/**
 * PennyWise Pro - Notepad ASCII View & Two-Way Text Import/Export Modal
 */

import { store } from '../store.js';
import { exportToNotepadText, parseFromNotepadText } from '../utils/textParser.js';
import { showToast } from './toast.js';

let modalEl = null;

export function initNotepadModal() {
  if (modalEl) return;

  modalEl = document.createElement('div');
  modalEl.id = 'notepad-modal-overlay';
  modalEl.className = 'modal-overlay';
  document.body.appendChild(modalEl);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeNotepadModal();
  });
}

export function openNotepadModal() {
  initNotepadModal();

  const currentText = exportToNotepadText({
    period: store.state.period,
    salary: store.state.salary,
    banks: store.state.banks
  });

  modalEl.innerHTML = `
    <div class="modal-container" style="max-width: 680px;">
      <div class="modal-header">
        <div>
          <h2 class="modal-title flex items-center gap-2">
            <i class="fa-solid fa-file-lines text-sky"></i>
            <span>Format Notepad & Salinan Teks</span>
          </h2>
          <p class="text-xs text-muted">Format asal seperti catatan teks peribadi anda</p>
        </div>
        <button id="btn-close-notepad-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Tab Switcher -->
      <div class="flex items-center gap-2 px-6 pt-3 border-b border-subtle">
        <button id="tab-view-text" class="btn text-xs font-bold py-2 border-b-2 border-primary text-primary">
          <i class="fa-solid fa-eye mr-1"></i> Paparan Teks
        </button>
        <button id="tab-import-text" class="btn text-xs font-bold py-2 text-muted hover:text-main">
          <i class="fa-solid fa-file-import mr-1"></i> Import dari Teks
        </button>
      </div>

      <div class="modal-body">
        <!-- View Mode Pane -->
        <div id="pane-view-text">
          <div class="notepad-view" id="notepad-code-view">${escapeHtml(currentText)}</div>
        </div>

        <!-- Import Mode Pane -->
        <div id="pane-import-text" style="display: none;">
          <p class="text-xs text-muted mb-2">
            Tampal teks format bajet anda di bawah (seperti dari Notepad) untuk dikemaskini terus ke dalam sistem:
          </p>
          <textarea id="import-text-input" class="notepad-textarea" placeholder="Tampal teks bajet di sini...">${escapeHtml(currentText)}</textarea>
        </div>
      </div>

      <div class="modal-footer">
        <div class="flex items-center justify-between w-full">
          <div class="text-xs text-muted">
            <i class="fa-solid fa-check text-emerald mr-1"></i> Sedia disalin ke clipboard
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-copy-notepad" class="btn btn-primary text-xs">
              <i class="fa-regular fa-clone"></i> Salin Semua Teks
            </button>
            <button id="btn-apply-import" class="btn btn-gold text-xs" style="display: none;">
              <i class="fa-solid fa-check-double"></i> Kemaskini Bajet
            </button>
            <button id="btn-download-txt" class="btn btn-secondary text-xs">
              <i class="fa-solid fa-download"></i> Simpan .TXT
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind Events
  document.getElementById('btn-close-notepad-modal')?.addEventListener('click', closeNotepadModal);

  const tabView = document.getElementById('tab-view-text');
  const tabImport = document.getElementById('tab-import-text');
  const paneView = document.getElementById('pane-view-text');
  const paneImport = document.getElementById('pane-import-text');
  const btnCopy = document.getElementById('btn-copy-notepad');
  const btnApply = document.getElementById('btn-apply-import');
  const btnDownload = document.getElementById('btn-download-txt');

  tabView?.addEventListener('click', () => {
    tabView.classList.add('border-b-2', 'border-primary', 'text-primary');
    tabView.classList.remove('text-muted');
    tabImport.classList.remove('border-b-2', 'border-primary', 'text-primary');
    tabImport.classList.add('text-muted');

    paneView.style.display = 'block';
    paneImport.style.display = 'none';
    btnCopy.style.display = 'inline-flex';
    btnApply.style.display = 'none';
    btnDownload.style.display = 'inline-flex';
  });

  tabImport?.addEventListener('click', () => {
    tabImport.classList.add('border-b-2', 'border-primary', 'text-primary');
    tabImport.classList.remove('text-muted');
    tabView.classList.remove('border-b-2', 'border-primary', 'text-primary');
    tabView.classList.add('text-muted');

    paneImport.style.display = 'block';
    paneView.style.display = 'none';
    btnCopy.style.display = 'none';
    btnApply.style.display = 'inline-flex';
    btnDownload.style.display = 'none';
  });

  btnCopy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      showToast('Teks berjaya disalin ke papan keratan!', 'success');
    } catch (e) {
      showToast('Gagal menyalin teks', 'error');
    }
  });

  btnDownload?.addEventListener('click', () => {
    const blob = new Blob([currentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Budget_${store.state.period}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fail muat turun dimulakan!', 'success');
  });

  btnApply?.addEventListener('click', () => {
    const rawInput = document.getElementById('import-text-input')?.value;
    if (!rawInput || !rawInput.trim()) {
      showToast('Sila masukkan teks bajet', 'error');
      return;
    }

    try {
      const parsed = parseFromNotepadText(rawInput, store.state.period);
      if (parsed.banks.length === 0) {
        showToast('Format tidak dapat dikenalpasti. Sila semak format teks.', 'error');
        return;
      }

      store.replaceBudgetData(parsed);
      showToast(`Berjaya mengimport ${parsed.banks.length} bank dan komitmen!`, 'success');
      closeNotepadModal();
    } catch (err) {
      showToast('Ralat memproses teks: ' + err.message, 'error');
    }
  });

  // Open modal
  requestAnimationFrame(() => {
    modalEl.classList.add('active');
  });
}

export function closeNotepadModal() {
  if (modalEl) {
    modalEl.classList.remove('active');
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
