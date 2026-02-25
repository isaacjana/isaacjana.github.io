/**
 * DevToys - Graphic Tools
 * Color Blind Simulator, Image Converter
 */

const GraphicTools = {

  // ── Color Blind Simulator ──
  'color-blind-sim': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Color Input</div>
            <div class="form-row">
              <div class="form-group" style="max-width:200px">
                <label class="form-label">Pick a Color</label>
                <div style="display:flex;gap:8px;align-items:center">
                  <input type="color" id="cb-color" value="#e74c3c" style="width:48px;height:40px;border:none;cursor:pointer;background:none">
                  <input type="text" class="form-input" id="cb-hex" value="#e74c3c" style="flex:1">
                </div>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Normal Vision</div>
            <div class="color-preview" id="cb-normal"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Simulated Vision</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px" id="cb-results"></div>
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Upload Image</div>
            <div class="drop-zone" id="cb-drop">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Drop an image to simulate color blind vision</p>
            </div>
            <input type="file" id="cb-file" accept="image/*" style="display:none">
            <div id="cb-image-results" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-top:16px"></div>
          </div>
        </div>
      `);

      const types = [
        { name: 'Protanopia', desc: 'Red-blind', transform: [0.567, 0.433, 0, 0, 0.558, 0.442, 0, 0.242, 0.758] },
        { name: 'Deuteranopia', desc: 'Green-blind', transform: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7] },
        { name: 'Tritanopia', desc: 'Blue-blind', transform: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525] },
        { name: 'Achromatopsia', desc: 'Total color blind', transform: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114] },
        { name: 'Protanomaly', desc: 'Red-weak', transform: [0.817, 0.183, 0, 0.333, 0.667, 0, 0, 0.125, 0.875] },
        { name: 'Deuteranomaly', desc: 'Green-weak', transform: [0.8, 0.2, 0, 0.258, 0.742, 0, 0, 0.142, 0.858] },
      ];

      const hexToRgb = hex => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
      };

      const rgbToHex = (r, g, b) => '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');

      const simulate = () => {
        const hex = $('#cb-hex').val();
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;

        $('#cb-color').val(hex);
        $('#cb-normal').css('background', hex);

        const [r, g, b] = hexToRgb(hex);

        let html = '';
        types.forEach(type => {
          const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = type.transform;
          const nr = m0 * r + m1 * g + m2 * b;
          const ng = m3 * r + m4 * g + m5 * b;
          const nb = m6 * r + m7 * g + m8 * b;
          const simHex = rgbToHex(nr, ng, nb);

          html += `<div style="background:var(--bg-elevated);padding:12px;border-radius:var(--radius-md);border:1px solid var(--border-muted)">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:${simHex};border:1px solid var(--border-default)"></div>
              <div>
                <div style="font-size:13px;font-weight:600">${type.name}</div>
                <div style="font-size:11px;color:var(--text-muted)">${type.desc}</div>
              </div>
            </div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-secondary)">${simHex}</div>
          </div>`;
        });
        $('#cb-results').html(html);
      };

      $('#cb-color').on('input', function () { $('#cb-hex').val(this.value); simulate(); });
      $('#cb-hex').on('input', function () { if (/^#[0-9a-fA-F]{6}$/.test(this.value)) { $('#cb-color').val(this.value); simulate(); } });

      // Image drop
      const dropZone = $('#cb-drop');
      dropZone.on('click', () => $('#cb-file').click());
      $('#cb-file').on('change', function () { if (this.files[0]) processImage(this.files[0]); });
      dropZone.on('dragover', e => { e.preventDefault(); dropZone.addClass('dragover'); });
      dropZone.on('dragleave', () => dropZone.removeClass('dragover'));
      dropZone.on('drop', e => {
        e.preventDefault(); dropZone.removeClass('dragover');
        if (e.originalEvent.dataTransfer.files[0]) processImage(e.originalEvent.dataTransfer.files[0]);
      });

      function processImage(file) {
        const img = new Image();
        img.onload = () => {
          let html = '';
          // Original
          html += `<div>
            <div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--text-muted)">Normal Vision</div>
            <div class="image-preview-container"><img src="${img.src}" style="max-width:100%"></div>
          </div>`;

          types.forEach(type => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = type.transform;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i + 1], b = data[i + 2];
              data[i] = Math.min(255, m0 * r + m1 * g + m2 * b);
              data[i + 1] = Math.min(255, m3 * r + m4 * g + m5 * b);
              data[i + 2] = Math.min(255, m6 * r + m7 * g + m8 * b);
            }

            ctx.putImageData(imageData, 0, 0);
            html += `<div>
              <div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--text-muted)">${type.name} (${type.desc})</div>
              <div class="image-preview-container"><img src="${canvas.toDataURL()}" style="max-width:100%"></div>
            </div>`;
          });

          $('#cb-image-results').html(html);
        };
        img.src = URL.createObjectURL(file);
      }

      simulate();
    }
  },

  // ── Image Converter ──
  'image-converter': {
    render(container) {
      container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">Upload Image</div>
            <div class="drop-zone" id="ic-drop">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Drop an image here or click to select</p>
            </div>
            <input type="file" id="ic-file" accept="image/*" style="display:none">
          </div>
          <div id="ic-options" style="display:none">
            <div class="tool-section">
              <div class="tool-section-title">Preview</div>
              <div class="image-preview-container" id="ic-preview"></div>
              <div id="ic-info" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
            </div>
            <div class="tool-section">
              <div class="tool-section-title">Convert To</div>
              <div class="form-row">
                <div class="form-group" style="max-width:200px">
                  <select class="form-select" id="ic-format">
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/webp">WebP</option>
                    <option value="image/bmp">BMP</option>
                  </select>
                </div>
                <div class="form-group" style="max-width:200px" id="ic-quality-group">
                  <label class="form-label">Quality: <span id="ic-quality-val">90</span>%</label>
                  <input type="range" id="ic-quality" min="1" max="100" value="90" style="width:100%;accent-color:var(--accent-blue)">
                </div>
                <div class="form-group" style="display:flex;align-items:flex-end">
                  <button class="btn btn-primary" id="ic-convert"><i class="fas fa-exchange-alt"></i> Convert & Download</button>
                </div>
              </div>
              <div class="form-row" style="margin-top:12px">
                <div class="form-group" style="max-width:150px">
                  <label class="form-label">Width (px)</label>
                  <input type="number" class="form-input" id="ic-width" placeholder="Auto">
                </div>
                <div class="form-group" style="max-width:150px">
                  <label class="form-label">Height (px)</label>
                  <input type="number" class="form-input" id="ic-height" placeholder="Auto">
                </div>
                <div class="toggle-group" style="align-items:flex-end;padding-bottom:8px">
                  <label class="toggle"><input type="checkbox" id="ic-ratio" checked><span class="toggle-slider"></span></label>
                  <span class="toggle-label">Keep Aspect Ratio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);

      let currentImage = null;

      const dropZone = $('#ic-drop');
      dropZone.on('click', () => $('#ic-file').click());
      $('#ic-file').on('change', function () { if (this.files[0]) loadImage(this.files[0]); });
      dropZone.on('dragover', e => { e.preventDefault(); dropZone.addClass('dragover'); });
      dropZone.on('dragleave', () => dropZone.removeClass('dragover'));
      dropZone.on('drop', e => {
        e.preventDefault(); dropZone.removeClass('dragover');
        if (e.originalEvent.dataTransfer.files[0]) loadImage(e.originalEvent.dataTransfer.files[0]);
      });

      function loadImage(file) {
        const img = new Image();
        img.onload = () => {
          currentImage = img;
          $('#ic-preview').html(`<img src="${img.src}" alt="Preview">`);
          $('#ic-info').text(`${img.width} × ${img.height} | ${formatBytes(file.size)} | ${file.type}`);
          $('#ic-width').val(img.width);
          $('#ic-height').val(img.height);
          $('#ic-options').show();
        };
        img.src = URL.createObjectURL(file);
      }

      $('#ic-quality').on('input', function () { $('#ic-quality-val').text(this.value); });
      $('#ic-format').on('change', function () {
        const showQuality = ['image/jpeg', 'image/webp'].includes(this.value);
        $('#ic-quality-group').toggle(showQuality);
      });

      let aspectRatio = 1;
      $('#ic-width').on('input', function () {
        if ($('#ic-ratio').is(':checked') && currentImage) {
          aspectRatio = currentImage.width / currentImage.height;
          $('#ic-height').val(Math.round(this.value / aspectRatio));
        }
      });
      $('#ic-height').on('input', function () {
        if ($('#ic-ratio').is(':checked') && currentImage) {
          aspectRatio = currentImage.width / currentImage.height;
          $('#ic-width').val(Math.round(this.value * aspectRatio));
        }
      });

      $('#ic-convert').on('click', () => {
        if (!currentImage) { showToast('Please upload an image first', 'error'); return; }
        const format = $('#ic-format').val();
        const quality = parseInt($('#ic-quality').val()) / 100;
        const width = parseInt($('#ic-width').val()) || currentImage.width;
        const height = parseInt($('#ic-height').val()) || currentImage.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(currentImage, 0, 0, width, height);

        canvas.toBlob(blob => {
          const ext = format.split('/')[1];
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `converted.${ext}`;
          a.click();
          showToast(`Image converted to ${ext.toUpperCase()}!`, 'success');
        }, format, quality);
      });
    }
  },
};
