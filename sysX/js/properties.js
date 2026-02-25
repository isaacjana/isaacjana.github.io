/**
 * SysX — Properties Panel Module
 * Handles the right sidebar properties editing for selected components.
 */

const SysXProperties = {
    selectedElement: null,
    selectedComponentData: null,

    init: function () {
        this.setupEventListeners();
    },

    setupEventListeners: function () {
        const self = this;

        // Section toggle
        $(document).on('click', '.prop-section-header', function () {
            $(this).closest('.prop-section').toggleClass('collapsed');
        });

        // Delete button
        $('#btn-delete-component').on('click', function () {
            if (self.selectedElement) {
                $(self.selectedElement).remove();
                self.deselect();
                SysXDragDrop.updateLayerTree();
                SysXApp.showToast('Component deleted', 'info');
            }
        });

        // Style property changes
        this.setupStyleListeners();

        // Content field changes
        $(document).on('input change', '#prop-content-fields .prop-input, #prop-content-fields .prop-select, #prop-content-fields .prop-textarea-field, #prop-content-fields .prop-color', function () {
            self.applyContentChanges();
        });

        // Component ID change
        $('#prop-component-id').on('change', function () {
            if (self.selectedElement) {
                const newId = $(this).val().trim();
                if (newId) {
                    $(self.selectedElement).attr('data-custom-id', newId);
                }
            }
        });
    },

    setupStyleListeners: function () {
        const self = this;

        // Size
        $('#prop-width, #prop-height').on('change', function () {
            if (!self.selectedElement) return;
            const prop = $(this).attr('id') === 'prop-width' ? 'width' : 'height';
            const val = $(this).val();
            if (val) $(self.selectedElement).css(prop, val);
            SysXApp.saveState(); // Added saveState
        });

        // Padding
        $('#prop-pt, #prop-pr, #prop-pb, #prop-pl').on('change', function () {
            if (!self.selectedElement) return;
            const sides = { 'prop-pt': 'paddingTop', 'prop-pr': 'paddingRight', 'prop-pb': 'paddingBottom', 'prop-pl': 'paddingLeft' };
            const prop = sides[$(this).attr('id')];
            const val = $(this).val();
            if (val) $(self.selectedElement).css(prop, val.includes('px') ? val : val + 'px');
            SysXApp.saveState(); // Added saveState
        });

        // Margin
        $('#prop-mt, #prop-mr, #prop-mb, #prop-ml').on('change', function () {
            if (!self.selectedElement) return;
            const sides = { 'prop-mt': 'marginTop', 'prop-mr': 'marginRight', 'prop-mb': 'marginBottom', 'prop-ml': 'marginLeft' };
            const prop = sides[$(this).attr('id')];
            const val = $(this).val();
            if (val) $(self.selectedElement).css(prop, val.includes('px') ? val : val + 'px');
            SysXApp.saveState(); // Added saveState
        });

        // Colors
        $('#prop-bg-color').on('change', function () { // Changed 'input' to 'change'
            if (!self.selectedElement) return;
            $(self.selectedElement).css('backgroundColor', $(this).val());
            $('#prop-bg-color-text').val($(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-bg-color-text').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('backgroundColor', $(this).val());
            $('#prop-bg-color').val($(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-text-color').on('change', function () { // Changed 'input' to 'change'
            if (!self.selectedElement) return;
            $(self.selectedElement).css('color', $(this).val());
            $('#prop-text-color-text').val($(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-text-color-text').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('color', $(this).val());
            $('#prop-text-color').val($(this).val());
            SysXApp.saveState(); // Added saveState
        });

        // Typography
        $('#prop-font-size').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('fontSize', $(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-font-weight').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('fontWeight', $(this).val());
            SysXApp.saveState(); // Added saveState
        });

        // Text Align
        $(document).on('click', '.prop-toggle-btn[data-style="text-align"]', function () {
            if (!self.selectedElement) return;
            const val = $(this).data('value');
            $('.prop-toggle-btn[data-style="text-align"]').removeClass('active');
            $(this).addClass('active');
            $(self.selectedElement).css('textAlign', val);
            SysXApp.saveState(); // Added saveState
        });

        // Border
        $('#prop-border-width, #prop-border-style').on('change', function () {
            if (!self.selectedElement) return;
            const w = $('#prop-border-width').val() || '0px';
            const s = $('#prop-border-style').val() || 'none';
            const c = $('#prop-border-color').val() || '#e5e7eb';
            $(self.selectedElement).css('border', `${w} ${s} ${c}`);
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-border-color').on('change', function () { // Changed 'input' to 'change'
            if (!self.selectedElement) return;
            const w = $('#prop-border-width').val() || '0px';
            const s = $('#prop-border-style').val() || 'solid';
            $(self.selectedElement).css('borderColor', $(this).val());
            $('#prop-border-color-text').val($(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-border-color-text').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('borderColor', $(this).val());
            $('#prop-border-color').val($(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-border-radius').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('borderRadius', $(this).val());
            SysXApp.saveState(); // Added saveState
        });

        // Display
        $('#prop-display').on('change', function () {
            if (!self.selectedElement) return;
            const val = $(this).val();
            $(self.selectedElement).css('display', val);
            if (val === 'flex') {
                $('#flex-options').removeClass('hidden');
            } else {
                $('#flex-options').addClass('hidden');
            }
            SysXApp.saveState(); // Added saveState
        });

        // Flex options
        $('#prop-flex-direction').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('flexDirection', $(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-justify-content').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('justifyContent', $(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-align-items').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('alignItems', $(this).val());
            SysXApp.saveState(); // Added saveState
        });
        $('#prop-gap').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('gap', $(this).val());
            SysXApp.saveState(); // Added saveState
        });

        // Shadow
        $('#prop-shadow').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).css('boxShadow', $(this).val());
            SysXApp.saveState(); // Added saveState
        });

        // Opacity
        $('#prop-opacity').on('change', function () { // Changed 'input' to 'change'
            if (!self.selectedElement) return;
            const val = $(this).val();
            $(self.selectedElement).css('opacity', val / 100);
            $('#prop-opacity-value').text(val + '%');
            SysXApp.saveState(); // Added saveState
        });

        // Events
        $('#prop-onclick-action').on('change', function () {
            if (!self.selectedElement) return;
            const action = $(this).val();
            self.updateEventParams(action);
            $(self.selectedElement).attr('data-onclick-action', action);
        });

        $('#prop-onhover-action').on('change', function () {
            if (!self.selectedElement) return;
            $(self.selectedElement).attr('data-onhover-action', $(this).val());
        });
    },

    select: function (element) {
        this.deselect();
        this.selectedElement = element;
        const $el = $(element);

        $el.addClass('selected');
        $('#no-selection-state').addClass('hidden');
        $('#properties-content').removeClass('hidden');
        $('#btn-delete-component').removeClass('hidden');

        const compType = $el.data('component-type');
        const compDef = SysXComponents[compType];

        if (compDef) {
            $('#prop-component-name').text(compDef.name);
            this.selectedComponentData = {
                type: compType,
                definition: compDef,
                props: $el.data('component-props') || {}
            };
        } else {
            $('#prop-component-name').text(compType || 'Unknown');
            this.selectedComponentData = { type: compType, definition: null, props: {} };
        }

        // Load custom ID
        $('#prop-component-id').val($el.attr('data-custom-id') || '');

        // Load current styles
        this.loadCurrentStyles($el);

        // Load content fields
        this.loadContentFields(compDef, $el.data('component-props') || {});

        // Load events
        $('#prop-onclick-action').val($el.attr('data-onclick-action') || '');
        $('#prop-onhover-action').val($el.attr('data-onhover-action') || '');

        lucide.createIcons();
    },

    deselect: function () {
        if (this.selectedElement) {
            $(this.selectedElement).removeClass('selected');
        }
        this.selectedElement = null;
        this.selectedComponentData = null;
        $('#no-selection-state').removeClass('hidden');
        $('#properties-content').addClass('hidden');
        $('#btn-delete-component').addClass('hidden');
    },

    loadCurrentStyles: function ($el) {
        // Size
        const w = $el[0].style.width;
        const h = $el[0].style.height;
        $('#prop-width').val(w || '');
        $('#prop-height').val(h || '');

        // Padding
        $('#prop-pt').val($el[0].style.paddingTop || '');
        $('#prop-pr').val($el[0].style.paddingRight || '');
        $('#prop-pb').val($el[0].style.paddingBottom || '');
        $('#prop-pl').val($el[0].style.paddingLeft || '');

        // Margin
        $('#prop-mt').val($el[0].style.marginTop || '');
        $('#prop-mr').val($el[0].style.marginRight || '');
        $('#prop-mb').val($el[0].style.marginBottom || '');
        $('#prop-ml').val($el[0].style.marginLeft || '');

        // Colors
        const bgColor = $el[0].style.backgroundColor;
        const textColor = $el[0].style.color;
        if (bgColor) {
            const hex = this.rgbToHex(bgColor);
            $('#prop-bg-color').val(hex);
            $('#prop-bg-color-text').val(hex);
        }
        if (textColor) {
            const hex = this.rgbToHex(textColor);
            $('#prop-text-color').val(hex);
            $('#prop-text-color-text').val(hex);
        }

        // Font
        $('#prop-font-size').val($el[0].style.fontSize || '');
        $('#prop-font-weight').val($el[0].style.fontWeight || '');

        // Text align
        const ta = $el[0].style.textAlign || 'left';
        $('.prop-toggle-btn[data-style="text-align"]').removeClass('active');
        $(`.prop-toggle-btn[data-style="text-align"][data-value="${ta}"]`).addClass('active');

        // Border
        $('#prop-border-radius').val($el[0].style.borderRadius || '');
        const borderWidth = $el[0].style.borderWidth;
        const borderStyle = $el[0].style.borderStyle;
        $('#prop-border-width').val(borderWidth || '');
        $('#prop-border-style').val(borderStyle || 'none');

        // Display
        const display = $el[0].style.display || 'block';
        $('#prop-display').val(display);
        if (display === 'flex') {
            $('#flex-options').removeClass('hidden');
            $('#prop-flex-direction').val($el[0].style.flexDirection || 'row');
            $('#prop-justify-content').val($el[0].style.justifyContent || 'flex-start');
            $('#prop-align-items').val($el[0].style.alignItems || 'stretch');
            $('#prop-gap').val($el[0].style.gap || '');
        } else {
            $('#flex-options').addClass('hidden');
        }

        // Shadow
        const shadow = $el[0].style.boxShadow;
        if (shadow) {
            $('#prop-shadow option').each(function () {
                if ($(this).val() === shadow) $(this).prop('selected', true);
            });
        }

        // Opacity
        const opacity = $el[0].style.opacity;
        const opVal = opacity !== '' ? Math.round(parseFloat(opacity) * 100) : 100;
        $('#prop-opacity').val(opVal);
        $('#prop-opacity-value').text(opVal + '%');
    },

    loadContentFields: function (compDef, currentProps) {
        const container = $('#prop-content-fields');
        container.empty();

        if (!compDef || !compDef.contentFields || compDef.contentFields.length === 0) {
            container.html('<p class="text-xs text-sysx-500 px-1">No content fields</p>');
            return;
        }

        compDef.contentFields.forEach(field => {
            const value = currentProps[field.key] || field.default || '';
            let fieldHtml = '';

            switch (field.type) {
                case 'text':
                    fieldHtml = `
                        <div class="prop-group">
                            <label class="prop-label">${field.label}</label>
                            <input type="text" class="prop-input" data-field-key="${field.key}" value="${this.escapeHtml(value)}">
                        </div>`;
                    break;
                case 'textarea':
                    fieldHtml = `
                        <div class="prop-group">
                            <label class="prop-label">${field.label}</label>
                            <textarea class="prop-input prop-textarea-field" data-field-key="${field.key}" rows="3" style="resize:vertical;">${this.escapeHtml(value)}</textarea>
                        </div>`;
                    break;
                case 'select':
                    const opts = field.options.map(o => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('');
                    fieldHtml = `
                        <div class="prop-group">
                            <label class="prop-label">${field.label}</label>
                            <select class="prop-select" data-field-key="${field.key}">${opts}</select>
                        </div>`;
                    break;
                case 'color':
                    fieldHtml = `
                        <div class="prop-group">
                            <label class="prop-label">${field.label}</label>
                            <div class="flex items-center gap-2">
                                <input type="color" class="prop-color" data-field-key="${field.key}" value="${value}">
                                <input type="text" class="prop-input flex-1" data-field-key="${field.key}" value="${value}">
                            </div>
                        </div>`;
                    break;
            }
            container.append(fieldHtml);
        });
    },

    applyContentChanges: function () {
        if (!this.selectedElement || !this.selectedComponentData) return;

        const compDef = this.selectedComponentData.definition;
        if (!compDef) return;

        // Gather new props
        const newProps = {};
        $('#prop-content-fields [data-field-key]').each(function () {
            const key = $(this).data('field-key');
            newProps[key] = $(this).val();
        });

        // Store props on element
        $(this.selectedElement).data('component-props', newProps);
        this.selectedComponentData.props = newProps;

        // Re-render component content
        const newHtml = compDef.render(newProps);
        const $content = $(this.selectedElement).find('.component-content');
        if ($content.length) {
            // Preserve children for container types
            if (compDef.isContainer) {
                const children = $content.children('.dropped-component').detach();
                $content.html(newHtml);
                const newContent = $(this.selectedElement).find('.component-content');
                newContent.append(children);
            }
        } else {
            // Non-container: replace inner content entirely but keep label + handles
            const label = $(this.selectedElement).find('.component-label').detach();
            const handles = $(this.selectedElement).find('.resize-handle').detach();
            $(this.selectedElement).html(newHtml);
            $(this.selectedElement).prepend(label);
            $(this.selectedElement).append(handles);
        }

        SysXApp.saveState();
    },

    updateEventParams: function (action) {
        const container = $('#onclick-params');
        container.empty();

        if (!action) {
            container.addClass('hidden');
            return;
        }
        container.removeClass('hidden');

        switch (action) {
            case 'navigate':
                container.html(`
                    <label class="prop-label">Target Page</label>
                    <select class="prop-select" id="onclick-navigate-target">
                        ${SysXApp.pages.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>`);
                break;
            case 'show-alert':
                container.html(`
                    <label class="prop-label">Alert Message</label>
                    <input type="text" class="prop-input" id="onclick-alert-msg" placeholder="Alert message" value="Hello!">
                `);
                break;
            case 'toggle-class':
                container.html(`
                    <label class="prop-label">Target ID</label>
                    <input type="text" class="prop-input" id="onclick-target-id" placeholder="Component ID">
                    <label class="prop-label mt-2">CSS Class</label>
                    <input type="text" class="prop-input" id="onclick-class-name" placeholder="Class name">
                `);
                break;
            case 'custom':
                container.html(`
                    <p class="text-xs text-sysx-400">Use the Flowchart Editor to define custom logic for this component.</p>
                    <button class="text-xs bg-accent-primary/20 text-accent-primary border border-accent-primary/30 rounded-lg px-3 py-1 mt-2" onclick="$('#btn-flowchart').click()">Open Flowchart</button>
                `);
                break;
            default:
                container.addClass('hidden');
        }
    },

    rgbToHex: function (rgb) {
        if (!rgb) return '#000000';
        if (rgb.startsWith('#')) return rgb;
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) return '#000000';
        return '#' + match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    },

    escapeHtml: function (str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};
