/**
 * DevToys - Converter Tools
 * Cron Parser, Date, JSON Array to Table/CSV, JSON <> YAML, Number Base
 */

const ConverterTools = {

    // ── Cron Parser ──
    'cron-parser': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Cron Expression</div>
            <div class="form-group">
              <input type="text" class="form-input" id="cron-input" placeholder="e.g. */5 * * * *" value="*/5 * * * *">
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Human-Readable Description</div>
            <div class="output-area" id="cron-output"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Next 5 Scheduled Runs</div>
            <div id="cron-schedule"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Quick Reference</div>
            <table class="result-table">
              <thead><tr><th>Field</th><th>Values</th><th>Special</th></tr></thead>
              <tbody>
                <tr><td>Minute</td><td>0-59</td><td>* , - /</td></tr>
                <tr><td>Hour</td><td>0-23</td><td>* , - /</td></tr>
                <tr><td>Day of Month</td><td>1-31</td><td>* , - / ?</td></tr>
                <tr><td>Month</td><td>1-12</td><td>* , - /</td></tr>
                <tr><td>Day of Week</td><td>0-6 (Sun-Sat)</td><td>* , - / ?</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `);

            const parseCron = () => {
                const val = $('#cron-input').val().trim();
                const parts = val.split(/\s+/);
                if (parts.length < 5) {
                    $('#cron-output').text('Invalid cron expression. Expected 5 fields: minute hour day month weekday');
                    $('#cron-schedule').html('');
                    return;
                }
                const [min, hr, dom, mon, dow] = parts;
                const desc = describeCron(min, hr, dom, mon, dow);
                $('#cron-output').text(desc);

                // Compute next 5 runs
                const runs = getNextCronRuns(parts, 5);
                let html = '<table class="result-table"><thead><tr><th>#</th><th>Date & Time</th></tr></thead><tbody>';
                runs.forEach((d, i) => {
                    html += `<tr><td>${i + 1}</td><td>${d.toLocaleString()}</td></tr>`;
                });
                html += '</tbody></table>';
                $('#cron-schedule').html(html);
            };

            $('#cron-input').on('input', parseCron);
            parseCron();
        }
    },

    // ── Date Converter ──
    'date-converter': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Input</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date/Time Value</label>
                <input type="text" class="form-input" id="date-input" placeholder="e.g. 2024-01-15, 1705276800, now" value="now">
              </div>
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Timezone</label>
                <select class="form-select" id="date-tz">
                  <option value="local">Local</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
            <div class="btn-group" style="margin-top:8px">
              <button class="btn btn-secondary btn-sm" id="date-now-btn"><i class="fas fa-clock"></i> Now</button>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Conversions</div>
            <table class="result-table" id="date-output">
              <thead><tr><th>Format</th><th>Value</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      `);

            const convert = () => {
                let val = $('#date-input').val().trim();
                let date;
                if (val.toLowerCase() === 'now') {
                    date = new Date();
                } else if (/^\d{10}$/.test(val)) {
                    date = new Date(parseInt(val) * 1000);
                } else if (/^\d{13}$/.test(val)) {
                    date = new Date(parseInt(val));
                } else {
                    date = new Date(val);
                }

                if (isNaN(date.getTime())) {
                    $('#date-output tbody').html('<tr><td colspan="2" style="color:var(--accent-red)">Invalid date input</td></tr>');
                    return;
                }

                const rows = [
                    ['ISO 8601', date.toISOString()],
                    ['Unix Timestamp (s)', Math.floor(date.getTime() / 1000)],
                    ['Unix Timestamp (ms)', date.getTime()],
                    ['UTC String', date.toUTCString()],
                    ['Local String', date.toLocaleString()],
                    ['Date Only', date.toLocaleDateString()],
                    ['Time Only', date.toLocaleTimeString()],
                    ['Day of Week', date.toLocaleDateString('en-US', { weekday: 'long' })],
                    ['Relative', getRelativeTime(date)],
                ];

                let html = '';
                rows.forEach(([fmt, v]) => {
                    html += `<tr><td class="text-secondary" style="font-family:inherit">${fmt}</td><td>${v}</td></tr>`;
                });
                $('#date-output tbody').html(html);
            };

            $('#date-input').on('input', convert);
            $('#date-tz').on('change', convert);
            $('#date-now-btn').on('click', () => {
                $('#date-input').val('now');
                convert();
            });
            convert();
        }
    },

    // ── JSON Array to Table, CSV ──
    'json-table-csv': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">JSON Array Input</div>
            <textarea class="form-textarea tall" id="jtc-input" placeholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'>[{"name":"Alice","age":30,"email":"alice@example.com"},{"name":"Bob","age":25,"email":"bob@example.com"}]</textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Output</div>
            <div class="tabs">
              <button class="tab active" data-tab="table">Table</button>
              <button class="tab" data-tab="csv">CSV</button>
            </div>
            <div id="jtc-table-tab" style="overflow-x:auto"></div>
            <div id="jtc-csv-tab" style="display:none;position:relative">
              <button class="copy-btn" data-target="jtc-csv-output"><i class="fas fa-copy"></i> Copy</button>
              <div class="output-area" id="jtc-csv-output"></div>
            </div>
          </div>
        </div>
      `);

            const convert = () => {
                try {
                    const data = JSON.parse($('#jtc-input').val());
                    if (!Array.isArray(data) || data.length === 0) throw new Error('Not an array');
                    const keys = [...new Set(data.flatMap(Object.keys))];

                    // Table
                    let table = '<table class="result-table"><thead><tr>';
                    keys.forEach(k => table += `<th>${escHtml(k)}</th>`);
                    table += '</tr></thead><tbody>';
                    data.forEach(row => {
                        table += '<tr>';
                        keys.forEach(k => table += `<td>${escHtml(String(row[k] ?? ''))}</td>`);
                        table += '</tr>';
                    });
                    table += '</tbody></table>';
                    $('#jtc-table-tab').html(table);

                    // CSV
                    const csvRows = [keys.map(k => `"${k}"`).join(',')];
                    data.forEach(row => {
                        csvRows.push(keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','));
                    });
                    $('#jtc-csv-output').text(csvRows.join('\n'));
                } catch (e) {
                    $('#jtc-table-tab').html(`<div style="color:var(--accent-red);padding:12px">${escHtml(e.message)}</div>`);
                    $('#jtc-csv-output').text(e.message);
                }
            };

            container.find('.tab').on('click', function () {
                container.find('.tab').removeClass('active');
                $(this).addClass('active');
                const tab = $(this).data('tab');
                $('#jtc-table-tab').toggle(tab === 'table');
                $('#jtc-csv-tab').toggle(tab === 'csv');
            });

            $('#jtc-input').on('input', convert);
            convert();
        }
    },

    // ── JSON <> YAML ──
    'json-yaml': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="form-row" style="margin-bottom:12px">
              <div class="btn-group">
                <button class="btn btn-primary btn-sm" id="jy-json2yaml"><i class="fas fa-arrow-right"></i> JSON → YAML</button>
                <button class="btn btn-secondary btn-sm" id="jy-yaml2json"><i class="fas fa-arrow-left"></i> YAML → JSON</button>
              </div>
            </div>
          </div>
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">JSON</span>
                <button class="btn btn-ghost btn-sm" id="jy-paste-json"><i class="fas fa-paste"></i> Paste</button>
              </div>
              <textarea class="form-textarea tall" id="jy-json" placeholder="Paste JSON here...">{
  "name": "DevToys",
  "version": "1.0",
  "features": ["converters","encoders","formatters"]
}</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">YAML</span>
                <button class="btn btn-ghost btn-sm" id="jy-copy-yaml"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="jy-yaml" placeholder="Paste YAML here..."></textarea>
            </div>
          </div>
        </div>
      `);

            $('#jy-json2yaml').on('click', () => {
                try {
                    const obj = JSON.parse($('#jy-json').val());
                    $('#jy-yaml').val(jsonToYaml(obj));
                } catch (e) {
                    showToast('Invalid JSON: ' + e.message, 'error');
                }
            });

            $('#jy-yaml2json').on('click', () => {
                try {
                    const obj = yamlToJson($('#jy-yaml').val());
                    $('#jy-json').val(JSON.stringify(obj, null, 2));
                } catch (e) {
                    showToast('Invalid YAML: ' + e.message, 'error');
                }
            });

            $('#jy-paste-json').on('click', async () => {
                const text = await navigator.clipboard.readText();
                $('#jy-json').val(text);
            });

            $('#jy-copy-yaml').on('click', () => {
                copyToClipboard($('#jy-yaml').val());
            });

            // Auto-convert on load
            try {
                const obj = JSON.parse($('#jy-json').val());
                $('#jy-yaml').val(jsonToYaml(obj));
            } catch (e) { }
        }
    },

    // ── Number Base ──
    'number-base': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Number Base Converter</div>
            <div class="form-group">
              <label class="form-label">Decimal (Base 10)</label>
              <input type="text" class="form-input" id="nb-dec" placeholder="Enter decimal number" value="255">
            </div>
            <div class="form-group">
              <label class="form-label">Binary (Base 2)</label>
              <input type="text" class="form-input" id="nb-bin" placeholder="Enter binary number">
            </div>
            <div class="form-group">
              <label class="form-label">Octal (Base 8)</label>
              <input type="text" class="form-input" id="nb-oct" placeholder="Enter octal number">
            </div>
            <div class="form-group">
              <label class="form-label">Hexadecimal (Base 16)</label>
              <input type="text" class="form-input" id="nb-hex" placeholder="Enter hex number">
            </div>
          </div>
        </div>
      `);

            let updating = false;

            const updateFrom = (base, val) => {
                if (updating) return;
                updating = true;
                let num;
                try {
                    num = parseInt(val, base);
                    if (isNaN(num)) throw new Error();
                } catch {
                    updating = false;
                    return;
                }
                if (base !== 10) $('#nb-dec').val(num.toString(10));
                if (base !== 2) $('#nb-bin').val(num.toString(2));
                if (base !== 8) $('#nb-oct').val(num.toString(8));
                if (base !== 16) $('#nb-hex').val(num.toString(16).toUpperCase());
                updating = false;
            };

            $('#nb-dec').on('input', function () { updateFrom(10, this.value); });
            $('#nb-bin').on('input', function () { updateFrom(2, this.value); });
            $('#nb-oct').on('input', function () { updateFrom(8, this.value); });
            $('#nb-hex').on('input', function () { updateFrom(16, this.value); });

            updateFrom(10, '255');
        }
    },

    // ── JSON to Code (TypeScript / Go / Python) ──
    'json-to-code': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="form-row">
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Language</label>
                <select class="form-select" id="jtc2-lang">
                  <option value="typescript">TypeScript interface</option>
                  <option value="zod">TypeScript + Zod</option>
                  <option value="go">Go struct</option>
                  <option value="python">Python dataclass</option>
                </select>
              </div>
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Root name</label>
                <input type="text" class="form-input" id="jtc2-root" value="Root">
              </div>
              <div class="toggle-group" style="align-items:flex-end;padding-bottom:8px">
                <label class="toggle"><input type="checkbox" id="jtc2-optional"><span class="toggle-slider"></span></label>
                <span class="toggle-label">Optional fields</span>
              </div>
            </div>
          </div>
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">JSON</span></div>
              <textarea class="form-textarea tall" id="jtc2-input">{
  "id": 42,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "active": true,
  "score": 98.5,
  "tags": ["admin", "math"],
  "address": { "city": "London", "zip": "NW1" },
  "orders": [{ "orderId": "A-1", "total": 19.99 }],
  "manager": null
}</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">Output</span>
                <button class="btn btn-ghost btn-sm" id="jtc2-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="jtc2-output" readonly></textarea>
            </div>
          </div>
        </div>
      `);

            function convert() {
                let data;
                try {
                    data = JSON.parse($('#jtc2-input').val());
                } catch (e) {
                    $('#jtc2-output').val('// Invalid JSON: ' + e.message);
                    return;
                }
                const root = toPascalCase($('#jtc2-root').val()) || 'Root';
                $('#jtc2-output').val(jsonToCode(data, root, $('#jtc2-lang').val(), $('#jtc2-optional').is(':checked')));
            }

            $('#jtc2-input, #jtc2-root').on('input', debounce(convert, 200));
            $('#jtc2-lang, #jtc2-optional').on('change', convert);
            $('#jtc2-copy').on('click', () => copyToClipboard($('#jtc2-output').val()));
            convert();
        }
    },

    // ── CSV to JSON ──
    'csv-to-json': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="form-row">
              <div class="form-group" style="max-width:160px">
                <label class="form-label">Delimiter</label>
                <select class="form-select" id="c2j-delim">
                  <option value="auto">Auto-detect</option>
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
              <div class="toggle-group" style="align-items:flex-end;padding-bottom:8px">
                <label class="toggle"><input type="checkbox" id="c2j-header" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">First row is header</span>
              </div>
              <div class="toggle-group" style="align-items:flex-end;padding-bottom:8px">
                <label class="toggle"><input type="checkbox" id="c2j-types" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Infer numbers / booleans</span>
              </div>
            </div>
          </div>
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">CSV</span></div>
              <textarea class="form-textarea tall" id="c2j-input">id,name,email,active,balance
1,Ada Lovelace,ada@example.com,true,1200.50
2,"Hopper, Grace",grace@example.com,false,88
3,Alan Turing,"alan@example.com",true,</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title" id="c2j-count">JSON</span>
                <button class="btn btn-ghost btn-sm" id="c2j-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="c2j-output" readonly></textarea>
            </div>
          </div>
        </div>
      `);

            function convert() {
                const text = $('#c2j-input').val();
                let delim = $('#c2j-delim').val();
                if (delim === 'auto') delim = detectDelimiter(text);
                const rows = parseCsv(text, delim);
                const infer = $('#c2j-types').is(':checked');
                const cast = v => {
                    if (!infer) return v;
                    if (v === '') return null;
                    if (v === 'true' || v === 'false') return v === 'true';
                    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(v) && !/^-?0\d/.test(v)) return Number(v);
                    return v;
                };

                let result;
                if ($('#c2j-header').is(':checked') && rows.length) {
                    const headers = rows[0];
                    result = rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, cast(r[i] ?? '')])));
                } else {
                    result = rows.map(r => r.map(cast));
                }
                $('#c2j-output').val(JSON.stringify(result, null, 2));
                $('#c2j-count').text(`JSON (${result.length} rows)`);
            }

            $('#c2j-input').on('input', debounce(convert, 200));
            $('#c2j-delim, #c2j-header, #c2j-types').on('change', convert);
            $('#c2j-copy').on('click', () => copyToClipboard($('#c2j-output').val()));
            convert();
        }
    },
};

// ── Cron Helpers ──
function describeCron(min, hr, dom, mon, dow) {
    const parts = [];
    const descField = (v, unit, names) => {
        if (v === '*') return `every ${unit}`;
        if (v.includes('/')) { const [, step] = v.split('/'); return `every ${step} ${unit}(s)`; }
        if (v.includes(',')) return `at ${unit}(s) ${v}`;
        if (v.includes('-')) { const [a, b] = v.split('-'); return `${unit}s ${a} through ${b}`; }
        if (names && names[parseInt(v)]) return names[parseInt(v)];
        return `at ${unit} ${v}`;
    };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monNames = [, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    parts.push(descField(min, 'minute'));
    parts.push(descField(hr, 'hour'));
    if (dom !== '*') parts.push(descField(dom, 'day of month'));
    if (mon !== '*') parts.push(descField(mon, 'month', monNames));
    if (dow !== '*') parts.push(`on ${descField(dow, 'day', dayNames)}`);

    return parts.join(', ');
}

function getNextCronRuns(parts, count) {
    const [minP, hrP, domP, monP, dowP] = parts;
    const runs = [];
    const now = new Date();
    let d = new Date(now);
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);

    const matches = (val, field) => {
        if (field === '*') return true;
        if (field.includes('/')) {
            const [base, step] = field.split('/');
            const b = base === '*' ? 0 : parseInt(base);
            return (val - b) % parseInt(step) === 0 && val >= b;
        }
        if (field.includes(',')) return field.split(',').map(Number).includes(val);
        if (field.includes('-')) { const [a, b] = field.split('-').map(Number); return val >= a && val <= b; }
        return val === parseInt(field);
    };

    let safety = 0;
    while (runs.length < count && safety < 525960) {
        safety++;
        if (matches(d.getMinutes(), minP) && matches(d.getHours(), hrP) &&
            matches(d.getDate(), domP) && matches(d.getMonth() + 1, monP) &&
            matches(d.getDay(), dowP)) {
            runs.push(new Date(d));
        }
        d.setMinutes(d.getMinutes() + 1);
    }
    return runs;
}

function getRelativeTime(date) {
    const diff = Date.now() - date.getTime();
    const abs = Math.abs(diff);
    const suffix = diff > 0 ? 'ago' : 'from now';
    if (abs < 60000) return 'just now';
    if (abs < 3600000) return `${Math.floor(abs / 60000)} minute(s) ${suffix}`;
    if (abs < 86400000) return `${Math.floor(abs / 3600000)} hour(s) ${suffix}`;
    if (abs < 2592000000) return `${Math.floor(abs / 86400000)} day(s) ${suffix}`;
    return `${Math.floor(abs / 2592000000)} month(s) ${suffix}`;
}

// ── Simple JSON to YAML ──
function jsonToYaml(obj, indent = 0) {
    const pad = '  '.repeat(indent);
    if (obj === null) return 'null';
    if (typeof obj !== 'object') {
        if (typeof obj === 'string') return obj.includes('\n') ? `|\n${obj.split('\n').map(l => pad + '  ' + l).join('\n')}` : obj;
        return String(obj);
    }
    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map(item => {
            const val = jsonToYaml(item, indent + 1);
            if (typeof item === 'object' && item !== null) return `${pad}- ${val.trimStart()}`;
            return `${pad}- ${val}`;
        }).join('\n');
    }
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    return keys.map(key => {
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
            return `${pad}${key}:\n${jsonToYaml(val, indent + 1)}`;
        }
        return `${pad}${key}: ${jsonToYaml(val, indent)}`;
    }).join('\n');
}

// ── Simple YAML to JSON ──
function yamlToJson(yaml) {
    // Basic YAML parser for simple structures
    const lines = yaml.split('\n');
    const result = {};
    let currentObj = result;
    const stack = [{ obj: result, indent: -1 }];

    for (let line of lines) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const indent = line.search(/\S/);
        const content = line.trim();

        // Pop stack to correct level
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }
        currentObj = stack[stack.length - 1].obj;

        if (content.startsWith('- ')) {
            // Array item
            const val = content.substring(2).trim();
            if (Array.isArray(currentObj)) {
                currentObj.push(parseYamlValue(val));
            }
        } else if (content.includes(':')) {
            const colonIdx = content.indexOf(':');
            const key = content.substring(0, colonIdx).trim();
            const val = content.substring(colonIdx + 1).trim();

            if (val === '' || val === '|' || val === '>') {
                // Could be object or array
                const nextLine = lines[lines.indexOf(line) + 1];
                if (nextLine && nextLine.trim().startsWith('- ')) {
                    currentObj[key] = [];
                    stack.push({ obj: currentObj[key], indent: indent });
                } else {
                    currentObj[key] = {};
                    stack.push({ obj: currentObj[key], indent: indent });
                }
            } else {
                currentObj[key] = parseYamlValue(val);
            }
        }
    }
    return result;
}

function parseYamlValue(val) {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null' || val === '~') return null;
    if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
    if (val.startsWith('[') && val.endsWith(']')) {
        try { return JSON.parse(val); } catch { return val; }
    }
    const num = Number(val);
    if (!isNaN(num) && val !== '') return num;
    return val;
}

// ── JSON to Code Helpers ──
function toPascalCase(str) {
    return String(str).replace(/[^a-zA-Z0-9]+(.)?/g, (m, c) => c ? c.toUpperCase() : '')
        .replace(/^[a-z]/, c => c.toUpperCase())
        .replace(/^(\d)/, '_$1');
}

function singularize(name) {
    if (/ies$/i.test(name)) return name.slice(0, -3) + 'y';
    if (/(ss|us)$/i.test(name)) return name;
    if (/s$/i.test(name)) return name.slice(0, -1);
    return name + 'Item';
}

/**
 * Walks JSON and builds named type definitions.
 * Returns { types: [{ name, fields: [{ key, type, optional }] }], rootType }
 * where type is a descriptor: { kind: 'string'|'int'|'float'|'bool'|'null'|'any'|'object'|'array', name?, of? }
 */
function inferTypes(data, rootName) {
    const types = [];
    const used = new Set();

    function uniqueName(base) {
        let name = toPascalCase(base) || 'Type', n = 2;
        while (used.has(name)) name = toPascalCase(base) + n++;
        used.add(name);
        return name;
    }

    // Merge a list of sample objects into one type so array items with varying keys are covered
    function objectType(samples, name) {
        const typeName = uniqueName(name);
        const def = { name: typeName, fields: [] };
        types.push(def);
        const keys = [...new Set(samples.flatMap(s => Object.keys(s)))];
        keys.forEach(key => {
            const values = samples.filter(s => key in s).map(s => s[key]);
            const optional = values.length < samples.length;
            def.fields.push({ key, type: describe(values, key), optional });
        });
        return { kind: 'object', name: typeName };
    }

    function describe(values, name) {
        const nonNull = values.filter(v => v !== null);
        const nullable = nonNull.length < values.length;
        if (!nonNull.length) return { kind: 'null' };
        const kinds = new Set(nonNull.map(v => Array.isArray(v) ? 'array' : typeof v));
        let t;
        if (kinds.size > 1) t = { kind: 'any' };
        else {
            const k = [...kinds][0];
            if (k === 'string') t = { kind: 'string' };
            else if (k === 'boolean') t = { kind: 'bool' };
            else if (k === 'number') t = { kind: nonNull.every(Number.isInteger) ? 'int' : 'float' };
            else if (k === 'array') t = { kind: 'array', of: describe(nonNull.flat(), singularize(name)) };
            else t = objectType(nonNull, name);
        }
        if (nullable) t.nullable = true;
        return t;
    }

    const rootType = describe([data], rootName);
    return { types, rootType };
}

function jsonToCode(data, rootName, lang, allOptional) {
    const { types, rootType } = inferTypes(data, rootName);
    const ident = k => /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
    const snake = k => k.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase().replace(/^(\d)/, '_$1');
    const out = [];

    if (lang === 'typescript') {
        const ts = t => {
            const base = { string: 'string', int: 'number', float: 'number', bool: 'boolean', null: 'null', any: 'unknown', object: t.name }[t.kind]
                || `${ts(t.of).includes('|') ? `(${ts(t.of)})` : ts(t.of)}[]`;
            return t.nullable ? `${base} | null` : base;
        };
        types.forEach(def => {
            out.push(`export interface ${def.name} {`);
            def.fields.forEach(f => out.push(`  ${ident(f.key)}${f.optional || allOptional ? '?' : ''}: ${ts(f.type)};`));
            out.push('}', '');
        });
        if (rootType.kind !== 'object') out.push(`export type ${toPascalCase(rootName)} = ${ts(rootType)};`);
    }

    if (lang === 'zod') {
        const zod = t => {
            let s = { string: 'z.string()', int: 'z.number().int()', float: 'z.number()', bool: 'z.boolean()', null: 'z.null()', any: 'z.unknown()', object: `${t.name}Schema` }[t.kind]
                || `z.array(${zod(t.of)})`;
            return t.nullable ? s + '.nullable()' : s;
        };
        out.push("import { z } from 'zod';", '');
        // Dependencies must be declared before use, so emit in reverse discovery order
        [...types].reverse().forEach(def => {
            out.push(`export const ${def.name}Schema = z.object({`);
            def.fields.forEach(f => out.push(`  ${ident(f.key)}: ${zod(f.type)}${f.optional || allOptional ? '.optional()' : ''},`));
            out.push('});', `export type ${def.name} = z.infer<typeof ${def.name}Schema>;`, '');
        });
        if (rootType.kind !== 'object') out.push(`export const ${toPascalCase(rootName)}Schema = ${zod(rootType)};`);
    }

    if (lang === 'go') {
        const go = t => {
            const base = { string: 'string', int: 'int64', float: 'float64', bool: 'bool', null: 'interface{}', any: 'interface{}', object: t.name }[t.kind]
                || `[]${go(t.of)}`;
            return t.nullable && !['null', 'any', 'array'].includes(t.kind) ? '*' + base : base;
        };
        out.push('package main', '');
        types.forEach(def => {
            out.push(`type ${def.name} struct {`);
            const width = Math.max(...def.fields.map(f => toPascalCase(f.key).length), 0);
            const typeWidth = Math.max(...def.fields.map(f => go(f.type).length), 0);
            def.fields.forEach(f => {
                const omit = f.optional || allOptional ? ',omitempty' : '';
                out.push(`\t${toPascalCase(f.key).padEnd(width)} ${go(f.type).padEnd(typeWidth)} \`json:"${f.key}${omit}"\``);
            });
            out.push('}', '');
        });
        if (rootType.kind !== 'object') out.push(`type ${toPascalCase(rootName)} ${go(rootType)}`);
    }

    if (lang === 'python') {
        const py = t => {
            const base = { string: 'str', int: 'int', float: 'float', bool: 'bool', null: 'None', any: 'Any', object: t.name }[t.kind]
                || `list[${py(t.of)}]`;
            return t.nullable ? `Optional[${base}]` : base;
        };
        out.push('from __future__ import annotations', '', 'from dataclasses import dataclass', 'from typing import Any, Optional', '', '');
        [...types].reverse().forEach(def => {
            out.push('@dataclass', `class ${def.name}:`);
            if (!def.fields.length) out.push('    pass');
            // Fields with defaults must come after required fields
            const sorted = [...def.fields].sort((a, b) => (a.optional || allOptional) - (b.optional || allOptional));
            sorted.forEach(f => {
                const opt = f.optional || allOptional;
                out.push(`    ${snake(f.key)}: ${opt && !f.type.nullable ? `Optional[${py(f.type)}]` : py(f.type)}${opt ? ' = None' : ''}`);
            });
            out.push('', '');
        });
        if (rootType.kind !== 'object') out.push(`${toPascalCase(rootName)} = ${py(rootType)}`);
    }

    return out.join('\n').trim() + '\n';
}

// ── CSV Helpers ──
function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const candidates = [',', ';', '\t', '|'];
    return candidates.reduce((best, d) => firstLine.split(d).length > firstLine.split(best).length ? d : best, ',');
}

// RFC 4180 parser: handles quoted fields, escaped quotes ("") and newlines inside quotes
function parseCsv(text, delim = ',') {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') inQuotes = false;
            else field += c;
        } else if (c === '"' && field === '') {
            inQuotes = true;
        } else if (c === delim) {
            row.push(field); field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.length > 1 || row[0] !== '') rows.push(row);
            row = [];
        } else {
            field += c;
        }
    }
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
    return rows;
}
