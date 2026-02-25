/**
 * DevToys - Encoder / Decoder Tools
 * Base64 Image, Base64 Text, Certificate, GZIP, HTML, JWT, QR Code, URL
 */

const EncoderDecoderTools = {

  // ── Base64 Image ──
  'base64-image': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Image → Base64</div>
            <div class="drop-zone" id="b64img-drop">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Drop an image here or click to select</p>
            </div>
            <input type="file" id="b64img-file" accept="image/*" style="display:none">
          </div>
          <div class="tool-section" id="b64img-preview-section" style="display:none">
            <div class="tool-section-title">Preview</div>
            <div class="image-preview-container" id="b64img-preview"></div>
          </div>
          <div class="tool-section" id="b64img-output-section" style="display:none">
            <div class="split-pane-header">
              <span class="tool-section-title" style="margin-bottom:0">Base64 Output</span>
              <button class="btn btn-secondary btn-sm" id="b64img-copy"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <textarea class="form-textarea tall" id="b64img-output" readonly style="margin-top:8px"></textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Base64 → Image</div>
            <textarea class="form-textarea" id="b64img-input-text" placeholder="Paste Base64 string here..."></textarea>
            <button class="btn btn-primary btn-sm" id="b64img-decode" style="margin-top:8px"><i class="fas fa-image"></i> Decode</button>
            <div class="image-preview-container" id="b64img-decode-preview" style="margin-top:12px;display:none"></div>
          </div>
        </div>
      `);

      // File upload
      const dropZone = $('#b64img-drop');
      dropZone.on('click', () => $('#b64img-file').click());
      $('#b64img-file').on('change', function () { if (this.files[0]) processImage(this.files[0]); });
      dropZone.on('dragover', e => { e.preventDefault(); dropZone.addClass('dragover'); });
      dropZone.on('dragleave', () => dropZone.removeClass('dragover'));
      dropZone.on('drop', e => {
        e.preventDefault();
        dropZone.removeClass('dragover');
        if (e.originalEvent.dataTransfer.files[0]) processImage(e.originalEvent.dataTransfer.files[0]);
      });

      function processImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const b64 = e.target.result;
          $('#b64img-preview').html(`<img src="${b64}" alt="Preview">`);
          $('#b64img-output').val(b64);
          $('#b64img-preview-section, #b64img-output-section').show();
        };
        reader.readAsDataURL(file);
      }

      $('#b64img-copy').on('click', () => copyToClipboard($('#b64img-output').val()));

      $('#b64img-decode').on('click', () => {
        let val = $('#b64img-input-text').val().trim();
        if (!val.startsWith('data:')) val = 'data:image/png;base64,' + val;
        $('#b64img-decode-preview').html(`<img src="${val}" alt="Decoded">`).show();
      });
    }
  },

  // ── Base64 Text ──
  'base64-text': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="form-row" style="margin-bottom:12px">
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="b64-mode" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label" id="b64-mode-label">Encode</span>
              </div>
            </div>
          </div>
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title" id="b64-input-label">Text</span>
                <button class="btn btn-ghost btn-sm" id="b64-clear"><i class="fas fa-eraser"></i> Clear</button>
              </div>
              <textarea class="form-textarea tall" id="b64-input" placeholder="Enter text to encode...">Hello, DevToys!</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title" id="b64-output-label">Base64</span>
                <button class="btn btn-ghost btn-sm" id="b64-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="b64-output" readonly></textarea>
            </div>
          </div>
        </div>
      `);

      const convert = () => {
        const encode = $('#b64-mode').is(':checked');
        const input = $('#b64-input').val();
        try {
          if (encode) {
            $('#b64-output').val(btoa(unescape(encodeURIComponent(input))));
          } else {
            $('#b64-output').val(decodeURIComponent(escape(atob(input))));
          }
        } catch (e) {
          $('#b64-output').val('Error: ' + e.message);
        }
      };

      $('#b64-mode').on('change', function () {
        const encode = $(this).is(':checked');
        $('#b64-mode-label').text(encode ? 'Encode' : 'Decode');
        $('#b64-input-label').text(encode ? 'Text' : 'Base64');
        $('#b64-output-label').text(encode ? 'Base64' : 'Text');
        convert();
      });

      $('#b64-input').on('input', convert);
      $('#b64-clear').on('click', () => { $('#b64-input').val(''); convert(); });
      $('#b64-copy').on('click', () => copyToClipboard($('#b64-output').val()));
      convert();
    }
  },

  // ── Certificate ──
  'certificate': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">PEM Certificate Input</div>
            <textarea class="form-textarea tall" id="cert-input" placeholder="Paste PEM certificate here...
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJ...
-----END CERTIFICATE-----"></textarea>
            <button class="btn btn-primary btn-sm" style="margin-top:8px" id="cert-decode"><i class="fas fa-unlock"></i> Decode</button>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Certificate Details</div>
            <div id="cert-output" class="output-area" style="min-height:120px">Paste a PEM certificate and click Decode</div>
          </div>
        </div>
      `);

      $('#cert-decode').on('click', () => {
        const pem = $('#cert-input').val().trim();
        if (!pem.includes('BEGIN CERTIFICATE')) {
          $('#cert-output').html('<span style="color:var(--accent-red)">Invalid PEM format. Must contain BEGIN CERTIFICATE header.</span>');
          return;
        }
        // Extract base64 content
        const b64 = pem.replace(/-----BEGIN CERTIFICATE-----/, '')
          .replace(/-----END CERTIFICATE-----/, '')
          .replace(/\s/g, '');
        try {
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

          // Basic ASN.1 parsing for display
          const info = [
            `Certificate Size: ${binary.length} bytes`,
            `Base64 Length: ${b64.length} characters`,
            `SHA-256 Fingerprint: (computing...)`,
          ];

          // Compute SHA-256 fingerprint
          crypto.subtle.digest('SHA-256', bytes).then(hash => {
            const hashArray = Array.from(new Uint8Array(hash));
            const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
            info[2] = `SHA-256 Fingerprint: ${fingerprint}`;
            $('#cert-output').html(info.join('\n'));
          });

          $('#cert-output').html(info.join('\n'));
        } catch (e) {
          $('#cert-output').html(`<span style="color:var(--accent-red)">Error: ${escHtml(e.message)}</span>`);
        }
      });
    }
  },

  // ── GZIP ──
  'gzip': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">GZIP Compress / Decompress</div>
            <div class="form-row" style="margin-bottom:12px">
              <div class="toggle-group">
                <label class="toggle"><input type="checkbox" id="gzip-mode" checked><span class="toggle-slider"></span></label>
                <span class="toggle-label" id="gzip-mode-label">Compress</span>
              </div>
            </div>
          </div>
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">Input</span>
              </div>
              <textarea class="form-textarea tall" id="gzip-input" placeholder="Enter text to compress...">Hello, this is some text to compress with GZIP!</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">Output</span>
                <button class="btn btn-ghost btn-sm" id="gzip-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="gzip-output" readonly></textarea>
            </div>
          </div>
          <div class="tool-section" style="margin-top:16px">
            <div id="gzip-stats" style="font-size:12px;color:var(--text-muted)"></div>
          </div>
        </div>
      `);

      const process = async () => {
        const compress = $('#gzip-mode').is(':checked');
        const input = $('#gzip-input').val();

        try {
          if (compress) {
            const blob = new Blob([input]);
            const cs = new CompressionStream('gzip');
            const compressedStream = blob.stream().pipeThrough(cs);
            const compressedBlob = await new Response(compressedStream).blob();
            const buffer = await compressedBlob.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            $('#gzip-output').val(b64);
            const ratio = ((1 - buffer.byteLength / input.length) * 100).toFixed(1);
            $('#gzip-stats').text(`Original: ${input.length} bytes → Compressed: ${buffer.byteLength} bytes (${ratio}% reduction)`);
          } else {
            const binary = atob(input);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes]);
            const ds = new DecompressionStream('gzip');
            const decompressedStream = blob.stream().pipeThrough(ds);
            const text = await new Response(decompressedStream).text();
            $('#gzip-output').val(text);
            $('#gzip-stats').text(`Compressed: ${input.length} chars → Decompressed: ${text.length} chars`);
          }
        } catch (e) {
          $('#gzip-output').val('Error: ' + e.message);
          $('#gzip-stats').text('');
        }
      };

      $('#gzip-mode').on('change', function () {
        $('#gzip-mode-label').text($(this).is(':checked') ? 'Compress' : 'Decompress');
        process();
      });

      $('#gzip-input').on('input', debounce(process, 300));
      $('#gzip-copy').on('click', () => copyToClipboard($('#gzip-output').val()));
      process();
    }
  },

  // ── HTML Encoder ──
  'html-encoder': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="toggle-group" style="margin-bottom:12px">
              <label class="toggle"><input type="checkbox" id="html-mode" checked><span class="toggle-slider"></span></label>
              <span class="toggle-label" id="html-mode-label">Encode</span>
            </div>
          </div>
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">Input</span></div>
              <textarea class="form-textarea tall" id="html-input" placeholder="Enter text...">&lt;div class="hello"&gt;World &amp; Friends&lt;/div&gt;</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">Output</span>
                <button class="btn btn-ghost btn-sm" id="html-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="html-output" readonly></textarea>
            </div>
          </div>
        </div>
      `);

      const convert = () => {
        const encode = $('#html-mode').is(':checked');
        const input = $('#html-input').val();
        if (encode) {
          $('#html-output').val(input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));
        } else {
          const txt = document.createElement('textarea');
          txt.innerHTML = input;
          $('#html-output').val(txt.value);
        }
      };

      $('#html-mode').on('change', function () {
        $('#html-mode-label').text($(this).is(':checked') ? 'Encode' : 'Decode');
        convert();
      });

      $('#html-input').on('input', convert);
      $('#html-copy').on('click', () => copyToClipboard($('#html-output').val()));
      convert();
    }
  },

  // ── JWT Decoder ──
  'jwt-decoder': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">JWT Token</div>
            <textarea class="form-textarea" id="jwt-input" placeholder="Paste JWT token here...">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</textarea>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Header</div>
            <div class="output-area" id="jwt-header" style="position:relative">
              <button class="copy-btn" data-copy="jwt-header"><i class="fas fa-copy"></i></button>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Payload</div>
            <div class="output-area" id="jwt-payload" style="position:relative">
              <button class="copy-btn" data-copy="jwt-payload"><i class="fas fa-copy"></i></button>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Signature</div>
            <div class="output-area" id="jwt-signature"></div>
          </div>
        </div>
      `);

      const decode = () => {
        const token = $('#jwt-input').val().trim();
        const parts = token.split('.');
        if (parts.length !== 3) {
          $('#jwt-header').text('Invalid JWT: expected 3 parts separated by dots');
          $('#jwt-payload, #jwt-signature').text('');
          return;
        }
        try {
          const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

          $('#jwt-header').html(`<button class="copy-btn" onclick="copyToClipboard(JSON.stringify(${escHtml(JSON.stringify(header))}, null, 2))"><i class="fas fa-copy"></i></button>` + escHtml(JSON.stringify(header, null, 2)));
          let payloadStr = JSON.stringify(payload, null, 2);
          // Annotate timestamps
          if (payload.iat) payloadStr = payloadStr.replace(`"iat": ${payload.iat}`, `"iat": ${payload.iat}  // ${new Date(payload.iat * 1000).toISOString()}`);
          if (payload.exp) payloadStr = payloadStr.replace(`"exp": ${payload.exp}`, `"exp": ${payload.exp}  // ${new Date(payload.exp * 1000).toISOString()}`);
          if (payload.nbf) payloadStr = payloadStr.replace(`"nbf": ${payload.nbf}`, `"nbf": ${payload.nbf}  // ${new Date(payload.nbf * 1000).toISOString()}`);
          $('#jwt-payload').html(`<button class="copy-btn" onclick="copyToClipboard('${escHtml(JSON.stringify(payload, null, 2)).replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>` + escHtml(payloadStr));
          $('#jwt-signature').text(parts[2]);
        } catch (e) {
          $('#jwt-header').text('Error decoding: ' + e.message);
          $('#jwt-payload, #jwt-signature').text('');
        }
      };

      $('#jwt-input').on('input', decode);
      decode();
    }
  },

  // ── QR Code ──
  'qr-code': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Text / URL</div>
            <textarea class="form-textarea" id="qr-input" placeholder="Enter text or URL...">https://github.com</textarea>
            <div class="form-row" style="margin-top:12px">
              <div class="form-group" style="max-width:150px">
                <label class="form-label">Size</label>
                <select class="form-select" id="qr-size">
                  <option value="128">128px</option>
                  <option value="256" selected>256px</option>
                  <option value="512">512px</option>
                </select>
              </div>
              <div class="form-group">
                <button class="btn btn-primary" id="qr-generate" style="margin-top:20px"><i class="fas fa-qrcode"></i> Generate</button>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">QR Code Output</div>
            <div class="qr-output" id="qr-output">
              <div style="color:var(--text-muted);font-size:13px">Click Generate to create QR code</div>
            </div>
            <div class="btn-group" style="margin-top:12px;justify-content:center">
              <button class="btn btn-secondary btn-sm" id="qr-download" style="display:none"><i class="fas fa-download"></i> Download PNG</button>
            </div>
          </div>
        </div>
      `);

      $('#qr-generate').on('click', () => {
        const text = $('#qr-input').val().trim();
        if (!text) { showToast('Please enter text', 'error'); return; }
        const size = parseInt($('#qr-size').val());
        $('#qr-output').html('');

        if (typeof QRCode !== 'undefined') {
          new QRCode(document.getElementById('qr-output'), {
            text: text,
            width: size,
            height: size,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
          setTimeout(() => { $('#qr-download').show(); }, 100);
        } else {
          // Fallback using API
          const img = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}" alt="QR Code" style="width:${size}px;height:${size}px">`;
          $('#qr-output').html(img);
          $('#qr-download').show();
        }
      });

      $('#qr-download').on('click', () => {
        const img = $('#qr-output img')[0] || $('#qr-output canvas')[0];
        if (!img) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (img.tagName === 'CANVAS') {
          const a = document.createElement('a');
          a.href = img.toDataURL('image/png');
          a.download = 'qrcode.png';
          a.click();
        } else {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = 'qrcode.png';
          a.click();
        }
      });
    }
  },

  // ── URL Encoder ──
  'url-encoder': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="toggle-group" style="margin-bottom:12px">
              <label class="toggle"><input type="checkbox" id="url-mode" checked><span class="toggle-slider"></span></label>
              <span class="toggle-label" id="url-mode-label">Encode</span>
            </div>
          </div>
          <div class="split-view">
            <div class="split-pane">
              <div class="split-pane-header"><span class="split-pane-title">Input</span></div>
              <textarea class="form-textarea tall" id="url-input" placeholder="Enter text...">https://example.com/path?query=hello world&foo=bar baz</textarea>
            </div>
            <div class="split-pane">
              <div class="split-pane-header">
                <span class="split-pane-title">Output</span>
                <button class="btn btn-ghost btn-sm" id="url-copy"><i class="fas fa-copy"></i> Copy</button>
              </div>
              <textarea class="form-textarea tall" id="url-output" readonly></textarea>
            </div>
          </div>
        </div>
      `);

      const convert = () => {
        const encode = $('#url-mode').is(':checked');
        const input = $('#url-input').val();
        try {
          $('#url-output').val(encode ? encodeURIComponent(input) : decodeURIComponent(input));
        } catch (e) {
          $('#url-output').val('Error: ' + e.message);
        }
      };

      $('#url-mode').on('change', function () {
        $('#url-mode-label').text($(this).is(':checked') ? 'Encode' : 'Decode');
        convert();
      });

      $('#url-input').on('input', convert);
      $('#url-copy').on('click', () => copyToClipboard($('#url-output').val()));
      convert();
    }
  },
};
