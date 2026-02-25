/**
 * SysX — Flowchart Editor Module
 * Handles visual flowchart logic creation with draggable nodes and connections.
 */

const SysXFlowchart = {
    nodes: [],
    connections: [],
    selectedNode: null,
    nextNodeId: 1,
    isConnecting: false,
    connectFrom: null,
    leaderLines: [],
    svgConnections: null,

    init: function () {
        this.setupEventListeners();
        this.setupNodeDragging();
        this.createSVGLayer();
    },

    createSVGLayer: function () {
        const canvas = document.getElementById('flowchart-canvas');
        let svg = canvas.querySelector('.flow-svg-layer');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('flow-svg-layer');
            svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
            canvas.insertBefore(svg, canvas.firstChild);
        }
        this.svgConnections = svg;
    },

    setupEventListeners: function () {
        const self = this;

        // Open/Close flowchart modal
        $('#btn-flowchart').on('click', function () {
            $('#flowchart-modal').removeClass('hidden');
            self.createSVGLayer();
            self.redrawConnections();
        });
        $('#btn-close-flowchart, #flowchart-overlay').on('click', function () {
            $('#flowchart-modal').addClass('hidden');
        });

        // Add node button
        $('#btn-add-flow-node').on('click', function () {
            self.addNode('action', 400, 300);
        });

        // Clear all
        $('#btn-clear-flow').on('click', function () {
            if (confirm('Delete all flow nodes and connections?')) {
                self.clearAll();
            }
        });

        // Delete selected node
        $('#btn-delete-flow-node').on('click', function () {
            if (self.selectedNode) {
                self.deleteNode(self.selectedNode);
            }
        });

        // Node label change
        $('#flow-node-label').on('input', function () {
            if (self.selectedNode) {
                const node = self.getNodeById(self.selectedNode);
                if (node) {
                    node.label = $(this).val();
                    $(`#${self.selectedNode} .flow-node-body`).text(node.label);
                }
            }
        });

        // Canvas click to deselect
        $('#flowchart-canvas').on('click', function (e) {
            if ($(e.target).is('#flowchart-canvas')) {
                self.deselectAll();
            }
        });

        // Setup flow node palette dragging
        this.setupFlowPaletteDrag();
    },

    setupFlowPaletteDrag: function () {
        const self = this;

        $('.flow-node-item').on('mousedown', function (e) {
            e.preventDefault();
            const type = $(this).data('flow-type');
            const ghost = $('<div class="drag-ghost"></div>').text($(this).find('span').text());
            $('body').append(ghost);

            function moveGhost(ev) {
                ghost.css({ left: ev.clientX + 10, top: ev.clientY + 10 });
            }
            moveGhost(e);

            $(document).on('mousemove.flowdrag', moveGhost);
            $(document).one('mouseup.flowdrag', function (ev) {
                $(document).off('mousemove.flowdrag');
                ghost.remove();

                // Check if dropped on flowchart canvas
                const canvasEl = document.getElementById('flowchart-canvas');
                const wrapper = document.getElementById('flowchart-canvas-wrapper');
                if (!canvasEl) return;

                const rect = canvasEl.getBoundingClientRect();
                if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
                    const scrollLeft = wrapper.scrollLeft;
                    const scrollTop = wrapper.scrollTop;
                    const x = ev.clientX - rect.left + scrollLeft;
                    const y = ev.clientY - rect.top + scrollTop;
                    self.addNode(type, x - 80, y - 20);
                }
            });
        });
    },

    setupNodeDragging: function () {
        const self = this;

        $(document).on('mousedown', '.flow-node', function (e) {
            if ($(e.target).hasClass('flow-port')) return;

            const nodeEl = $(this);
            const nodeId = nodeEl.attr('id');
            self.selectNode(nodeId);

            const startX = e.clientX;
            const startY = e.clientY;
            const origLeft = parseInt(nodeEl.css('left'));
            const origTop = parseInt(nodeEl.css('top'));

            $(document).on('mousemove.nodedrag', function (ev) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                nodeEl.css({ left: origLeft + dx, top: origTop + dy });

                // Update node data
                const node = self.getNodeById(nodeId);
                if (node) {
                    node.x = origLeft + dx;
                    node.y = origTop + dy;
                }
                self.redrawConnections();
            });

            $(document).one('mouseup.nodedrag', function () {
                $(document).off('mousemove.nodedrag');
            });

            e.preventDefault();
        });

        // Port clicking for connections
        $(document).on('mousedown', '.flow-port.output-port', function (e) {
            e.stopPropagation();
            e.preventDefault();

            const nodeId = $(this).closest('.flow-node').attr('id');
            self.isConnecting = true;
            self.connectFrom = nodeId;

            // Create temp line
            const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tempLine.setAttribute('stroke', '#6366f1');
            tempLine.setAttribute('stroke-width', '2');
            tempLine.setAttribute('stroke-dasharray', '6,4');
            tempLine.id = 'temp-connection-line';
            const portRect = this.getBoundingClientRect();
            const canvasRect = document.getElementById('flowchart-canvas').getBoundingClientRect();
            const wrapper = document.getElementById('flowchart-canvas-wrapper');
            const startX = portRect.left - canvasRect.left + wrapper.scrollLeft + portRect.width / 2;
            const startY = portRect.top - canvasRect.top + wrapper.scrollTop + portRect.height / 2;
            tempLine.setAttribute('x1', startX);
            tempLine.setAttribute('y1', startY);
            tempLine.setAttribute('x2', startX);
            tempLine.setAttribute('y2', startY);
            self.svgConnections.appendChild(tempLine);

            $(document).on('mousemove.connect', function (ev) {
                const mx = ev.clientX - canvasRect.left + wrapper.scrollLeft;
                const my = ev.clientY - canvasRect.top + wrapper.scrollTop;
                tempLine.setAttribute('x2', mx);
                tempLine.setAttribute('y2', my);
            });

            $(document).one('mouseup.connect', function (ev) {
                $(document).off('mousemove.connect');
                const tl = document.getElementById('temp-connection-line');
                if (tl) tl.remove();

                // Check if dropped on an input port
                const target = document.elementFromPoint(ev.clientX, ev.clientY);
                if (target && $(target).hasClass('input-port')) {
                    const targetNodeId = $(target).closest('.flow-node').attr('id');
                    if (targetNodeId && targetNodeId !== self.connectFrom) {
                        self.addConnection(self.connectFrom, targetNodeId);
                    }
                }

                self.isConnecting = false;
                self.connectFrom = null;
            });
        });
    },

    addNode: function (type, x, y) {
        const id = 'flow-node-' + this.nextNodeId++;
        const nodeTypes = {
            'start': { title: 'START', color: '#34d399' },
            'end': { title: 'END', color: '#fb7185' },
            'event': { title: 'EVENT', color: '#22d3ee' },
            'condition': { title: 'CONDITION', color: '#fbbf24' },
            'action': { title: 'ACTION', color: '#6366f1' },
            'navigate': { title: 'NAVIGATE', color: '#8b5cf6' },
            'set-value': { title: 'SET VALUE', color: '#a78bfa' },
            'get-value': { title: 'GET VALUE', color: '#60a5fa' },
            'show-hide': { title: 'SHOW/HIDE', color: '#f472b6' },
            'api-call': { title: 'API CALL', color: '#fb923c' },
            'delay': { title: 'DELAY', color: '#9ca3af' },
            'loop': { title: 'LOOP', color: '#2dd4bf' }
        };

        const info = nodeTypes[type] || nodeTypes['action'];
        const label = info.title;

        const nodeData = {
            id: id,
            type: type,
            label: label,
            x: x,
            y: y,
            config: {}
        };

        this.nodes.push(nodeData);

        const hasInput = type !== 'start';
        const hasOutput = type !== 'end';
        const extraOutput = type === 'condition';

        let portsHtml = '<div class="flow-node-ports">';
        if (hasInput) {
            portsHtml += '<div class="flow-port input-port" title="Input"></div>';
        } else {
            portsHtml += '<div style="width:10px;"></div>';
        }
        if (hasOutput) {
            portsHtml += '<div class="flow-port output-port" title="Output"></div>';
            if (extraOutput) {
                portsHtml += '<div class="flow-port output-port" title="False Output" style="background:#fbbf24;"></div>';
            }
        }
        portsHtml += '</div>';

        const configHtml = this.getNodeConfigHtml(type);

        const nodeHtml = `
            <div id="${id}" class="flow-node" data-type="${type}" style="left:${x}px;top:${y}px;">
                <div class="flow-node-header">
                    <div style="width:8px;height:8px;border-radius:${type === 'condition' ? '2px' : '50%'};background:${info.color};${type === 'condition' ? 'transform:rotate(45deg);' : ''}"></div>
                    ${info.title}
                </div>
                <div class="flow-node-body">${label}</div>
                ${portsHtml}
            </div>
        `;

        $('#flowchart-canvas').append(nodeHtml);
        this.selectNode(id);

        SysXApp.showToast(`Added ${info.title} node`, 'info');
    },

    getNodeConfigHtml: function (type) {
        switch (type) {
            case 'event':
                return `
                    <div>
                        <label class="prop-label">Event Type</label>
                        <select class="prop-select flow-config" data-config="eventType">
                            <option value="click">Click</option>
                            <option value="hover">Hover</option>
                            <option value="submit">Form Submit</option>
                            <option value="change">Value Change</option>
                            <option value="load">Page Load</option>
                            <option value="scroll">Scroll</option>
                            <option value="keypress">Key Press</option>
                        </select>
                    </div>
                    <div>
                        <label class="prop-label">Target Component</label>
                        <input type="text" class="prop-input flow-config" data-config="target" placeholder="Component ID">
                    </div>`;
            case 'condition':
                return `
                    <div>
                        <label class="prop-label">Condition</label>
                        <select class="prop-select flow-config" data-config="conditionType">
                            <option value="equals">Equals</option>
                            <option value="not-equals">Not Equals</option>
                            <option value="greater">Greater Than</option>
                            <option value="less">Less Than</option>
                            <option value="contains">Contains</option>
                            <option value="empty">Is Empty</option>
                            <option value="visible">Is Visible</option>
                        </select>
                    </div>
                    <div>
                        <label class="prop-label">Value A</label>
                        <input type="text" class="prop-input flow-config" data-config="valueA" placeholder="Component ID or value">
                    </div>
                    <div>
                        <label class="prop-label">Value B</label>
                        <input type="text" class="prop-input flow-config" data-config="valueB" placeholder="Compare value">
                    </div>`;
            case 'action':
                return `
                    <div>
                        <label class="prop-label">Action Type</label>
                        <select class="prop-select flow-config" data-config="actionType">
                            <option value="addClass">Add Class</option>
                            <option value="removeClass">Remove Class</option>
                            <option value="toggleClass">Toggle Class</option>
                            <option value="setStyle">Set Style</option>
                            <option value="setAttribute">Set Attribute</option>
                            <option value="alert">Show Alert</option>
                            <option value="log">Console Log</option>
                        </select>
                    </div>
                    <div>
                        <label class="prop-label">Target</label>
                        <input type="text" class="prop-input flow-config" data-config="target" placeholder="Component ID">
                    </div>
                    <div>
                        <label class="prop-label">Value</label>
                        <input type="text" class="prop-input flow-config" data-config="value" placeholder="Value">
                    </div>`;
            case 'navigate':
                return `
                    <div>
                        <label class="prop-label">Navigate To</label>
                        <select class="prop-select flow-config" data-config="navigateTo">
                            <option value="">Select Page...</option>
                        </select>
                    </div>`;
            case 'set-value':
                return `
                    <div>
                        <label class="prop-label">Target Component</label>
                        <input type="text" class="prop-input flow-config" data-config="target" placeholder="Component ID">
                    </div>
                    <div>
                        <label class="prop-label">Property</label>
                        <select class="prop-select flow-config" data-config="property">
                            <option value="text">Text Content</option>
                            <option value="value">Value</option>
                            <option value="src">Image Source</option>
                            <option value="href">Link URL</option>
                            <option value="class">CSS Class</option>
                        </select>
                    </div>
                    <div>
                        <label class="prop-label">New Value</label>
                        <input type="text" class="prop-input flow-config" data-config="newValue" placeholder="New value">
                    </div>`;
            case 'get-value':
                return `
                    <div>
                        <label class="prop-label">Source Component</label>
                        <input type="text" class="prop-input flow-config" data-config="source" placeholder="Component ID">
                    </div>
                    <div>
                        <label class="prop-label">Property</label>
                        <select class="prop-select flow-config" data-config="property">
                            <option value="text">Text Content</option>
                            <option value="value">Value</option>
                            <option value="checked">Checked State</option>
                        </select>
                    </div>
                    <div>
                        <label class="prop-label">Store As Variable</label>
                        <input type="text" class="prop-input flow-config" data-config="variable" placeholder="Variable name">
                    </div>`;
            case 'show-hide':
                return `
                    <div>
                        <label class="prop-label">Target Component</label>
                        <input type="text" class="prop-input flow-config" data-config="target" placeholder="Component ID">
                    </div>
                    <div>
                        <label class="prop-label">Action</label>
                        <select class="prop-select flow-config" data-config="showHideAction">
                            <option value="show">Show</option>
                            <option value="hide">Hide</option>
                            <option value="toggle">Toggle</option>
                            <option value="fadeIn">Fade In</option>
                            <option value="fadeOut">Fade Out</option>
                        </select>
                    </div>`;
            case 'api-call':
                return `
                    <div>
                        <label class="prop-label">Method</label>
                        <select class="prop-select flow-config" data-config="method">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <div>
                        <label class="prop-label">URL</label>
                        <input type="text" class="prop-input flow-config" data-config="url" placeholder="https://api.example.com/data">
                    </div>`;
            case 'delay':
                return `
                    <div>
                        <label class="prop-label">Duration (ms)</label>
                        <input type="number" class="prop-input flow-config" data-config="duration" placeholder="1000" value="1000">
                    </div>`;
            case 'loop':
                return `
                    <div>
                        <label class="prop-label">Loop Type</label>
                        <select class="prop-select flow-config" data-config="loopType">
                            <option value="count">Count</option>
                            <option value="forEach">For Each</option>
                            <option value="while">While</option>
                        </select>
                    </div>
                    <div>
                        <label class="prop-label">Iterations</label>
                        <input type="number" class="prop-input flow-config" data-config="iterations" placeholder="10" value="10">
                    </div>`;
            default:
                return '';
        }
    },

    selectNode: function (nodeId) {
        this.deselectAll();
        this.selectedNode = nodeId;
        $(`#${nodeId}`).addClass('selected');

        const node = this.getNodeById(nodeId);
        if (!node) return;

        $('#flow-no-selection').addClass('hidden');
        $('#flow-properties-content').removeClass('hidden');
        $('#flow-node-label').val(node.label);

        // Show config
        const configHtml = this.getNodeConfigHtml(node.type);
        $('#flow-node-config').html(configHtml);

        // Populate config values
        Object.keys(node.config).forEach(key => {
            $(`#flow-node-config .flow-config[data-config="${key}"]`).val(node.config[key]);
        });

        // Listen for config changes
        const self = this;
        $('#flow-node-config .flow-config').on('change input', function () {
            const key = $(this).data('config');
            node.config[key] = $(this).val();
        });

        lucide.createIcons();
    },

    deselectAll: function () {
        this.selectedNode = null;
        $('.flow-node').removeClass('selected');
        $('#flow-no-selection').removeClass('hidden');
        $('#flow-properties-content').addClass('hidden');
    },

    deleteNode: function (nodeId) {
        // Remove connections
        this.connections = this.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
        // Remove node data
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        // Remove from DOM
        $(`#${nodeId}`).remove();
        this.deselectAll();
        this.redrawConnections();
        SysXApp.showToast('Node deleted', 'info');
    },

    addConnection: function (fromId, toId) {
        // Check if connection already exists
        const exists = this.connections.find(c => c.from === fromId && c.to === toId);
        if (exists) return;

        this.connections.push({ from: fromId, to: toId, id: `conn-${fromId}-${toId}` });
        this.redrawConnections();
        SysXApp.showToast('Connection created', 'success');
    },

    redrawConnections: function () {
        if (!this.svgConnections) return;

        // Clear existing
        while (this.svgConnections.firstChild) {
            this.svgConnections.removeChild(this.svgConnections.firstChild);
        }

        // Add arrow marker
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '10');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', '#6366f1');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        this.svgConnections.appendChild(defs);

        // Draw connections
        this.connections.forEach(conn => {
            const fromEl = document.getElementById(conn.from);
            const toEl = document.getElementById(conn.to);
            if (!fromEl || !toEl) return;

            const fromPort = fromEl.querySelector('.output-port');
            const toPort = toEl.querySelector('.input-port');
            if (!fromPort || !toPort) return;

            const canvas = document.getElementById('flowchart-canvas');
            const canvasRect = canvas.getBoundingClientRect();
            const wrapper = document.getElementById('flowchart-canvas-wrapper');

            const fromRect = fromPort.getBoundingClientRect();
            const toRect = toPort.getBoundingClientRect();

            const x1 = fromRect.left - canvasRect.left + wrapper.scrollLeft + fromRect.width / 2;
            const y1 = fromRect.top - canvasRect.top + wrapper.scrollTop + fromRect.height / 2;
            const x2 = toRect.left - canvasRect.left + wrapper.scrollLeft + toRect.width / 2;
            const y2 = toRect.top - canvasRect.top + wrapper.scrollTop + toRect.height / 2;

            // Create curved path
            const dx = Math.abs(x2 - x1) * 0.5;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
            path.setAttribute('d', d);
            path.setAttribute('stroke', '#6366f1');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            path.setAttribute('marker-end', 'url(#arrowhead)');
            path.style.pointerEvents = 'none';
            this.svgConnections.appendChild(path);
        });
    },

    getNodeById: function (id) {
        return this.nodes.find(n => n.id === id);
    },

    clearAll: function () {
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        $('#flowchart-canvas .flow-node').remove();
        this.redrawConnections();
        this.deselectAll();
        SysXApp.showToast('Flowchart cleared', 'info');
    },

    exportFlowData: function () {
        return {
            nodes: this.nodes,
            connections: this.connections
        };
    },

    importFlowData: function (data) {
        this.clearAll();
        if (data.nodes) {
            data.nodes.forEach(n => {
                this.nextNodeId = Math.max(this.nextNodeId, parseInt(n.id.replace('flow-node-', '')) + 1);
                // Re-add visual node
                this.nodes.push(n);
                // We'd need to re-create the DOM element
            });
        }
        if (data.connections) {
            this.connections = data.connections;
        }
        this.redrawConnections();
    }
};
