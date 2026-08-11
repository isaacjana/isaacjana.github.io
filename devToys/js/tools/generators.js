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
