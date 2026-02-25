/**
 * SysX — Interactivity Module
 * Handles behavioral logic for complex components (Tabs, Accordions, etc.) 
 * within the builder canvas.
 */

const SysXInteractivity = {
    init: function () {
        this.setupTabInteractions();
        this.setupAccordionInteractions();
        this.setupGenericInteractions();
    },

    setupTabInteractions: function () {
        const self = this;

        // Listen for clicks on tab buttons inside the canvas
        $(document).on('click', '.tab-btn', function (e) {
            // Only handle if it's inside the canvas
            if (!$(this).closest('#canvas-drop-zone').length) return;

            // In builder mode, clicking selects the component, 
            // but we also want to switch the tab if clicking the button specifically.
            const $tabContainer = $(this).closest('.dropped-component[data-component-type="tabs"]');
            if (!$tabContainer.length) return;

            const index = $(this).index();
            const $contentContainer = $tabContainer.find('.tabs-content').first();

            // Update buttons
            $(this).siblings().removeClass('active').css({
                borderBottom: '2px solid transparent',
                color: '#6b7280'
            });
            $(this).addClass('active').css({
                borderBottom: '2px solid #6366f1',
                color: '#6366f1'
            });

            // Update panels
            $contentContainer.children('.tab-panel').addClass('hidden').css('display', 'none');
            $contentContainer.children('.tab-panel').eq(index).removeClass('hidden').css('display', 'block');

            // Prevent event from selecting the parent container immediately if we want to stay on tab buttons
            // e.stopPropagation(); 
        });
    },

    setupAccordionInteractions: function () {
        $(document).on('click', '.accordion-header', function (e) {
            if (!$(this).closest('#canvas-drop-zone').length) return;

            const $item = $(this).closest('.accordion-item');
            const $content = $item.find('.accordion-content');
            const $icon = $(this).find('.accordion-icon');

            // Toggle
            const isExpanded = $content.css('display') !== 'none';

            if (isExpanded) {
                $content.slideUp(200);
                $icon.css('transform', 'rotate(0deg)');
            } else {
                $content.slideDown(200);
                $icon.css('transform', 'rotate(180deg)');
            }
        });
    },

    setupGenericInteractions: function () {
        // Prevent default behavior for links and buttons inside the builder
        $(document).on('click', '#canvas-drop-zone a, #canvas-drop-zone button:not(.tab-btn)', function (e) {
            if (!$(this).hasClass('tab-btn')) {
                e.preventDefault();
            }
        });

        // Handle form input focus/change for visual feedback
        $(document).on('focus', '#canvas-drop-zone input, #canvas-drop-zone textarea, #canvas-drop-zone select', function () {
            $(this).css('borderColor', '#6366f1').css('boxShadow', '0 0 0 3px rgba(99,102,241,0.1)');
        });

        $(document).on('blur', '#canvas-drop-zone input, #canvas-drop-zone textarea, #canvas-drop-zone select', function () {
            $(this).css('borderColor', '').css('boxShadow', '');
        });
    }
};
