/**
 * SysX — Main Application Controller
 * Initializes all modules, handles global state, pages, preview, and canvas controls.
 */

const SysXApp = {
    projectName: 'Untitled',
    pages: [{ id: 'page-1', name: 'Home', canvasHTML: '' }],
    currentPage: 'page-1',
    nextPageId: 2,
    zoomLevel: 100,
    showGrid: true,
    showGuides: true,
    undoStack: [],
    redoStack: [],

    init: function () {
        console.log('🚀 SysX — Low-Code UI/UX Builder initializing...');

        // Initialize modules
        SysXDragDrop.init();
        SysXProperties.init();
        SysXFlowchart.init();
        SysXExport.init();
        SysXInteractivity.init();

        // Setup UI
        this.renderPageTabs();
        this.setupCanvasControls();
        this.setupPreview();
        this.setupWireframeGallery();
        this.setupCategoryToggles();
        this.setupComponentSearch();
        this.setupLayersPanel();

        // Initialize icons
        lucide.createIcons();

        // Load autosave if exists
        SysXExport.loadAutoSave();

        // Auto-save interval
        setInterval(function () {
            SysXExport.autoSave();
        }, 30000); // Every 30 seconds

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Remove splash screen
        setTimeout(function () {
            $('#splash-screen').css({
                opacity: 0,
                pointerEvents: 'none'
            });
            setTimeout(function () {
                $('#splash-screen').remove();
            }, 600);
        }, 2200);

        console.log('✅ SysX initialized successfully');
    },

    // ================================
    // PAGE MANAGEMENT
    // ================================
    renderPageTabs: function () {
        const $tabs = $('#page-tabs');
        $tabs.empty();

        this.pages.forEach(page => {
            const isActive = page.id === this.currentPage;
            const $tab = $(`
                <button class="page-tab ${isActive ? 'active' : ''}" data-page-id="${page.id}">
                    <span class="tab-name">${page.name}</span>
                    ${this.pages.length > 1 ? '<span class="tab-close">✕</span>' : ''}
                </button>
            `);

            $tab.on('click', (e) => {
                if (!$(e.target).hasClass('tab-close')) {
                    this.switchPage(page.id);
                }
            });

            $tab.find('.tab-close').on('click', (e) => {
                e.stopPropagation();
                this.deletePage(page.id);
            });

            // Double click to rename
            $tab.on('dblclick', () => {
                const newName = prompt('Rename page:', page.name);
                if (newName && newName.trim()) {
                    page.name = newName.trim();
                    this.renderPageTabs();
                }
            });

            $tabs.append($tab);
        });

        // Add page button
        $('#btn-add-page').off('click').on('click', () => {
            this.addPage();
        });

        lucide.createIcons();
    },

    addPage: function () {
        const id = 'page-' + this.nextPageId++;
        const name = 'Page ' + (this.pages.length + 1);
        this.pages.push({ id: id, name: name, canvasHTML: '' });
        this.switchPage(id);
        this.showToast(`Page "${name}" created`, 'success');
    },

    switchPage: function (pageId) {
        // Save current page content
        const currentPageData = this.pages.find(p => p.id === this.currentPage);
        if (currentPageData) {
            currentPageData.canvasHTML = document.getElementById('canvas-drop-zone').innerHTML;
        }

        // Switch
        this.currentPage = pageId;
        const newPage = this.pages.find(p => p.id === pageId);
        if (newPage) {
            document.getElementById('canvas-drop-zone').innerHTML = newPage.canvasHTML || '';
        }

        SysXProperties.deselect();
        SysXDragDrop.updateLayerTree();
        this.renderPageTabs();
    },

    deletePage: function (pageId) {
        if (this.pages.length <= 1) {
            this.showToast('Cannot delete the last page', 'warning');
            return;
        }
        if (!confirm('Delete this page?')) return;

        this.pages = this.pages.filter(p => p.id !== pageId);
        if (this.currentPage === pageId) {
            this.switchPage(this.pages[0].id);
        }
        this.renderPageTabs();
        this.showToast('Page deleted', 'info');
    },

    // ================================
    // CANVAS CONTROLS
    // ================================
    setupCanvasControls: function () {
        const self = this;

        // Device selector
        $('#canvas-device').on('change', function () {
            const device = $(this).val();
            const widths = {
                desktop: 1440,
                laptop: 1024,
                tablet: 768,
                mobile: 375
            };
            const w = widths[device] || 1440;
            $('#canvas').css('width', w + 'px');
        });

        // Zoom controls
        $('#btn-zoom-in').on('click', function () {
            self.setZoom(self.zoomLevel + 10);
        });
        $('#btn-zoom-out').on('click', function () {
            self.setZoom(self.zoomLevel - 10);
        });
        $('#btn-zoom-fit').on('click', function () {
            self.setZoom(100);
        });

        // Grid toggle
        $('#btn-toggle-grid').on('click', function () {
            self.showGrid = !self.showGrid;
            $(this).toggleClass('active', self.showGrid);
            $('#canvas-wrapper').toggleClass('no-grid', !self.showGrid);
        });

        // Guides toggle
        $('#btn-toggle-guides').on('click', function () {
            self.showGuides = !self.showGuides;
            $(this).toggleClass('active', self.showGuides);
        });
    },

    setZoom: function (level) {
        level = Math.max(25, Math.min(200, level));
        this.zoomLevel = level;
        $('#zoom-level').text(level + '%');
        $('#canvas').css('transform', `scale(${level / 100})`);
        $('#canvas').css('transformOrigin', 'top center');
    },

    // ================================
    // PREVIEW MODE
    // ================================
    setupPreview: function () {
        const self = this;

        $('#btn-preview').on('click', function () {
            self.openPreview();
        });
        $('#btn-close-preview').on('click', function () {
            self.closePreview();
        });

        $('#preview-device').on('change', function () {
            const device = $(this).val();
            const $frame = $('#preview-frame');
            $frame.removeClass('device-desktop device-tablet device-mobile');
            $frame.addClass('device-' + device);
        });
    },

    openPreview: function () {
        const canvasContent = document.getElementById('canvas-drop-zone');
        if (!canvasContent) return;

        // Clone and clean
        const clone = canvasContent.cloneNode(true);
        $(clone).find('.component-label, .resize-handle').remove();
        $(clone).find('.dropped-component').each(function () {
            $(this).removeClass('dropped-component selected');
        });

        const $frame = $('#preview-frame');
        $frame.addClass('device-desktop');

        // Build preview with inline styles
        $frame.html(`
            <div style="font-family:'Inter',system-ui,sans-serif;min-height:100vh;">
                ${clone.innerHTML}
            </div>
        `);

        // Set width
        const device = $('#preview-device').val();
        $frame.removeClass('device-desktop device-tablet device-mobile').addClass('device-' + device);

        $('#preview-modal').removeClass('hidden');
    },

    closePreview: function () {
        $('#preview-modal').addClass('hidden');
        $('#preview-frame').empty();
    },

    // ================================
    // WIREFRAME GALLERY
    // ================================
    setupWireframeGallery: function () {
        const self = this;

        $('#btn-wireframes').on('click', function () {
            self.openWireframeGallery();
        });
        $('#btn-close-wireframes, #wireframe-overlay').on('click', function () {
            $('#wireframe-modal').addClass('hidden');
        });

        // Category filtering
        $(document).on('click', '.wireframe-category-btn', function () {
            $('.wireframe-category-btn').removeClass('active');
            $(this).addClass('active');
            const cat = $(this).data('wf-cat');
            self.renderWireframes(cat);
        });
    },

    openWireframeGallery: function () {
        $('#wireframe-modal').removeClass('hidden');
        this.renderWireframes('all');
    },

    renderWireframes: function (category) {
        const $grid = $('#wireframe-grid');
        $grid.empty();

        const filtered = category === 'all'
            ? SysXWireframes
            : SysXWireframes.filter(w => w.category === category);

        if (filtered.length === 0) {
            $grid.html('<div class="col-span-3 text-center text-sysx-400 py-16"><p class="text-lg mb-2">No wireframes in this category yet</p><p class="text-sm">More templates coming soon!</p></div>');
            return;
        }

        filtered.forEach(wf => {
            const tags = wf.tags.map(t => `<span class="wf-tag">${t}</span>`).join('');

            // Create mini preview
            const previewHtml = this.createWireframePreview(wf);

            const $card = $(`
                <div class="wireframe-card" data-wf-id="${wf.id}">
                    <div class="wireframe-preview">
                        ${previewHtml}
                    </div>
                    <div class="wireframe-info">
                        <h4>${wf.name}</h4>
                        <p>${wf.description}</p>
                        <div class="wf-tags">${tags}</div>
                    </div>
                </div>
            `);

            $card.on('click', () => {
                if (confirm(`Load wireframe "${wf.name}"? This will replace the current canvas.`)) {
                    SysXDragDrop.loadWireframe(wf);
                    $('#wireframe-modal').addClass('hidden');
                }
            });

            $grid.append($card);
        });
    },

    createWireframePreview: function (wf) {
        // Create a simple visual preview using colored blocks
        const colors = {
            navbar: '#2563eb',
            section: '#f3f4f6',
            container: '#e5e7eb',
            row: '#dbeafe',
            card: '#ffffff',
            heading: '#374151',
            paragraph: '#9ca3af',
            button: '#6366f1',
            input: '#f9fafb',
            image: '#e2e8f0',
            'sidebar-nav': '#f9fafb'
        };

        let preview = '<div style="width:100%;height:100%;padding:8px;display:flex;flex-direction:column;gap:4px;overflow:hidden;">';

        const renderMini = (components, depth) => {
            components.forEach(comp => {
                const bg = colors[comp.type] || '#f3f4f6';
                const isRow = comp.type === 'row';
                const h = comp.type === 'heading' ? '8px' : comp.type === 'paragraph' ? '6px' : comp.type === 'button' ? '12px' : 'auto';

                preview += `<div style="background:${bg};border-radius:3px;padding:${depth > 0 ? '3px' : '4px'};${h !== 'auto' ? 'height:' + h + ';' : ''}${isRow ? 'display:flex;gap:3px;' : ''}min-height:8px;border:1px solid rgba(0,0,0,0.05);">`;

                if (comp.children && depth < 3) {
                    renderMini(comp.children, depth + 1);
                }

                preview += '</div>';
            });
        };

        renderMini(wf.components, 0);
        preview += '</div>';
        return preview;
    },

    // ================================
    // UI HELPERS
    // ================================
    setupCategoryToggles: function () {
        $(document).on('click', '.category-header', function () {
            $(this).closest('.component-category').toggleClass('collapsed');
        });
    },

    setupComponentSearch: function () {
        $('#component-search').on('input', function () {
            const query = $(this).val().toLowerCase();
            if (!query) {
                $('.draggable-component').show();
                $('.component-category').show();
                return;
            }

            $('.draggable-component').each(function () {
                const name = $(this).find('span').text().toLowerCase();
                const matches = name.includes(query);
                $(this).toggle(matches);
            });

            // Hide empty categories
            $('.component-category').each(function () {
                const visibleItems = $(this).find('.draggable-component:visible').length;
                $(this).toggle(visibleItems > 0);
            });
        });
    },

    setupLayersPanel: function () {
        $('#btn-toggle-layers').on('click', function () {
            $('#layers-panel').toggleClass('hidden');
            SysXDragDrop.updateLayerTree();
        });
    },

    setupKeyboardShortcuts: function () {
        const self = this;
        $(document).on('keydown', function (e) {
            // Ctrl+S Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                SysXExport.saveProject();
            }
            // Ctrl+Z Undo
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                self.undo();
            }
            // Ctrl+Y / Ctrl+Shift+Z Redo
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
                e.preventDefault();
                self.redo();
            }
            // Escape: close modals
            if (e.key === 'Escape') {
                $('#flowchart-modal').addClass('hidden');
                $('#wireframe-modal').addClass('hidden');
                $('#preview-modal').addClass('hidden');
                $('#context-menu').addClass('hidden');
            }
        });

        // Undo/Redo buttons
        $('#btn-undo').on('click', function () { self.undo(); });
        $('#btn-redo').on('click', function () { self.redo(); });
    },

    // ================================
    // UNDO / REDO
    // ================================
    saveState: function () {
        const html = document.getElementById('canvas-drop-zone').innerHTML;
        this.undoStack.push(html);
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = [];
    },

    undo: function () {
        if (this.undoStack.length === 0) {
            this.showToast('Nothing to undo', 'warning');
            return;
        }
        const current = document.getElementById('canvas-drop-zone').innerHTML;
        this.redoStack.push(current);
        const prev = this.undoStack.pop();
        document.getElementById('canvas-drop-zone').innerHTML = prev;
        SysXProperties.deselect();
        SysXDragDrop.updateLayerTree();
    },

    redo: function () {
        if (this.redoStack.length === 0) {
            this.showToast('Nothing to redo', 'warning');
            return;
        }
        const current = document.getElementById('canvas-drop-zone').innerHTML;
        this.undoStack.push(current);
        const next = this.redoStack.pop();
        document.getElementById('canvas-drop-zone').innerHTML = next;
        SysXProperties.deselect();
        SysXDragDrop.updateLayerTree();
    },

    // ================================
    // TOAST NOTIFICATIONS
    // ================================
    showToast: function (message, type) {
        type = type || 'info';
        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        const icon = icons[type] || 'ℹ️';

        const $toast = $(`
            <div class="toast ${type}">
                <span>${icon}</span>
                <span>${message}</span>
            </div>
        `);

        $('#toast-container').append($toast);

        setTimeout(function () {
            $toast.css('animation', 'toastOut 0.3s ease-in forwards');
            setTimeout(function () {
                $toast.remove();
            }, 300);
        }, 3000);
    }
};

// ================================
// BOOT
// ================================
$(document).ready(function () {
    SysXApp.init();
});
