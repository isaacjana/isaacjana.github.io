/**
 * DevToys - Formatter Tools
 * JSON, SQL, XML
 */

const FormatterTools = {

    // ── JSON Formatter ──
    'json-formatter': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="form-row" style="margin-bottom:12px">
              <div class="form-group" style="max-width:150px">
                <label class="form-label">Indent Size</label>
                <select class="form-select" id="jf-indent">
                  <option value="2" selected>2 Spaces</option>
                  <option value="4">4 Spaces</option>
                  <option value="tab">Tab</option>
                </select>
              </div>
              <div class="btn-group" style="align-items:flex-end">
                <button class="btn btn-primary btn-sm" id="jf-format"><i class="fas fa-indent"></i> Format</button>
                <button class="btn btn-secondary btn-sm" id="jf-minify"><i class="fas fa-compress-alt"></i> Minify</button>
                <button class="btn btn-ghost btn-sm" id="jf-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <textarea class="form-textarea tall" id="jf-input" placeholder="Paste JSON here...">{"name":"DevToys","version":"1.0","features":["converters","encoders","formatters"],"config":{"theme":"dark","language":"en"}}</textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Stats</div>
            <div id="jf-stats" style="font-size:12px;color:var(--text-muted)"></div>
          </div>
        </div>
      `);

            $('#jf-format').on('click', () => {
                try {
                    const obj = JSON.parse($('#jf-input').val());
                    const indent = $('#jf-indent').val() === 'tab' ? '\t' : parseInt($('#jf-indent').val());
                    const formatted = JSON.stringify(obj, null, indent);
                    $('#jf-input').val(formatted);
                    updateStats(formatted);
                    showToast('JSON formatted!', 'success');
                } catch (e) {
                    showToast('Invalid JSON: ' + e.message, 'error');
                }
            });

            $('#jf-minify').on('click', () => {
                try {
                    const obj = JSON.parse($('#jf-input').val());
                    const minified = JSON.stringify(obj);
                    $('#jf-input').val(minified);
                    updateStats(minified);
                    showToast('JSON minified!', 'success');
                } catch (e) {
                    showToast('Invalid JSON: ' + e.message, 'error');
                }
            });

            $('#jf-copy').on('click', () => copyToClipboard($('#jf-input').val()));

            function updateStats(json) {
                try {
                    const obj = JSON.parse(json);
                    const keys = countKeys(obj);
                    const size = new Blob([json]).size;
                    $('#jf-stats').text(`Size: ${formatBytes(size)} | Keys: ${keys} | Lines: ${json.split('\n').length}`);
                } catch { $('#jf-stats').text(''); }
            }

            function countKeys(obj) {
                if (typeof obj !== 'object' || obj === null) return 0;
                let count = 0;
                for (const key in obj) {
                    count++;
                    count += countKeys(obj[key]);
                }
                if (Array.isArray(obj)) obj.forEach(item => count += countKeys(item));
                return count;
            }

            updateStats($('#jf-input').val());
        }
    },

    // ── SQL Formatter ──
    'sql-formatter': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="btn-group" style="margin-bottom:12px">
              <button class="btn btn-primary btn-sm" id="sql-format"><i class="fas fa-indent"></i> Format</button>
              <button class="btn btn-secondary btn-sm" id="sql-minify"><i class="fas fa-compress-alt"></i> Minify</button>
              <button class="btn btn-secondary btn-sm" id="sql-uppercase"><i class="fas fa-font"></i> Uppercase Keywords</button>
              <button class="btn btn-ghost btn-sm" id="sql-copy"><i class="fas fa-copy"></i> Copy</button>
            </div>
          </div>
          <div class="tool-section">
            <textarea class="form-textarea tall" id="sql-input" placeholder="Paste SQL here...">SELECT u.id, u.name, u.email, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.active = 1 AND o.total > 100 ORDER BY o.total DESC LIMIT 10;</textarea>
          </div>
        </div>
      `);

            const SQL_KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'CROSS', 'ON', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'HAVING', 'UNION', 'ALL', 'DISTINCT', 'AS', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'WITH'];

            $('#sql-format').on('click', () => {
                let sql = $('#sql-input').val().trim();
                // Uppercase keywords
                SQL_KEYWORDS.forEach(kw => {
                    sql = sql.replace(new RegExp('\\b' + kw + '\\b', 'gi'), kw);
                });
                // Add newlines before major keywords
                const majorKW = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN', 'JOIN', 'ON', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE'];
                majorKW.forEach(kw => {
                    sql = sql.replace(new RegExp('\\s+(' + kw.replace(/ /g, '\\s+') + ')\\b', 'gi'), '\n' + kw);
                });
                // Indent sub-clauses
                const lines = sql.split('\n');
                const formatted = lines.map(line => {
                    const trimmed = line.trim();
                    if (/^(AND|OR|ON|SET)\b/i.test(trimmed)) return '  ' + trimmed;
                    return trimmed;
                }).join('\n');
                $('#sql-input').val(formatted);
                showToast('SQL formatted!', 'success');
            });

            $('#sql-minify').on('click', () => {
                const sql = $('#sql-input').val().replace(/\s+/g, ' ').trim();
                $('#sql-input').val(sql);
                showToast('SQL minified!', 'success');
            });

            $('#sql-uppercase').on('click', () => {
                let sql = $('#sql-input').val();
                SQL_KEYWORDS.forEach(kw => {
                    sql = sql.replace(new RegExp('\\b' + kw + '\\b', 'gi'), kw);
                });
                $('#sql-input').val(sql);
                showToast('Keywords uppercased!', 'success');
            });

            $('#sql-copy').on('click', () => copyToClipboard($('#sql-input').val()));
        }
    },

    // ── XML Formatter ──
    'xml-formatter': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="btn-group" style="margin-bottom:12px">
              <button class="btn btn-primary btn-sm" id="xml-format"><i class="fas fa-indent"></i> Format</button>
              <button class="btn btn-secondary btn-sm" id="xml-minify"><i class="fas fa-compress-alt"></i> Minify</button>
              <button class="btn btn-ghost btn-sm" id="xml-copy"><i class="fas fa-copy"></i> Copy</button>
            </div>
          </div>
          <div class="tool-section">
            <textarea class="form-textarea tall" id="xml-input" placeholder="Paste XML here..."><root><person><name>John</name><age>30</age><email>john@example.com</email></person><person><name>Jane</name><age>25</age><email>jane@example.com</email></person></root></textarea>
          </div>
        </div>
      `);

            $('#xml-format').on('click', () => {
                try {
                    const formatted = formatXml($('#xml-input').val());
                    $('#xml-input').val(formatted);
                    showToast('XML formatted!', 'success');
                } catch (e) {
                    showToast('Invalid XML: ' + e.message, 'error');
                }
            });

            $('#xml-minify').on('click', () => {
                const xml = $('#xml-input').val().replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
                $('#xml-input').val(xml);
                showToast('XML minified!', 'success');
            });

            $('#xml-copy').on('click', () => copyToClipboard($('#xml-input').val()));
        }
    },
};

// ── XML Formatter Helper ──
function formatXml(xml) {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    xml = xml.replace(/(>)\s*(<)/g, '$1\n$2');
    const lines = xml.split('\n');

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.match(/^<\/\w/)) {
            indent = indent.substring(tab.length);
        }

        formatted += indent + line + '\n';

        if (line.match(/^<\w([^>]*[^/])?>.*$/) && !line.match(/^<.*\/>/)) {
            if (!line.match(/<\/\w/)) {
                indent += tab;
            }
        }
    });

    return formatted.trim();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
