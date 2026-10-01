/**
 * DevToys - Generator Tools
 * Hash / Checksum, Lorem Ipsum, Password, UUID
 */

const GeneratorTools = {

  // ── Hash / Checksum ──
  'hash-generator': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Input</div>
            <div class="tabs">
              <button class="tab active" data-tab="text">Text</button>
              <button class="tab" data-tab="file">File</button>
            </div>
            <div id="hash-text-tab">
              <textarea class="form-textarea" id="hash-input" placeholder="Enter text to hash...">Hello, World!</textarea>
            </div>
            <div id="hash-file-tab" style="display:none">
              <div class="drop-zone" id="hash-drop">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drop a file here or click to select</p>
              </div>
              <input type="file" id="hash-file" style="display:none">
            </div>
            <div class="toggle-group" style="margin-top:12px">
              <label class="toggle"><input type="checkbox" id="hash-uppercase"><span class="toggle-slider"></span></label>
              <span class="toggle-label">Uppercase</span>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Hashes</div>
            <table class="result-table" id="hash-results">
              <thead><tr><th>Algorithm</th><th>Hash</th><th></th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      `);

      container.find('.tab').on('click', function () {
        container.find('.tab').removeClass('active');
        $(this).addClass('active');
        const tab = $(this).data('tab');
        $('#hash-text-tab').toggle(tab === 'text');
        $('#hash-file-tab').toggle(tab === 'file');
      });

      const hashDrop = $('#hash-drop');
      hashDrop.on('click', () => $('#hash-file').click());
      $('#hash-file').on('change', function () { if (this.files[0]) hashFile(this.files[0]); });
      hashDrop.on('dragover', e => { e.preventDefault(); hashDrop.addClass('dragover'); });
      hashDrop.on('dragleave', () => hashDrop.removeClass('dragover'));
      hashDrop.on('drop', e => {
        e.preventDefault(); hashDrop.removeClass('dragover');
        if (e.originalEvent.dataTransfer.files[0]) hashFile(e.originalEvent.dataTransfer.files[0]);
      });

      async function hashFile(file) {
        const buffer = await file.arrayBuffer();
        computeHashes(buffer);
      }

      async function computeHashes(data) {
        const algos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        const upper = $('#hash-uppercase').is(':checked');
        let buffer;
        if (typeof data === 'string') {
          buffer = new TextEncoder().encode(data);
        } else {
          buffer = data;
        }

        let html = '';
        for (const algo of algos) {
          const hashBuffer = await crypto.subtle.digest(algo, buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          let hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          if (upper) hash = hash.toUpperCase();
          html += `<tr>
            <td class="text-secondary nowrap" style="font-family:inherit">${algo}</td>
            <td style="word-break:break-all">${hash}</td>
            <td style="width:40px"><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${hash}')"><i class="fas fa-copy"></i></button></td>
          </tr>`;
        }

        // MD5 (simple implementation)
        const md5hash = md5(typeof data === 'string' ? data : arrayBufferToString(buffer));
        const md5display = upper ? md5hash.toUpperCase() : md5hash;
        html = `<tr>
          <td class="text-secondary nowrap" style="font-family:inherit">MD5</td>
          <td style="word-break:break-all">${md5display}</td>
          <td style="width:40px"><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${md5display}')"><i class="fas fa-copy"></i></button></td>
        </tr>` + html;

        $('#hash-results tbody').html(html);
      }

      function arrayBufferToString(buffer) {
        return new TextDecoder().decode(buffer);
      }

      $('#hash-input').on('input', () => computeHashes($('#hash-input').val()));
      $('#hash-uppercase').on('change', () => computeHashes($('#hash-input').val()));
      computeHashes($('#hash-input').val());
    }
  },

  // ── Lorem Ipsum ──
  'lorem-ipsum': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Options</div>
            <div class="form-row">
              <div class="form-group" style="max-width:120px">
                <label class="form-label">Count</label>
                <input type="number" class="form-input" id="lorem-count" value="3" min="1" max="50">
              </div>
              <div class="form-group" style="max-width:180px">
                <label class="form-label">Type</label>
                <select class="form-select" id="lorem-type">
                  <option value="paragraphs">Paragraphs</option>
                  <option value="sentences">Sentences</option>
                  <option value="words">Words</option>
                </select>
              </div>
              <div class="form-group" style="max-width:120px;display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="lorem-generate"><i class="fas fa-magic"></i> Generate</button>
              </div>
            </div>
            <div class="toggle-group" style="margin-top:8px">
              <label class="toggle"><input type="checkbox" id="lorem-start" checked><span class="toggle-slider"></span></label>
              <span class="toggle-label">Start with "Lorem ipsum dolor sit amet..."</span>
            </div>
          </div>
          <div class="tool-section" style="position:relative">
            <div class="split-pane-header">
              <span class="tool-section-title" style="margin-bottom:0">Output</span>
              <button class="btn btn-ghost btn-sm" id="lorem-copy"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="output-area" id="lorem-output" style="margin-top:8px;min-height:200px"></div>
          </div>
        </div>
      `);

      const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

      const EXTRA_WORDS = 'ac accumsan adipiscing aliquam amet ante aptent arcu at auctor augue bibendum blandit class commodo condimentum conubia convallis cras cubilia cursus dapibus diam dictum dictumst dignissim donec dui efficitur egestas eget eleifend elementum eros est etiam euismod facilisi facilisis fames faucibus felis fermentum feugiat finibus fringilla fusce gravida habitant habitasse hac hendrerit himenaeos iaculis imperdiet in inceptos integer interdum justo lacinia lacus laoreet lectus leo libero ligula litora lobortis luctus maecenas magnis massa mattis mauris maximus metus mi molestie montes morbi mus nam nascetur natoque nec neque netus nibh nisi nisl nostra nulla nullam nunc odio orci ornare parturient pellentesque penatibus per pharetra phasellus placerat platea porta porttitor posuere potenti praesent pretium primis proin pulvinar purus quam quis quisque rhoncus ridiculus risus rutrum sagittis sapien scelerisque semper senectus sociosqu sodales sollicitudin suscipit suspendisse taciti tellus tempus tincidunt torquent tortor tristique turpis ullamcorper ultrices ultricies urna varius vehicula vel velit venenatis vestibulum vitae vivamus viverra volutpat vulputate'.split(' ');

      const allWords = [...LOREM_WORDS, ...EXTRA_WORDS];

      function randomWord() { return allWords[Math.floor(Math.random() * allWords.length)]; }

      function generateSentence(minWords = 5, maxWords = 15) {
        const len = minWords + Math.floor(Math.random() * (maxWords - minWords));
        const words = Array.from({ length: len }, randomWord);
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        return words.join(' ') + '.';
      }

      function generateParagraph(minSentences = 3, maxSentences = 7) {
        const len = minSentences + Math.floor(Math.random() * (maxSentences - minSentences));
        return Array.from({ length: len }, () => generateSentence()).join(' ');
      }

      $('#lorem-generate').on('click', () => {
        const count = parseInt($('#lorem-count').val()) || 1;
        const type = $('#lorem-type').val();
        const startWithLorem = $('#lorem-start').is(':checked');

        let result = '';
        switch (type) {
          case 'paragraphs':
            const paragraphs = Array.from({ length: count }, () => generateParagraph());
            if (startWithLorem) paragraphs[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + paragraphs[0];
            result = paragraphs.join('\n\n');
            break;
          case 'sentences':
            const sentences = Array.from({ length: count }, () => generateSentence());
            if (startWithLorem) sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
            result = sentences.join(' ');
            break;
          case 'words':
            const words = Array.from({ length: count }, randomWord);
            if (startWithLorem && count >= 2) { words[0] = 'lorem'; words[1] = 'ipsum'; }
            result = words.join(' ');
            break;
        }

        $('#lorem-output').text(result);
      });

      $('#lorem-copy').on('click', () => copyToClipboard($('#lorem-output').text()));
      $('#lorem-generate').click();
    }
  },

  // ── Password Generator ──
  'password-gen': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Options</div>
            <div class="form-group">
              <label class="form-label">Length: <span id="pw-len-display">16</span></label>
              <input type="range" id="pw-length" min="4" max="128" value="16" style="width:100%;accent-color:var(--accent-blue)">
            </div>
            <div class="form-row">
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="pw-upper" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Uppercase (A-Z)</span>
              </div>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="pw-lower" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Lowercase (a-z)</span>
              </div>
            </div>
            <div class="form-row" style="margin-top:12px">
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="pw-digits" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Digits (0-9)</span>
              </div>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="pw-symbols" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Symbols (!@#$...)</span>
              </div>
            </div>
            <div class="form-group" style="margin-top:12px">
              <label class="form-label">Number of passwords</label>
              <input type="number" class="form-input" id="pw-count" value="1" min="1" max="50" style="max-width:120px">
            </div>
          </div>
          <div class="tool-section">
            <div class="split-pane-header">
              <span class="tool-section-title" style="margin-bottom:0">Generated Password(s)</span>
              <div class="btn-group">
                <button class="btn btn-primary btn-sm" id="pw-generate"><i class="fas fa-sync-alt"></i> Generate</button>
                <button class="btn btn-ghost btn-sm" id="pw-copy"><i class="fas fa-copy"></i> Copy All</button>
              </div>
            </div>
            <div id="pw-output" style="margin-top:12px"></div>
            <div class="strength-bar" style="margin-top:12px">
              <div class="strength-fill" id="pw-strength"></div>
            </div>
            <div id="pw-strength-label" style="font-size:12px;margin-top:4px;color:var(--text-muted)"></div>
          </div>
        </div>
      `);

      const generate = () => {
        let chars = '';
        if ($('#pw-upper').is(':checked')) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if ($('#pw-lower').is(':checked')) chars += 'abcdefghijklmnopqrstuvwxyz';
        if ($('#pw-digits').is(':checked')) chars += '0123456789';
        if ($('#pw-symbols').is(':checked')) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (!chars) { showToast('Select at least one character set', 'error'); return; }

        const len = parseInt($('#pw-length').val());
        const count = parseInt($('#pw-count').val()) || 1;

        let html = '';
        const passwords = [];
        for (let i = 0; i < count; i++) {
          const arr = new Uint32Array(len);
          crypto.getRandomValues(arr);
          const pw = Array.from(arr, x => chars[x % chars.length]).join('');
          passwords.push(pw);
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <code style="flex:1;background:var(--bg-input);padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--border-default);font-family:'JetBrains Mono',monospace;font-size:14px;word-break:break-all;color:var(--accent-green)">${escHtml(pw)}</code>
            <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${escHtml(pw).replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>
          </div>`;
        }
        $('#pw-output').html(html);

        // Strength estimation
        const entropy = Math.log2(Math.pow(chars.length, len));
        let strength, color, width;
        if (entropy < 28) { strength = 'Very Weak'; color = 'var(--accent-red)'; width = '15%'; }
        else if (entropy < 36) { strength = 'Weak'; color = 'var(--accent-orange)'; width = '30%'; }
        else if (entropy < 60) { strength = 'Fair'; color = 'var(--accent-orange)'; width = '50%'; }
        else if (entropy < 80) { strength = 'Strong'; color = 'var(--accent-green)'; width = '75%'; }
        else { strength = 'Very Strong'; color = 'var(--accent-green)'; width = '100%'; }

        $('#pw-strength').css({ width, background: color });
        $('#pw-strength-label').text(`${strength} (${entropy.toFixed(0)} bits of entropy)`).css('color', color);

        $('#pw-copy').off('click').on('click', () => copyToClipboard(passwords.join('\n')));
      };

      $('#pw-length').on('input', function () {
        $('#pw-len-display').text(this.value);
        generate();
      });
      $('#pw-upper, #pw-lower, #pw-digits, #pw-symbols, #pw-count').on('change input', generate);
      $('#pw-generate').on('click', generate);
      generate();
    }
  },

  // ── UUID Generator ──
  'uuid-gen': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Options</div>
            <div class="form-row">
              <div class="form-group" style="max-width:150px">
                <label class="form-label">Version</label>
                <select class="form-select" id="uuid-version">
                  <option value="4" selected>v4 (Random)</option>
                  <option value="1">v1 (Time-based)</option>
                </select>
              </div>
              <div class="form-group" style="max-width:120px">
                <label class="form-label">Count</label>
                <input type="number" class="form-input" id="uuid-count" value="5" min="1" max="100">
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="uuid-generate"><i class="fas fa-sync-alt"></i> Generate</button>
              </div>
            </div>
            <div class="form-row" style="margin-top:8px">
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="uuid-upper"><span class="toggle-slider"></span></label>
                <span class="toggle-label">Uppercase</span>
              </div>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="uuid-hyphens" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label">Hyphens</span>
              </div>
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="uuid-braces"><span class="toggle-slider"></span></label>
                <span class="toggle-label">Braces {}</span>
              </div>
            </div>
          </div>
          <div class="tool-section" style="position:relative">
            <div class="split-pane-header">
              <span class="tool-section-title" style="margin-bottom:0">Generated UUIDs</span>
              <button class="btn btn-ghost btn-sm" id="uuid-copy"><i class="fas fa-copy"></i> Copy All</button>
            </div>
            <div class="output-area" id="uuid-output" style="margin-top:8px;min-height:150px"></div>
          </div>
        </div>
      `);

      const generate = () => {
        const count = parseInt($('#uuid-count').val()) || 1;
        const upper = $('#uuid-upper').is(':checked');
        const hyphens = $('#uuid-hyphens').is(':checked');
        const braces = $('#uuid-braces').is(':checked');
        const version = $('#uuid-version').val();

        const uuids = [];
        for (let i = 0; i < count; i++) {
          let uuid;
          if (version === '1') {
            uuid = generateUUIDv1();
          } else {
            uuid = generateUUIDv4();
          }
          if (!hyphens) uuid = uuid.replace(/-/g, '');
          if (upper) uuid = uuid.toUpperCase();
          if (braces) uuid = '{' + uuid + '}';
          uuids.push(uuid);
        }

        $('#uuid-output').text(uuids.join('\n'));
        $('#uuid-copy').off('click').on('click', () => copyToClipboard(uuids.join('\n')));
      };

      $('#uuid-generate').on('click', generate);
      $('#uuid-upper, #uuid-hyphens, #uuid-braces, #uuid-version, #uuid-count').on('change input', generate);
      generate();
    }
  },

  // ── Chmod Calculator ──
  'chmod-calculator': {
    render(container) {
      const who = [['owner', 'Owner'], ['group', 'Group'], ['other', 'Other']];
      const perms = [['r', 'Read', 4], ['w', 'Write', 2], ['x', 'Execute', 1]];
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <table class="result-table" style="max-width:520px">
              <thead><tr><th></th>${perms.map(p => `<th style="text-align:center">${p[1]}</th>`).join('')}</tr></thead>
              <tbody>
                ${who.map(([w, label]) => `<tr><td style="font-family:inherit;font-weight:600">${label}</td>${perms.map(([p]) =>
                  `<td style="text-align:center"><input type="checkbox" class="chmod-bit" data-who="${w}" data-perm="${p}"></td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="tool-section">
            <div class="form-row">
              <div class="form-group" style="max-width:160px">
                <label class="form-label">Octal</label>
                <input type="text" class="form-input text-mono" id="chmod-octal" maxlength="4" value="755">
              </div>
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Symbolic</label>
                <input type="text" class="form-input text-mono" id="chmod-symbolic" maxlength="10" value="rwxr-xr-x">
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div class="split-pane-header">
              <span class="tool-section-title mb-0">Command</span>
              <button class="btn btn-ghost btn-sm" id="chmod-copy"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="output-area" id="chmod-cmd" style="min-height:auto"></div>
            <div class="btn-group mt-12">
              ${['644', '755', '600', '700', '775', '444', '777'].map(p => `<button class="btn btn-secondary btn-sm chmod-preset" data-mode="${p}">${p}</button>`).join('')}
            </div>
          </div>
        </div>
      `);

      function setFromOctal(octal) {
        const digits = octal.slice(-3).padStart(3, '0');
        who.forEach(([w], i) => {
          const d = parseInt(digits[i], 10);
          perms.forEach(([p, , bit]) => $(`.chmod-bit[data-who="${w}"][data-perm="${p}"]`).prop('checked', (d & bit) !== 0));
        });
      }

      function update(source) {
        let octal = '', symbolic = '';
        who.forEach(([w]) => {
          let d = 0;
          perms.forEach(([p, , bit]) => {
            const on = $(`.chmod-bit[data-who="${w}"][data-perm="${p}"]`).is(':checked');
            if (on) d += bit;
            symbolic += on ? p : '-';
          });
          octal += d;
        });
        if (source !== 'octal') $('#chmod-octal').val(octal);
        if (source !== 'symbolic') $('#chmod-symbolic').val(symbolic);
        $('#chmod-cmd').text(`chmod ${octal} filename`);
      }

      $('.chmod-bit').on('change', () => update('bits'));
      $('#chmod-octal').on('input', function () {
        const v = this.value.trim();
        if (!/^[0-7]{3,4}$/.test(v)) return;
        setFromOctal(v);
        update('octal');
      });
      $('#chmod-symbolic').on('input', function () {
        const v = this.value.trim().replace(/^[-dl]?(?=.{9}$)/, '');
        if (!/^([r-][w-][x-]){3}$/.test(v)) return;
        let octal = '';
        for (let i = 0; i < 9; i += 3) {
          octal += (v[i] === 'r' ? 4 : 0) + (v[i + 1] === 'w' ? 2 : 0) + (v[i + 2] === 'x' ? 1 : 0);
        }
        setFromOctal(octal);
        update('symbolic');
      });
      $('.chmod-preset').on('click', function () {
        setFromOctal(String($(this).data('mode')));
        update('bits');
      });
      $('#chmod-copy').on('click', () => copyToClipboard($('#chmod-cmd').text()));

      setFromOctal('755');
      update('bits');
    }
  },

  // ── HMAC Generator ──
  'hmac-generator': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Secret key</label>
                <input type="text" class="form-input text-mono" id="hmac-key" value="my-secret-key">
              </div>
              <div class="form-group" style="max-width:160px">
                <label class="form-label">Algorithm</label>
                <select class="form-select" id="hmac-algo">
                  <option value="SHA-1">HMAC-SHA1</option>
                  <option value="SHA-256" selected>HMAC-SHA256</option>
                  <option value="SHA-384">HMAC-SHA384</option>
                  <option value="SHA-512">HMAC-SHA512</option>
                </select>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Message</div>
            <textarea class="form-textarea" id="hmac-msg" style="min-height:120px">{"event":"payment.succeeded","id":"evt_123"}</textarea>
          </div>
          <div class="tool-section">
            <div class="split-pane-header">
              <span class="tool-section-title mb-0">Hex</span>
              <button class="btn btn-ghost btn-sm copy-btn" data-target="hmac-hex"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="output-area" id="hmac-hex" style="min-height:auto;word-break:break-all"></div>
            <div class="split-pane-header mt-12">
              <span class="tool-section-title mb-0">Base64</span>
              <button class="btn btn-ghost btn-sm copy-btn" data-target="hmac-b64"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="output-area" id="hmac-b64" style="min-height:auto;word-break:break-all"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Verify signature</div>
            <input type="text" class="form-input text-mono" id="hmac-verify" placeholder="Paste an expected signature (hex or Base64) to compare">
            <div id="hmac-verify-result" class="text-sm mt-8"></div>
          </div>
        </div>
      `);

      const enc = new TextEncoder();
      let current = { hex: '', b64: '' };

      async function compute() {
        if (!crypto.subtle) {
          $('#hmac-hex').text('Web Crypto is unavailable (requires HTTPS or localhost).');
          return;
        }
        const keyBytes = enc.encode($('#hmac-key').val());
        if (!keyBytes.length) {
          $('#hmac-hex, #hmac-b64').text('Enter a secret key.');
          return;
        }
        const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: $('#hmac-algo').val() }, false, ['sign']);
        const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode($('#hmac-msg').val())));
        current = {
          hex: [...sig].map(b => b.toString(16).padStart(2, '0')).join(''),
          b64: btoa(String.fromCharCode(...sig)),
        };
        $('#hmac-hex').text(current.hex);
        $('#hmac-b64').text(current.b64);
        verify();
      }

      function verify() {
        const v = $('#hmac-verify').val().trim().replace(/^sha\d+=/i, '');
        if (!v) { $('#hmac-verify-result').html(''); return; }
        const ok = v.toLowerCase() === current.hex || v === current.b64;
        $('#hmac-verify-result').html(ok
          ? '<span class="badge badge-green"><i class="fas fa-check"></i>&nbsp;Signature matches</span>'
          : '<span class="badge badge-red"><i class="fas fa-times"></i>&nbsp;Signature does not match</span>');
      }

      $('#hmac-key, #hmac-msg').on('input', debounce(compute, 150));
      $('#hmac-algo').on('change', compute);
      $('#hmac-verify').on('input', verify);
      compute();
    }
  },

  // ── Mock Data Generator ──
  'mock-data': {
    render(container) {
      const fields = Object.keys(MOCK_FIELDS);
      const defaults = ['id', 'firstName', 'lastName', 'email', 'company', 'createdAt'];
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Fields</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px 16px">
              ${fields.map(f => `<label class="text-sm" style="display:flex;align-items:center;gap:6px;cursor:pointer">
                <input type="checkbox" class="mock-field" value="${f}" ${defaults.includes(f) ? 'checked' : ''}> ${f}</label>`).join('')}
            </div>
          </div>
          <div class="tool-section">
            <div class="form-row">
              <div class="form-group" style="max-width:120px">
                <label class="form-label">Rows</label>
                <input type="number" class="form-input" id="mock-count" value="10" min="1" max="10000">
              </div>
              <div class="form-group" style="max-width:160px">
                <label class="form-label">Format</label>
                <select class="form-select" id="mock-format">
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="sql">SQL INSERT</option>
                  <option value="ndjson">NDJSON</option>
                </select>
              </div>
              <div class="btn-group" style="align-items:flex-end">
                <button class="btn btn-primary btn-sm" id="mock-generate"><i class="fas fa-sync-alt"></i> Generate</button>
                <button class="btn btn-ghost btn-sm" id="mock-copy"><i class="fas fa-copy"></i> Copy</button>
                <button class="btn btn-ghost btn-sm" id="mock-download"><i class="fas fa-download"></i> Download</button>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <textarea class="form-textarea tall" id="mock-output" readonly></textarea>
          </div>
        </div>
      `);

      function generate() {
        const selected = $('.mock-field:checked').map((_, el) => el.value).get();
        if (!selected.length) { $('#mock-output').val(''); return; }
        const count = Math.min(Math.max(parseInt($('#mock-count').val(), 10) || 1, 1), 10000);
        const rows = Array.from({ length: count }, (_, i) => {
          const ctx = { index: i };
          return Object.fromEntries(selected.map(f => [f, MOCK_FIELDS[f](ctx)]));
        });
        $('#mock-output').val(formatMockRows(rows, selected, $('#mock-format').val()));
      }

      $('#mock-generate').on('click', generate);
      $('.mock-field, #mock-format, #mock-count').on('change', generate);
      $('#mock-copy').on('click', () => copyToClipboard($('#mock-output').val()));
      $('#mock-download').on('click', () => {
        const ext = { json: 'json', csv: 'csv', sql: 'sql', ndjson: 'ndjson' }[$('#mock-format').val()];
        const blob = new Blob([$('#mock-output').val()], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `mock-data.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
      generate();
    }
  },
};

// ── UUID Helpers ──
function generateUUIDv4() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hex = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
}

function generateUUIDv1() {
  const now = Date.now();
  const ticks = (now + 12219292800000) * 10000;
  const timeLow = (ticks & 0xFFFFFFFF).toString(16).padStart(8, '0');
  const timeMid = ((ticks >> 32) & 0xFFFF).toString(16).padStart(4, '0');
  const timeHi = (((ticks >> 48) & 0x0FFF) | 0x1000).toString(16).padStart(4, '0');
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  arr[0] = (arr[0] & 0x3f) | 0x80;
  const rest = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  return `${timeLow}-${timeMid}-${timeHi}-${rest.substr(0, 4)}-${rest.substr(4, 12)}`;
}

// ── Simple MD5 (client-side) ──
function md5(string) {
  function md5cycle(x, k) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b) }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t) }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t) }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t) }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t) }
  function add32(a, b) { return (a + b) & 0xFFFFFFFF }

  var n = string.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
  for (i = 64; i <= n; i += 64) { md5cycle(state, md5blk(string.substring(i - 64, i))) }
  string = string.substring(i - 64); var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (i = 0; i < string.length; i++)tail[i >> 2] |= string.charCodeAt(i) << ((i % 4) << 3);
  tail[i >> 2] |= 0x80 << ((i % 4) << 3);
  if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++)tail[i] = 0 }
  tail[14] = n * 8; md5cycle(state, tail);
  return hex(state);

  function md5blk(s) { var md5blks = [], i; for (i = 0; i < 64; i += 4) { md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24) } return md5blks }
  function hex(x) { var s = '', j; for (var i = 0; i < x.length; i++) { for (j = 0; j < 4; j++)s += ('0' + ((x[i] >> (j * 8)) & 255).toString(16)).slice(-2) } return s }
}

// ── Mock Data Helpers ──
const MOCK_WORDS = {
  firstNames: ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Frances', 'Guido', 'Radia', 'Tim', 'Katherine', 'Donald', 'Hedy', 'Bjarne', 'Anita', 'James', 'Sophie', 'Yukihiro'],
  lastNames: ['Lovelace', 'Turing', 'Hopper', 'Torvalds', 'Hamilton', 'Ritchie', 'Liskov', 'Thompson', 'Allen', 'van Rossum', 'Perlman', 'Berners-Lee', 'Johnson', 'Knuth', 'Lamarr', 'Stroustrup', 'Borg', 'Gosling', 'Wilson', 'Matsumoto'],
  companies: ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark Industries', 'Wayne Enterprises', 'Pied Piper', 'Soylent', 'Vandelay Industries'],
  domains: ['example.com', 'example.org', 'example.net', 'test.dev', 'mail.test'],
  cities: ['London', 'Berlin', 'Tokyo', 'New York', 'São Paulo', 'Sydney', 'Toronto', 'Nairobi', 'Madrid', 'Seoul'],
  countries: ['GB', 'DE', 'JP', 'US', 'BR', 'AU', 'CA', 'KE', 'ES', 'KR'],
  streets: ['Main St', 'High St', 'Oak Ave', 'Elm St', 'Park Rd', 'Church Ln', 'Mill Rd', 'Station Rd'],
  jobs: ['Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'DevOps Engineer', 'QA Engineer', 'Engineering Manager', 'Technical Writer'],
  statuses: ['active', 'inactive', 'pending', 'suspended'],
};

const mockPick = arr => arr[Math.floor(Math.random() * arr.length)];
const mockRandInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Each field generator receives a per-row context so related fields (name → email) stay consistent
const MOCK_FIELDS = {
  id: ctx => ctx.index + 1,
  uuid: () => generateUUIDv4(),
  firstName: ctx => (ctx.first ??= mockPick(MOCK_WORDS.firstNames)),
  lastName: ctx => (ctx.last ??= mockPick(MOCK_WORDS.lastNames)),
  fullName: ctx => `${MOCK_FIELDS.firstName(ctx)} ${MOCK_FIELDS.lastName(ctx)}`,
  username: ctx => `${MOCK_FIELDS.firstName(ctx)}.${MOCK_FIELDS.lastName(ctx)}`.toLowerCase().replace(/[^a-z.]/g, '') + mockRandInt(1, 99),
  email: ctx => `${MOCK_FIELDS.firstName(ctx)}.${MOCK_FIELDS.lastName(ctx)}`.toLowerCase().replace(/[^a-z.]/g, '') + '@' + mockPick(MOCK_WORDS.domains),
  phone: () => `+1-${mockRandInt(200, 999)}-${mockRandInt(200, 999)}-${String(mockRandInt(0, 9999)).padStart(4, '0')}`,
  company: () => mockPick(MOCK_WORDS.companies),
  jobTitle: () => mockPick(MOCK_WORDS.jobs),
  street: () => `${mockRandInt(1, 999)} ${mockPick(MOCK_WORDS.streets)}`,
  city: () => mockPick(MOCK_WORDS.cities),
  country: () => mockPick(MOCK_WORDS.countries),
  zip: () => String(mockRandInt(10000, 99999)),
  age: () => mockRandInt(18, 80),
  price: () => Math.round(Math.random() * 100000) / 100,
  boolean: () => Math.random() < 0.5,
  status: () => mockPick(MOCK_WORDS.statuses),
  ipv4: () => `${mockRandInt(1, 223)}.${mockRandInt(0, 255)}.${mockRandInt(0, 255)}.${mockRandInt(1, 254)}`,
  url: () => `https://${mockPick(MOCK_WORDS.domains)}/${Math.random().toString(36).slice(2, 8)}`,
  hexColor: () => '#' + mockRandInt(0, 0xffffff).toString(16).padStart(6, '0'),
  createdAt: () => new Date(Date.now() - mockRandInt(0, 3 * 365 * 24 * 3600) * 1000).toISOString(),
};

function formatMockRows(rows, fields, format) {
  if (format === 'json') return JSON.stringify(rows, null, 2);
  if (format === 'ndjson') return rows.map(r => JSON.stringify(r)).join('\n');
  if (format === 'csv') {
    const cell = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    return [fields.join(','), ...rows.map(r => fields.map(f => cell(r[f])).join(','))].join('\n');
  }
  // SQL
  const val = v => typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : `'${String(v).replace(/'/g, "''")}'`;
  return rows.map(r => `INSERT INTO mock_data (${fields.join(', ')}) VALUES (${fields.map(f => val(r[f])).join(', ')});`).join('\n');
}
