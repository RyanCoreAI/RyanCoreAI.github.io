# Local search repair

All 70 primary generated pages load `/js/search.js` and use one search bootstrap. Queries are literal text, highlights are DOM text nodes, and index destinations must stay on the current HTTP(S) origin. This fixes searches such as `C++`, `[`, `a.b` and `$&` without treating query text as a regular expression or HTML.

Run `node --test tests/search.test.cjs` with Node 20+ for special-character, index-escaping, URL-boundary and generated-page coverage checks. The deterministic test exercises the actual shared script with DOM/jQuery boundary fixtures; it is not a full browser acceptance test.

This repository contains generated site output rather than the Hexo source/theme build. Apply the same shared-script bootstrap to that upstream source template before regenerating the site. Otherwise regeneration can restore the broken inline implementation; the page-coverage regression will detect that drift.

No hosting/deployment configuration is changed in this repair.
