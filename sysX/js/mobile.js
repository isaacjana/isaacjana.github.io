/**
 * SysX — Mobile support
 * Turns the side panels into drawers on small screens, lets users tap a
 * palette item to add it (drag & drop needs a mouse), and starts the canvas
 * in the mobile device size so it fits the screen.
 */
const SysXMobile = {
    mq: window.matchMedia('(max-width: 767px)'),

    isMobile: function () { return this.mq.matches; },

    init: function () {
        const self = this;

        $('#btn-mobile-components').on('click', function (e) { e.stopPropagation(); self.toggle('components'); });
        $('#btn-mobile-properties').on('click', function (e) { e.stopPropagation(); self.toggle('properties'); });
        $('#mobile-drawer-backdrop').on('click', function () { self.close(); });

        // Tap a palette item to add it to the selected container (or the page)
        $(document).on('click', '.draggable-component', function () {
            if (!self.isMobile()) return;
            const type = $(this).data('component');
            const $sel = $('.dropped-component.selected .component-content').first();
            const target = $sel.length ? $sel[0] : document.getElementById('canvas-drop-zone');
            const comp = SysXDragDrop.createComponent(type, target);
            self.close();
            if (comp) {
                const el = comp.jquery ? comp[0] : comp;
                if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });

        if (this.isMobile()) this.fitCanvas();
    },

    toggle: function (which) {
        const cls = 'drawer-' + which;
        const open = !document.body.classList.contains(cls);
        this.close();
        if (open) document.body.classList.add(cls);
    },

    close: function () {
        document.body.classList.remove('drawer-components', 'drawer-properties');
    },

    fitCanvas: function () {
        const $dev = $('#canvas-device');
        if ($dev.val() !== 'mobile') $dev.val('mobile').trigger('change');
    }
};
window.SysXMobile = SysXMobile;

$(function () {
    // Run after the main app has wired up its handlers
    setTimeout(function () { SysXMobile.init(); }, 0);
});
