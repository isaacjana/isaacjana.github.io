/**
 * DevToys - Text Tools
 * Escape/Unescape, List Comparer, Markdown Preview, Analyzer & Utilities, Text Comparer
 */

const TextTools = {

    // ── Escape / Unescape ──
    'escape-unescape': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Mode</div>
            <div class="form-row">
              <div class="form-group" style="max-width:200px">
                <select class="form-select" id="esc-type">
                  <option value="json">JSON String</option>
                  <option value="html">HTML Entities</option>
                  <option value="url">URL Encoding</option>
                  <option value="xml">XML</option>
                  <option value="backslash">Backslash</option>
                </select>
              </div>
              <div class="btn-group" style="align-items:flex-end">
                <button class="btn btn-primary btn-sm" id="esc-escape"><i class="fas fa-lock"></i> Escape</button>
                <button class="btn btn-secondary btn-sm" id="esc-unescape"><i class="fas fa-unlock"></i> Unescape</button>
              </div>
            </div>
          </div>
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">Input</span></div>
              <textarea class="form-textarea tall" id="esc-input" placeholder="Enter text...">Hello "World"! It's a <test> & example.\nNew line here.</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">Output</span>
                <button class="btn btn-ghost btn-sm" id="esc-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="esc-output" readonly></textarea>
            </div>
          </div>
        </div>
      `);

            const escapeText = () => {
                const input = $('#esc-input').val();
                const type = $('#esc-type').val();
                let result = '';
                switch (type) {
                    case 'json':
                        result = JSON.stringify(input).slice(1, -1);
                        break;
                    case 'html':
                        result = input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                        break;
                    case 'url':
                        result = encodeURIComponent(input);
                        break;
                    case 'xml':
                        result = input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
                        break;
                    case 'backslash':
                        result = input.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/"/g, '\\"');
                        break;
                }
                $('#esc-output').val(result);
            };

            const unescapeText = () => {
                const input = $('#esc-input').val();
                const type = $('#esc-type').val();
                let result = '';
                try {
                    switch (type) {
                        case 'json':
                            result = JSON.parse('"' + input + '"');
                            break;
                        case 'html':
                            const el = document.createElement('textarea');
                            el.innerHTML = input;
                            result = el.value;
                            break;
                        case 'url':
                            result = decodeURIComponent(input);
                            break;
                        case 'xml':
                            result = input.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
                            break;
                        case 'backslash':
                            result = input.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                            break;
                    }
                } catch (e) {
                    result = 'Error: ' + e.message;
                }
                $('#esc-output').val(result);
            };

            $('#esc-escape').on('click', escapeText);
            $('#esc-unescape').on('click', unescapeText);
            $('#esc-copy').on('click', () => copyToClipboard($('#esc-output').val()));
            escapeText();
        }
    },

    // ── List Comparer ──
    'list-comparer': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">List A</span></div>
              <textarea class="form-textarea tall" id="lc-a" placeholder="One item per line...">Apple
Banana
Cherry
Date
Elderberry</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">List B</span></div>
              <textarea class="form-textarea tall" id="lc-b" placeholder="One item per line...">Banana
Cherry
Fig
Grape
Elderberry</textarea>
            </div>
          </div>
          <div class="tool-section" style="margin-top:16px">
            <div class="form-row">
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="lc-case"><span class="toggle-slider"></span></label>
                <span class="toggle-label">Case Sensitive</span>
              </div>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="lc-trim" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Trim Whitespace</span>
              </div>
              <button class="btn btn-primary btn-sm" id="lc-compare"><i class="fas fa-exchange-alt"></i> Compare</button>
            </div>
          </div>
          <div class="tool-section">
            <div class="tabs">
              <button class="tab active" data-result="common">Common</button>
              <button class="tab" data-result="only-a">Only in A</button>
              <button class="tab" data-result="only-b">Only in B</button>
            </div>
            <div class="output-area" id="lc-result" style="min-height:120px"></div>
            <div id="lc-stats" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
          </div>
        </div>
      `);

            let results = { common: [], onlyA: [], onlyB: [] };

            const compare = () => {
                const caseSensitive = $('#lc-case').is(':checked');
                const trim = $('#lc-trim').is(':checked');

                let listA = $('#lc-a').val().split('\n').filter(l => l.trim());
                let listB = $('#lc-b').val().split('\n').filter(l => l.trim());

                if (trim) { listA = listA.map(l => l.trim()); listB = listB.map(l => l.trim()); }

                const normalize = s => caseSensitive ? s : s.toLowerCase();
                const setB = new Set(listB.map(normalize));
                const setA = new Set(listA.map(normalize));

                results.common = listA.filter(a => setB.has(normalize(a)));
                results.onlyA = listA.filter(a => !setB.has(normalize(a)));
                results.onlyB = listB.filter(b => !setA.has(normalize(b)));

                showResult('common');
                $('#lc-stats').text(`A: ${listA.length} items | B: ${listB.length} items | Common: ${results.common.length} | Only A: ${results.onlyA.length} | Only B: ${results.onlyB.length}`);
            };

            const showResult = (type) => {
                const map = { common: results.common, 'only-a': results.onlyA, 'only-b': results.onlyB };
                const items = map[type] || [];
                $('#lc-result').text(items.join('\n') || '(empty)');
            };

            container.find('.tab').on('click', function () {
                container.find('.tab').removeClass('active');
                $(this).addClass('active');
                showResult($(this).data('result'));
            });

            $('#lc-compare').on('click', compare);
            compare();
        }
    },

    // ── Markdown Preview ──
    'markdown-preview': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="split-view" style="height:calc(100vh - 160px)">
            <div class="split-pane" style="display:flex;flex-direction:column">
              <div class="split-pane-header"><span class="split-pane-title">Markdown</span></div>
              <textarea class="form-textarea" id="md-input" style="flex:1;resize:none" placeholder="Type Markdown here...">
# Hello World

This is a **Markdown** preview tool.

## Features
- Real-time preview
- GitHub-flavored markdown
- Code highlighting

\`\`\`javascript
const greeting = "Hello, DevToys!";
console.log(greeting);
\`\`\`

> This is a blockquote with some *italic* text.

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More     |
| Row 2    | Data     | More     |

---

Visit [GitHub](https://github.com) for more.
              </textarea>
            </div>
            <div class="split-pane" style="display:flex;flex-direction:column">
              <div class="split-pane-header"><span class="split-pane-title">Preview</span></div>
              <div class="output-area markdown-preview" id="md-preview" style="flex:1;overflow-y:auto"></div>
            </div>
          </div>
        </div>
      `);

            const render = () => {
                const md = $('#md-input').val();
                $('#md-preview').html(parseMarkdown(md));
            };

            $('#md-input').on('input', render);
            render();
        }
    },

    // ── Text Analyzer & Utilities ──
    'text-analyzer': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Input Text</div>
            <textarea class="form-textarea tall" id="ta-input" placeholder="Paste text to analyze...">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Statistics</div>
            <div id="ta-stats" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Utilities</div>
            <div class="btn-group" style="flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-action="upper"><i class="fas fa-arrow-up"></i> UPPERCASE</button>
              <button class="btn btn-secondary btn-sm" data-action="lower"><i class="fas fa-arrow-down"></i> lowercase</button>
              <button class="btn btn-secondary btn-sm" data-action="title"><i class="fas fa-heading"></i> Title Case</button>
              <button class="btn btn-secondary btn-sm" data-action="sentence"><i class="fas fa-paragraph"></i> Sentence case</button>
              <button class="btn btn-secondary btn-sm" data-action="camel"><i class="fas fa-code"></i> camelCase</button>
              <button class="btn btn-secondary btn-sm" data-action="snake"><i class="fas fa-minus"></i> snake_case</button>
              <button class="btn btn-secondary btn-sm" data-action="kebab"><i class="fas fa-grip-lines"></i> kebab-case</button>
              <button class="btn btn-secondary btn-sm" data-action="reverse"><i class="fas fa-undo"></i> Reverse</button>
              <button class="btn btn-secondary btn-sm" data-action="sort"><i class="fas fa-sort-alpha-down"></i> Sort Lines</button>
              <button class="btn btn-secondary btn-sm" data-action="dedupe"><i class="fas fa-filter"></i> Remove Duplicates</button>
              <button class="btn btn-secondary btn-sm" data-action="trim"><i class="fas fa-cut"></i> Trim Lines</button>
              <button class="btn btn-secondary btn-sm" data-action="removeEmpty"><i class="fas fa-eraser"></i> Remove Empty Lines</button>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Word Frequency</div>
            <div id="ta-frequency" style="max-height:200px;overflow-y:auto"></div>
          </div>
        </div>
      `);

            const analyze = () => {
                const text = $('#ta-input').val();
                const chars = text.length;
                const charsNoSpaces = text.replace(/\s/g, '').length;
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                const lines = text.split('\n').length;
                const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
                const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
                const bytes = new Blob([text]).size;
                const readingTime = Math.ceil(words / 200);

                const stats = [
                    { label: 'Characters', value: chars.toLocaleString() },
                    { label: 'No Spaces', value: charsNoSpaces.toLocaleString() },
                    { label: 'Words', value: words.toLocaleString() },
                    { label: 'Lines', value: lines.toLocaleString() },
                    { label: 'Sentences', value: sentences.toLocaleString() },
                    { label: 'Paragraphs', value: paragraphs.toLocaleString() },
                    { label: 'Bytes', value: formatBytes(bytes) },
                    { label: 'Reading Time', value: `~${readingTime} min` },
                ];

                let html = '';
                stats.forEach(s => {
                    html += `<div style="background:var(--bg-elevated);padding:12px;border-radius:var(--radius-md);border:1px solid var(--border-muted)">
            <div style="font-size:20px;font-weight:700;color:var(--accent-blue)">${s.value}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${s.label}</div>
          </div>`;
                });
                $('#ta-stats').html(html);

                // Word frequency
                const wordList = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
                const freq = {};
                wordList.forEach(w => freq[w] = (freq[w] || 0) + 1);
                const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);

                let freqHtml = '<table class="result-table"><thead><tr><th>Word</th><th>Count</th><th>%</th></tr></thead><tbody>';
                sorted.forEach(([word, count]) => {
                    const pct = ((count / wordList.length) * 100).toFixed(1);
                    freqHtml += `<tr><td>${word}</td><td>${count}</td><td>${pct}%</td></tr>`;
                });
                freqHtml += '</tbody></table>';
                $('#ta-frequency').html(freqHtml);
            };

            // Utility actions
            container.find('[data-action]').on('click', function () {
                const action = $(this).data('action');
                let text = $('#ta-input').val();

                switch (action) {
                    case 'upper': text = text.toUpperCase(); break;
                    case 'lower': text = text.toLowerCase(); break;
                    case 'title': text = text.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase()); break;
                    case 'sentence': text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(); break;
                    case 'camel': text = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase()); break;
                    case 'snake': text = text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, ''); break;
                    case 'kebab': text = text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, ''); break;
                    case 'reverse': text = text.split('').reverse().join(''); break;
                    case 'sort': text = text.split('\n').sort().join('\n'); break;
                    case 'dedupe': text = [...new Set(text.split('\n'))].join('\n'); break;
                    case 'trim': text = text.split('\n').map(l => l.trim()).join('\n'); break;
                    case 'removeEmpty': text = text.split('\n').filter(l => l.trim()).join('\n'); break;
                }
                $('#ta-input').val(text);
                analyze();
            });

            $('#ta-input').on('input', debounce(analyze, 200));
            analyze();
        }
    },

    // ── Text Comparer ──
    'text-comparer': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">Original</span></div>
              <textarea class="form-textarea tall" id="tc-a" placeholder="Paste original text...">The quick brown fox
jumps over the lazy dog.
This line is the same.
Remove this line.</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">Modified</span></div>
              <textarea class="form-textarea tall" id="tc-b" placeholder="Paste modified text...">The quick brown cat
jumps over the lazy dog.
This line is the same.
Add this new line.</textarea>
            </div>
          </div>
          <div class="tool-section" style="margin-top:16px">
            <div class="form-row">
              <button class="btn btn-primary btn-sm" id="tc-compare"><i class="fas fa-exchange-alt"></i> Compare</button>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="tc-ignore-ws"><span class="toggle-slider"></span></label>
                <span class="toggle-label">Ignore Whitespace</span>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Diff Result</div>
            <div class="diff-container" id="tc-diff"></div>
            <div id="tc-stats" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
          </div>
        </div>
      `);

            $('#tc-compare').on('click', () => {
                const ignoreWs = $('#tc-ignore-ws').is(':checked');
                const linesA = $('#tc-a').val().split('\n');
                const linesB = $('#tc-b').val().split('\n');
                const normalize = s => ignoreWs ? s.trim().replace(/\s+/g, ' ') : s;

                // Simple LCS-based diff
                const diff = computeDiff(linesA, linesB, normalize);

                let html = '';
                let added = 0, removed = 0, unchanged = 0;
                diff.forEach((item, idx) => {
                    const lineNum = idx + 1;
                    if (item.type === 'added') {
                        html += `<div class="diff-line diff-added"><span class="diff-line-num">${lineNum}</span><span class="diff-line-content">+ ${escHtml(item.value)}</span></div>`;
                        added++;
                    } else if (item.type === 'removed') {
                        html += `<div class="diff-line diff-removed"><span class="diff-line-num">${lineNum}</span><span class="diff-line-content">- ${escHtml(item.value)}</span></div>`;
                        removed++;
                    } else {
                        html += `<div class="diff-line"><span class="diff-line-num">${lineNum}</span><span class="diff-line-content">  ${escHtml(item.value)}</span></div>`;
                        unchanged++;
                    }
                });

                $('#tc-diff').html(html || '<div style="padding:12px;color:var(--text-muted)">No differences found</div>');
                $('#tc-stats').text(`Added: ${added} | Removed: ${removed} | Unchanged: ${unchanged}`);
            });

            $('#tc-compare').click();
        }
    },
};

// ── Diff Helper ──
function computeDiff(linesA, linesB, normalize) {
    const result = [];
    const maxLen = Math.max(linesA.length, linesB.length);

    // Simple line-by-line diff (not full LCS for performance)
    const usedB = new Set();
    for (let i = 0; i < linesA.length; i++) {
        let found = false;
        for (let j = 0; j < linesB.length; j++) {
            if (!usedB.has(j) && normalize(linesA[i]) === normalize(linesB[j])) {
                // Check if we need to add 'added' lines before this match
                result.push({ type: 'unchanged', value: linesA[i] });
                usedB.add(j);
                found = true;
                break;
            }
        }
        if (!found) {
            result.push({ type: 'removed', value: linesA[i] });
        }
    }

    for (let j = 0; j < linesB.length; j++) {
        if (!usedB.has(j)) {
            result.push({ type: 'added', value: linesB[j] });
        }
    }

    return result;
}

// ── Simple Markdown Parser ──
function parseMarkdown(md) {
    let html = md;

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Bold & italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    // Unordered lists
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.every(c => /^[\s\-:]+$/.test(c))) return '';
        const isHeader = false;
        const tag = isHeader ? 'th' : 'td';
        return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    });
    html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table>$1</table>');
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    // Clean up
    html = html.replace(/<p><(h[1-6]|ul|ol|blockquote|pre|hr|table)/g, '<$1');
    html = html.replace(/<\/(h[1-6]|ul|ol|blockquote|pre|hr|table)><\/p>/g, '</$1>');
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
}
