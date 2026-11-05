const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.raw=null;this.value='';}
 set textContent(value){this.raw=null;this.children=[{html:()=>escape(value)}];}
 set innerHTML(value){this.raw=value;this.children=[];}
 get innerHTML(){return this.raw??this.children.map(c=>c.html()).join('');}
 appendChild(child){this.children.push(child);return child;}
 addEventListener(event,handler){this.handler=handler;}
 html(){const attrs=(this.className?' class="'+escape(this.className)+'"':'')+(this.href?' href="'+escape(this.href)+'"':'');return '<'+this.tag+attrs+'>'+this.innerHTML+'</'+this.tag+'>';}
}
function setup(records){
 const input=new Element('input'),output=new Element('div');
 function $(selector,node){
  if(selector==='entry')return{map(fn){return{get(){return records.map(r=>fn.call(r));}}}};
  return{text(){return node[selector];}};
 }
 $.ajax=options=>options.success({});
 const context={$ ,URL,window:{location:{href:'https://example.com/',origin:'https://example.com'}},document:{
  getElementById:id=>id==='query'?input:output,createElement:tag=>new Element(tag),createTextNode:text=>({html:()=>escape(text)})
 }};
 vm.runInNewContext(fs.readFileSync(path.join(root,'js/search.js'),'utf8'),context);
 context.searchFunc('/search.xml','query','results');
 return query=>{input.value=query;input.handler();return output.innerHTML;};
}
for(const query of ['C++','[','a.b','$&'])test('literal query '+query,()=>{
 const search=setup([{title:'Literal '+query,content:'Text about '+query+' and examples.',url:'/p/literal/'}]);
 assert.match(search(query),/https:\/\/example.com\/p\/literal\//);
 assert.match(search(query),/<em class="search-keyword">/);
});
test('index content cannot create HTML or unsafe destinations',()=>{
 const search=setup([
  {title:'heading <img src=x onerror=alert(1)>',content:'heading text',url:'/p/safe/'},
  {title:'heading script',content:'heading text',url:'javascript:alert(1)'},
  {title:'heading external',content:'heading text',url:'https://example.net/'}
 ]);
 const html=search('heading');
 assert.match(html,/&lt;img/);
 assert.doesNotMatch(html,/<img|<script|href="javascript:|href="https:\/\/example.net/);
 assert.equal(search(''), '');
});
test('all generated primary pages load the shared search implementation',()=>{
 let pages=0;
 function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(['.git','libs','lib','portfolio'].includes(entry.name))continue;
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())visit(file);
  else if(entry.name.endsWith('.html')){
   const html=fs.readFileSync(file,'utf8');
   if(!html.includes('searchInput'))continue;
   assert.ok(html.includes('<script src="/js/search.js"></script>'),path.relative(root,file));
   assert.ok(!/<script\b[^>]*>[^<]*new RegExp/.test(html),path.relative(root,file));
   pages++;
  }
 }}visit(root);
 assert.ok(pages>=70);
});
