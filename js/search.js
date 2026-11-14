/* Shared local search for generated pages. Queries and index content are text. */
var searchFunc = function (indexPath, inputId, resultId) {
  function textOf(value) { return String(value || "").replace(/<[^>]+>/g, ""); }
  function appendHighlighted(parent, text, keywords) {
    var lower = text.toLowerCase(), offset = 0;
    while (offset < text.length) {
      var next = -1, length = 0;
      keywords.forEach(function (keyword) {
        var index = lower.indexOf(keyword, offset);
        if (index >= 0 && (next < 0 || index < next || (index === next && keyword.length > length))) {
          next = index; length = keyword.length;
        }
      });
      if (next < 0) { parent.appendChild(document.createTextNode(text.slice(offset))); break; }
      parent.appendChild(document.createTextNode(text.slice(offset, next)));
      var emphasis = document.createElement("em");
      emphasis.className = "search-keyword";
      emphasis.textContent = text.slice(next, next + length);
      parent.appendChild(emphasis);
      offset = next + length;
    }
  }
  $.ajax({url: indexPath, dataType: "xml", success: function (xml) {
    var records = $("entry", xml).map(function () {
      return { title: $("title", this).text(), content: $("content", this).text(), url: $("url", this).text() };
    }).get();
    var input = document.getElementById(inputId), output = document.getElementById(resultId);
    if (!input || !output || input.dataset.searchBound) return;
    input.dataset.searchBound = "true";
    input.addEventListener("input", function () {
      output.textContent = "";
      var query = input.value.trim().toLowerCase().slice(0, 200);
      if (!query) return;
      var keywords = query.split(/[\s\-]+/).filter(Boolean).slice(0, 10);
      if (!keywords.length) return;
      var list = document.createElement("ul"), count = 0;
      list.className = "search-result-list";
      records.forEach(function (record) {
        if (count >= 50) return;
        var title = String(record.title || ""), content = textOf(record.content);
        var lowerTitle = title.toLowerCase(), lowerContent = content.toLowerCase();
        if (!keywords.every(function (word) { return lowerTitle.includes(word) || lowerContent.includes(word); })) return;
        var destination;
        try {
          destination = new URL(record.url, window.location.href);
          if (destination.origin !== window.location.origin || !/^https?:$/.test(destination.protocol)) return;
        } catch (_) { return; }
        var item = document.createElement("li"), link = document.createElement("a");
        link.className = "search-result-title";
        link.style.overflowWrap = "anywhere";
        link.href = destination.href;
        link.textContent = title;
        item.appendChild(link);
        var snippet = document.createElement("p");
        snippet.className = "search-result";
        snippet.style.overflowWrap = "anywhere";
        var first = lowerContent.indexOf(keywords[0]), start = Math.max(0, first - 20);
        appendHighlighted(snippet, content.slice(start, start + 100), keywords);
        snippet.appendChild(document.createTextNode("..."));
        item.appendChild(snippet);
        list.appendChild(item);
        count++;
      });
      var summary = document.createElement("p");
      summary.className = "search-result-summary";
      summary.textContent = "共找到 " + count + " 条结果";
      output.appendChild(summary);
      output.appendChild(list);
    });
  }});
};
