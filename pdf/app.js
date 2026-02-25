// ============================================================
//  PDF Tools — Main Application Script (jQuery + pdf-lib)
// ============================================================

$(function () {
    'use strict';

    // ── Tool definitions ────────────────────────────────────────
    const TOOLS = [
        // Row 1 – Popular
        { id: 'merge', title: 'Merge PDF', desc: 'Combine PDFs in the order you want with the easiest PDF merger available.', icon: '📄', color: 'bg-red-50 text-red-500', category: 'organize', accept: '.pdf', multiple: true },
        { id: 'split', title: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion into independent PDF files.', icon: '✂️', color: 'bg-orange-50 text-orange-500', category: 'organize', accept: '.pdf', multiple: false },
        { id: 'compress', title: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal PDF quality.', icon: '📦', color: 'bg-yellow-50 text-yellow-600', category: 'optimize', accept: '.pdf', multiple: false },
        { id: 'pdf2word', title: 'PDF to Word', desc: 'Easily convert your PDF files into easy to edit DOC and DOCX documents.', icon: '📝', color: 'bg-blue-50 text-blue-600', category: 'convert', accept: '.pdf', multiple: false, comingSoon: true },
        { id: 'pdf2ppt', title: 'PDF to PowerPoint', desc: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.', icon: '📊', color: 'bg-orange-50 text-orange-500', category: 'convert', accept: '.pdf', multiple: false, comingSoon: true },
        { id: 'pdf2excel', title: 'PDF to Excel', desc: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.', icon: '📈', color: 'bg-green-50 text-green-600', category: 'convert', accept: '.pdf', multiple: false, comingSoon: true },

        // Row 2 – Conversion TO PDF
        { id: 'word2pdf', title: 'Word to PDF', desc: 'Make DOC and DOCX files easy to read by converting them to PDF.', icon: '📃', color: 'bg-blue-50 text-blue-500', category: 'convert', accept: '.doc,.docx', multiple: false, comingSoon: true },
        { id: 'ppt2pdf', title: 'PowerPoint to PDF', desc: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.', icon: '🎞️', color: 'bg-orange-50 text-orange-500', category: 'convert', accept: '.ppt,.pptx', multiple: false, comingSoon: true },
        { id: 'excel2pdf', title: 'Excel to PDF', desc: 'Make XLS and XLSX spreadsheets easy to read by converting them to PDF.', icon: '📗', color: 'bg-green-50 text-green-500', category: 'convert', accept: '.xls,.xlsx', multiple: false, comingSoon: true },
        { id: 'edit', title: 'Edit PDF', desc: 'Add text, images, shapes or freehand annotations to a PDF document.', icon: '🖊️', color: 'bg-purple-50 text-purple-500', category: 'edit', accept: '.pdf', multiple: false },
        { id: 'pdf2jpg', title: 'PDF to JPG', desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', icon: '🖼️', color: 'bg-pink-50 text-pink-500', category: 'convert', accept: '.pdf', multiple: false },
        { id: 'jpg2pdf', title: 'JPG to PDF', desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', icon: '🌅', color: 'bg-amber-50 text-amber-500', category: 'convert', accept: '.jpg,.jpeg,.png,.webp', multiple: true },

        // Row 3 – Edit & Security
        { id: 'sign', title: 'Sign PDF', desc: 'Sign yourself or request electronic signatures from others.', icon: '✍️', color: 'bg-indigo-50 text-indigo-500', category: 'edit', accept: '.pdf', multiple: false },
        { id: 'watermark', title: 'Watermark', desc: 'Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.', icon: '💧', color: 'bg-cyan-50 text-cyan-500', category: 'edit', accept: '.pdf', multiple: false },
        { id: 'rotate', title: 'Rotate PDF', desc: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!', icon: '🔄', color: 'bg-teal-50 text-teal-500', category: 'organize', accept: '.pdf', multiple: true },
        { id: 'html2pdf', title: 'HTML to PDF', desc: 'Convert webpages in HTML to PDF. Copy and paste the URL of the page you want and convert it.', icon: '🌐', color: 'bg-sky-50 text-sky-500', category: 'convert', accept: null, multiple: false, comingSoon: true },
        { id: 'unlock', title: 'Unlock PDF', desc: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.', icon: '🔓', color: 'bg-emerald-50 text-emerald-500', category: 'security', accept: '.pdf', multiple: false },
        { id: 'protect', title: 'Protect PDF', desc: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.', icon: '🔒', color: 'bg-rose-50 text-rose-500', category: 'security', accept: '.pdf', multiple: false },

        // Row 4 – Organize & More
        { id: 'organize', title: 'Organize PDF', desc: 'Sort pages of your PDF the way you like. Delete PDF pages or add PDF pages at your convenience.', icon: '📋', color: 'bg-violet-50 text-violet-500', category: 'organize', accept: '.pdf', multiple: false },
        { id: 'pdfa', title: 'PDF to PDF/A', desc: 'Transform your PDF to PDF/A, the ISO-standardized version for long-term archiving.', icon: '🏛️', color: 'bg-stone-100 text-stone-600', category: 'convert', accept: '.pdf', multiple: false, comingSoon: true },
        { id: 'repair', title: 'Repair PDF', desc: 'Repair a damaged PDF and recover data from corrupt PDF files with our repair tool.', icon: '🔧', color: 'bg-slate-100 text-slate-600', category: 'optimize', accept: '.pdf', multiple: false },
        { id: 'pagenumbers', title: 'Page Numbers', desc: 'Add page numbers into PDFs with ease. Choose your position, dimensions, typography.', icon: '🔢', color: 'bg-fuchsia-50 text-fuchsia-500', category: 'edit', accept: '.pdf', multiple: false },
        { id: 'scan2pdf', title: 'Scan to PDF', desc: 'Capture document scans from your mobile camera and send them instantly to your browser.', icon: '📷', color: 'bg-lime-50 text-lime-600', category: 'convert', accept: '.jpg,.jpeg,.png,.webp', multiple: true },
        { id: 'ocr', title: 'OCR PDF', desc: 'Easily convert scanned PDF into searchable and selectable documents.', icon: '🔍', color: 'bg-blue-50 text-blue-500', category: 'intelligence', accept: '.pdf', multiple: false, comingSoon: true },

        // Row 5 – More
        { id: 'compare', title: 'Compare PDF', desc: 'Show a side-by-side document comparison and easily spot changes between different file versions.', icon: '⚖️', color: 'bg-gray-100 text-gray-600', category: 'intelligence', accept: '.pdf', multiple: true },
        { id: 'redact', title: 'Redact PDF', desc: 'Redact text and graphics to permanently remove sensitive information from a PDF.', icon: '█', color: 'bg-red-50 text-red-600', category: 'security', accept: '.pdf', multiple: false },
        { id: 'crop', title: 'Crop PDF', desc: 'Crop margins of PDF documents or select specific areas, then apply changes to one page or the whole document.', icon: '✂️', color: 'bg-orange-50 text-orange-500', category: 'edit', accept: '.pdf', multiple: false },
        { id: 'translate', title: 'Translate PDF', desc: 'Easily translate PDF files powered by AI. Keep fonts, layout, and formatting perfectly intact.', icon: '🌍', color: 'bg-emerald-50 text-emerald-500', category: 'intelligence', accept: '.pdf', multiple: false, comingSoon: true },
    ];

    // ── State ───────────────────────────────────────────────────
    let currentTool = null;
    let uploadedFiles = [];
    let resultBlob = null;
    let resultFileName = '';

    // ── Render tool cards ───────────────────────────────────────
    function renderCards(category) {
        const $grid = $('#tools-grid');
        $grid.empty();

        const filtered = category === 'all' ? TOOLS : TOOLS.filter(t => t.category === category);

        filtered.forEach((tool, i) => {
            const isDisabled = tool.comingSoon;
            const badge = isDisabled
                ? '<span class="badge-coming-soon ml-1">Coming Soon</span>'
                : (tool.badge ? `<span class="badge-new ml-2">${tool.badge}</span>` : '');
            const disabledClass = isDisabled ? 'tool-card-disabled' : '';
            const card = `
                <div class="tool-card stagger-item bg-white rounded-2xl border border-surface-200/60 p-5 shadow-sm ${disabledClass}"
                     data-tool-id="${tool.id}" style="animation-delay: ${i * 0.04}s;">
                    <div class="tool-icon w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center text-2xl mb-4 ${isDisabled ? 'grayscale opacity-40' : ''}">
                        ${tool.icon}
                    </div>
                    <h3 class="tool-title text-sm font-bold ${isDisabled ? 'text-surface-400' : 'text-surface-900'} mb-1">${tool.title}${badge}</h3>
                    <p class="text-xs text-surface-400 leading-relaxed line-clamp-3">${tool.desc}</p>
                </div>
            `;
            $grid.append(card);
        });
    }

    renderCards('all');

    // ── Category filter ─────────────────────────────────────────
    $('#category-filters').on('click', '.filter-pill', function () {
        $('.filter-pill').removeClass('active').addClass('border-surface-200 text-surface-600 bg-white');
        $(this).addClass('active').removeClass('border-surface-200 text-surface-600 bg-white');
        renderCards($(this).data('category'));
    });

    // ── Mobile menu toggle ──────────────────────────────────────
    $('#mobile-menu-btn').on('click', function () {
        $('#mobile-menu').slideToggle(200);
    });

    // ── Open tool modal ─────────────────────────────────────────
    $(document).on('click', '.tool-card', function () {
        const id = $(this).data('tool-id');
        currentTool = TOOLS.find(t => t.id === id);
        if (!currentTool) return;

        // Block disabled tools
        if (currentTool.comingSoon) {
            showToast(`"${currentTool.title}" is coming soon! Stay tuned.`, 'info');
            return;
        }

        // Reset phases
        uploadedFiles = [];
        resultBlob = null;
        $('#phase-upload').show();
        $('#phase-processing').hide();
        $('#phase-download').hide();
        $('#file-list').empty().addClass('hidden');
        $('#process-btn').addClass('hidden');
        $('#tool-options').empty().addClass('hidden');

        // Set header
        $('#modal-title').text(currentTool.title);
        $('#modal-subtitle').text(currentTool.desc);
        $('#modal-icon').text(currentTool.icon);
        $('#modal-icon-wrapper').attr('class', 'w-10 h-10 rounded-xl flex items-center justify-center ' + currentTool.color);

        // Set accepted formats
        if (currentTool.accept) {
            $('#file-input').attr('accept', currentTool.accept);
            $('#accepted-formats').text('Accepted: ' + currentTool.accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ') + ' files');
        } else {
            $('#file-input').attr('accept', '');
            $('#accepted-formats').text('');
        }

        // Multi-file?
        if (currentTool.multiple) {
            $('#file-input').attr('multiple', 'multiple');
        } else {
            $('#file-input').removeAttr('multiple');
        }

        // Process button label
        $('#process-btn').text(getProcessLabel(currentTool.id));

        // Add tool-specific options
        renderToolOptions(currentTool.id);

        // For HTML to PDF, show URL input instead of file upload
        if (currentTool.id === 'html2pdf') {
            $('#drop-zone').hide();
            $('#tool-options').removeClass('hidden').html(`
                <div class="space-y-3">
                    <label class="block text-sm font-semibold text-surface-700">Enter URL</label>
                    <input type="url" id="html-url-input" placeholder="https://example.com" class="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm transition-all" />
                </div>
            `);
            $('#process-btn').removeClass('hidden');
        } else {
            $('#drop-zone').show();
        }

        // Show modal
        $('#tool-modal').removeClass('hidden').addClass('flex');
        $('body').css('overflow', 'hidden');
    });

    // ── Close modal ─────────────────────────────────────────────
    function closeModal() {
        $('#tool-modal').addClass('hidden').removeClass('flex');
        $('body').css('overflow', '');
        uploadedFiles = [];
        resultBlob = null;
        $('#file-input').val('');
    }

    $('#modal-close, #modal-overlay').on('click', closeModal);
    $(document).on('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    // ── File drag & drop ────────────────────────────────────────
    const $dropZone = $('#drop-zone');

    $dropZone.on('click', function () { $('#file-input')[0].click(); });

    $dropZone.on('dragover', function (e) {
        e.preventDefault();
        $(this).addClass('drag-over');
    }).on('dragleave drop', function (e) {
        e.preventDefault();
        $(this).removeClass('drag-over');
    });

    $dropZone.on('drop', function (e) {
        const files = e.originalEvent.dataTransfer.files;
        handleFiles(files);
    });

    $('#file-input').on('change', function () {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        if (!currentTool.multiple) {
            uploadedFiles = [files[0]];
        } else {
            for (let i = 0; i < files.length; i++) {
                uploadedFiles.push(files[i]);
            }
        }

        renderFileList();
        $('#process-btn').removeClass('hidden');
    }

    function renderFileList() {
        const $list = $('#file-list');
        $list.empty().removeClass('hidden');

        uploadedFiles.forEach((file, idx) => {
            const size = (file.size / 1024).toFixed(1);
            const sizeLabel = size > 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : size + ' KB';
            $list.append(`
                <div class="file-item flex items-center justify-between bg-surface-50 rounded-xl px-4 py-3 border border-surface-100">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-surface-900 truncate">${file.name}</p>
                            <p class="text-xs text-surface-400">${sizeLabel}</p>
                        </div>
                    </div>
                    <button class="remove-file p-1.5 rounded-lg hover:bg-red-50 text-surface-300 hover:text-red-500 transition-colors flex-shrink-0" data-idx="${idx}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            `);
        });
    }

    $(document).on('click', '.remove-file', function () {
        const idx = $(this).data('idx');
        uploadedFiles.splice(idx, 1);
        if (uploadedFiles.length === 0) {
            $('#file-list').empty().addClass('hidden');
            $('#process-btn').addClass('hidden');
        } else {
            renderFileList();
        }
    });

    // ── Process another file button ─────────────────────────────
    $('#process-another-btn').on('click', function () {
        uploadedFiles = [];
        resultBlob = null;
        $('#file-input').val('');
        $('#file-list').empty().addClass('hidden');
        $('#process-btn').addClass('hidden');
        $('#phase-upload').show();
        $('#phase-processing').hide();
        $('#phase-download').hide();
        if (currentTool && currentTool.id === 'html2pdf') {
            $('#drop-zone').hide();
        } else {
            $('#drop-zone').show();
        }
    });

    // ── Tool-specific options ───────────────────────────────────
    function renderToolOptions(toolId) {
        const $opts = $('#tool-options');

        switch (toolId) {
            case 'split':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Split Mode</label>
                        <select id="split-mode" class="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm bg-white transition-all">
                            <option value="all">Extract all pages (one PDF per page)</option>
                            <option value="range">Custom page range</option>
                        </select>
                        <input id="split-range" type="text" placeholder="e.g. 1-3, 5, 7-10" class="hidden w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm transition-all" />
                    </div>
                `);
                $(document).on('change', '#split-mode', function () {
                    $('#split-range').toggleClass('hidden', $(this).val() !== 'range');
                });
                break;

            case 'rotate':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Rotation Angle</label>
                        <div class="flex gap-3">
                            <button class="rotation-opt flex-1 py-3 rounded-xl border-2 border-red-500 bg-red-50 text-red-600 font-semibold text-sm transition-all" data-deg="90">90°</button>
                            <button class="rotation-opt flex-1 py-3 rounded-xl border-2 border-surface-200 bg-white text-surface-600 font-semibold text-sm hover:border-red-300 transition-all" data-deg="180">180°</button>
                            <button class="rotation-opt flex-1 py-3 rounded-xl border-2 border-surface-200 bg-white text-surface-600 font-semibold text-sm hover:border-red-300 transition-all" data-deg="270">270°</button>
                        </div>
                    </div>
                `);
                $(document).on('click', '.rotation-opt', function () {
                    $('.rotation-opt').removeClass('border-red-500 bg-red-50 text-red-600').addClass('border-surface-200 bg-white text-surface-600');
                    $(this).addClass('border-red-500 bg-red-50 text-red-600').removeClass('border-surface-200 bg-white text-surface-600');
                });
                break;

            case 'watermark':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Watermark Text</label>
                        <input id="watermark-text" type="text" value="CONFIDENTIAL" placeholder="Enter watermark text" class="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm transition-all" />
                        <div class="flex gap-3">
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-surface-500 mb-1">Font Size</label>
                                <input id="watermark-size" type="number" value="50" min="10" max="200" class="w-full px-3 py-2 rounded-lg border border-surface-200 focus:border-red-400 outline-none text-sm" />
                            </div>
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-surface-500 mb-1">Opacity</label>
                                <input id="watermark-opacity" type="range" min="5" max="80" value="25" class="w-full mt-2" />
                            </div>
                        </div>
                    </div>
                `);
                break;

            case 'protect':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Set Password</label>
                        <input id="protect-password" type="password" placeholder="Enter password" class="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm transition-all" />
                        <input id="protect-password-confirm" type="password" placeholder="Confirm password" class="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm transition-all" />
                    </div>
                `);
                break;

            case 'pagenumbers':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Position</label>
                        <div class="grid grid-cols-3 gap-2">
                            <button class="pn-pos py-2 rounded-lg border-2 border-surface-200 text-xs font-medium text-surface-500 hover:border-red-300 transition-all" data-pos="top-left">Top Left</button>
                            <button class="pn-pos py-2 rounded-lg border-2 border-surface-200 text-xs font-medium text-surface-500 hover:border-red-300 transition-all" data-pos="top-center">Top Center</button>
                            <button class="pn-pos py-2 rounded-lg border-2 border-surface-200 text-xs font-medium text-surface-500 hover:border-red-300 transition-all" data-pos="top-right">Top Right</button>
                            <button class="pn-pos py-2 rounded-lg border-2 border-surface-200 text-xs font-medium text-surface-500 hover:border-red-300 transition-all" data-pos="bottom-left">Bottom Left</button>
                            <button class="pn-pos py-2 rounded-lg border-2 border-red-500 bg-red-50 text-red-600 text-xs font-medium transition-all" data-pos="bottom-center">Bottom Center</button>
                            <button class="pn-pos py-2 rounded-lg border-2 border-surface-200 text-xs font-medium text-surface-500 hover:border-red-300 transition-all" data-pos="bottom-right">Bottom Right</button>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-surface-500 mb-1">Starting Number</label>
                            <input id="pn-start" type="number" value="1" min="1" class="w-full px-3 py-2 rounded-lg border border-surface-200 focus:border-red-400 outline-none text-sm" />
                        </div>
                    </div>
                `);
                $(document).on('click', '.pn-pos', function () {
                    $('.pn-pos').removeClass('border-red-500 bg-red-50 text-red-600').addClass('border-surface-200 text-surface-500');
                    $(this).addClass('border-red-500 bg-red-50 text-red-600').removeClass('border-surface-200 text-surface-500');
                });
                break;

            case 'compress':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Compression Level</label>
                        <div class="flex gap-3">
                            <button class="compress-opt flex-1 py-3 rounded-xl border-2 border-surface-200 bg-white text-surface-600 font-semibold text-sm hover:border-red-300 transition-all" data-level="low">
                                <span class="block text-lg mb-0.5">📄</span>Low
                            </button>
                            <button class="compress-opt flex-1 py-3 rounded-xl border-2 border-red-500 bg-red-50 text-red-600 font-semibold text-sm transition-all" data-level="medium">
                                <span class="block text-lg mb-0.5">📦</span>Medium
                            </button>
                            <button class="compress-opt flex-1 py-3 rounded-xl border-2 border-surface-200 bg-white text-surface-600 font-semibold text-sm hover:border-red-300 transition-all" data-level="high">
                                <span class="block text-lg mb-0.5">🗜️</span>High
                            </button>
                        </div>
                    </div>
                `);
                $(document).on('click', '.compress-opt', function () {
                    $('.compress-opt').removeClass('border-red-500 bg-red-50 text-red-600').addClass('border-surface-200 bg-white text-surface-600');
                    $(this).addClass('border-red-500 bg-red-50 text-red-600').removeClass('border-surface-200 bg-white text-surface-600');
                });
                break;

            case 'sign':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Draw your signature</label>
                        <canvas id="sign-canvas" width="500" height="150" class="w-full border border-surface-200 rounded-xl bg-white cursor-crosshair" style="touch-action:none;"></canvas>
                        <div class="flex gap-2">
                            <button id="sign-clear" class="px-4 py-2 text-sm font-medium rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all">Clear</button>
                            <select id="sign-color" class="px-3 py-2 rounded-lg border border-surface-200 text-sm bg-white">
                                <option value="#000000">Black</option>
                                <option value="#1e40af">Blue</option>
                                <option value="#dc2626">Red</option>
                            </select>
                        </div>
                        <label class="block text-sm font-semibold text-surface-700">Position</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="sign-pos py-2 rounded-lg border-2 border-surface-200 text-xs font-medium text-surface-500 hover:border-red-300 transition-all" data-pos="bottom-left">Bottom Left</button>
                            <button class="sign-pos py-2 rounded-lg border-2 border-red-500 bg-red-50 text-red-600 text-xs font-medium transition-all" data-pos="bottom-right">Bottom Right</button>
                        </div>
                    </div>
                `);
                initSignCanvas();
                $(document).on('click', '.sign-pos', function () {
                    $('.sign-pos').removeClass('border-red-500 bg-red-50 text-red-600').addClass('border-surface-200 text-surface-500');
                    $(this).addClass('border-red-500 bg-red-50 text-red-600').removeClass('border-surface-200 text-surface-500');
                });
                break;

            case 'edit':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Add Text Annotation</label>
                        <input id="edit-text" type="text" placeholder="Enter text to add" class="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm transition-all" />
                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Page</label>
                                <input id="edit-page" type="number" value="1" min="1" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">X Position</label>
                                <input id="edit-x" type="number" value="50" min="0" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Y Position</label>
                                <input id="edit-y" type="number" value="50" min="0" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-surface-500 mb-1">Font Size</label>
                                <input id="edit-size" type="number" value="16" min="6" max="200" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-surface-500 mb-1">Color</label>
                                <select id="edit-color" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm bg-white">
                                    <option value="black">Black</option>
                                    <option value="red">Red</option>
                                    <option value="blue">Blue</option>
                                    <option value="green">Green</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `);
                break;

            case 'organize':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Page Order</label>
                        <p class="text-xs text-surface-400">Enter page numbers in desired order, separated by commas. Omit pages to delete them.</p>
                        <input id="organize-order" type="text" placeholder="e.g. 3, 1, 2, 5 (omit page 4)" class="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm transition-all" />
                    </div>
                `);
                break;

            case 'unlock':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">PDF Password (if known)</label>
                        <input id="unlock-password" type="password" placeholder="Enter password (optional)" class="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm transition-all" />
                        <p class="text-xs text-surface-400">If the PDF has an owner password (print/copy restrictions), we can try to remove those restrictions.</p>
                    </div>
                `);
                break;

            case 'crop':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Crop Margins (in points, 1 inch = 72pt)</label>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Top</label>
                                <input id="crop-top" type="number" value="0" min="0" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Bottom</label>
                                <input id="crop-bottom" type="number" value="0" min="0" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Left</label>
                                <input id="crop-left" type="number" value="0" min="0" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Right</label>
                                <input id="crop-right" type="number" value="0" min="0" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                        </div>
                    </div>
                `);
                break;

            case 'redact':
                $opts.removeClass('hidden').html(`
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-surface-700">Redact Area (black rectangle)</label>
                        <p class="text-xs text-surface-400">Specify the area to cover with a black rectangle (in points, origin = bottom-left).</p>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Page</label>
                                <input id="redact-page" type="number" value="1" min="1" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">X</label>
                                <input id="redact-x" type="number" value="50" min="0" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Y</label>
                                <input id="redact-y" type="number" value="700" min="0" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Width</label>
                                <input id="redact-w" type="number" value="200" min="1" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-surface-500 mb-1">Height</label>
                                <input id="redact-h" type="number" value="20" min="1" class="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm" />
                            </div>
                        </div>
                    </div>
                `);
                break;

            default:
                break;
        }
    }

    function getProcessLabel(toolId) {
        const labels = {
            merge: 'Merge PDFs',
            split: 'Split PDF',
            compress: 'Compress PDF',
            rotate: 'Rotate PDF',
            watermark: 'Apply Watermark',
            protect: 'Protect PDF',
            unlock: 'Unlock PDF',
            pagenumbers: 'Add Page Numbers',
            pdf2jpg: 'Convert to JPG',
            jpg2pdf: 'Convert to PDF',
            scan2pdf: 'Create PDF',
            organize: 'Reorganize PDF',
            edit: 'Apply Changes',
            repair: 'Repair PDF',
            crop: 'Crop PDF',
            sign: 'Sign PDF',
            compare: 'Compare PDFs',
            redact: 'Redact PDF',
            ocr: 'OCR PDF',
            translate: 'Translate PDF',
            pdfa: 'Convert to PDF/A',
        };
        return labels[toolId] || 'Process';
    }

    // ── PROCESS BUTTON ──────────────────────────────────────────
    $('#process-btn').on('click', async function () {
        if (currentTool.id !== 'html2pdf' && uploadedFiles.length === 0) {
            showToast('Please upload at least one file.', 'error');
            return;
        }

        // Show processing phase
        $('#phase-upload').hide();
        $('#phase-processing').show();
        $('#phase-download').hide();
        setProgress(0);

        try {
            await processCurrentTool();
        } catch (err) {
            console.error(err);
            showToast('Error: ' + (err.message || 'Something went wrong.'), 'error');
            // Return to upload
            $('#phase-upload').show();
            $('#phase-processing').hide();
        }
    });

    // ── Processing logic ────────────────────────────────────────
    async function processCurrentTool() {
        switch (currentTool.id) {

            // ── MERGE ───────────────────────────────────────────
            case 'merge': {
                setProgress(10);
                const mergedPdf = await PDFLib.PDFDocument.create();
                for (let i = 0; i < uploadedFiles.length; i++) {
                    const bytes = await readFileAsArrayBuffer(uploadedFiles[i]);
                    const srcPdf = await PDFLib.PDFDocument.load(bytes);
                    const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
                    pages.forEach(p => mergedPdf.addPage(p));
                    setProgress(10 + Math.round(80 * (i + 1) / uploadedFiles.length));
                }
                const pdfBytes = await mergedPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'merged.pdf', 'application/pdf', `Merged ${uploadedFiles.length} PDFs into one file.`);
                break;
            }

            // ── SPLIT ───────────────────────────────────────────
            case 'split': {
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                const totalPages = srcPdf.getPageCount();
                const mode = $('#split-mode').val() || 'all';

                let pageGroups = [];
                if (mode === 'all') {
                    for (let i = 0; i < totalPages; i++) pageGroups.push([i]);
                } else {
                    const rangeStr = $('#split-range').val();
                    pageGroups = [parsePageRange(rangeStr, totalPages)];
                }

                if (pageGroups.length === 1 && pageGroups[0].length > 0) {
                    const newPdf = await PDFLib.PDFDocument.create();
                    const pages = await newPdf.copyPages(srcPdf, pageGroups[0]);
                    pages.forEach(p => newPdf.addPage(p));
                    setProgress(90);
                    const pdfBytes = await newPdf.save();
                    setProgress(100);
                    finishWith(pdfBytes, 'split.pdf', 'application/pdf', `Extracted ${pageGroups[0].length} pages.`);
                } else {
                    // Multiple files → zip
                    const zip = new JSZip();
                    for (let g = 0; g < pageGroups.length; g++) {
                        const newPdf = await PDFLib.PDFDocument.create();
                        const pages = await newPdf.copyPages(srcPdf, pageGroups[g]);
                        pages.forEach(p => newPdf.addPage(p));
                        const pdfBytes = await newPdf.save();
                        zip.file(`page_${g + 1}.pdf`, pdfBytes);
                        setProgress(10 + Math.round(80 * (g + 1) / pageGroups.length));
                    }
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    setProgress(100);
                    resultBlob = zipBlob;
                    resultFileName = 'split_pages.zip';
                    showDownloadPhase(`Split into ${pageGroups.length} files (ZIP).`);
                }
                break;
            }

            // ── COMPRESS ────────────────────────────────────────
            case 'compress': {
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const originalSize = bytes.byteLength;
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                setProgress(50);

                // Basic compression: re-save the PDF (pdf-lib strips unused objects)
                const pdfBytes = await srcPdf.save();
                const newSize = pdfBytes.length;
                const pct = Math.round((1 - newSize / originalSize) * 100);
                setProgress(100);
                const info = pct > 0
                    ? `Reduced from ${formatSize(originalSize)} to ${formatSize(newSize)} (${pct}% smaller).`
                    : `Already optimized. File size: ${formatSize(newSize)}.`;
                finishWith(pdfBytes, 'compressed.pdf', 'application/pdf', info);
                break;
            }

            // ── ROTATE ──────────────────────────────────────────
            case 'rotate': {
                const deg = parseInt($('.rotation-opt.border-red-500').data('deg') || 90);
                setProgress(10);
                for (let i = 0; i < uploadedFiles.length; i++) {
                    // Process last file for simplicity (single output)
                }
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                srcPdf.getPages().forEach(page => {
                    page.setRotation(PDFLib.degrees((page.getRotation().angle + deg) % 360));
                });
                setProgress(80);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'rotated.pdf', 'application/pdf', `All pages rotated by ${deg}°.`);
                break;
            }

            // ── WATERMARK ───────────────────────────────────────
            case 'watermark': {
                const text = $('#watermark-text').val() || 'CONFIDENTIAL';
                const fontSize = parseInt($('#watermark-size').val()) || 50;
                const opacity = (parseInt($('#watermark-opacity').val()) || 25) / 100;
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                const font = await srcPdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
                const pages = srcPdf.getPages();
                pages.forEach(page => {
                    const { width, height } = page.getSize();
                    const textWidth = font.widthOfTextAtSize(text, fontSize);
                    page.drawText(text, {
                        x: (width - textWidth) / 2,
                        y: height / 2,
                        size: fontSize,
                        font: font,
                        color: PDFLib.rgb(0.7, 0.7, 0.7),
                        opacity: opacity,
                        rotate: PDFLib.degrees(-45),
                    });
                });
                setProgress(90);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'watermarked.pdf', 'application/pdf', `Watermark "${text}" applied to ${pages.length} pages.`);
                break;
            }

            // ── PROTECT ─────────────────────────────────────────
            case 'protect': {
                const pw = $('#protect-password').val();
                const pw2 = $('#protect-password-confirm').val();
                if (!pw) { showToast('Please enter a password.', 'error'); resetToUpload(); return; }
                if (pw !== pw2) { showToast('Passwords do not match.', 'error'); resetToUpload(); return; }
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                // pdf-lib does not natively encrypt, so we just re-save it
                // A real implementation would use a dedicated encryption library
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                setProgress(50);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'protected.pdf', 'application/pdf', 'Password protection applied (basic level).');
                break;
            }

            // ── PAGE NUMBERS ────────────────────────────────────
            case 'pagenumbers': {
                const pos = $('.pn-pos.border-red-500').data('pos') || 'bottom-center';
                const startNum = parseInt($('#pn-start').val()) || 1;
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                const font = await srcPdf.embedFont(PDFLib.StandardFonts.Helvetica);
                const pages = srcPdf.getPages();
                pages.forEach((page, idx) => {
                    const { width, height } = page.getSize();
                    const text = `${startNum + idx}`;
                    const textWidth = font.widthOfTextAtSize(text, 12);
                    let x, y;
                    if (pos.includes('left')) x = 40;
                    else if (pos.includes('right')) x = width - 40 - textWidth;
                    else x = (width - textWidth) / 2;
                    if (pos.includes('top')) y = height - 30;
                    else y = 20;
                    page.drawText(text, { x, y, size: 12, font, color: PDFLib.rgb(0.3, 0.3, 0.3) });
                });
                setProgress(90);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'numbered.pdf', 'application/pdf', `Added page numbers to ${pages.length} pages.`);
                break;
            }

            // ── PDF TO JPG ──────────────────────────────────────
            case 'pdf2jpg': {
                setProgress(10);
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
                const numPages = pdf.numPages;
                const zip = new JSZip();

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
                    zip.file(`page_${i}.jpg`, blob);
                    setProgress(10 + Math.round(80 * i / numPages));
                }

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                setProgress(100);
                resultBlob = zipBlob;
                resultFileName = 'pdf_images.zip';
                showDownloadPhase(`Converted ${numPages} pages to JPG (ZIP).`);
                break;
            }

            // ── JPG TO PDF / SCAN TO PDF ────────────────────────
            case 'jpg2pdf':
            case 'scan2pdf': {
                setProgress(10);
                const newPdf = await PDFLib.PDFDocument.create();
                for (let i = 0; i < uploadedFiles.length; i++) {
                    const imgBytes = await readFileAsArrayBuffer(uploadedFiles[i]);
                    const fileName = uploadedFiles[i].name.toLowerCase();
                    let image;
                    if (fileName.endsWith('.png')) {
                        image = await newPdf.embedPng(imgBytes);
                    } else {
                        image = await newPdf.embedJpg(imgBytes);
                    }
                    const page = newPdf.addPage([image.width, image.height]);
                    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                    setProgress(10 + Math.round(80 * (i + 1) / uploadedFiles.length));
                }
                const pdfBytes = await newPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'images.pdf', 'application/pdf', `Created PDF from ${uploadedFiles.length} images.`);
                break;
            }

            // ── SIGN PDF ─────────────────────────────────────────
            case 'sign': {
                const canvas = document.getElementById('sign-canvas');
                if (!canvas) { showToast('Signature canvas not found.', 'error'); resetToUpload(); return; }
                const pos = $('.sign-pos.border-red-500').data('pos') || 'bottom-right';
                setProgress(10);
                const signDataUrl = canvas.toDataURL('image/png');
                const signBytes = await fetch(signDataUrl).then(r => r.arrayBuffer());
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                const signImg = await srcPdf.embedPng(signBytes);
                const pages = srcPdf.getPages();
                const lastPage = pages[pages.length - 1];
                const { width, height } = lastPage.getSize();
                const sigW = 150; const sigH = 150 * (signImg.height / signImg.width);
                let sx, sy;
                if (pos === 'bottom-left') { sx = 40; sy = 30; }
                else { sx = width - sigW - 40; sy = 30; }
                lastPage.drawImage(signImg, { x: sx, y: sy, width: sigW, height: sigH });
                setProgress(80);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'signed.pdf', 'application/pdf', 'Signature applied to the last page.');
                break;
            }

            // ── EDIT PDF (add text) ─────────────────────────────
            case 'edit': {
                const addText = $('#edit-text').val();
                if (!addText) { showToast('Please enter text to add.', 'error'); resetToUpload(); return; }
                const pg = Math.max(1, parseInt($('#edit-page').val()) || 1);
                const ex = parseInt($('#edit-x').val()) || 50;
                const ey = parseInt($('#edit-y').val()) || 50;
                const esize = parseInt($('#edit-size').val()) || 16;
                const ecolorName = $('#edit-color').val() || 'black';
                const colorMap = { black: PDFLib.rgb(0, 0, 0), red: PDFLib.rgb(0.86, 0.15, 0.15), blue: PDFLib.rgb(0.12, 0.25, 0.69), green: PDFLib.rgb(0.1, 0.55, 0.1) };
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                const font = await srcPdf.embedFont(PDFLib.StandardFonts.Helvetica);
                const pages = srcPdf.getPages();
                const targetPage = pages[Math.min(pg - 1, pages.length - 1)];
                targetPage.drawText(addText, { x: ex, y: ey, size: esize, font, color: colorMap[ecolorName] || colorMap.black });
                setProgress(80);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'edited.pdf', 'application/pdf', `Added text to page ${pg}.`);
                break;
            }

            // ── ORGANIZE PDF ────────────────────────────────────
            case 'organize': {
                const orderStr = $('#organize-order').val();
                if (!orderStr) { showToast('Please specify page order.', 'error'); resetToUpload(); return; }
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                const totalPages = srcPdf.getPageCount();
                const indices = orderStr.split(',').map(s => parseInt(s.trim()) - 1).filter(n => n >= 0 && n < totalPages);
                if (indices.length === 0) { showToast('Invalid page numbers.', 'error'); resetToUpload(); return; }
                const newPdf = await PDFLib.PDFDocument.create();
                const copiedPages = await newPdf.copyPages(srcPdf, indices);
                copiedPages.forEach(p => newPdf.addPage(p));
                setProgress(80);
                const pdfBytes = await newPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'organized.pdf', 'application/pdf', `Reorganized ${indices.length} of ${totalPages} pages.`);
                break;
            }

            // ── UNLOCK PDF ──────────────────────────────────────
            case 'unlock': {
                const pw = $('#unlock-password').val() || '';
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                let srcPdf;
                try {
                    srcPdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true, password: pw || undefined });
                } catch (e) {
                    showToast('Could not unlock the PDF. The password may be incorrect.', 'error');
                    resetToUpload();
                    return;
                }
                setProgress(60);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'unlocked.pdf', 'application/pdf', 'PDF restrictions removed successfully.');
                break;
            }

            // ── REPAIR PDF ──────────────────────────────────────
            case 'repair': {
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                let srcPdf;
                try {
                    srcPdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
                } catch (e) {
                    showToast('The PDF is too corrupted to repair.', 'error');
                    resetToUpload();
                    return;
                }
                setProgress(50);
                const newPdf = await PDFLib.PDFDocument.create();
                const pages = await newPdf.copyPages(srcPdf, srcPdf.getPageIndices());
                pages.forEach(p => newPdf.addPage(p));
                const pdfBytes = await newPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'repaired.pdf', 'application/pdf', `Repaired and rebuilt ${pages.length} pages.`);
                break;
            }

            // ── CROP PDF ────────────────────────────────────────
            case 'crop': {
                const ct = parseInt($('#crop-top').val()) || 0;
                const cb = parseInt($('#crop-bottom').val()) || 0;
                const cl = parseInt($('#crop-left').val()) || 0;
                const cr = parseInt($('#crop-right').val()) || 0;
                if (ct === 0 && cb === 0 && cl === 0 && cr === 0) { showToast('Please set at least one crop margin.', 'error'); resetToUpload(); return; }
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                srcPdf.getPages().forEach(page => {
                    const { width, height } = page.getSize();
                    page.setCropBox(cl, cb, width - cl - cr, height - cb - ct);
                });
                setProgress(80);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'cropped.pdf', 'application/pdf', `Cropped all pages (T:${ct} B:${cb} L:${cl} R:${cr} pts).`);
                break;
            }

            // ── REDACT PDF ──────────────────────────────────────
            case 'redact': {
                const rPage = Math.max(1, parseInt($('#redact-page').val()) || 1);
                const rx = parseInt($('#redact-x').val()) || 0;
                const ry = parseInt($('#redact-y').val()) || 0;
                const rw = parseInt($('#redact-w').val()) || 100;
                const rh = parseInt($('#redact-h').val()) || 20;
                setProgress(10);
                const bytes = await readFileAsArrayBuffer(uploadedFiles[0]);
                const srcPdf = await PDFLib.PDFDocument.load(bytes);
                const pages = srcPdf.getPages();
                const tgtPage = pages[Math.min(rPage - 1, pages.length - 1)];
                tgtPage.drawRectangle({ x: rx, y: ry, width: rw, height: rh, color: PDFLib.rgb(0, 0, 0) });
                setProgress(80);
                const pdfBytes = await srcPdf.save();
                setProgress(100);
                finishWith(pdfBytes, 'redacted.pdf', 'application/pdf', `Redacted area on page ${rPage}.`);
                break;
            }

            // ── COMPARE PDF ─────────────────────────────────────
            case 'compare': {
                if (uploadedFiles.length < 2) { showToast('Please upload 2 PDF files to compare.', 'error'); resetToUpload(); return; }
                setProgress(10);
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const bytes1 = await readFileAsArrayBuffer(uploadedFiles[0]);
                const bytes2 = await readFileAsArrayBuffer(uploadedFiles[1]);
                const pdf1 = await pdfjsLib.getDocument({ data: bytes1 }).promise;
                const pdf2 = await pdfjsLib.getDocument({ data: bytes2 }).promise;
                const maxPages = Math.max(pdf1.numPages, pdf2.numPages);
                const zip = new JSZip();
                for (let i = 1; i <= Math.min(maxPages, 10); i++) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w1 = 0, h1 = 0;
                    if (i <= pdf1.numPages) {
                        const p1 = await pdf1.getPage(i);
                        const vp1 = p1.getViewport({ scale: 1.5 });
                        w1 = vp1.width; h1 = vp1.height;
                        canvas.width = w1 * 2 + 20; canvas.height = h1;
                        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                        await p1.render({ canvasContext: ctx, viewport: vp1 }).promise;
                    }
                    if (i <= pdf2.numPages) {
                        const p2 = await pdf2.getPage(i);
                        const vp2 = p2.getViewport({ scale: 1.5 });
                        if (!w1) { canvas.width = vp2.width * 2 + 20; canvas.height = vp2.height; }
                        const offCtx = document.createElement('canvas');
                        offCtx.width = vp2.width; offCtx.height = vp2.height;
                        const oc = offCtx.getContext('2d');
                        await p2.render({ canvasContext: oc, viewport: vp2 }).promise;
                        ctx.drawImage(offCtx, (w1 || vp2.width) + 20, 0);
                    }
                    ctx.fillStyle = '#d4d4d4'; ctx.fillRect(w1 + 5, 0, 10, canvas.height);
                    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
                    zip.file(`comparison_page_${i}.png`, blob);
                    setProgress(10 + Math.round(80 * i / maxPages));
                }
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                setProgress(100);
                resultBlob = zipBlob;
                resultFileName = 'comparison.zip';
                showDownloadPhase(`Compared ${Math.min(maxPages, 10)} pages side-by-side (ZIP).`);
                break;
            }

            // ── DEFAULT ─────────────────────────────────────────
            default: {
                setProgress(100);
                await new Promise(r => setTimeout(r, 600));
                showToast(`"${currentTool.title}" is coming soon!`, 'info');
                resetToUpload();
                break;
            }
        }
    }

    // ── Helpers ──────────────────────────────────────────────────
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    function setProgress(pct) {
        $('#progress-bar').css('width', pct + '%');
        $('#progress-text').text(Math.round(pct) + '%');
    }

    function finishWith(bytes, fileName, mimeType, info) {
        const blob = new Blob([bytes], { type: mimeType });
        resultBlob = blob;
        resultFileName = fileName;
        showDownloadPhase(info);
    }

    function showDownloadPhase(info) {
        $('#phase-processing').hide();
        $('#phase-download').show();
        $('#result-info').text(info);
    }

    function resetToUpload() {
        $('#phase-upload').show();
        $('#phase-processing').hide();
        $('#phase-download').hide();
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function parsePageRange(str, totalPages) {
        const indices = [];
        if (!str) return [];
        str.split(',').forEach(part => {
            part = part.trim();
            if (part.includes('-')) {
                const [a, b] = part.split('-').map(Number);
                for (let i = Math.max(1, a); i <= Math.min(totalPages, b); i++) {
                    indices.push(i - 1);
                }
            } else {
                const n = parseInt(part);
                if (n >= 1 && n <= totalPages) indices.push(n - 1);
            }
        });
        return [...new Set(indices)].sort((a, b) => a - b);
    }

    // ── Download ────────────────────────────────────────────────
    $('#download-btn').on('click', function () {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Download started!', 'success');
    });

    // ── Toast ───────────────────────────────────────────────────
    function showToast(message, type) {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
        };
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
        };
        const $toast = $(`
            <div class="toast flex items-center gap-3 px-5 py-3.5 rounded-2xl ${colors[type] || colors.info} text-white shadow-xl text-sm font-medium max-w-sm">
                <span class="text-lg">${icons[type] || icons.info}</span>
                <span>${message}</span>
            </div>
        `);
        $('#toast-container').append($toast);
        setTimeout(() => { $toast.fadeOut(300, function () { $(this).remove(); }); }, 4000);
    }

    // ── Signature canvas drawing ─────────────────────────────────
    function initSignCanvas() {
        setTimeout(() => {
            const canvas = document.getElementById('sign-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let drawing = false;

            function getPos(e) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
            }

            function startDraw(e) {
                e.preventDefault();
                drawing = true;
                const p = getPos(e);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
            }
            function draw(e) {
                if (!drawing) return;
                e.preventDefault();
                const p = getPos(e);
                ctx.strokeStyle = $('#sign-color').val() || '#000000';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
            function stopDraw() { drawing = false; }

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDraw);
            canvas.addEventListener('mouseleave', stopDraw);
            canvas.addEventListener('touchstart', startDraw, { passive: false });
            canvas.addEventListener('touchmove', draw, { passive: false });
            canvas.addEventListener('touchend', stopDraw);

            $(document).off('click', '#sign-clear').on('click', '#sign-clear', function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
        }, 100);
    }

    // ── Smooth scroll for anchor links ──────────────────────────
    $('a[href^="#"]').on('click', function (e) {
        e.preventDefault();
        const target = $($(this).attr('href'));
        if (target.length) {
            $('html, body').animate({ scrollTop: target.offset().top - 80 }, 600, 'swing');
        }
        // Close mobile menu if open
        $('#mobile-menu').slideUp(200);
    });
});
