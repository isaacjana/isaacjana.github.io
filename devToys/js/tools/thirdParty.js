/**
 * DevToys - Third Party Tools
 * Duplicate Detector, File Splitter, JSON Schema, JSON to PHP, JSON to C#,
 * PNG Compressor, Randomizer, RESX Translator, RSA Generator,
 * Semver Calculator, Text Delimiter, ULID Generator, XSD Generator
 */

const ThirdPartyTools = {

  // ── Duplicate Detector ──
  'duplicate-detector': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Input Text (one item per line)</div>
            <textarea class="form-textarea tall" id="dd-input" placeholder="Enter text, one item per line...">apple
banana
cherry
apple
date
banana
elderberry
cherry
apple</textarea>
          </div>
          <div class="tool-section">
            <div class="form-row">
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="dd-case"><span class="toggle-slider"></span></label>
                <span class="toggle-label">Case Sensitive</span>
              </div>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="dd-trim" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Trim Whitespace</span>
              </div>
              <button class="btn btn-primary btn-sm" id="dd-detect"><i class="fas fa-search"></i> Detect</button>
            </div>
          </div>
          <div class="tool-section">
            <div class="tabs">
              <button class="tab active" data-tab="dupes">Duplicates</button>
              <button class="tab" data-tab="unique">Unique Only</button>
              <button class="tab" data-tab="removed">Duplicates Removed</button>
            </div>
            <div class="output-area" id="dd-output" style="min-height:120px"></div>
            <div id="dd-stats" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
          </div>
        </div>
      `);

      let results = { dupes: [], unique: [], removed: [] };

      const detect = () => {
        const caseS = $('#dd-case').is(':checked');
        const trim = $('#dd-trim').is(':checked');
        let lines = $('#dd-input').val().split('\n').filter(l => l.trim());
        if (trim) lines = lines.map(l => l.trim());

        const normalize = s => caseS ? s : s.toLowerCase();
        const counts = {};
        lines.forEach(l => counts[normalize(l)] = (counts[normalize(l)] || 0) + 1);

        results.dupes = [...new Set(lines.filter(l => counts[normalize(l)] > 1))];
        results.unique = lines.filter(l => counts[normalize(l)] === 1);
        results.removed = [...new Set(lines)];

        showTab('dupes');
        $('#dd-stats').text(`Total: ${lines.length} | Unique: ${results.removed.length} | Duplicated: ${results.dupes.length}`);
      };

      const showTab = (tab) => {
        const data = results[tab] || [];
        if (tab === 'dupes') {
          const caseS = $('#dd-case').is(':checked');
          const normalize = s => caseS ? s : s.toLowerCase();
          const lines = $('#dd-input').val().split('\n').filter(l => l.trim());
          const counts = {};
          lines.forEach(l => counts[normalize(l)] = (counts[normalize(l)] || 0) + 1);
          const output = data.map(d => `${d} (×${counts[normalize(d)]})`).join('\n');
          $('#dd-output').text(output || '(no duplicates)');
        } else {
          $('#dd-output').text(data.join('\n') || '(empty)');
        }
      };

      container.find('.tab').on('click', function () {
        container.find('.tab').removeClass('active');
        $(this).addClass('active');
        showTab($(this).data('tab'));
      });

      $('#dd-detect').on('click', detect);
      detect();
    }
  },

  // ── File Splitter ──
  'file-splitter': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Input Text</div>
            <textarea class="form-textarea tall" id="fs-input" placeholder="Paste text to split...">Line 1
Line 2
Line 3
Line 4
Line 5
Line 6
Line 7
Line 8
Line 9
Line 10</textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Split Options</div>
            <div class="form-row">
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Split By</label>
                <select class="form-select" id="fs-mode">
                  <option value="lines">Number of Lines</option>
                  <option value="parts">Number of Parts</option>
                  <option value="delimiter">Custom Delimiter</option>
                </select>
              </div>
              <div class="form-group" style="max-width:120px">
                <label class="form-label">Value</label>
                <input type="text" class="form-input" id="fs-value" value="3">
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="fs-split"><i class="fas fa-cut"></i> Split</button>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Result</div>
            <div id="fs-output"></div>
          </div>
        </div>
      `);

      $('#fs-split').on('click', () => {
        const text = $('#fs-input').val();
        const mode = $('#fs-mode').val();
        const value = $('#fs-value').val();
        const lines = text.split('\n');
        let parts = [];

        switch (mode) {
          case 'lines': {
            const n = parseInt(value) || 1;
            for (let i = 0; i < lines.length; i += n) {
              parts.push(lines.slice(i, i + n).join('\n'));
            }
            break;
          }
          case 'parts': {
            const n = parseInt(value) || 1;
            const size = Math.ceil(lines.length / n);
            for (let i = 0; i < lines.length; i += size) {
              parts.push(lines.slice(i, i + size).join('\n'));
            }
            break;
          }
          case 'delimiter': {
            parts = text.split(value);
            break;
          }
        }

        let html = '';
        parts.forEach((part, i) => {
          html += `<div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span class="badge badge-blue">Part ${i + 1}</span>
              <button class="btn btn-ghost btn-sm" onclick="copyToClipboard(document.getElementById('fs-part-${i}').textContent)"><i class="fas fa-copy"></i></button>
            </div>
            <div class="output-area" id="fs-part-${i}">${escHtml(part)}</div>
          </div>`;
        });
        html += `<div style="font-size:12px;color:var(--text-muted)">Split into ${parts.length} parts</div>`;
        $('#fs-output').html(html);
      });
    }
  },

  // ── JSON Schema Generator ──
  'json-schema': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">JSON Input</span>
              </div>
              <textarea class="form-textarea tall" id="js-input" placeholder="Paste JSON data...">{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "active": true,
  "tags": ["developer", "admin"],
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zip": "12345"
  }
}</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">JSON Schema</span>
                <button class="btn btn-ghost btn-sm" id="js-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="js-output" readonly></textarea>
            </div>
          </div>
          <div class="tool-section" style="margin-top:16px">
            <button class="btn btn-primary" id="js-generate"><i class="fas fa-project-diagram"></i> Generate Schema</button>
          </div>
        </div>
      `);

      const generateSchema = (data, title = 'Root') => {
        const schema = { $schema: 'http://json-schema.org/draft-07/schema#', title };

        const inferType = (value) => {
          if (value === null) return { type: 'null' };
          if (Array.isArray(value)) {
            const items = value.length > 0 ? inferType(value[0]) : {};
            return { type: 'array', items };
          }
          if (typeof value === 'object') {
            const properties = {};
            const required = Object.keys(value);
            for (const [k, v] of Object.entries(value)) {
              properties[k] = inferType(v);
            }
            return { type: 'object', properties, required };
          }
          if (typeof value === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) return { type: 'string', format: 'date-time' };
            if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) return { type: 'string', format: 'email' };
            if (/^https?:\/\//.test(value)) return { type: 'string', format: 'uri' };
            return { type: 'string' };
          }
          if (typeof value === 'number') {
            return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
          }
          if (typeof value === 'boolean') return { type: 'boolean' };
          return {};
        };

        return { ...schema, ...inferType(data) };
      };

      $('#js-generate').on('click', () => {
        try {
          const data = JSON.parse($('#js-input').val());
          const schema = generateSchema(data);
          $('#js-output').val(JSON.stringify(schema, null, 2));
        } catch (e) {
          showToast('Invalid JSON: ' + e.message, 'error');
        }
      });

      $('#js-copy').on('click', () => copyToClipboard($('#js-output').val()));
      $('#js-generate').click();
    }
  },

  // ── JSON to PHP ──
  'json-to-php': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">JSON</span></div>
              <textarea class="form-textarea tall" id="jphp-input" placeholder="Paste JSON here...">{
  "name": "DevToys",
  "version": 1.0,
  "features": ["converters", "encoders"],
  "config": {
    "theme": "dark",
    "language": "en"
  }
}</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">PHP Array</span>
                <button class="btn btn-ghost btn-sm" id="jphp-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="jphp-output" readonly></textarea>
            </div>
          </div>
          <div class="tool-section" style="margin-top:16px">
            <button class="btn btn-primary" id="jphp-convert"><i class="fas fa-exchange-alt"></i> Convert</button>
          </div>
        </div>
      `);

      const jsonToPhp = (data, indent = 0) => {
        const pad = '    '.repeat(indent);
        const pad1 = '    '.repeat(indent + 1);

        if (data === null) return 'null';
        if (typeof data === 'boolean') return data ? 'true' : 'false';
        if (typeof data === 'number') return String(data);
        if (typeof data === 'string') return `'${data.replace(/'/g, "\\'")}'`;

        if (Array.isArray(data)) {
          if (data.length === 0) return '[]';
          const items = data.map(item => `${pad1}${jsonToPhp(item, indent + 1)}`);
          return `[\n${items.join(',\n')}\n${pad}]`;
        }

        if (typeof data === 'object') {
          const keys = Object.keys(data);
          if (keys.length === 0) return '[]';
          const items = keys.map(key => `${pad1}'${key}' => ${jsonToPhp(data[key], indent + 1)}`);
          return `[\n${items.join(',\n')}\n${pad}]`;
        }

        return String(data);
      };

      $('#jphp-convert').on('click', () => {
        try {
          const data = JSON.parse($('#jphp-input').val());
          const php = `<?php\n\n$data = ${jsonToPhp(data)};\n`;
          $('#jphp-output').val(php);
        } catch (e) {
          showToast('Invalid JSON: ' + e.message, 'error');
        }
      });

      $('#jphp-copy').on('click', () => copyToClipboard($('#jphp-output').val()));
      $('#jphp-convert').click();
    }
  },

  // ── JSON to C# ──
  'json-to-csharp': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">JSON</span></div>
              <textarea class="form-textarea tall" id="jcs-input" placeholder="Paste JSON here...">{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true,
  "score": 95.5,
  "tags": ["admin", "user"],
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  }
}</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">C# Classes</span>
                <button class="btn btn-ghost btn-sm" id="jcs-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="jcs-output" readonly></textarea>
            </div>
          </div>
          <div class="tool-section" style="margin-top:16px">
            <div class="form-row">
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Root Class Name</label>
                <input type="text" class="form-input" id="jcs-classname" value="RootObject">
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="jcs-convert"><i class="fas fa-exchange-alt"></i> Convert</button>
              </div>
            </div>
          </div>
        </div>
      `);

      const getCSharpType = (value, key) => {
        if (value === null) return 'object';
        if (typeof value === 'boolean') return 'bool';
        if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
        if (typeof value === 'string') {
          if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'DateTime';
          return 'string';
        }
        if (Array.isArray(value)) {
          if (value.length === 0) return 'List<object>';
          const itemType = getCSharpType(value[0], key);
          return `List<${itemType}>`;
        }
        if (typeof value === 'object') {
          return capitalize(key);
        }
        return 'object';
      };

      const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

      const jsonToCSharp = (data, className) => {
        const classes = [];

        const processObject = (obj, name) => {
          let code = `public class ${name}\n{\n`;
          for (const [key, value] of Object.entries(obj)) {
            const type = getCSharpType(value, key);
            const propName = capitalize(key);
            code += `    public ${type} ${propName} { get; set; }\n`;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              processObject(value, capitalize(key));
            }
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
              processObject(value[0], capitalize(key));
            }
          }
          code += '}\n';
          classes.push(code);
        };

        processObject(data, className);
        return classes.join('\n');
      };

      $('#jcs-convert').on('click', () => {
        try {
          const data = JSON.parse($('#jcs-input').val());
          const className = $('#jcs-classname').val() || 'RootObject';
          const csharp = `using System;\nusing System.Collections.Generic;\n\n${jsonToCSharp(data, className)}`;
          $('#jcs-output').val(csharp);
        } catch (e) {
          showToast('Invalid JSON: ' + e.message, 'error');
        }
      });

      $('#jcs-copy').on('click', () => copyToClipboard($('#jcs-output').val()));
      $('#jcs-convert').click();
    }
  },

  // ── PNG Compressor ──
  'png-compressor': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Upload Image</div>
            <div class="drop-zone" id="pc-drop">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Drop a PNG image here or click to select</p>
            </div>
            <input type="file" id="pc-file" accept="image/png,image/*" style="display:none">
          </div>
          <div id="pc-options" style="display:none">
            <div class="tool-section">
              <div class="tool-section-title">Quality</div>
              <div class="form-group">
                <label class="form-label">Compression Quality: <span id="pc-quality-val">80</span>%</label>
                <input type="range" id="pc-quality" min="1" max="100" value="80" style="width:100%;accent-color:var(--accent-blue)">
              </div>
              <button class="btn btn-primary" id="pc-compress"><i class="fas fa-compress"></i> Compress & Download</button>
            </div>
            <div class="tool-section">
              <div class="split-view">
                <div>
                  <div class="tool-section-title">Original</div>
                  <div class="image-preview-container" id="pc-original"></div>
                  <div id="pc-original-size" style="font-size:12px;color:var(--text-muted);margin-top:4px"></div>
                </div>
                <div>
                  <div class="tool-section-title">Compressed</div>
                  <div class="image-preview-container" id="pc-compressed"></div>
                  <div id="pc-compressed-size" style="font-size:12px;color:var(--text-muted);margin-top:4px"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);

      let currentFile = null;

      const dropZone = $('#pc-drop');
      dropZone.on('click', () => $('#pc-file').click());
      $('#pc-file').on('change', function () { if (this.files[0]) loadFile(this.files[0]); });
      dropZone.on('dragover', e => { e.preventDefault(); dropZone.addClass('dragover'); });
      dropZone.on('dragleave', () => dropZone.removeClass('dragover'));
      dropZone.on('drop', e => {
        e.preventDefault(); dropZone.removeClass('dragover');
        if (e.originalEvent.dataTransfer.files[0]) loadFile(e.originalEvent.dataTransfer.files[0]);
      });

      function loadFile(file) {
        currentFile = file;
        const img = new Image();
        img.onload = () => {
          $('#pc-original').html(`<img src="${img.src}" style="max-width:100%">`);
          $('#pc-original-size').text(`${img.width}×${img.height} | ${formatBytes(file.size)}`);
          $('#pc-options').show();
        };
        img.src = URL.createObjectURL(file);
      }

      $('#pc-quality').on('input', function () { $('#pc-quality-val').text(this.value); });

      $('#pc-compress').on('click', () => {
        if (!currentFile) return;
        const quality = parseInt($('#pc-quality').val()) / 100;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            $('#pc-compressed').html(`<img src="${url}" style="max-width:100%">`);
            const savings = ((1 - blob.size / currentFile.size) * 100).toFixed(1);
            $('#pc-compressed-size').text(`${formatBytes(blob.size)} (${savings}% smaller)`);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed.webp';
            a.click();
            showToast('Image compressed!', 'success');
          }, 'image/webp', quality);
        };
        img.src = URL.createObjectURL(currentFile);
      });
    }
  },

  // ── Randomizer ──
  'randomizer': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Random Number</div>
            <div class="form-row">
              <div class="form-group" style="max-width:150px">
                <label class="form-label">Min</label>
                <input type="number" class="form-input" id="rand-min" value="1">
              </div>
              <div class="form-group" style="max-width:150px">
                <label class="form-label">Max</label>
                <input type="number" class="form-input" id="rand-max" value="100">
              </div>
              <div class="form-group" style="max-width:100px">
                <label class="form-label">Count</label>
                <input type="number" class="form-input" id="rand-count" value="1" min="1" max="100">
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="rand-gen"><i class="fas fa-dice"></i> Roll</button>
              </div>
            </div>
            <div class="output-area" id="rand-num-output" style="font-size:24px;text-align:center;min-height:60px;display:flex;align-items:center;justify-content:center;color:var(--accent-blue)"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Random Pick from List</div>
            <textarea class="form-textarea" id="rand-list" placeholder="One item per line...">Pizza
Sushi
Burger
Pasta
Tacos
Salad</textarea>
            <div class="form-row" style="margin-top:8px">
              <div class="form-group" style="max-width:100px">
                <label class="form-label">Pick</label>
                <input type="number" class="form-input" id="rand-pick-count" value="1" min="1">
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="rand-pick"><i class="fas fa-hand-pointer"></i> Pick</button>
              </div>
            </div>
            <div class="output-area" id="rand-pick-output" style="font-size:18px;text-align:center;min-height:50px;display:flex;align-items:center;justify-content:center;color:var(--accent-green)"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Shuffle List</div>
            <textarea class="form-textarea" id="rand-shuffle" placeholder="One item per line...">1. First
2. Second
3. Third
4. Fourth
5. Fifth</textarea>
            <button class="btn btn-secondary btn-sm" id="rand-shuffle-btn" style="margin-top:8px"><i class="fas fa-random"></i> Shuffle</button>
          </div>
        </div>
      `);

      $('#rand-gen').on('click', () => {
        const min = parseInt($('#rand-min').val());
        const max = parseInt($('#rand-max').val());
        const count = parseInt($('#rand-count').val()) || 1;
        const results = [];
        for (let i = 0; i < count; i++) {
          results.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        $('#rand-num-output').text(results.join(', '));
      });

      $('#rand-pick').on('click', () => {
        const items = $('#rand-list').val().split('\n').filter(l => l.trim());
        const count = Math.min(parseInt($('#rand-pick-count').val()) || 1, items.length);
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, count);
        $('#rand-pick-output').text(picked.join(', '));
      });

      $('#rand-shuffle-btn').on('click', () => {
        const lines = $('#rand-shuffle').val().split('\n');
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        $('#rand-shuffle').val(lines.join('\n'));
        showToast('List shuffled!', 'success');
      });

      $('#rand-gen').click();
    }
  },

  // ── RESX Translator ──
  'resx-translator': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">.resx XML Input</div>
            <textarea class="form-textarea tall" id="resx-input" placeholder="Paste .resx file content here...">
<root>
  <data name="AppTitle" xml:space="preserve">
    <value>My Application</value>
    <comment>Main window title</comment>
  </data>
  <data name="WelcomeMessage" xml:space="preserve">
    <value>Welcome to our app!</value>
  </data>
  <data name="ButtonOK" xml:space="preserve">
    <value>OK</value>
  </data>
  <data name="ButtonCancel" xml:space="preserve">
    <value>Cancel</value>
  </data>
</root></textarea>
          </div>
          <div class="tool-section">
            <button class="btn btn-primary" id="resx-parse"><i class="fas fa-language"></i> Parse</button>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Extracted Resources</div>
            <div id="resx-output"></div>
          </div>
        </div>
      `);

      $('#resx-parse').on('click', () => {
        const xml = $('#resx-input').val();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const errors = doc.getElementsByTagName('parsererror');
        if (errors.length) {
          $('#resx-output').html(`<span style="color:var(--accent-red)">Invalid XML</span>`);
          return;
        }

        const dataNodes = doc.querySelectorAll('data');
        let html = '<table class="result-table"><thead><tr><th>Key</th><th>Value</th><th>Comment</th></tr></thead><tbody>';
        dataNodes.forEach(node => {
          const name = node.getAttribute('name') || '';
          const value = node.querySelector('value')?.textContent || '';
          const comment = node.querySelector('comment')?.textContent || '';
          html += `<tr><td>${escHtml(name)}</td><td>${escHtml(value)}</td><td style="color:var(--text-muted)">${escHtml(comment)}</td></tr>`;
        });
        html += '</tbody></table>';
        html += `<div style="font-size:12px;color:var(--text-muted);margin-top:8px">${dataNodes.length} resource(s) found</div>`;
        $('#resx-output').html(html);
      });
    }
  },

  // ── RSA Key Generator ──
  'rsa-generator': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Options</div>
            <div class="form-row">
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Key Size (bits)</label>
                <select class="form-select" id="rsa-bits">
                  <option value="1024">1024</option>
                  <option value="2048" selected>2048</option>
                  <option value="4096">4096</option>
                </select>
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="rsa-generate"><i class="fas fa-key"></i> Generate Key Pair</button>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div class="split-pane-header">
              <span class="tool-section-title" style="margin-bottom:0">Public Key</span>
              <button class="btn btn-ghost btn-sm" id="rsa-copy-pub"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <textarea class="form-textarea tall" id="rsa-public" readonly style="margin-top:8px"></textarea>
          </div>
          <div class="tool-section">
            <div class="split-pane-header">
              <span class="tool-section-title" style="margin-bottom:0">Private Key</span>
              <button class="btn btn-ghost btn-sm" id="rsa-copy-priv"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <textarea class="form-textarea tall" id="rsa-private" readonly style="margin-top:8px"></textarea>
          </div>
        </div>
      `);

      $('#rsa-generate').on('click', async () => {
        const bits = parseInt($('#rsa-bits').val());
        $('#rsa-public').val('Generating...');
        $('#rsa-private').val('Generating...');

        try {
          const keyPair = await crypto.subtle.generateKey(
            { name: 'RSA-OAEP', modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
            true, ['encrypt', 'decrypt']
          );

          const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
          const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

          const toPem = (buffer, type) => {
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            const lines = b64.match(/.{1,64}/g).join('\n');
            return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----`;
          };

          $('#rsa-public').val(toPem(publicKey, 'PUBLIC KEY'));
          $('#rsa-private').val(toPem(privateKey, 'PRIVATE KEY'));
          showToast('RSA key pair generated!', 'success');
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
          $('#rsa-public, #rsa-private').val('Error generating keys: ' + e.message);
        }
      });

      $('#rsa-copy-pub').on('click', () => copyToClipboard($('#rsa-public').val()));
      $('#rsa-copy-priv').on('click', () => copyToClipboard($('#rsa-private').val()));
    }
  },

  // ── Semver Calculator ──
  'semver-calculator': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Parse Semantic Version</div>
            <div class="form-group">
              <input type="text" class="form-input" id="sv-input" placeholder="e.g. 1.2.3-alpha.1+build.123" value="2.4.1-beta.2+build.456">
            </div>
            <div id="sv-parsed"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Compare Versions</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Version A</label>
                <input type="text" class="form-input" id="sv-a" value="1.2.3">
              </div>
              <div class="form-group">
                <label class="form-label">Version B</label>
                <input type="text" class="form-input" id="sv-b" value="1.3.0">
              </div>
            </div>
            <div class="output-area" id="sv-compare" style="text-align:center;font-size:18px;padding:16px"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Bump Version</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Current Version</label>
                <input type="text" class="form-input" id="sv-bump" value="1.2.3">
              </div>
            </div>
            <div class="btn-group" style="margin-top:8px">
              <button class="btn btn-secondary btn-sm" data-bump="major">Major (x.0.0)</button>
              <button class="btn btn-secondary btn-sm" data-bump="minor">Minor (1.x.0)</button>
              <button class="btn btn-secondary btn-sm" data-bump="patch">Patch (1.2.x)</button>
            </div>
            <div class="output-area" id="sv-bumped" style="text-align:center;font-size:18px;padding:12px;margin-top:8px"></div>
          </div>
        </div>
      `);

      const parseSemver = (v) => {
        const match = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+([a-zA-Z0-9.]+))?$/);
        if (!match) return null;
        return { major: parseInt(match[1]), minor: parseInt(match[2]), patch: parseInt(match[3]), prerelease: match[4] || null, build: match[5] || null };
      };

      const parseAndDisplay = () => {
        const sv = parseSemver($('#sv-input').val().trim());
        if (!sv) {
          $('#sv-parsed').html('<div style="color:var(--accent-red)">Invalid semver format</div>');
          return;
        }
        let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-top:8px">';
        html += `<div style="background:var(--bg-elevated);padding:8px;border-radius:var(--radius-md);text-align:center"><div style="font-size:20px;font-weight:700;color:var(--accent-blue)">${sv.major}</div><div style="font-size:11px;color:var(--text-muted)">Major</div></div>`;
        html += `<div style="background:var(--bg-elevated);padding:8px;border-radius:var(--radius-md);text-align:center"><div style="font-size:20px;font-weight:700;color:var(--accent-green)">${sv.minor}</div><div style="font-size:11px;color:var(--text-muted)">Minor</div></div>`;
        html += `<div style="background:var(--bg-elevated);padding:8px;border-radius:var(--radius-md);text-align:center"><div style="font-size:20px;font-weight:700;color:var(--accent-orange)">${sv.patch}</div><div style="font-size:11px;color:var(--text-muted)">Patch</div></div>`;
        if (sv.prerelease) html += `<div style="background:var(--bg-elevated);padding:8px;border-radius:var(--radius-md);text-align:center"><div style="font-size:14px;font-weight:600;color:var(--accent-purple)">${sv.prerelease}</div><div style="font-size:11px;color:var(--text-muted)">Pre-release</div></div>`;
        if (sv.build) html += `<div style="background:var(--bg-elevated);padding:8px;border-radius:var(--radius-md);text-align:center"><div style="font-size:14px;font-weight:600;color:var(--accent-pink)">${sv.build}</div><div style="font-size:11px;color:var(--text-muted)">Build</div></div>`;
        html += '</div>';
        $('#sv-parsed').html(html);
      };

      const compareSemver = () => {
        const a = parseSemver($('#sv-a').val().trim());
        const b = parseSemver($('#sv-b').val().trim());
        if (!a || !b) { $('#sv-compare').text('Invalid version'); return; }

        let result;
        if (a.major !== b.major) result = a.major > b.major ? 1 : -1;
        else if (a.minor !== b.minor) result = a.minor > b.minor ? 1 : -1;
        else if (a.patch !== b.patch) result = a.patch > b.patch ? 1 : -1;
        else result = 0;

        const sym = result > 0 ? '>' : result < 0 ? '<' : '=';
        const color = result === 0 ? 'var(--accent-green)' : 'var(--accent-blue)';
        $('#sv-compare').html(`<span style="color:${color}">${$('#sv-a').val()} <strong>${sym}</strong> ${$('#sv-b').val()}</span>`);
      };

      container.find('[data-bump]').on('click', function () {
        const sv = parseSemver($('#sv-bump').val().trim());
        if (!sv) { showToast('Invalid version', 'error'); return; }
        const type = $(this).data('bump');
        if (type === 'major') { sv.major++; sv.minor = 0; sv.patch = 0; }
        if (type === 'minor') { sv.minor++; sv.patch = 0; }
        if (type === 'patch') { sv.patch++; }
        const bumped = `${sv.major}.${sv.minor}.${sv.patch}`;
        $('#sv-bumped').html(`<span style="color:var(--accent-green)">${bumped}</span>`);
      });

      $('#sv-input').on('input', parseAndDisplay);
      $('#sv-a, #sv-b').on('input', compareSemver);
      parseAndDisplay();
      compareSemver();
    }
  },

  // ── Text Delimiter ──
  'text-delimiter': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Input</div>
            <textarea class="form-textarea tall" id="td-input" placeholder="Enter text...">apple
banana
cherry
date
elderberry</textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Options</div>
            <div class="form-row">
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Delimiter</label>
                <select class="form-select" id="td-delim">
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="|">Pipe (|)</option>
                  <option value="\\t">Tab</option>
                  <option value=" ">Space</option>
                  <option value="\\n">New Line</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div class="form-group" style="max-width:150px;display:none" id="td-custom-group">
                <label class="form-label">Custom Delimiter</label>
                <input type="text" class="form-input" id="td-custom" value="">
              </div>
            </div>
            <div class="form-row" style="margin-top:8px">
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="td-wrap-quotes"><span class="toggle-slider"></span></label>
                <span class="toggle-label">Wrap in quotes</span>
              </div>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="td-trim" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Trim items</span>
              </div>
            </div>
            <div class="btn-group" style="margin-top:12px">
              <button class="btn btn-primary btn-sm" id="td-join"><i class="fas fa-compress-alt"></i> Join (Lines → Delimited)</button>
              <button class="btn btn-secondary btn-sm" id="td-split"><i class="fas fa-expand-alt"></i> Split (Delimited → Lines)</button>
            </div>
          </div>
          <div class="tool-section" style="position:relative">
            <div class="split-pane-header">
              <span class="tool-section-title" style="margin-bottom:0">Output</span>
              <button class="btn btn-ghost btn-sm" id="td-copy"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="output-area" id="td-output" style="margin-top:8px;min-height:80px"></div>
          </div>
        </div>
      `);

      const getDelim = () => {
        let d = $('#td-delim').val();
        if (d === 'custom') d = $('#td-custom').val();
        if (d === '\\t') d = '\t';
        if (d === '\\n') d = '\n';
        return d;
      };

      $('#td-delim').on('change', function () {
        $('#td-custom-group').toggle(this.value === 'custom');
      });

      $('#td-join').on('click', () => {
        const delim = getDelim();
        const trim = $('#td-trim').is(':checked');
        const quotes = $('#td-wrap-quotes').is(':checked');
        let items = $('#td-input').val().split('\n');
        if (trim) items = items.map(l => l.trim()).filter(l => l);
        if (quotes) items = items.map(l => `"${l}"`);
        $('#td-output').text(items.join(delim));
      });

      $('#td-split').on('click', () => {
        const delim = getDelim();
        const trim = $('#td-trim').is(':checked');
        let items = $('#td-input').val().split(delim);
        if (trim) items = items.map(l => l.trim().replace(/^["']|["']$/g, ''));
        $('#td-output').text(items.join('\n'));
      });

      $('#td-copy').on('click', () => copyToClipboard($('#td-output').text()));
    }
  },

  // ── ULID Generator ──
  'ulid-generator': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Options</div>
            <div class="form-row">
              <div class="form-group" style="max-width:120px">
                <label class="form-label">Count</label>
                <input type="number" class="form-input" id="ulid-count" value="5" min="1" max="100">
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="ulid-generate"><i class="fas fa-sync-alt"></i> Generate</button>
              </div>
            </div>
          </div>
          <div class="tool-section" style="position:relative">
            <div class="split-pane-header">
              <span class="tool-section-title" style="margin-bottom:0">Generated ULIDs</span>
              <button class="btn btn-ghost btn-sm" id="ulid-copy"><i class="fas fa-copy"></i> Copy All</button>
            </div>
            <div class="output-area" id="ulid-output" style="margin-top:8px;min-height:150px"></div>
          </div>
        </div>
      `);

      const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

      function generateULID() {
        const now = Date.now();
        let timeStr = '';
        let t = now;
        for (let i = 9; i >= 0; i--) {
          timeStr = ENCODING[t % 32] + timeStr;
          t = Math.floor(t / 32);
        }

        let randomStr = '';
        const arr = new Uint8Array(10);
        crypto.getRandomValues(arr);
        for (let i = 0; i < 16; i++) {
          randomStr += ENCODING[arr[i % 10] % 32];
        }

        return timeStr + randomStr;
      }

      const generate = () => {
        const count = parseInt($('#ulid-count').val()) || 1;
        const ulids = Array.from({ length: count }, () => generateULID());
        $('#ulid-output').text(ulids.join('\n'));
        $('#ulid-copy').off('click').on('click', () => copyToClipboard(ulids.join('\n')));
      };

      $('#ulid-generate').on('click', generate);
      generate();
    }
  },

  // ── XSD Generator ──
  'xsd-generator': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">XML Input</span></div>
              <textarea class="form-textarea tall" id="xsdg-xml" placeholder="Paste XML here...">
<bookstore>
  <book category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>12.99</price>
  </book>
</bookstore></textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">Generated XSD</span>
                <button class="btn btn-ghost btn-sm" id="xsdg-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="xsdg-output" readonly></textarea>
            </div>
          </div>
          <div class="tool-section" style="margin-top:16px">
            <button class="btn btn-primary" id="xsdg-generate"><i class="fas fa-sitemap"></i> Generate XSD</button>
          </div>
        </div>
      `);

      function generateXsd(xmlStr) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'text/xml');
        const errors = doc.getElementsByTagName('parsererror');
        if (errors.length) throw new Error('Invalid XML');

        const generateElement = (node, indent = 2) => {
          const pad = ' '.repeat(indent);
          let xsd = '';
          const children = [...node.children];
          const attrs = [...node.attributes];

          if (children.length === 0 && attrs.length === 0) {
            // Simple element
            const text = node.textContent.trim();
            let type = 'xs:string';
            if (/^\d+$/.test(text)) type = 'xs:integer';
            else if (/^\d+\.\d+$/.test(text)) type = 'xs:decimal';
            else if (/^\d{4}-\d{2}-\d{2}/.test(text)) type = 'xs:date';
            xsd += `${pad}<xs:element name="${node.tagName}" type="${type}"/>\n`;
          } else {
            xsd += `${pad}<xs:element name="${node.tagName}">\n`;
            xsd += `${pad}  <xs:complexType>\n`;
            if (children.length > 0) {
              xsd += `${pad}    <xs:sequence>\n`;
              const seen = new Set();
              children.forEach(child => {
                if (!seen.has(child.tagName)) {
                  seen.add(child.tagName);
                  const count = children.filter(c => c.tagName === child.tagName).length;
                  xsd += generateElement(child, indent + 6);
                  if (count > 1) {
                    xsd = xsd.replace(`name="${child.tagName}"`, `name="${child.tagName}" maxOccurs="unbounded"`);
                  }
                }
              });
              xsd += `${pad}    </xs:sequence>\n`;
            }
            attrs.forEach(attr => {
              xsd += `${pad}    <xs:attribute name="${attr.name}" type="xs:string"/>\n`;
            });
            xsd += `${pad}  </xs:complexType>\n`;
            xsd += `${pad}</xs:element>\n`;
          }
          return xsd;
        };

        let xsd = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xsd += '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n';
        xsd += generateElement(doc.documentElement);
        xsd += '</xs:schema>';
        return xsd;
      }

      $('#xsdg-generate').on('click', () => {
        try {
          const xsd = generateXsd($('#xsdg-xml').val());
          $('#xsdg-output').val(xsd);
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
        }
      });

      $('#xsdg-copy').on('click', () => copyToClipboard($('#xsdg-output').val()));
      $('#xsdg-generate').click();
    }
  },
};
