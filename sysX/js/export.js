/**
 * SysX — Export Module
 * Handles exporting the built UI to clean HTML, saving/loading projects.
 */

const SysXExport = {
    init: function () {
        this.setupEventListeners();
    },

    setupEventListeners: function () {
        const self = this;

        $('#btn-export-html').on('click', function () {
            self.exportAsHTML();
        });

        $('#btn-save-project').on('click', function () {
            self.saveProject();
        });

        $('#btn-load-project').on('click', function () {
            self.loadProject();
        });

        $('#btn-new-project').on('click', function () {
            if (confirm('Create a new project? Unsaved changes will be lost.')) {
                self.newProject();
            }
        });
    },

    exportAsHTML: function () {
        const canvasContent = document.getElementById('canvas-drop-zone');
        if (!canvasContent) return;

        // Clone the canvas content
        const clone = canvasContent.cloneNode(true);

        // ---- STEP 1: Remove all builder-only visual elements ----
        $(clone).find('.component-label, .resize-handle, .alignment-guide').remove();

        // ---- STEP 2: Clean dropped-component wrappers ----
        $(clone).find('.dropped-component').each(function () {
            const el = this;
            // Remove all builder classes
            $(el).removeClass('dropped-component selected locked');
            // Remove builder data attributes
            $(el).removeAttr('data-component-type');
            $(el).removeAttr('data-custom-id');
            $(el).removeAttr('data-onclick-action');
            $(el).removeAttr('data-onhover-action');
            // Remove builder-generated IDs (comp-1, comp-2, etc.)
            const id = $(el).attr('id');
            if (id && id.startsWith('comp-')) {
                $(el).removeAttr('id');
            }
            // Clean up empty class attribute
            if ($(el).attr('class') !== undefined && $(el).attr('class').trim() === '') {
                $(el).removeAttr('class');
            }
        });

        // ---- STEP 3: Unwrap component-content divs (internal builder wrappers) ----
        // For container components, the .component-content div is just a wrapper;
        // in exported HTML we keep it as a plain div but remove the class
        $(clone).find('.component-content').each(function () {
            $(this).removeClass('component-content');
            if ($(this).attr('class') !== undefined && $(this).attr('class').trim() === '') {
                $(this).removeAttr('class');
            }
        });

        // ---- STEP 4: Remove event.preventDefault() from links ----
        $(clone).find('a[onclick]').each(function () {
            const onclick = $(this).attr('onclick');
            if (onclick && onclick.includes('event.preventDefault()')) {
                $(this).removeAttr('onclick');
            }
        });

        // ---- STEP 5: Clean empty attributes ----
        $(clone).find('*').each(function () {
            // Remove empty style attributes
            if ($(this).attr('style') !== undefined && $(this).attr('style').trim() === '') {
                $(this).removeAttr('style');
            }
            // Remove empty class attributes
            if ($(this).attr('class') !== undefined && $(this).attr('class').trim() === '') {
                $(this).removeAttr('class');
            }
        });

        // Get clean body content
        let bodyContent = clone.innerHTML;

        // ---- STEP 6: Clean up whitespace / formatting ----
        // Remove excessive blank lines
        bodyContent = bodyContent.replace(/\n\s*\n\s*\n/g, '\n\n');
        // Trim leading/trailing whitespace per line
        bodyContent = bodyContent.split('\n').map(line => {
            const trimmed = line.trimEnd();
            return trimmed;
        }).filter((line, i, arr) => {
            // Remove consecutive empty lines
            if (line.trim() === '' && i > 0 && arr[i - 1].trim() === '') return false;
            return true;
        }).join('\n');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const projectName = SysXApp.projectName || 'SysX Project';

        // Get the canvas width for the page container
        const canvasWidth = document.getElementById('canvas').style.width || '1440px';

        const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(projectName)}</title>
    <meta name="description" content="Built with SysX Low-Code Builder">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        /* === Reset & Base === */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        html {
            scroll-behavior: smooth;
            -webkit-text-size-adjust: 100%;
        }
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            line-height: 1.5;
            color: #111827;
            background-color: #ffffff;
        }
        img, video {
            max-width: 100%;
            height: auto;
            display: block;
        }
        a {
            color: inherit;
            text-decoration: none;
        }
        a:hover {
            opacity: 0.85;
        }
        button, input, select, textarea {
            font-family: inherit;
            font-size: inherit;
        }
        button {
            cursor: pointer;
            border: none;
            background: none;
        }
        ul, ol {
            list-style-position: inside;
        }
        hr {
            border: none;
            border-top: 1px solid #e5e7eb;
        }

        /* === Page Container === */
        .page-container {
            max-width: ${canvasWidth};
            margin: 0 auto;
            background: #ffffff;
            min-height: 100vh;
            overflow: hidden;
        }

        /* === Responsive === */
        @media (max-width: 768px) {
            .page-container {
                max-width: 100%;
            }
            [style*="display: flex"], [style*="display:flex"] {
                flex-wrap: wrap;
            }
        }

        /* === Animations === */
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* === Utility === */
        .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <div class="page-container">
${bodyContent}
    </div>
</body>
</html>`;

        // Create and download file
        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        SysXApp.showToast('HTML exported successfully!', 'success');
    },

    escapeHtml: function (str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    saveProject: function () {
        const projectData = {
            version: '1.0',
            name: SysXApp.projectName,
            pages: SysXApp.pages,
            currentPage: SysXApp.currentPage,
            canvasHTML: {},
            flowchart: SysXFlowchart.exportFlowData(),
            timestamp: new Date().toISOString(),
            nextComponentId: SysXDragDrop.nextComponentId
        };

        // Save canvas HTML for each page
        SysXApp.pages.forEach(page => {
            if (page.id === SysXApp.currentPage) {
                projectData.canvasHTML[page.id] = document.getElementById('canvas-drop-zone').innerHTML;
            } else {
                projectData.canvasHTML[page.id] = page.canvasHTML || '';
            }
        });

        // Save to localStorage
        const key = 'sysx-project-' + (SysXApp.projectName || 'default');
        try {
            localStorage.setItem(key, JSON.stringify(projectData));

            // Also save project list
            let projectList = JSON.parse(localStorage.getItem('sysx-projects') || '[]');
            if (!projectList.includes(key)) {
                projectList.push(key);
                localStorage.setItem('sysx-projects', JSON.stringify(projectList));
            }

            SysXApp.showToast(`Project "${SysXApp.projectName}" saved!`, 'success');
        } catch (e) {
            SysXApp.showToast('Error saving project: ' + e.message, 'error');
        }

        // Also offer download as JSON
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(SysXApp.projectName || 'project').toLowerCase().replace(/\s+/g, '-')}.sysx.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    loadProject: function () {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const data = JSON.parse(ev.target.result);
                    SysXExport.applyProjectData(data);
                    SysXApp.showToast(`Project "${data.name}" loaded!`, 'success');
                } catch (err) {
                    SysXApp.showToast('Error loading project: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    applyProjectData: function (data) {
        if (!data) return;

        SysXApp.projectName = data.name || 'Untitled';
        SysXApp.pages = data.pages || [{ id: 'page-1', name: 'Home' }];
        SysXApp.currentPage = data.currentPage || 'page-1';

        if (data.nextComponentId) {
            SysXDragDrop.nextComponentId = data.nextComponentId;
        }

        // Restore canvas
        if (data.canvasHTML && data.canvasHTML[SysXApp.currentPage]) {
            document.getElementById('canvas-drop-zone').innerHTML = data.canvasHTML[SysXApp.currentPage];
        }

        // Store page HTML
        SysXApp.pages.forEach(page => {
            if (data.canvasHTML && data.canvasHTML[page.id]) {
                page.canvasHTML = data.canvasHTML[page.id];
            }
        });

        // Restore flowchart
        if (data.flowchart) {
            SysXFlowchart.importFlowData(data.flowchart);
        }

        SysXApp.renderPageTabs();
        SysXDragDrop.updateLayerTree();
    },

    newProject: function () {
        SysXApp.projectName = 'Untitled';
        SysXApp.pages = [{ id: 'page-1', name: 'Home' }];
        SysXApp.currentPage = 'page-1';
        document.getElementById('canvas-drop-zone').innerHTML = '';
        SysXFlowchart.clearAll();
        SysXProperties.deselect();
        SysXDragDrop.nextComponentId = 1;
        SysXApp.renderPageTabs();
        SysXDragDrop.updateLayerTree();
        SysXApp.showToast('New project created', 'info');
    },

    // Auto-save to localStorage
    autoSave: function () {
        try {
            const quickSave = {
                name: SysXApp.projectName,
                pages: SysXApp.pages,
                currentPage: SysXApp.currentPage,
                canvasHTML: {},
                nextComponentId: SysXDragDrop.nextComponentId
            };

            SysXApp.pages.forEach(page => {
                if (page.id === SysXApp.currentPage) {
                    quickSave.canvasHTML[page.id] = document.getElementById('canvas-drop-zone').innerHTML;
                } else {
                    quickSave.canvasHTML[page.id] = page.canvasHTML || '';
                }
            });

            localStorage.setItem('sysx-autosave', JSON.stringify(quickSave));
        } catch (e) {
            // Silently fail for auto-save
        }
    },

    loadAutoSave: function () {
        try {
            const data = localStorage.getItem('sysx-autosave');
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.canvasHTML && Object.keys(parsed.canvasHTML).length > 0) {
                    const hasContent = Object.values(parsed.canvasHTML).some(html => html && html.trim().length > 0);
                    if (hasContent) {
                        this.applyProjectData(parsed);
                        return true;
                    }
                }
            }
        } catch (e) {
            // Ignore
        }
        return false;
    }
};
