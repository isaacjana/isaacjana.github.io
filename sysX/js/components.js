/**
 * SysX — Component Definitions
 * Defines all available UI components, their default properties, and HTML templates.
 */

const SysXComponents = {
    // ==========================================
    // LAYOUT COMPONENTS
    // ==========================================
    container: {
        name: 'Container',
        icon: 'square',
        category: 'layout',
        isContainer: true,
        defaultStyles: {
            padding: '16px',
            minHeight: '80px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
        },
        render: function(props) {
            return `<div class="component-content" style="min-height:60px;"></div>`;
        },
        contentFields: []
    },

    row: {
        name: 'Row',
        icon: 'columns',
        category: 'layout',
        isContainer: true,
        defaultStyles: {
            display: 'flex',
            gap: '12px',
            padding: '8px',
            minHeight: '60px',
            flexDirection: 'row'
        },
        render: function(props) {
            return `<div class="component-content" style="display:flex;gap:12px;min-height:60px;flex-wrap:wrap;"></div>`;
        },
        contentFields: []
    },

    column: {
        name: 'Column',
        icon: 'rectangle-vertical',
        category: 'layout',
        isContainer: true,
        defaultStyles: {
            flex: '1',
            padding: '8px',
            minHeight: '60px'
        },
        render: function(props) {
            return `<div class="component-content" style="min-height:60px;"></div>`;
        },
        contentFields: []
    },

    section: {
        name: 'Section',
        icon: 'panel-top',
        category: 'layout',
        isContainer: true,
        defaultStyles: {
            padding: '32px',
            minHeight: '120px',
            backgroundColor: '#f9fafb'
        },
        render: function(props) {
            return `<div class="component-content" style="min-height:80px;"></div>`;
        },
        contentFields: []
    },

    divider: {
        name: 'Divider',
        icon: 'minus',
        category: 'layout',
        isContainer: false,
        defaultStyles: {
            margin: '12px 0'
        },
        render: function(props) {
            const color = props.color || '#e5e7eb';
            const thickness = props.thickness || '1px';
            return `<hr style="border:none;border-top:${thickness} solid ${color};margin:0;">`;
        },
        contentFields: [
            { key: 'color', label: 'Color', type: 'color', default: '#e5e7eb' },
            { key: 'thickness', label: 'Thickness', type: 'text', default: '1px' }
        ]
    },

    spacer: {
        name: 'Spacer',
        icon: 'space',
        category: 'layout',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const h = props.height || '32px';
            return `<div style="height:${h};"></div>`;
        },
        contentFields: [
            { key: 'height', label: 'Height', type: 'text', default: '32px' }
        ]
    },

    // ==========================================
    // BASIC COMPONENTS
    // ==========================================
    heading: {
        name: 'Heading',
        icon: 'heading',
        category: 'basic',
        isContainer: false,
        defaultStyles: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
        },
        render: function(props) {
            const level = props.level || 'h2';
            const text = props.text || 'Heading Text';
            return `<${level} style="margin:0;font-size:inherit;font-weight:inherit;color:inherit;">${text}</${level}>`;
        },
        contentFields: [
            { key: 'text', label: 'Text', type: 'text', default: 'Heading Text' },
            { key: 'level', label: 'Level', type: 'select', options: ['h1','h2','h3','h4','h5','h6'], default: 'h2' }
        ]
    },

    paragraph: {
        name: 'Paragraph',
        icon: 'align-left',
        category: 'basic',
        isContainer: false,
        defaultStyles: {
            fontSize: '14px',
            color: '#4b5563',
            lineHeight: '1.6'
        },
        render: function(props) {
            const text = props.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
            return `<p style="margin:0;font-size:inherit;color:inherit;line-height:inherit;">${text}</p>`;
        },
        contentFields: [
            { key: 'text', label: 'Text', type: 'textarea', default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }
        ]
    },

    link: {
        name: 'Link',
        icon: 'link',
        category: 'basic',
        isContainer: false,
        defaultStyles: {
            color: '#6366f1',
            fontSize: '14px',
            textDecoration: 'underline'
        },
        render: function(props) {
            const text = props.text || 'Click here';
            const href = props.href || '#';
            return `<a href="${href}" style="color:inherit;font-size:inherit;text-decoration:inherit;" onclick="event.preventDefault()">${text}</a>`;
        },
        contentFields: [
            { key: 'text', label: 'Label', type: 'text', default: 'Click here' },
            { key: 'href', label: 'URL', type: 'text', default: '#' }
        ]
    },

    image: {
        name: 'Image',
        icon: 'image',
        category: 'basic',
        isContainer: false,
        defaultStyles: {
            maxWidth: '100%',
            borderRadius: '8px'
        },
        render: function(props) {
            const src = props.src || 'https://placehold.co/400x250/e2e8f0/94a3b8?text=Image';
            const alt = props.alt || 'Image';
            return `<img src="${src}" alt="${alt}" style="max-width:100%;height:auto;border-radius:inherit;display:block;">`;
        },
        contentFields: [
            { key: 'src', label: 'Image URL', type: 'text', default: 'https://placehold.co/400x250/e2e8f0/94a3b8?text=Image' },
            { key: 'alt', label: 'Alt Text', type: 'text', default: 'Image' }
        ]
    },

    icon: {
        name: 'Icon',
        icon: 'smile',
        category: 'basic',
        isContainer: false,
        defaultStyles: {
            fontSize: '24px',
            color: '#6366f1'
        },
        render: function(props) {
            const emoji = props.emoji || '⭐';
            const size = props.size || '24px';
            return `<span style="font-size:${size};line-height:1;">${emoji}</span>`;
        },
        contentFields: [
            { key: 'emoji', label: 'Emoji / Icon', type: 'text', default: '⭐' },
            { key: 'size', label: 'Size', type: 'text', default: '24px' }
        ]
    },

    list: {
        name: 'List',
        icon: 'list',
        category: 'basic',
        isContainer: false,
        defaultStyles: {
            fontSize: '14px',
            color: '#4b5563',
            paddingLeft: '20px'
        },
        render: function(props) {
            const items = props.items || 'Item 1\nItem 2\nItem 3';
            const type = props.listType || 'ul';
            const lis = items.split('\n').map(i => `<li style="margin-bottom:4px;">${i.trim()}</li>`).join('');
            return `<${type} style="margin:0;padding-left:20px;font-size:inherit;color:inherit;">${lis}</${type}>`;
        },
        contentFields: [
            { key: 'items', label: 'Items (one per line)', type: 'textarea', default: 'Item 1\nItem 2\nItem 3' },
            { key: 'listType', label: 'Type', type: 'select', options: ['ul', 'ol'], default: 'ul' }
        ]
    },

    // ==========================================
    // FORM COMPONENTS
    // ==========================================
    button: {
        name: 'Button',
        icon: 'rectangle-horizontal',
        category: 'form',
        isContainer: false,
        defaultStyles: {
            backgroundColor: '#6366f1',
            color: '#ffffff',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer'
        },
        render: function(props) {
            const text = props.text || 'Button';
            const variant = props.variant || 'primary';
            let style = 'padding:10px 24px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none;display:inline-block;';
            if (variant === 'primary') style += 'background:#6366f1;color:white;';
            else if (variant === 'secondary') style += 'background:#e5e7eb;color:#374151;';
            else if (variant === 'outline') style += 'background:transparent;color:#6366f1;border:2px solid #6366f1;';
            else if (variant === 'ghost') style += 'background:transparent;color:#6366f1;';
            else if (variant === 'danger') style += 'background:#ef4444;color:white;';
            return `<button style="${style}" type="button">${text}</button>`;
        },
        contentFields: [
            { key: 'text', label: 'Label', type: 'text', default: 'Button' },
            { key: 'variant', label: 'Variant', type: 'select', options: ['primary','secondary','outline','ghost','danger'], default: 'primary' }
        ]
    },

    input: {
        name: 'Text Input',
        icon: 'text-cursor',
        category: 'form',
        isContainer: false,
        defaultStyles: {
            marginBottom: '8px'
        },
        render: function(props) {
            const label = props.label || 'Label';
            const placeholder = props.placeholder || 'Enter text...';
            const inputType = props.inputType || 'text';
            return `
                <div style="margin-bottom:4px;">
                    <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">${label}</label>
                    <input type="${inputType}" placeholder="${placeholder}" 
                        style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;color:#374151;outline:none;box-sizing:border-box;">
                </div>`;
        },
        contentFields: [
            { key: 'label', label: 'Label', type: 'text', default: 'Label' },
            { key: 'placeholder', label: 'Placeholder', type: 'text', default: 'Enter text...' },
            { key: 'inputType', label: 'Type', type: 'select', options: ['text','email','password','number','tel','url','date'], default: 'text' }
        ]
    },

    textarea: {
        name: 'Text Area',
        icon: 'file-text',
        category: 'form',
        isContainer: false,
        defaultStyles: {
            marginBottom: '8px'
        },
        render: function(props) {
            const label = props.label || 'Message';
            const placeholder = props.placeholder || 'Enter your message...';
            const rows = props.rows || '4';
            return `
                <div>
                    <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">${label}</label>
                    <textarea placeholder="${placeholder}" rows="${rows}" 
                        style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;color:#374151;outline:none;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>
                </div>`;
        },
        contentFields: [
            { key: 'label', label: 'Label', type: 'text', default: 'Message' },
            { key: 'placeholder', label: 'Placeholder', type: 'text', default: 'Enter your message...' },
            { key: 'rows', label: 'Rows', type: 'text', default: '4' }
        ]
    },

    select: {
        name: 'Dropdown',
        icon: 'chevron-down-square',
        category: 'form',
        isContainer: false,
        defaultStyles: {
            marginBottom: '8px'
        },
        render: function(props) {
            const label = props.label || 'Select';
            const options = (props.options || 'Option 1\nOption 2\nOption 3').split('\n');
            const opts = options.map(o => `<option>${o.trim()}</option>`).join('');
            return `
                <div>
                    <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">${label}</label>
                    <select style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;color:#374151;outline:none;background:white;box-sizing:border-box;">
                        ${opts}
                    </select>
                </div>`;
        },
        contentFields: [
            { key: 'label', label: 'Label', type: 'text', default: 'Select' },
            { key: 'options', label: 'Options (one per line)', type: 'textarea', default: 'Option 1\nOption 2\nOption 3' }
        ]
    },

    checkbox: {
        name: 'Checkbox',
        icon: 'check-square',
        category: 'form',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const label = props.label || 'Checkbox label';
            return `
                <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;cursor:pointer;">
                    <input type="checkbox" style="width:16px;height:16px;accent-color:#6366f1;">
                    ${label}
                </label>`;
        },
        contentFields: [
            { key: 'label', label: 'Label', type: 'text', default: 'Checkbox label' }
        ]
    },

    radio: {
        name: 'Radio',
        icon: 'circle-dot',
        category: 'form',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const groupName = props.groupName || 'radio-group';
            const options = (props.options || 'Option A\nOption B\nOption C').split('\n');
            const radios = options.map(o => `
                <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;cursor:pointer;margin-bottom:4px;">
                    <input type="radio" name="${groupName}" style="width:16px;height:16px;accent-color:#6366f1;">
                    ${o.trim()}
                </label>`).join('');
            return `<div>${radios}</div>`;
        },
        contentFields: [
            { key: 'groupName', label: 'Group Name', type: 'text', default: 'radio-group' },
            { key: 'options', label: 'Options (one per line)', type: 'textarea', default: 'Option A\nOption B\nOption C' }
        ]
    },

    toggle: {
        name: 'Toggle',
        icon: 'toggle-left',
        category: 'form',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const label = props.label || 'Enable feature';
            return `
                <label style="display:flex;align-items:center;gap:10px;font-size:14px;color:#374151;cursor:pointer;">
                    <div style="position:relative;width:44px;height:24px;background:#d1d5db;border-radius:12px;transition:all 0.2s;">
                        <div style="position:absolute;top:2px;left:2px;width:20px;height:20px;background:white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:all 0.2s;"></div>
                    </div>
                    ${label}
                </label>`;
        },
        contentFields: [
            { key: 'label', label: 'Label', type: 'text', default: 'Enable feature' }
        ]
    },

    slider: {
        name: 'Slider',
        icon: 'sliders-horizontal',
        category: 'form',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const label = props.label || 'Volume';
            const min = props.min || '0';
            const max = props.max || '100';
            return `
                <div>
                    <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">${label}</label>
                    <input type="range" min="${min}" max="${max}" value="50" style="width:100%;accent-color:#6366f1;">
                </div>`;
        },
        contentFields: [
            { key: 'label', label: 'Label', type: 'text', default: 'Volume' },
            { key: 'min', label: 'Min', type: 'text', default: '0' },
            { key: 'max', label: 'Max', type: 'text', default: '100' }
        ]
    },

    'file-upload': {
        name: 'File Upload',
        icon: 'upload',
        category: 'form',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const label = props.label || 'Upload File';
            return `
                <div style="border:2px dashed #d1d5db;border-radius:8px;padding:24px;text-align:center;">
                    <div style="font-size:32px;margin-bottom:8px;">📁</div>
                    <p style="font-size:14px;color:#374151;font-weight:500;margin:0 0 4px;">${label}</p>
                    <p style="font-size:12px;color:#9ca3af;margin:0;">Drag & drop or click to browse</p>
                </div>`;
        },
        contentFields: [
            { key: 'label', label: 'Label', type: 'text', default: 'Upload File' }
        ]
    },

    // ==========================================
    // DATA DISPLAY COMPONENTS
    // ==========================================
    table: {
        name: 'Table',
        icon: 'table',
        category: 'data',
        isContainer: false,
        defaultStyles: {
            width: '100%'
        },
        render: function(props) {
            const cols = props.columns || 'Name,Email,Role';
            const headers = cols.split(',').map(c => `<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e5e7eb;">${c.trim()}</th>`).join('');
            const sampleData = [
                ['John Doe', 'john@email.com', 'Admin'],
                ['Jane Smith', 'jane@email.com', 'Editor'],
                ['Bob Johnson', 'bob@email.com', 'Viewer']
            ];
            const rows = sampleData.map(row => `<tr>${row.map(cell => `<td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${cell}</td>`).join('')}</tr>`).join('');
            return `
                <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <thead style="background:#f9fafb;"><tr>${headers}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>`;
        },
        contentFields: [
            { key: 'columns', label: 'Columns (comma-separated)', type: 'text', default: 'Name,Email,Role' }
        ]
    },

    card: {
        name: 'Card',
        icon: 'credit-card',
        category: 'data',
        isContainer: true,
        defaultStyles: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        },
        render: function(props) {
            const title = props.title || 'Card Title';
            const desc = props.description || 'Card description goes here.';
            return `
                <div class="component-content">
                    <h3 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 8px;">${title}</h3>
                    <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">${desc}</p>
                </div>`;
        },
        contentFields: [
            { key: 'title', label: 'Title', type: 'text', default: 'Card Title' },
            { key: 'description', label: 'Description', type: 'textarea', default: 'Card description goes here.' }
        ]
    },

    badge: {
        name: 'Badge',
        icon: 'badge',
        category: 'data',
        isContainer: false,
        defaultStyles: {
            display: 'inline-block'
        },
        render: function(props) {
            const text = props.text || 'Badge';
            const variant = props.variant || 'default';
            let bg = '#e5e7eb', color = '#374151';
            if (variant === 'primary') { bg = '#eef2ff'; color = '#6366f1'; }
            else if (variant === 'success') { bg = '#ecfdf5'; color = '#059669'; }
            else if (variant === 'warning') { bg = '#fffbeb'; color = '#d97706'; }
            else if (variant === 'danger') { bg = '#fef2f2'; color = '#dc2626'; }
            return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${bg};color:${color};">${text}</span>`;
        },
        contentFields: [
            { key: 'text', label: 'Text', type: 'text', default: 'Badge' },
            { key: 'variant', label: 'Variant', type: 'select', options: ['default','primary','success','warning','danger'], default: 'primary' }
        ]
    },

    progress: {
        name: 'Progress Bar',
        icon: 'loader',
        category: 'data',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const value = props.value || '65';
            const label = props.label || 'Progress';
            const color = props.barColor || '#6366f1';
            return `
                <div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-size:13px;font-weight:500;color:#374151;">${label}</span>
                        <span style="font-size:13px;color:#6b7280;">${value}%</span>
                    </div>
                    <div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
                        <div style="height:100%;width:${value}%;background:${color};border-radius:4px;transition:width 0.3s;"></div>
                    </div>
                </div>`;
        },
        contentFields: [
            { key: 'label', label: 'Label', type: 'text', default: 'Progress' },
            { key: 'value', label: 'Value (%)', type: 'text', default: '65' },
            { key: 'barColor', label: 'Color', type: 'color', default: '#6366f1' }
        ]
    },

    avatar: {
        name: 'Avatar',
        icon: 'user-circle',
        category: 'data',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const size = props.size || '48px';
            const initials = props.initials || 'JD';
            const bg = props.bgColor || '#6366f1';
            return `
                <div style="width:${size};height:${size};border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:calc(${size}/2.5);">
                    ${initials}
                </div>`;
        },
        contentFields: [
            { key: 'initials', label: 'Initials', type: 'text', default: 'JD' },
            { key: 'size', label: 'Size', type: 'text', default: '48px' },
            { key: 'bgColor', label: 'Background', type: 'color', default: '#6366f1' }
        ]
    },

    chart: {
        name: 'Chart',
        icon: 'bar-chart-2',
        category: 'data',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const type = props.chartType || 'bar';
            const bars = [65, 40, 80, 55, 90, 45, 70];
            const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            let content = '';
            if (type === 'bar') {
                const barsHtml = bars.map((v, i) => `
                    <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px;">
                        <div style="flex:1;width:100%;display:flex;align-items:flex-end;">
                            <div style="width:100%;height:${v}%;background:linear-gradient(to top,#6366f1,#818cf8);border-radius:4px 4px 0 0;"></div>
                        </div>
                        <span style="font-size:10px;color:#9ca3af;">${days[i]}</span>
                    </div>`).join('');
                content = `<div style="display:flex;gap:6px;height:150px;align-items:stretch;">${barsHtml}</div>`;
            } else {
                content = `<div style="height:150px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px;">📊 Chart Preview</div>`;
            }
            return `
                <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                    <h4 style="font-size:14px;font-weight:600;color:#111827;margin:0 0 12px;">Weekly Activity</h4>
                    ${content}
                </div>`;
        },
        contentFields: [
            { key: 'chartType', label: 'Type', type: 'select', options: ['bar','line','pie'], default: 'bar' }
        ]
    },

    // ==========================================
    // NAVIGATION COMPONENTS
    // ==========================================
    navbar: {
        name: 'Navbar',
        icon: 'navigation',
        category: 'navigation',
        isContainer: false,
        defaultStyles: {
            width: '100%'
        },
        render: function(props) {
            const brand = props.brand || 'Brand';
            const links = (props.links || 'Home\nAbout\nServices\nContact').split('\n');
            const linksHtml = links.map(l => `<a href="#" style="color:#4b5563;text-decoration:none;font-size:14px;font-weight:500;transition:color 0.2s;" onclick="event.preventDefault()">${l.trim()}</a>`).join('');
            return `
                <nav style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:white;border-bottom:1px solid #e5e7eb;">
                    <span style="font-size:18px;font-weight:700;color:#111827;">${brand}</span>
                    <div style="display:flex;gap:24px;">${linksHtml}</div>
                    <button style="padding:8px 18px;background:#6366f1;color:white;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;">Sign Up</button>
                </nav>`;
        },
        contentFields: [
            { key: 'brand', label: 'Brand Name', type: 'text', default: 'Brand' },
            { key: 'links', label: 'Links (one per line)', type: 'textarea', default: 'Home\nAbout\nServices\nContact' }
        ]
    },

    'sidebar-nav': {
        name: 'Sidebar',
        icon: 'panel-left',
        category: 'navigation',
        isContainer: false,
        defaultStyles: {
            width: '220px',
            minHeight: '400px'
        },
        render: function(props) {
            const links = (props.links || '🏠 Dashboard\n👤 Profile\n📊 Analytics\n⚙️ Settings').split('\n');
            const linksHtml = links.map((l, i) => `<a href="#" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:6px;font-size:13px;color:${i===0?'#6366f1':'#4b5563'};text-decoration:none;background:${i===0?'#eef2ff':'transparent'};font-weight:${i===0?'600':'400'};" onclick="event.preventDefault()">${l.trim()}</a>`).join('');
            return `
                <div style="width:100%;background:#f9fafb;border-right:1px solid #e5e7eb;padding:16px 12px;min-height:inherit;">
                    <div style="font-size:16px;font-weight:700;color:#111827;padding:0 12px 16px;border-bottom:1px solid #e5e7eb;margin-bottom:12px;">Menu</div>
                    <div style="display:flex;flex-direction:column;gap:2px;">${linksHtml}</div>
                </div>`;
        },
        contentFields: [
            { key: 'links', label: 'Links (one per line)', type: 'textarea', default: '🏠 Dashboard\n👤 Profile\n📊 Analytics\n⚙️ Settings' }
        ]
    },

    breadcrumb: {
        name: 'Breadcrumb',
        icon: 'chevron-right',
        category: 'navigation',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const items = (props.items || 'Home\nProducts\nCategory\nItem').split('\n');
            const crumbs = items.map((item, i) => {
                const isLast = i === items.length - 1;
                const sep = isLast ? '' : '<span style="color:#9ca3af;margin:0 6px;">/</span>';
                return `<span style="font-size:13px;color:${isLast?'#111827':'#6b7280'};font-weight:${isLast?'500':'400'};">${item.trim()}</span>${sep}`;
            }).join('');
            return `<div style="display:flex;align-items:center;flex-wrap:wrap;">${crumbs}</div>`;
        },
        contentFields: [
            { key: 'items', label: 'Items (one per line)', type: 'textarea', default: 'Home\nProducts\nCategory\nItem' }
        ]
    },

    tabs: {
        name: 'Tabs',
        icon: 'folder',
        category: 'navigation',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const items = (props.items || 'Overview\nFeatures\nPricing\nFAQ').split('\n');
            const tabsHtml = items.map((item, i) => `<button style="padding:8px 16px;font-size:13px;font-weight:${i===0?'600':'400'};color:${i===0?'#6366f1':'#6b7280'};border:none;background:none;border-bottom:2px solid ${i===0?'#6366f1':'transparent'};cursor:pointer;">${item.trim()}</button>`).join('');
            return `<div style="display:flex;border-bottom:1px solid #e5e7eb;">${tabsHtml}</div>`;
        },
        contentFields: [
            { key: 'items', label: 'Tab Labels (one per line)', type: 'textarea', default: 'Overview\nFeatures\nPricing\nFAQ' }
        ]
    },

    pagination: {
        name: 'Pagination',
        icon: 'more-horizontal',
        category: 'navigation',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const pages = parseInt(props.pages || '5');
            let pagesHtml = `<button style="padding:6px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#6b7280;background:white;cursor:pointer;">←</button>`;
            for (let i = 1; i <= pages; i++) {
                pagesHtml += `<button style="padding:6px 10px;border:1px solid ${i===1?'#6366f1':'#e5e7eb'};border-radius:6px;font-size:12px;color:${i===1?'white':'#374151'};background:${i===1?'#6366f1':'white'};cursor:pointer;font-weight:${i===1?'600':'400'};">${i}</button>`;
            }
            pagesHtml += `<button style="padding:6px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#6b7280;background:white;cursor:pointer;">→</button>`;
            return `<div style="display:flex;gap:4px;align-items:center;">${pagesHtml}</div>`;
        },
        contentFields: [
            { key: 'pages', label: 'Number of Pages', type: 'text', default: '5' }
        ]
    },

    // ==========================================
    // FEEDBACK COMPONENTS
    // ==========================================
    alert: {
        name: 'Alert',
        icon: 'alert-triangle',
        category: 'feedback',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const message = props.message || 'This is an alert message.';
            const variant = props.variant || 'info';
            let bg, color, icon;
            if (variant === 'info') { bg = '#eff6ff'; color = '#1d4ed8'; icon = 'ℹ️'; }
            else if (variant === 'success') { bg = '#ecfdf5'; color = '#059669'; icon = '✅'; }
            else if (variant === 'warning') { bg = '#fffbeb'; color = '#d97706'; icon = '⚠️'; }
            else if (variant === 'error') { bg = '#fef2f2'; color = '#dc2626'; icon = '❌'; }
            return `
                <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:${bg};border-radius:8px;border-left:4px solid ${color};">
                    <span style="font-size:16px;">${icon}</span>
                    <span style="font-size:13px;color:${color};font-weight:500;">${message}</span>
                </div>`;
        },
        contentFields: [
            { key: 'message', label: 'Message', type: 'text', default: 'This is an alert message.' },
            { key: 'variant', label: 'Type', type: 'select', options: ['info','success','warning','error'], default: 'info' }
        ]
    },

    toast: {
        name: 'Toast',
        icon: 'message-square',
        category: 'feedback',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const message = props.message || 'Action completed successfully!';
            return `
                <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#111827;color:white;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:320px;">
                    <span style="font-size:14px;">✅</span>
                    <span style="font-size:13px;flex:1;">${message}</span>
                    <span style="color:#9ca3af;cursor:pointer;">✕</span>
                </div>`;
        },
        contentFields: [
            { key: 'message', label: 'Message', type: 'text', default: 'Action completed successfully!' }
        ]
    },

    modal: {
        name: 'Modal',
        icon: 'maximize-2',
        category: 'feedback',
        isContainer: true,
        defaultStyles: {},
        render: function(props) {
            const title = props.title || 'Modal Title';
            const body = props.body || 'Modal body content goes here.';
            return `
                <div style="background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-width:480px;width:100%;overflow:hidden;">
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                        <h3 style="font-size:16px;font-weight:600;color:#111827;margin:0;">${title}</h3>
                        <span style="color:#9ca3af;cursor:pointer;font-size:18px;">✕</span>
                    </div>
                    <div class="component-content" style="padding:20px;font-size:14px;color:#4b5563;min-height:80px;">
                        ${body}
                    </div>
                    <div style="display:flex;justify-content:flex-end;gap:8px;padding:16px 20px;border-top:1px solid #e5e7eb;">
                        <button style="padding:8px 16px;border:1px solid #d1d5db;border-radius:8px;background:white;color:#374151;font-size:13px;cursor:pointer;">Cancel</button>
                        <button style="padding:8px 16px;border:none;border-radius:8px;background:#6366f1;color:white;font-size:13px;cursor:pointer;">Confirm</button>
                    </div>
                </div>`;
        },
        contentFields: [
            { key: 'title', label: 'Title', type: 'text', default: 'Modal Title' },
            { key: 'body', label: 'Body Text', type: 'textarea', default: 'Modal body content goes here.' }
        ]
    },

    tooltip: {
        name: 'Tooltip',
        icon: 'info',
        category: 'feedback',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const text = props.text || 'Hover me';
            const tip = props.tip || 'This is a tooltip';
            return `
                <div style="display:inline-block;position:relative;">
                    <span style="font-size:14px;color:#6366f1;cursor:help;border-bottom:1px dashed #6366f1;">${text}</span>
                    <div style="position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);padding:6px 12px;background:#111827;color:white;border-radius:6px;font-size:11px;white-space:nowrap;pointer-events:none;">
                        ${tip}
                        <div style="position:absolute;top:100%;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid #111827;"></div>
                    </div>
                </div>`;
        },
        contentFields: [
            { key: 'text', label: 'Trigger Text', type: 'text', default: 'Hover me' },
            { key: 'tip', label: 'Tooltip Text', type: 'text', default: 'This is a tooltip' }
        ]
    },

    spinner: {
        name: 'Spinner',
        icon: 'loader-2',
        category: 'feedback',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            const size = props.size || '32px';
            const color = props.color || '#6366f1';
            return `
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:${size};height:${size};border:3px solid #e5e7eb;border-top-color:${color};border-radius:50%;animation:spin 0.8s linear infinite;"></div>
                    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                    <span style="font-size:13px;color:#6b7280;">Loading...</span>
                </div>`;
        },
        contentFields: [
            { key: 'size', label: 'Size', type: 'text', default: '32px' },
            { key: 'color', label: 'Color', type: 'color', default: '#6366f1' }
        ]
    },

    // ==========================================
    // MEDIA COMPONENTS
    // ==========================================
    video: {
        name: 'Video',
        icon: 'video',
        category: 'media',
        isContainer: false,
        defaultStyles: {
            borderRadius: '12px',
            overflow: 'hidden'
        },
        render: function(props) {
            return `
                <div style="background:#111827;border-radius:12px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;position:relative;">
                    <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                        <div style="width:0;height:0;border-top:12px solid transparent;border-bottom:12px solid transparent;border-left:20px solid white;margin-left:4px;"></div>
                    </div>
                </div>`;
        },
        contentFields: []
    },

    carousel: {
        name: 'Carousel',
        icon: 'gallery-horizontal',
        category: 'media',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            return `
                <div style="position:relative;background:#f3f4f6;border-radius:12px;overflow:hidden;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;">
                    <img src="https://placehold.co/800x400/e2e8f0/94a3b8?text=Slide+1" alt="Slide" style="width:100%;height:100%;object-fit:cover;">
                    <button style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);">←</button>
                    <button style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);">→</button>
                    <div style="position:absolute;bottom:12px;display:flex;gap:6px;">
                        <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
                        <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.4);"></div>
                        <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.4);"></div>
                    </div>
                </div>`;
        },
        contentFields: []
    },

    map: {
        name: 'Map',
        icon: 'map-pin',
        category: 'media',
        isContainer: false,
        defaultStyles: {},
        render: function(props) {
            return `
                <div style="background:#e2e8f0;border-radius:12px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
                    <div style="text-align:center;">
                        <div style="font-size:36px;margin-bottom:4px;">📍</div>
                        <span style="font-size:13px;color:#64748b;">Map Placeholder</span>
                    </div>
                </div>`;
        },
        contentFields: []
    }
};
