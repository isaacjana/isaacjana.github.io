/**
 * PennyWise Pro - Notepad ASCII View & Two-Way Text Import/Export Modal
 * All in English with mobile-responsive view
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
      <div class="modal-drag-handle"></div>

      <div class="modal-header">
        <div>
          <h2 class="modal-title flex items-center gap-2">
            <i class="fa-solid fa-file-lines text-sky"></i>
            <span>Notepad ASCII & Text Format</span>
          </h2>
          <p class="text-xs text-muted">Original ASCII format matching your personal budget notes</p>
        </div>
        <button id="btn-close-notepad-modal" class="btn btn-subtle btn-icon-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Tab Switcher -->
      <div class="flex items-center gap-2 px-6 pt-3 border-b border-subtle">
        <button id="tab-view-text" class="btn text-xs font-bold py-2 border-b-2 border-primary text-primary">
          <i class="fa-solid fa-eye mr-1"></i> Text View
        </button>
        <button id="tab-import-text" class="btn text-xs font-bold py-2 text-muted hover:text-main">
          <i class="fa-solid fa-file-import mr-1"></i> Import from Text
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
            Paste your ASCII budget notes below to parse and load them into your account:
          </p>
          <textarea id="import-text-input" class="notepad-textarea" placeholder="Paste your budget text here...">${escapeHtml(currentText)}</textarea>
        </div>
      </div>

      <div class="modal-footer">
        <div class="flex items-center justify-between w-full flex-wrap gap-2">
          <div class="text-xs text-muted">
            <i class="fa-solid fa-check text-emerald mr-1"></i> Ready to copy or export
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-copy-notepad" class="btn btn-primary text-xs">
              <i class="fa-regular fa-clone"></i> Copy Text
            </button>
            <button id="btn-apply-import" class="btn btn-gold text-xs" style="display: none;">
              <i class="fa-solid fa-check-double"></i> Update Budget
            </button>
            <button id="btn-download-txt" class="btn btn-secondary text-xs">
              <i class="fa-solid fa-download"></i> Save .TXT
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
      showToast('Text copied to clipboard!', 'success');
    } catch (e) {
      showToast('Could not copy to clipboard', 'error');
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
    showToast('Download started!', 'success');
  });

  btnApply?.addEventListener('click', () => {
    const rawInput = document.getElementById('import-text-input')?.value;
    if (!rawInput || !rawInput.trim()) {
      showToast('Please enter budget text', 'error');
      return;
    }

    try {
      const parsed = parseFromNotepadText(rawInput, store.state.period);
      if (parsed.banks.length === 0) {
        showToast('Could not identify budget structure. Please verify formatting.', 'error');
        return;
      }

      store.replaceBudgetData(parsed);
      showToast(`Imported ${parsed.banks.length} banks and commitments successfully!`, 'success');
      closeNotepadModal();
    } catch (err) {
      showToast('Error parsing text: ' + err.message, 'error');
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
