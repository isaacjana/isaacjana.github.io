/**
 * DevToys - Main Application
 * Handles routing, sidebar navigation, search, and tool rendering
 */

// ── Tool Maps (all tools from all categories merged) ──
const ALL_TOOL_RENDERERS = {};

function registerToolRenderers() {
    const sources = [ConverterTools, EncoderDecoderTools, FormatterTools, GeneratorTools, TextTools, GraphicTools, TesterTools, ThirdPartyTools];
    sources.forEach(source => {
        for (const [id, tool] of Object.entries(source)) {
            ALL_TOOL_RENDERERS[id] = tool;
        }
    });
}

// ── App State ──
let currentToolId = null;

// ── Initialize ──
$(document).ready(() => {
    registerToolRenderers();
    buildSidebar();
    bindEvents();
    updateFooter();
    detectOS();
    navigateFromHash();
});

// ── Detect OS for shortcut hint ──
function detectOS() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const hint = isMac ? '⌘K' : 'Ctrl+K';
    $('#search-shortcut-hint').text(hint);
}

// ── Footer ──
function updateFooter() {
    $('#footer-tool-count').text(`${TOOLS.length} tools available`);
}

// ── Sidebar Builder ──
function buildSidebar() {
    const nav = $('#sidebar-nav');
    const toolsByCategory = getToolsByCategory();

    // Home item
    nav.append(`
    <div class="nav-item" data-tool="home" id="nav-home" tabindex="0" role="button" aria-label="All Tools">
      <i class="fas fa-home"></i>
      <span>All Tools</span>
    </div>
  `);

    TOOL_CATEGORIES.forEach(cat => {
        const tools = toolsByCategory[cat.id] || [];
        if (tools.length === 0) return;

        const catEl = $(`
      <div class="nav-category" data-category="${cat.id}">
        <div class="nav-category-header" tabindex="0" role="button" aria-expanded="true" aria-label="Toggle ${cat.name} category">
          <span class="nav-category-title">${cat.name}</span>
          <i class="fas fa-chevron-down nav-category-chevron"></i>
        </div>
        <div class="nav-category-items" role="group" aria-label="${cat.name} tools"></div>
      </div>
    `);

        const items = catEl.find('.nav-category-items');
        tools.forEach(tool => {
            items.append(`
        <div class="nav-item" data-tool="${tool.id}" tabindex="0" role="button" aria-label="${tool.name}: ${tool.description}">
          <i class="${tool.icon}"></i>
          <span>${tool.name}</span>
        </div>
      `);
        });

        nav.append(catEl);
    });
}

// ── Event Bindings ──
function bindEvents() {
    // Nav item clicks
    $(document).on('click', '.nav-item', function () {
        const toolId = $(this).data('tool');
        navigateTo(toolId);
    });

    // Nav item keyboard (Enter/Space)
    $(document).on('keydown', '.nav-item', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const toolId = $(this).data('tool');
            navigateTo(toolId);
        }
    });

    // Category collapse
    $(document).on('click', '.nav-category-header', function () {
        const cat = $(this).closest('.nav-category');
        cat.toggleClass('collapsed');
        $(this).attr('aria-expanded', !cat.hasClass('collapsed'));
    });

    // Category collapse keyboard
    $(document).on('keydown', '.nav-category-header', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).click();
        }
    });

    // Search (debounced)
    $('#sidebar-search').on('input', debounce(function () {
        const query = $(this).val().trim();
        filterSidebar(query);
    }, 150));

    // Tool card clicks (home grid)
    $(document).on('click', '.tool-card', function () {
        const toolId = $(this).data('tool');
        navigateTo(toolId);
    });

    // Copy button handler
    $(document).on('click', '.copy-btn', function () {
        const target = $(this).data('target');
        if (target) {
            const text = $(`#${target}`).text() || $(`#${target}`).val();
            copyToClipboard(text);
        }
    });

    // Mobile menu
    $('#mobile-menu-btn').on('click', () => {
        $('.sidebar').toggleClass('open');
        $('.sidebar-overlay').toggleClass('visible');
    });

    $('.sidebar-overlay').on('click', () => {
        $('.sidebar').removeClass('open');
        $('.sidebar-overlay').removeClass('visible');
    });

    // Sidebar collapse (desktop)
    $('#sidebar-collapse-btn').on('click', () => {
        const sidebar = $('#sidebar');
        sidebar.toggleClass('collapsed');
        const isCollapsed = sidebar.hasClass('collapsed');
        localStorage.setItem('devtoys-sidebar-collapsed', isCollapsed);
    });

    // Restore sidebar collapsed state
    if (localStorage.getItem('devtoys-sidebar-collapsed') === 'true') {
        $('#sidebar').addClass('collapsed');
    }

    // Hash change
    $(window).on('hashchange', navigateFromHash);

    // Keyboard shortcuts
    $(document).on('keydown', function (e) {
        // Ctrl+K / Cmd+K — focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = $('#sidebar-search');
            searchInput.focus().select();
            // If sidebar is collapsed, expand it
            $('#sidebar').removeClass('collapsed');
            // If on mobile, open sidebar
            if ($(window).width() <= 768) {
                $('.sidebar').addClass('open');
                $('.sidebar-overlay').addClass('visible');
            }
        }

        // Escape — clear search or navigate home
        if (e.key === 'Escape') {
            const searchInput = $('#sidebar-search');
            if (searchInput.is(':focus') && searchInput.val()) {
                searchInput.val('');
                filterSidebar('');
            } else if (searchInput.is(':focus')) {
                searchInput.blur();
            } else if (currentToolId !== 'home') {
                navigateTo('home');
            }
        }
    });
}

// ── Navigation ──
function navigateTo(toolId, fromHash = false) {
    if (toolId === currentToolId && !fromHash) return;

    const id = (toolId === 'home' || !toolId) ? 'home' : toolId;
    if (id === 'home') {
        renderHome();
        if (window.location.hash !== '' && window.location.hash !== '#') {
            window.location.hash = '';
        }
    } else {
        renderTool(id);
        if (window.location.hash !== '#' + id) {
            window.location.hash = id;
        }
    }

    // Update active state
    $('.nav-item').removeClass('active').attr('aria-current', null);
    $(`.nav-item[data-tool="${id}"]`).addClass('active').attr('aria-current', 'page');

    // Close mobile menu
    $('.sidebar').removeClass('open');
    $('.sidebar-overlay').removeClass('visible');

    // Scroll content to top
    $('#content-body').scrollTop(0);

    // Remember last tool
    localStorage.setItem('devtoys-last-tool', id);
}

function navigateFromHash() {
    const hash = window.location.hash.replace('#', '');
    let target = hash || null;

    // If no hash, try to restore last tool
    if (!target) {
        const lastTool = localStorage.getItem('devtoys-last-tool');
        if (lastTool && lastTool !== 'home' && getToolById(lastTool)) {
            target = lastTool;
        } else {
            target = 'home';
        }
    }

    if (target === currentToolId) return;

    if (target === 'home' || getToolById(target)) {
        navigateTo(target, true);
    } else {
        navigateTo('home', true);
    }
}

// ── Render Home (All Tools Grid) ──
function renderHome() {
    currentToolId = 'home';
    $('#content-title').text('All Tools');
    $('#content-subtitle').text(`${TOOLS.length} tools available`);

    const body = $('#content-body');
    let html = '';
    let cardIndex = 0;

    const toolsByCategory = getToolsByCategory();

    TOOL_CATEGORIES.forEach(cat => {
        const tools = toolsByCategory[cat.id] || [];
        if (tools.length === 0) return;

        html += `<div class="home-section">
      <div class="home-section-title">${cat.name}</div>
      <div class="tools-grid">`;

        tools.forEach(tool => {
            html += `
        <div class="tool-card" data-tool="${tool.id}" style="--i:${cardIndex}" tabindex="0" role="button" aria-label="${tool.name}: ${tool.description}">
          <div class="tool-card-icon" style="background:${tool.gradient}">
            <i class="${tool.icon}"></i>
          </div>
          <div class="tool-card-info">
            <div class="tool-card-name">${tool.name}</div>
            <div class="tool-card-desc">${tool.description}</div>
          </div>
        </div>`;
            cardIndex++;
        });

        html += `</div></div>`;
    });

    body.html(html);

    // Enable keyboard activation of cards
    body.find('.tool-card').on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).click();
        }
    });
}

// ── Render Tool ──
function renderTool(toolId) {
    currentToolId = toolId;
    const tool = getToolById(toolId);
    if (!tool) {
        navigateTo('home');
        return;
    }

    $('#content-title').text(tool.name);
    const cat = TOOL_CATEGORIES.find(c => c.id === tool.category);
    $('#content-subtitle').text(cat ? cat.name : '');

    const body = $('#content-body');
    body.html('<div id="tool-container"></div>');

    const renderer = ALL_TOOL_RENDERERS[toolId];
    if (renderer && renderer.render) {
        renderer.render($('#tool-container'));
    } else {
        body.html(`
      <div class="tool-page">
        <div class="tool-section" style="text-align:center;padding:48px">
          <i class="${tool.icon}" style="font-size:48px;color:var(--text-muted);margin-bottom:16px"></i>
          <h3 style="color:var(--text-secondary)">${tool.name}</h3>
          <p style="color:var(--text-muted);margin-top:8px">${tool.description}</p>
          <p style="color:var(--text-muted);margin-top:16px">This tool is not yet implemented.</p>
        </div>
      </div>
    `);
    }

    // Expand the parent category in sidebar
    const catEl = $(`.nav-category`).filter(function () {
        return $(this).find(`.nav-item[data-tool="${toolId}"]`).length > 0;
    });
    catEl.removeClass('collapsed');
}

// ── Sidebar Filter ──
function filterSidebar(query) {
    if (!query) {
        $('.nav-category, .nav-item').show();
        return;
    }

    const results = searchTools(query);
    const matchIds = new Set(results.map(t => t.id));

    $('.nav-item').each(function () {
        const id = $(this).data('tool');
        if (id === 'home') {
            $(this).show();
        } else {
            $(this).toggle(matchIds.has(id));
        }
    });

    // Show categories that have visible items
    $('.nav-category').each(function () {
        const hasVisible = $(this).find('.nav-item:visible').length > 0;
        $(this).toggle(hasVisible);
        if (hasVisible) $(this).removeClass('collapsed');
    });
}

// ── Utility Functions ──
function escHtml(str) {
    if (str === undefined || str === null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied to clipboard!', 'success');
    });
}

function showToast(message, type = 'info') {
    const iconMap = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
    const icon = iconMap[type] || iconMap.info;
    const toast = $(`<div class="toast toast-${type}"><i class="fas fa-${icon}"></i> ${message}</div>`);
    $('#toast-container').append(toast);
    setTimeout(() => toast.remove(), 3200);
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
