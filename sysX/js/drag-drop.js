/**
 * SysX — Drag & Drop Engine
 * Handles dragging components from palette to canvas and rearranging on canvas.
 */

const SysXDragDrop = {
    isDragging: false,
    dragType: null,
    dragGhost: null,
    dropPlaceholder: null,
    nextComponentId: 1,

    init: function () {
        this.setupPaletteDrag();
        this.setupCanvasInteractions();
        this.setupSortable();
    },

    setupPaletteDrag: function () {
        const self = this;

        $(document).on('mousedown', '.draggable-component', function (e) {
            e.preventDefault();
            const compType = $(this).data('component');
            const compName = $(this).find('span').text();

            self.isDragging = true;
            self.dragType = compType;

            // Create ghost
            self.dragGhost = $('<div class="drag-ghost"></div>').text(compName);
            $('body').append(self.dragGhost);
            self.dragGhost.css({ left: e.clientX + 12, top: e.clientY + 12 });

            // Add drop zone highlight
            $('#canvas-drop-zone').addClass('drag-over');
            // Also highlight container children
            $('.dropped-component .component-content').each(function () {
                $(this).css('outline', '1px dashed rgba(99,102,241,0.2)');
            });

            $(document).on('mousemove.drag', function (ev) {
                if (self.dragGhost) {
                    self.dragGhost.css({ left: ev.clientX + 12, top: ev.clientY + 12 });
                }
            });

            $(document).one('mouseup.drag', function (ev) {
                $(document).off('mousemove.drag');
                if (self.dragGhost) self.dragGhost.remove();
                self.dragGhost = null;
                $('#canvas-drop-zone').removeClass('drag-over');
                $('.dropped-component .component-content').css('outline', '');

                // Find drop target
                const dropTarget = self.findDropTarget(ev.clientX, ev.clientY);
                if (dropTarget) {
                    self.createComponent(compType, dropTarget);
                }

                self.isDragging = false;
                self.dragType = null;
            });
        });
    },

    findDropTarget: function (clientX, clientY) {
        // Hide ghost temporarily for elementFromPoint
        const elements = document.elementsFromPoint(clientX, clientY);

        for (let el of elements) {
            // Check if it's a component-content (container child zone)
            if ($(el).hasClass('component-content')) {
                return el;
            }
            // Check if it's the main canvas drop zone
            if (el.id === 'canvas-drop-zone') {
                return el;
            }
        }
        return null;
    },

    createComponent: function (type, dropTarget, props, customStyles) {
        const compDef = SysXComponents[type];
        if (!compDef) {
            console.warn('Unknown component type:', type);
            return null;
        }

        const id = 'comp-' + this.nextComponentId++;
        const componentProps = props || {};

        // Set defaults from contentFields
        if (compDef.contentFields) {
            compDef.contentFields.forEach(field => {
                if (componentProps[field.key] === undefined) {
                    componentProps[field.key] = field.default || '';
                }
            });
        }

        const innerHTML = compDef.render(componentProps);

        // Build component wrapper
        const $comp = $(`
            <div id="${id}" class="dropped-component" data-component-type="${type}">
                <span class="component-label">${compDef.name}</span>
                ${innerHTML}
                <div class="resize-handle nw"></div>
                <div class="resize-handle ne"></div>
                <div class="resize-handle sw"></div>
                <div class="resize-handle se"></div>
                <div class="resize-handle n"></div>
                <div class="resize-handle s"></div>
                <div class="resize-handle e"></div>
                <div class="resize-handle w"></div>
            </div>
        `);

        // Apply default styles
        if (compDef.defaultStyles) {
            Object.entries(compDef.defaultStyles).forEach(([prop, val]) => {
                $comp.css(prop, val);
            });
        }

        // Apply custom overrides
        if (customStyles) {
            Object.entries(customStyles).forEach(([prop, val]) => {
                $comp.css(prop, val);
            });
        }

        // Store props
        $comp.data('component-props', componentProps);

        // Add to drop target
        $(dropTarget).append($comp);

        // Make container children droppable
        if (compDef.isContainer) {
            this.makeContainerDroppable($comp);
        }

        this.updateLayerTree();

        return $comp;
    },

    makeContainerDroppable: function ($comp) {
        const content = $comp.find('.component-content').first();
        if (content.length) {
            content.on('dragover', function (e) {
                e.preventDefault();
                $(this).css('outline', '2px dashed #6366f1');
            });
            content.on('dragleave', function () {
                $(this).css('outline', '');
            });
        }
    },

    setupCanvasInteractions: function () {
        const self = this;

        // Click to select
        $(document).on('click', '.dropped-component', function (e) {
            e.stopPropagation();
            SysXProperties.select(this);
        });

        // Click on canvas to deselect
        $('#canvas-drop-zone').on('click', function (e) {
            if (e.target === this) {
                SysXProperties.deselect();
            }
        });

        // Context menu
        $(document).on('contextmenu', '.dropped-component', function (e) {
            e.preventDefault();
            e.stopPropagation();
            SysXProperties.select(this);
            self.showContextMenu(e.clientX, e.clientY, this);
        });

        // Hide context menu
        $(document).on('click', function () {
            $('#context-menu').addClass('hidden');
        });

        // Context menu actions
        $(document).on('click', '.ctx-item', function () {
            const action = $(this).data('action');
            self.handleContextAction(action);
            $('#context-menu').addClass('hidden');
        });

        // Resize handles
        this.setupResizeHandles();

        // Drag to move on canvas
        this.setupCanvasMove();

        // Keyboard shortcuts
        $(document).on('keydown', function (e) {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (SysXProperties.selectedElement && !$(e.target).is('input, textarea, select')) {
                    $(SysXProperties.selectedElement).remove();
                    SysXProperties.deselect();
                    self.updateLayerTree();
                    SysXApp.showToast('Component deleted', 'info');
                }
            }
            // Ctrl+C Copy
            if (e.ctrlKey && e.key === 'c' && SysXProperties.selectedElement) {
                self.copiedElement = $(SysXProperties.selectedElement).clone(true);
                SysXApp.showToast('Component copied', 'info');
            }
            // Ctrl+V Paste
            if (e.ctrlKey && e.key === 'v' && self.copiedElement) {
                const newEl = self.copiedElement.clone(true);
                newEl.attr('id', 'comp-' + self.nextComponentId++);
                newEl.removeClass('selected');
                $('#canvas-drop-zone').append(newEl);
                self.updateLayerTree();
                SysXApp.showToast('Component pasted', 'success');
            }
        });
    },

    setupCanvasMove: function () {
        const self = this;

        $(document).on('mousedown', '.dropped-component', function (e) {
            if ($(e.target).hasClass('resize-handle')) return;
            if ($(e.target).is('input, textarea, select, button, a')) return;

            const $el = $(this);
            const startX = e.clientX;
            const startY = e.clientY;
            const origLeft = parseInt($el.css('left')) || 0;
            const origTop = parseInt($el.css('top')) || 0;
            let moved = false;

            $(document).on('mousemove.canvasmove', function (ev) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    moved = true;
                }
            });

            $(document).one('mouseup.canvasmove', function () {
                $(document).off('mousemove.canvasmove');
            });

            e.stopPropagation();
        });
    },

    setupResizeHandles: function () {
        $(document).on('mousedown', '.resize-handle', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const $handle = $(this);
            const $comp = $handle.closest('.dropped-component');
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = $comp.outerWidth();
            const startH = $comp.outerHeight();
            const dir = '';

            const isRight = $handle.hasClass('ne') || $handle.hasClass('se') || $handle.hasClass('e');
            const isBottom = $handle.hasClass('se') || $handle.hasClass('sw') || $handle.hasClass('s');
            const isLeft = $handle.hasClass('nw') || $handle.hasClass('sw') || $handle.hasClass('w');
            const isTop = $handle.hasClass('nw') || $handle.hasClass('ne') || $handle.hasClass('n');

            $(document).on('mousemove.resize', function (ev) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                if (isRight) $comp.css('width', Math.max(40, startW + dx) + 'px');
                if (isBottom) $comp.css('height', Math.max(20, startH + dy) + 'px');
                if (isLeft) $comp.css('width', Math.max(40, startW - dx) + 'px');
                if (isTop) $comp.css('height', Math.max(20, startH - dy) + 'px');
            });

            $(document).one('mouseup.resize', function () {
                $(document).off('mousemove.resize');
            });
        });
    },

    showContextMenu: function (x, y, element) {
        const $menu = $('#context-menu');
        $menu.css({ left: x, top: y }).removeClass('hidden');
        $menu.data('target-element', element);
    },

    handleContextAction: function (action) {
        const target = SysXProperties.selectedElement;
        if (!target) return;

        const $target = $(target);

        switch (action) {
            case 'duplicate':
                SysXApp.saveState();
                const $clone = $target.clone(true);
                const newId = 'comp-' + this.nextComponentId++;
                $clone.attr('id', newId);
                $clone.removeClass('selected');
                // If it has a custom ID, append "-copy"
                const customId = $clone.attr('data-custom-id');
                if (customId) $clone.attr('data-custom-id', customId + '-copy');

                $target.after($clone);
                this.updateLayerTree();
                SysXProperties.select($clone[0]);
                SysXApp.showToast('Component duplicated', 'success');
                break;

            case 'copy':
                this.copiedElement = $target.clone(true);
                SysXApp.showToast('Component copied to clipboard', 'info');
                break;

            case 'paste':
                if (this.copiedElement) {
                    SysXApp.saveState();
                    const $pasted = this.copiedElement.clone(true);
                    $pasted.attr('id', 'comp-' + this.nextComponentId++);
                    $pasted.removeClass('selected');
                    $('#canvas-drop-zone').append($pasted);
                    this.updateLayerTree();
                    SysXProperties.select($pasted[0]);
                    SysXApp.showToast('Component pasted', 'success');
                }
                break;

            case 'bring-front':
                SysXApp.saveState();
                $target.parent().append($target);
                SysXApp.showToast('Brought to front', 'info');
                break;

            case 'send-back':
                SysXApp.saveState();
                $target.parent().prepend($target);
                SysXApp.showToast('Sent to back', 'info');
                break;

            case 'move-up':
                SysXApp.saveState();
                $target.prev().before($target);
                SysXApp.showToast('Moved up', 'info');
                break;

            case 'move-down':
                SysXApp.saveState();
                $target.next().after($target);
                SysXApp.showToast('Moved down', 'info');
                break;

            case 'lock':
                $target.toggleClass('locked');
                const isLocked = $target.hasClass('locked');
                SysXApp.showToast(isLocked ? 'Component locked' : 'Component unlocked', 'info');
                break;

            case 'delete':
                SysXApp.saveState();
                $target.remove();
                SysXProperties.deselect();
                this.updateLayerTree();
                SysXApp.showToast('Component deleted', 'info');
                break;
        }

        this.updateLayerTree();
    },

    setupSortable: function () {
        // Simple sort by making drop zone accept reordering
        // Using jQuery UI sortable for the drop zone
        try {
            $('#canvas-drop-zone').sortable({
                items: '> .dropped-component',
                handle: '.component-label',
                placeholder: 'drop-placeholder',
                tolerance: 'pointer',
                cursor: 'grabbing',
                opacity: 0.8,
                update: function () {
                    SysXDragDrop.updateLayerTree();
                }
            });
        } catch (e) {
            // jQuery UI sortable might not be fully loaded
            console.log('Sortable initialization deferred');
        }
    },

    updateLayerTree: function () {
        const $tree = $('#layer-tree');
        $tree.empty();

        const buildTree = function ($parent, depth) {
            $parent.children('.dropped-component').each(function () {
                const $el = $(this);
                const type = $el.data('component-type');
                const compDef = SysXComponents[type];
                const name = compDef ? compDef.name : type;
                const id = $el.attr('id');
                const indent = Array(depth).fill('<span class="layer-indent"></span>').join('');
                const isSelected = $el.hasClass('selected');

                const item = $(`
                    <div class="layer-item ${isSelected ? 'active' : ''}" data-target-id="${id}">
                        ${indent}
                        <span class="layer-visibility">👁</span>
                        <span>${name}</span>
                    </div>
                `);

                item.on('click', function () {
                    const targetEl = document.getElementById($(this).data('target-id'));
                    if (targetEl) {
                        SysXProperties.select(targetEl);
                        SysXDragDrop.updateLayerTree();
                    }
                });

                $tree.append(item);

                // Recurse into containers
                const $content = $el.find('.component-content').first();
                if ($content.length) {
                    buildTree($content, depth + 1);
                }
            });
        };

        buildTree($('#canvas-drop-zone'), 0);
    },

    // Load wireframe template
    loadWireframe: function (wireframe) {
        // Clear canvas
        $('#canvas-drop-zone').empty();
        this.nextComponentId = 1;

        const self = this;
        const buildComponents = function (components, parentEl) {
            components.forEach(comp => {
                const $created = self.createComponent(comp.type, parentEl, comp.props || {}, comp.styles || {});
                if ($created && comp.children && comp.children.length > 0) {
                    const $content = $created.find('.component-content').first();
                    const dropTarget = $content.length ? $content[0] : $created[0];
                    buildComponents(comp.children, dropTarget);
                }
            });
        };

        buildComponents(wireframe.components, document.getElementById('canvas-drop-zone'));
        this.updateLayerTree();
        SysXApp.showToast(`Loaded: ${wireframe.name}`, 'success');
    },

    copiedElement: null
};
