/**
 * DevToys - Tester Tools
 * JSONPath, Regular Expression, XML / XSD
 */

const TesterTools = {

    // ── JSONPath Tester ──
    'jsonpath-tester': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">JSON Data</div>
            <textarea class="form-textarea tall" id="jp-json" placeholder="Paste JSON here...">{
  "store": {
    "books": [
      { "title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "price": 12.99 },
      { "title": "1984", "author": "George Orwell", "price": 9.99 },
      { "title": "To Kill a Mockingbird", "author": "Harper Lee", "price": 14.99 },
      { "title": "The Catcher in the Rye", "author": "J.D. Salinger", "price": 11.50 }
    ],
    "name": "My Bookstore",
    "open": true
  }
}</textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">JSONPath Expression</div>
            <div class="form-row">
              <div class="form-group">
                <input type="text" class="form-input" id="jp-path" placeholder="e.g. $.store.books[*].title" value="$.store.books[*].title">
              </div>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
              Examples: <code>$.store.books[*].title</code> | <code>$.store.books[0]</code> | <code>$.store.name</code> | <code>$..price</code>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Result</div>
            <div class="output-area" id="jp-output" style="min-height:100px"></div>
          </div>
        </div>
      `);

            const evaluate = () => {
                try {
                    const data = JSON.parse($('#jp-json').val());
                    const path = $('#jp-path').val().trim();
                    if (!path) { $('#jp-output').text('Enter a JSONPath expression'); return; }

                    const results = evaluateJsonPath(data, path);
                    if (results.length === 0) {
                        $('#jp-output').text('No matches found');
                    } else if (results.length === 1) {
                        $('#jp-output').text(JSON.stringify(results[0], null, 2));
                    } else {
                        $('#jp-output').text(JSON.stringify(results, null, 2));
                    }
                } catch (e) {
                    $('#jp-output').html(`<span style="color:var(--accent-red)">${escHtml(e.message)}</span>`);
                }
            };

            $('#jp-json, #jp-path').on('input', debounce(evaluate, 300));
            evaluate();
        }
    },

    // ── Regex Tester ──
    'regex-tester': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Regular Expression</div>
            <div class="form-row">
              <div class="form-group">
                <div style="display:flex;align-items:center;gap:4px">
                  <span style="color:var(--accent-blue);font-size:18px;font-family:'JetBrains Mono'">/</span>
                  <input type="text" class="form-input" id="regex-pattern" placeholder="Enter regex pattern..." value="\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b" style="flex:1">
                  <span style="color:var(--accent-blue);font-size:18px;font-family:'JetBrains Mono'">/</span>
                  <input type="text" class="form-input" id="regex-flags" value="gmi" style="width:60px;text-align:center">
                </div>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Test String</div>
            <textarea class="form-textarea tall" id="regex-input" placeholder="Enter test string...">My email is john@example.com and also jane.doe@company.org.
Contact us at support@devtoys.app for help.
Invalid emails: @test, foo@, hello@.com</textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Matches</div>
            <div id="regex-matches"></div>
            <div id="regex-stats" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Highlighted Result</div>
            <div class="output-area" id="regex-highlighted" style="min-height:80px"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Quick Reference</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;font-size:12px">
              ${[
                    ['.', 'Any character'],
                    ['\\d', 'Digit [0-9]'],
                    ['\\w', 'Word char'],
                    ['\\s', 'Whitespace'],
                    ['\\b', 'Word boundary'],
                    ['^', 'Start of string'],
                    ['$', 'End of string'],
                    ['*', '0 or more'],
                    ['+', '1 or more'],
                    ['?', '0 or 1'],
                    ['{n}', 'Exactly n'],
                    ['{n,m}', 'n to m times'],
                    ['[abc]', 'Character class'],
                    ['[^abc]', 'Not in class'],
                    ['(abc)', 'Capture group'],
                    ['a|b', 'Alternation'],
                ].map(([p, d]) => `<div style="display:flex;gap:8px"><code style="color:var(--accent-blue);min-width:50px">${p}</code><span style="color:var(--text-muted)">${d}</span></div>`).join('')}
            </div>
          </div>
        </div>
      `);

            const test = () => {
                try {
                    const pattern = $('#regex-pattern').val();
                    const flags = $('#regex-flags').val();
                    const input = $('#regex-input').val();

                    if (!pattern) {
                        $('#regex-matches').html('<div style="color:var(--text-muted)">Enter a pattern</div>');
                        $('#regex-highlighted').html(escHtml(input));
                        return;
                    }

                    const regex = new RegExp(pattern, flags);
                    const matches = [...input.matchAll(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'))];

                    if (matches.length === 0) {
                        $('#regex-matches').html('<div style="color:var(--text-muted)">No matches found</div>');
                        $('#regex-highlighted').html(escHtml(input));
                        $('#regex-stats').text('');
                        return;
                    }

                    // Match table
                    let html = '<table class="result-table"><thead><tr><th>#</th><th>Match</th><th>Index</th><th>Groups</th></tr></thead><tbody>';
                    matches.forEach((m, i) => {
                        const groups = m.slice(1).filter(g => g !== undefined).join(', ') || '-';
                        html += `<tr><td>${i + 1}</td><td>${escHtml(m[0])}</td><td>${m.index}</td><td>${escHtml(groups)}</td></tr>`;
                    });
                    html += '</tbody></table>';
                    $('#regex-matches').html(html);
                    $('#regex-stats').text(`${matches.length} match${matches.length !== 1 ? 'es' : ''} found`);

                    // Highlight
                    let highlighted = escHtml(input);
                    const highlightRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
                    highlighted = input.replace(highlightRegex, match =>
                        `<mark style="background:rgba(88,166,255,0.3);color:var(--text-primary);padding:1px 2px;border-radius:2px">${escHtml(match)}</mark>`
                    );
                    $('#regex-highlighted').html(highlighted);

                } catch (e) {
                    $('#regex-matches').html(`<div style="color:var(--accent-red)">${escHtml(e.message)}</div>`);
                    $('#regex-stats').text('');
                }
            };

            $('#regex-pattern, #regex-flags, #regex-input').on('input', debounce(test, 200));
            test();
        }
    },

    // ── XML / XSD Tester ──
    'xml-xsd-tester': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">XML Document</span></div>
              <textarea class="form-textarea tall" id="xxsd-xml" placeholder="Paste XML here...">
<bookstore>
  <book category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>12.99</price>
  </book>
  <book category="nonfiction">
    <title>Sapiens</title>
    <author>Yuval Noah Harari</author>
    <year>2011</year>
    <price>15.99</price>
  </book>
</bookstore></textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">XSD Schema (Optional)</span></div>
              <textarea class="form-textarea tall" id="xxsd-xsd" placeholder="Paste XSD schema here (optional)..."></textarea>
            </div>
          </div>
          <div class="tool-section" style="margin-top:16px">
            <div class="btn-group">
              <button class="btn btn-primary btn-sm" id="xxsd-validate"><i class="fas fa-check-circle"></i> Validate XML</button>
              <button class="btn btn-secondary btn-sm" id="xxsd-tree"><i class="fas fa-sitemap"></i> Show Tree</button>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Result</div>
            <div class="output-area" id="xxsd-output" style="min-height:120px"></div>
          </div>
        </div>
      `);

            $('#xxsd-validate').on('click', () => {
                const xml = $('#xxsd-xml').val().trim();
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, 'text/xml');
                const errors = doc.getElementsByTagName('parsererror');

                if (errors.length > 0) {
                    const errorText = errors[0].textContent;
                    $('#xxsd-output').html(`<span style="color:var(--accent-red)"><i class="fas fa-times-circle"></i> Invalid XML</span>\n\n${escHtml(errorText)}`);
                } else {
                    $('#xxsd-output').html(`<span style="color:var(--accent-green)"><i class="fas fa-check-circle"></i> Valid XML</span>\n\nThe XML document is well-formed.`);
                }
            });

            $('#xxsd-tree').on('click', () => {
                const xml = $('#xxsd-xml').val().trim();
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, 'text/xml');
                const errors = doc.getElementsByTagName('parsererror');

                if (errors.length > 0) {
                    $('#xxsd-output').html(`<span style="color:var(--accent-red)">Cannot display tree: XML is invalid</span>`);
                    return;
                }

                const buildTree = (node, indent = 0) => {
                    let result = '';
                    const pad = '  '.repeat(indent);
                    if (node.nodeType === 1) { // Element
                        result += `${pad}<span style="color:var(--accent-blue)">&lt;${node.tagName}</span>`;
                        for (const attr of node.attributes) {
                            result += ` <span style="color:var(--accent-orange)">${attr.name}</span>=<span style="color:var(--accent-green)">"${escHtml(attr.value)}"</span>`;
                        }
                        result += `<span style="color:var(--accent-blue)">&gt;</span>\n`;
                        for (const child of node.childNodes) {
                            result += buildTree(child, indent + 1);
                        }
                        result += `${pad}<span style="color:var(--accent-blue)">&lt;/${node.tagName}&gt;</span>\n`;
                    } else if (node.nodeType === 3) { // Text
                        const text = node.textContent.trim();
                        if (text) result += `${pad}<span style="color:var(--text-primary)">${escHtml(text)}</span>\n`;
                    }
                    return result;
                };

                const tree = buildTree(doc.documentElement);
                $('#xxsd-output').html(tree);
            });
        }
    },

    // ── JSON Diff ──
    'json-diff': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">Original</span></div>
              <textarea class="form-textarea tall" id="jd-a">{
  "name": "devtoys",
  "version": "1.0.0",
  "private": true,
  "scripts": { "start": "serve .", "test": "jest" },
  "keywords": ["tools", "developer"],
  "author": { "name": "Ada", "email": "ada@example.com" }
}</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">Modified</span></div>
              <textarea class="form-textarea tall" id="jd-b">{
  "name": "devtoys",
  "version": "1.1.0",
  "scripts": { "start": "serve .", "test": "vitest", "lint": "eslint ." },
  "keywords": ["tools", "developer", "web"],
  "author": { "name": "Ada" },
  "license": "MIT"
}</textarea>
            </div>
          </div>
          <div class="tool-section mt-16">
            <div class="split-pane-header">
              <span class="tool-section-title mb-0" id="jd-summary">Differences</span>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="jd-order"><span class="toggle-slider"></span></label>
                <span class="toggle-label">Ignore array order</span>
              </div>
            </div>
            <div id="jd-result"></div>
          </div>
        </div>
      `);

            function run() {
                let a, b;
                try { a = JSON.parse($('#jd-a').val()); } catch (e) { return showError('Original', e); }
                try { b = JSON.parse($('#jd-b').val()); } catch (e) { return showError('Modified', e); }

                const diffs = diffJson(a, b, '$', $('#jd-order').is(':checked'));
                const counts = { added: 0, removed: 0, changed: 0 };
                diffs.forEach(d => counts[d.type]++);
                $('#jd-summary').html(diffs.length
                    ? `Differences <span class="badge badge-green">+${counts.added}</span> <span class="badge badge-red">−${counts.removed}</span> <span class="badge badge-orange">~${counts.changed}</span>`
                    : 'Differences');

                if (!diffs.length) {
                    $('#jd-result').html('<span class="badge badge-green"><i class="fas fa-check"></i>&nbsp;The documents are semantically identical</span>');
                    return;
                }
                const BADGE = { added: 'badge-green', removed: 'badge-red', changed: 'badge-orange' };
                const fmt = v => escHtml(JSON.stringify(v));
                let html = '<table class="result-table"><thead><tr><th style="width:90px">Change</th><th>Path</th><th>Original</th><th>Modified</th></tr></thead><tbody>';
                diffs.forEach(d => {
                    html += `<tr><td><span class="badge ${BADGE[d.type]}">${d.type}</span></td><td>${escHtml(d.path)}</td>
            <td style="color:var(--accent-red)">${d.type === 'added' ? '' : fmt(d.from)}</td>
            <td style="color:var(--accent-green)">${d.type === 'removed' ? '' : fmt(d.to)}</td></tr>`;
                });
                html += '</tbody></table>';
                $('#jd-result').html(html);
            }

            function showError(which, e) {
                $('#jd-summary').text('Differences');
                $('#jd-result').html(`<span class="text-sm" style="color:var(--accent-red)">${which} is not valid JSON: ${escHtml(e.message)}</span>`);
            }

            $('#jd-a, #jd-b').on('input', debounce(run, 250));
            $('#jd-order').on('change', run);
            run();
        }
    },
};

// ── JSONPath Evaluator ──
function evaluateJsonPath(data, path) {
    const results = [];

    if (path === '$') {
        return [data];
    }

    // Handle recursive descent ($..key)
    if (path.startsWith('$..')) {
        const key = path.substring(3);
        const findRecursive = (obj) => {
            if (typeof obj !== 'object' || obj === null) return;
            if (key in obj) results.push(obj[key]);
            for (const k in obj) {
                if (typeof obj[k] === 'object') findRecursive(obj[k]);
            }
            if (Array.isArray(obj)) obj.forEach(item => findRecursive(item));
        };
        findRecursive(data);
        return results;
    }

    // Parse path segments
    const segments = [];
    const pathStr = path.startsWith('$.') ? path.substring(2) : path.startsWith('$') ? path.substring(1) : path;

    // Split by dots and brackets
    const parts = pathStr.match(/[^.\[\]]+|\[\*\]|\[\d+\]/g) || [];

    let current = [data];
    for (const part of parts) {
        const next = [];
        for (const item of current) {
            if (part === '[*]' || part === '*') {
                if (Array.isArray(item)) {
                    item.forEach(v => next.push(v));
                } else if (typeof item === 'object' && item !== null) {
                    Object.values(item).forEach(v => next.push(v));
                }
            } else if (/^\[\d+\]$/.test(part)) {
                const idx = parseInt(part.slice(1, -1));
                if (Array.isArray(item) && idx < item.length) next.push(item[idx]);
            } else if (/^\d+$/.test(part)) {
                const idx = parseInt(part);
                if (Array.isArray(item) && idx < item.length) next.push(item[idx]);
            } else {
                if (typeof item === 'object' && item !== null && part in item) {
                    next.push(item[part]);
                }
            }
        }
        current = next;
    }

    return current;
}

// ── JSON Diff Helper ──
function diffJson(a, b, path, ignoreOrder, out = []) {
    const kind = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
    const ka = kind(a), kb = kind(b);

    if (ka !== kb) {
        out.push({ type: 'changed', path, from: a, to: b });
    } else if (ka === 'object') {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        keys.forEach(k => {
            const p = /^[A-Za-z_$][\w$]*$/.test(k) ? `${path}.${k}` : `${path}[${JSON.stringify(k)}]`;
            if (!(k in b)) out.push({ type: 'removed', path: p, from: a[k] });
            else if (!(k in a)) out.push({ type: 'added', path: p, to: b[k] });
            else diffJson(a[k], b[k], p, ignoreOrder, out);
        });
    } else if (ka === 'array') {
        if (ignoreOrder) {
            // Compare as multisets of canonical JSON strings
            const canon = v => JSON.stringify(sortKeysDeep(v));
            const remaining = b.map(canon);
            a.forEach((item, i) => {
                const idx = remaining.indexOf(canon(item));
                if (idx === -1) out.push({ type: 'removed', path: `${path}[${i}]`, from: item });
                else remaining[idx] = undefined;
            });
            remaining.forEach((c, i) => { if (c !== undefined) out.push({ type: 'added', path: `${path}[${i}]`, to: b[i] }); });
        } else {
            const len = Math.max(a.length, b.length);
            for (let i = 0; i < len; i++) {
                if (i >= b.length) out.push({ type: 'removed', path: `${path}[${i}]`, from: a[i] });
                else if (i >= a.length) out.push({ type: 'added', path: `${path}[${i}]`, to: b[i] });
                else diffJson(a[i], b[i], `${path}[${i}]`, ignoreOrder, out);
            }
        }
    } else if (a !== b) {
        out.push({ type: 'changed', path, from: a, to: b });
    }
    return out;
}

function sortKeysDeep(v) {
    if (Array.isArray(v)) return v.map(sortKeysDeep);
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeysDeep(v[k])]));
    return v;
}
