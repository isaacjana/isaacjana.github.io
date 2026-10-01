/**
 * DevToys - Web & Network Tools
 * URL Parser, HTTP Status Codes, cURL Converter, User-Agent Parser, IPv4 Subnet Calculator
 */

const WebTools = {

    // ── URL Parser ──
    'url-parser': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">URL</div>
            <input type="text" class="form-input text-mono" id="up-input" value="https://user:pass@api.example.com:8443/v1/users/42?sort=name&amp;order=asc&amp;tags=a&amp;tags=b#profile" placeholder="https://example.com/path?query=value">
          </div>
          <div class="tool-section">
            <div class="tool-section-title">Components</div>
            <div id="up-parts"></div>
          </div>
          <div class="tool-section">
            <div class="split-pane-header">
              <span class="tool-section-title mb-0">Query Parameters</span>
              <div class="btn-group">
                <button class="btn btn-secondary btn-sm" id="up-add"><i class="fas fa-plus"></i> Add</button>
                <button class="btn btn-ghost btn-sm" id="up-json"><i class="fas fa-copy"></i> Copy as JSON</button>
              </div>
            </div>
            <div id="up-params"></div>
          </div>
        </div>
      `);

            const PARTS = ['protocol', 'username', 'password', 'hostname', 'port', 'pathname', 'search', 'hash', 'origin'];
            let url = null;

            function parse() {
                const raw = $('#up-input').val().trim();
                try {
                    url = new URL(raw);
                    $('#up-input').css('border-color', '');
                } catch {
                    url = null;
                    $('#up-input').css('border-color', 'var(--accent-red)');
                    $('#up-parts').html('<span class="text-muted text-sm">Enter a valid absolute URL (including the scheme, e.g. https://).</span>');
                    $('#up-params').html('');
                    return;
                }
                renderParts();
                renderParams();
            }

            function renderParts() {
                let html = '<table class="result-table"><tbody>';
                PARTS.forEach(p => {
                    let value = url[p];
                    if (p === 'port' && !value) value = '(default)';
                    if (p === 'pathname') value = decodeURIComponent(value);
                    html += `<tr><td style="width:140px;color:var(--text-secondary)">${p}</td><td>${escHtml(value) || '<span class="text-muted">—</span>'}</td></tr>`;
                });
                const segments = url.pathname.split('/').filter(Boolean);
                if (segments.length) {
                    html += `<tr><td style="color:var(--text-secondary)">path segments</td><td>${segments.map(s => `<span class="badge badge-blue" style="margin:2px">${escHtml(decodeURIComponent(s))}</span>`).join('')}</td></tr>`;
                }
                html += '</tbody></table>';
                $('#up-parts').html(html);
            }

            function renderParams() {
                const entries = [...url.searchParams.entries()];
                if (!entries.length) {
                    $('#up-params').html('<span class="text-muted text-sm">No query parameters.</span>');
                    return;
                }
                let html = '<table class="result-table"><thead><tr><th>Key</th><th>Value</th><th style="width:40px"></th></tr></thead><tbody>';
                entries.forEach(([k, v], i) => {
                    html += `<tr data-i="${i}">
            <td><input class="form-input text-mono up-key" value="${escHtml(k)}"></td>
            <td><input class="form-input text-mono up-val" value="${escHtml(v)}"></td>
            <td><button class="btn btn-ghost btn-sm up-del" title="Remove"><i class="fas fa-times"></i></button></td>
          </tr>`;
                });
                html += '</tbody></table>';
                $('#up-params').html(html);
            }

            // Rebuild the URL from the editable parameter table
            function rebuildFromParams() {
                if (!url) return;
                const params = new URLSearchParams();
                $('#up-params tbody tr').each(function () {
                    const k = $(this).find('.up-key').val();
                    if (k) params.append(k, $(this).find('.up-val').val());
                });
                url.search = params.toString();
                $('#up-input').val(url.toString());
                renderParts();
            }

            $('#up-input').on('input', debounce(parse, 200));
            $('#up-params').on('input', '.up-key, .up-val', debounce(rebuildFromParams, 200));
            $('#up-params').on('click', '.up-del', function () {
                $(this).closest('tr').remove();
                rebuildFromParams();
                renderParams();
            });
            $('#up-add').on('click', () => {
                if (!url) return;
                url.searchParams.append('key', 'value');
                $('#up-input').val(url.toString());
                parse();
            });
            $('#up-json').on('click', () => {
                if (!url) return;
                const obj = {};
                for (const [k, v] of url.searchParams) {
                    if (k in obj) obj[k] = [].concat(obj[k], v);
                    else obj[k] = v;
                }
                copyToClipboard(JSON.stringify(obj, null, 2));
            });

            parse();
        }
    },

    // ── HTTP Status Codes ──
    'http-status': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="form-row">
              <div class="form-group">
                <input type="text" class="form-input" id="hs-search" placeholder="Search by code, name or description (e.g. 404, teapot, cache)...">
              </div>
              <div class="form-group" style="max-width:180px">
                <select class="form-select" id="hs-class">
                  <option value="">All classes</option>
                  <option value="1">1xx Informational</option>
                  <option value="2">2xx Success</option>
                  <option value="3">3xx Redirection</option>
                  <option value="4">4xx Client Error</option>
                  <option value="5">5xx Server Error</option>
                </select>
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div id="hs-list"></div>
          </div>
        </div>
      `);

            const BADGE = { 1: 'badge-purple', 2: 'badge-green', 3: 'badge-blue', 4: 'badge-orange', 5: 'badge-red' };

            function renderList() {
                const q = $('#hs-search').val().trim().toLowerCase();
                const cls = $('#hs-class').val();
                const rows = HTTP_STATUS_CODES.filter(([code, name, desc]) =>
                    (!cls || String(code)[0] === cls) &&
                    (!q || `${code} ${name} ${desc}`.toLowerCase().includes(q)));

                if (!rows.length) {
                    $('#hs-list').html('<span class="text-muted text-sm">No matching status codes.</span>');
                    return;
                }
                let html = '<table class="result-table"><thead><tr><th style="width:80px">Code</th><th style="width:220px">Name</th><th>Description</th></tr></thead><tbody>';
                rows.forEach(([code, name, desc]) => {
                    html += `<tr><td><span class="badge ${BADGE[String(code)[0]]}">${code}</span></td><td style="font-family:inherit;font-weight:600">${name}</td><td style="font-family:inherit;color:var(--text-secondary)">${desc}</td></tr>`;
                });
                html += '</tbody></table>';
                $('#hs-list').html(html);
            }

            $('#hs-search').on('input', debounce(renderList, 100));
            $('#hs-class').on('change', renderList);
            renderList();
            $('#hs-search').focus();
        }
    },

    // ── cURL Converter ──
    'curl-converter': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="tool-section-title">cURL Command</div>
            <textarea class="form-textarea" id="cc-input" style="min-height:120px" placeholder="curl https://api.example.com -H 'Accept: application/json'">curl -X POST 'https://api.example.com/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer abc123' \\
  -d '{"name":"Ada","role":"admin"}'</textarea>
          </div>
          <div class="tool-section">
            <div class="split-pane-header">
              <div class="tabs mb-0" id="cc-tabs">
                <button class="tab active" data-lang="fetch">JS fetch</button>
                <button class="tab" data-lang="axios">axios</button>
                <button class="tab" data-lang="python">Python requests</button>
                <button class="tab" data-lang="go">Go net/http</button>
                <button class="tab" data-lang="httpie">HTTPie</button>
              </div>
              <button class="btn btn-ghost btn-sm" id="cc-copy"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <textarea class="form-textarea tall text-mono" id="cc-output" readonly></textarea>
          </div>
        </div>
      `);

            let lang = 'fetch';

            function convert() {
                let req;
                try {
                    req = parseCurl($('#cc-input').val());
                } catch (e) {
                    $('#cc-output').val('// ' + e.message);
                    return;
                }
                $('#cc-output').val(CURL_GENERATORS[lang](req));
            }

            $('#cc-tabs').on('click', '.tab', function () {
                $('#cc-tabs .tab').removeClass('active');
                $(this).addClass('active');
                lang = $(this).data('lang');
                convert();
            });
            $('#cc-input').on('input', debounce(convert, 200));
            $('#cc-copy').on('click', () => copyToClipboard($('#cc-output').val()));
            convert();
        }
    },

    // ── User-Agent Parser ──
    'user-agent': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="split-pane-header">
              <span class="tool-section-title mb-0">User-Agent String</span>
              <button class="btn btn-ghost btn-sm" id="ua-mine"><i class="fas fa-user"></i> Use mine</button>
            </div>
            <textarea class="form-textarea text-mono" id="ua-input" style="min-height:80px"></textarea>
          </div>
          <div class="tool-section">
            <div id="ua-result" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px"></div>
          </div>
        </div>
      `);

            function render() {
                const info = parseUserAgent($('#ua-input').val());
                const cards = [
                    ['Browser', info.browser], ['Engine', info.engine], ['OS', info.os],
                    ['Device', info.device], ['Bot', info.bot ? 'Yes' : 'No'],
                ];
                $('#ua-result').html(cards.map(([label, value]) =>
                    `<div class="stat-card"><div class="stat-value" style="font-size:16px">${escHtml(value || 'Unknown')}</div><div class="stat-label">${label}</div></div>`).join(''));
            }

            $('#ua-input').on('input', debounce(render, 150));
            $('#ua-mine').on('click', () => { $('#ua-input').val(navigator.userAgent); render(); });
            $('#ua-input').val(navigator.userAgent);
            render();
        }
    },

    // ── IPv4 Subnet Calculator ──
    'ip-subnet': {
        render(container) {
            container.html(`
        <div class="tool-page">
          <div class="tool-section">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">IPv4 address / CIDR</label>
                <input type="text" class="form-input text-mono" id="ips-input" value="192.168.10.37/26" placeholder="10.0.0.0/8 or 10.0.0.1 255.255.255.0">
              </div>
            </div>
          </div>
          <div class="tool-section">
            <div id="ips-result"></div>
          </div>
        </div>
      `);

            function calc() {
                let res;
                try {
                    res = calcSubnet($('#ips-input').val());
                } catch (e) {
                    $('#ips-result').html(`<span class="text-sm" style="color:var(--accent-red)">${escHtml(e.message)}</span>`);
                    return;
                }
                const rows = [
                    ['Address', res.address], ['Network', `${res.network}/${res.prefix}`], ['Netmask', res.netmask],
                    ['Wildcard', res.wildcard], ['Broadcast', res.broadcast], ['First host', res.firstHost],
                    ['Last host', res.lastHost], ['Usable hosts', res.usable.toLocaleString()],
                    ['Total addresses', res.total.toLocaleString()], ['Class', res.ipClass],
                    ['Type', res.isPrivate ? 'Private (RFC 1918)' : res.type], ['Binary netmask', res.binaryMask],
                    ['Hex address', res.hex],
                ];
                $('#ips-result').html('<table class="result-table"><tbody>' +
                    rows.map(([k, v]) => `<tr><td style="width:160px;color:var(--text-secondary)">${k}</td><td>${escHtml(v)}</td></tr>`).join('') +
                    '</tbody></table>');
            }

            $('#ips-input').on('input', debounce(calc, 150));
            calc();
        }
    },
};

// ── HTTP status code data: [code, name, description] ──
const HTTP_STATUS_CODES = [
    [100, 'Continue', 'The client should continue the request or ignore this response if already finished.'],
    [101, 'Switching Protocols', 'The server is switching protocols as requested by the client (e.g. WebSocket upgrade).'],
    [102, 'Processing', 'WebDAV: the server has received and is processing the request, but no response is available yet.'],
    [103, 'Early Hints', 'Lets the user agent start preloading resources while the server prepares a response.'],
    [200, 'OK', 'The request succeeded.'],
    [201, 'Created', 'The request succeeded and a new resource was created. Usually the result of POST or PUT.'],
    [202, 'Accepted', 'The request has been received but not yet acted upon (async processing).'],
    [203, 'Non-Authoritative Information', 'The returned metadata is from a local or third-party copy, not the origin server.'],
    [204, 'No Content', 'There is no content to send for this request, but headers may be useful.'],
    [205, 'Reset Content', 'Tells the user agent to reset the document which sent this request.'],
    [206, 'Partial Content', 'Used when the Range header is sent to request only part of a resource.'],
    [207, 'Multi-Status', 'WebDAV: conveys information about multiple resources.'],
    [208, 'Already Reported', 'WebDAV: members of a binding were already enumerated in a previous reply.'],
    [226, 'IM Used', 'The server fulfilled a GET request with instance-manipulations applied (delta encoding).'],
    [300, 'Multiple Choices', 'The request has more than one possible response; the user agent should choose one.'],
    [301, 'Moved Permanently', 'The URL of the requested resource has been changed permanently. Method may change to GET.'],
    [302, 'Found', 'The resource is temporarily at a different URI. Method may change to GET.'],
    [303, 'See Other', 'The client should GET the resource at another URI (e.g. after a POST).'],
    [304, 'Not Modified', 'Used for caching: the response has not been modified, so the cached version can be used.'],
    [307, 'Temporary Redirect', 'The resource is temporarily at another URI; the method and body must not change.'],
    [308, 'Permanent Redirect', 'The resource is permanently at another URI; the method and body must not change.'],
    [400, 'Bad Request', 'The server cannot process the request due to a client error (malformed syntax, invalid framing).'],
    [401, 'Unauthorized', 'Authentication is required and has failed or not been provided.'],
    [402, 'Payment Required', 'Reserved for future use; sometimes used by payment or quota systems.'],
    [403, 'Forbidden', 'The client is authenticated but does not have access rights to the content.'],
    [404, 'Not Found', 'The server cannot find the requested resource.'],
    [405, 'Method Not Allowed', 'The request method is known but not supported by the target resource.'],
    [406, 'Not Acceptable', 'No content matches the criteria given by the Accept headers.'],
    [407, 'Proxy Authentication Required', 'Authentication must be done by a proxy.'],
    [408, 'Request Timeout', 'The server timed out waiting for the request.'],
    [409, 'Conflict', 'The request conflicts with the current state of the server (e.g. edit conflict).'],
    [410, 'Gone', 'The resource has been permanently deleted and will not be available again.'],
    [411, 'Length Required', 'The server requires a Content-Length header.'],
    [412, 'Precondition Failed', 'Preconditions in headers such as If-Match were not met.'],
    [413, 'Content Too Large', 'The request body is larger than the server is willing to process.'],
    [414, 'URI Too Long', 'The URI requested is longer than the server is willing to interpret.'],
    [415, 'Unsupported Media Type', 'The media format of the request body is not supported.'],
    [416, 'Range Not Satisfiable', 'The range in the Range header cannot be fulfilled.'],
    [417, 'Expectation Failed', 'The expectation in the Expect header cannot be met.'],
    [418, "I'm a teapot", 'The server refuses to brew coffee because it is, permanently, a teapot (RFC 2324).'],
    [421, 'Misdirected Request', 'The request was directed at a server unable to produce a response.'],
    [422, 'Unprocessable Content', 'The request was well-formed but has semantic errors (common for validation failures).'],
    [423, 'Locked', 'WebDAV: the resource being accessed is locked.'],
    [424, 'Failed Dependency', 'WebDAV: the request failed because a previous request failed.'],
    [425, 'Too Early', 'The server is unwilling to process a request that might be replayed.'],
    [426, 'Upgrade Required', 'The client should switch to a different protocol given in the Upgrade header.'],
    [428, 'Precondition Required', 'The server requires the request to be conditional (prevents lost updates).'],
    [429, 'Too Many Requests', 'The user has sent too many requests in a given amount of time (rate limiting).'],
    [431, 'Request Header Fields Too Large', 'The request header fields are too large.'],
    [451, 'Unavailable For Legal Reasons', 'The resource cannot legally be provided (e.g. censorship).'],
    [500, 'Internal Server Error', 'The server encountered an unexpected condition.'],
    [501, 'Not Implemented', 'The request method is not supported by the server.'],
    [502, 'Bad Gateway', 'A gateway or proxy received an invalid response from the upstream server.'],
    [503, 'Service Unavailable', 'The server is not ready to handle the request (overloaded or down for maintenance).'],
    [504, 'Gateway Timeout', 'A gateway or proxy did not get a response from the upstream server in time.'],
    [505, 'HTTP Version Not Supported', 'The HTTP version used in the request is not supported.'],
    [506, 'Variant Also Negotiates', 'The server has an internal configuration error in content negotiation.'],
    [507, 'Insufficient Storage', 'WebDAV: the server is unable to store the representation.'],
    [508, 'Loop Detected', 'WebDAV: the server detected an infinite loop while processing the request.'],
    [510, 'Not Extended', 'Further extensions to the request are required.'],
    [511, 'Network Authentication Required', 'The client needs to authenticate to gain network access (captive portal).'],
];

// ── cURL Helpers ──

// Split a shell command into arguments, honoring quotes and line continuations
function tokenizeShell(cmd) {
    const tokens = [];
    let cur = '', quote = null, hasToken = false;
    cmd = cmd.replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' ');
    for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (quote) {
            if (c === quote) quote = null;
            else if (c === '\\' && quote === '"' && i + 1 < cmd.length) cur += cmd[++i];
            else cur += c;
        } else if (c === "'" || c === '"') {
            quote = c; hasToken = true;
        } else if (c === '\\' && i + 1 < cmd.length) {
            cur += cmd[++i]; hasToken = true;
        } else if (/\s/.test(c)) {
            if (hasToken) { tokens.push(cur); cur = ''; hasToken = false; }
        } else {
            cur += c; hasToken = true;
        }
    }
    if (quote) throw new Error('Unterminated quote in command');
    if (hasToken) tokens.push(cur);
    return tokens;
}

function parseCurl(cmd) {
    const tokens = tokenizeShell(cmd.trim());
    if (tokens[0] !== 'curl') throw new Error('Command must start with "curl"');

    const req = { method: null, url: null, headers: [], data: null, auth: null };
    const dataParts = [];
    const takesValue = new Set(['-o', '--output', '-A', '--user-agent', '-e', '--referer', '-b', '--cookie', '--connect-timeout', '-m', '--max-time', '-x', '--proxy']);

    for (let i = 1; i < tokens.length; i++) {
        const t = tokens[i];
        const next = () => tokens[++i];
        if (t === '-X' || t === '--request') req.method = next().toUpperCase();
        else if (t === '-H' || t === '--header') {
            const h = next();
            const idx = h.indexOf(':');
            if (idx > 0) req.headers.push([h.slice(0, idx).trim(), h.slice(idx + 1).trim()]);
        }
        else if (['-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--json'].includes(t)) {
            dataParts.push(next());
            if (t === '--json') {
                req.headers.push(['Content-Type', 'application/json'], ['Accept', 'application/json']);
            }
        }
        else if (t === '--data-urlencode') dataParts.push(next());
        else if (t === '-u' || t === '--user') req.auth = next();
        else if (t === '-A' || t === '--user-agent') req.headers.push(['User-Agent', next()]);
        else if (t === '-b' || t === '--cookie') req.headers.push(['Cookie', next()]);
        else if (t === '-e' || t === '--referer') req.headers.push(['Referer', next()]);
        else if (t === '-I' || t === '--head') req.method = 'HEAD';
        else if (t === '--url') req.url = next();
        else if (takesValue.has(t)) next();
        else if (!t.startsWith('-') && !req.url) req.url = t;
    }

    if (!req.url) throw new Error('No URL found in command');
    if (dataParts.length) req.data = dataParts.join('&');
    if (!req.method) req.method = req.data ? 'POST' : 'GET';
    if (req.data && !req.headers.some(([k]) => k.toLowerCase() === 'content-type')) {
        req.headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
    }
    if (req.auth) req.headers.push(['Authorization', 'Basic ' + btoa(req.auth)]);
    return req;
}

function isJsonBody(req) {
    if (!req.data) return false;
    try { JSON.parse(req.data); return true; } catch { return false; }
}

const CURL_GENERATORS = {
    fetch(req) {
        const opts = [`  method: '${req.method}'`];
        if (req.headers.length) {
            opts.push(`  headers: {\n${req.headers.map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n  }`);
        }
        if (req.data) {
            opts.push(isJsonBody(req)
                ? `  body: JSON.stringify(${JSON.stringify(JSON.parse(req.data), null, 2).replace(/\n/g, '\n  ')})`
                : `  body: ${JSON.stringify(req.data)}`);
        }
        return `const response = await fetch(${JSON.stringify(req.url)}, {\n${opts.join(',\n')}\n});\n\nconst data = await response.json();\nconsole.log(data);`;
    },
    axios(req) {
        const lines = [`  method: '${req.method.toLowerCase()}'`, `  url: ${JSON.stringify(req.url)}`];
        if (req.headers.length) {
            lines.push(`  headers: {\n${req.headers.map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n  }`);
        }
        if (req.data) {
            lines.push(isJsonBody(req)
                ? `  data: ${JSON.stringify(JSON.parse(req.data), null, 2).replace(/\n/g, '\n  ')}`
                : `  data: ${JSON.stringify(req.data)}`);
        }
        return `import axios from 'axios';\n\nconst { data } = await axios({\n${lines.join(',\n')}\n});\nconsole.log(data);`;
    },
    python(req) {
        const out = ['import requests', ''];
        const args = [JSON.stringify(req.url)];
        const headers = req.headers.filter(([k]) => !(isJsonBody(req) && k.toLowerCase() === 'content-type'));
        if (headers.length) {
            out.push('headers = {', ...headers.map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`), '}', '');
            args.push('headers=headers');
        }
        if (req.data) {
            if (isJsonBody(req)) {
                out.push(`payload = ${pyLiteral(JSON.parse(req.data), 0)}`, '');
                args.push('json=payload');
            } else {
                out.push(`data = ${JSON.stringify(req.data)}`, '');
                args.push('data=data');
            }
        }
        out.push(`response = requests.${req.method.toLowerCase()}(${args.join(', ')})`, 'response.raise_for_status()', 'print(response.json())');
        return out.join('\n');
    },
    go(req) {
        const body = req.data ? `strings.NewReader(${goString(req.data)})` : 'nil';
        const imports = ['"fmt"', '"io"', '"net/http"'];
        if (req.data) imports.push('"strings"');
        const headerLines = req.headers.map(([k, v]) => `\treq.Header.Set(${goString(k)}, ${goString(v)})`).join('\n');
        return `package main

import (
${imports.map(i => '\t' + i).join('\n')}
)

func main() {
\treq, err := http.NewRequest(${goString(req.method)}, ${goString(req.url)}, ${body})
\tif err != nil {
\t\tpanic(err)
\t}
${headerLines ? headerLines + '\n' : ''}
\tresp, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()

\tbody, _ := io.ReadAll(resp.Body)
\tfmt.Println(resp.Status, string(body))
}`;
    },
    httpie(req) {
        const q = s => `'${s.replace(/'/g, `'\\''`)}'`;
        const parts = ['http', req.method, q(req.url)];
        req.headers.forEach(([k, v]) => parts.push(q(`${k}:${v}`)));
        let cmd = parts.join(' ');
        if (req.data) cmd = `echo ${q(req.data)} | ${cmd}`;
        return cmd;
    },
};

function goString(s) {
    return s.includes('`') ? JSON.stringify(s) : '`' + s + '`';
}

function pyLiteral(v, depth) {
    const pad = '    '.repeat(depth + 1), end = '    '.repeat(depth);
    if (v === null) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (Array.isArray(v)) {
        if (!v.length) return '[]';
        return '[\n' + v.map(x => pad + pyLiteral(x, depth + 1)).join(',\n') + '\n' + end + ']';
    }
    if (typeof v === 'object') {
        const keys = Object.keys(v);
        if (!keys.length) return '{}';
        return '{\n' + keys.map(k => `${pad}${JSON.stringify(k)}: ${pyLiteral(v[k], depth + 1)}`).join(',\n') + '\n' + end + '}';
    }
    return JSON.stringify(v);
}

// ── User-Agent Helper ──
function parseUserAgent(ua) {
    const info = { browser: '', engine: '', os: '', device: 'Desktop', bot: false };
    if (!ua) return info;

    const m = (re) => ua.match(re);
    let r;

    if ((r = m(/[\w.-]*(bot|crawler|spider|slurp|curl|wget|python-requests|postman)[\w\/.-]*/i))) {
        info.bot = true;
        info.browser = r[0];
    }

    if (!info.browser) {
        if ((r = m(/Edg(?:e|A|iOS)?\/([\d.]+)/))) info.browser = 'Microsoft Edge ' + r[1];
        else if ((r = m(/OPR\/([\d.]+)/))) info.browser = 'Opera ' + r[1];
        else if ((r = m(/SamsungBrowser\/([\d.]+)/))) info.browser = 'Samsung Internet ' + r[1];
        else if ((r = m(/(?:Firefox|FxiOS)\/([\d.]+)/))) info.browser = 'Firefox ' + r[1];
        else if ((r = m(/(?:Chrome|CriOS)\/([\d.]+)/))) info.browser = 'Chrome ' + r[1];
        else if ((r = m(/Version\/([\d.]+).*Safari/))) info.browser = 'Safari ' + r[1];
        else if ((r = m(/MSIE ([\d.]+)|Trident\/.*rv:([\d.]+)/))) info.browser = 'Internet Explorer ' + (r[1] || r[2]);
    }

    if ((r = m(/AppleWebKit\/([\d.]+)/))) info.engine = /Chrome|CriOS|Edg|OPR/.test(ua) ? 'Blink' : 'WebKit ' + r[1];
    else if (/Gecko\/\d/.test(ua) && (r = m(/rv:([\d.]+)/))) info.engine = 'Gecko ' + r[1];
    else if (/Trident/.test(ua)) info.engine = 'Trident';

    if ((r = m(/Windows NT ([\d.]+)/))) {
        const map = { '10.0': '10 / 11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP' };
        info.os = 'Windows ' + (map[r[1]] || r[1]);
    }
    else if ((r = m(/(?:iPhone|CPU) OS ([\d_]+)/))) info.os = 'iOS ' + r[1].replace(/_/g, '.');
    else if ((r = m(/Mac OS X ([\d_.]+)/))) info.os = 'macOS ' + r[1].replace(/_/g, '.');
    else if ((r = m(/Android ([\d.]+)/))) info.os = 'Android ' + r[1];
    else if (/CrOS/.test(ua)) info.os = 'ChromeOS';
    else if (/Linux/.test(ua)) info.os = 'Linux';

    if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) info.device = 'Tablet';
    else if (/Mobi|iPhone|Android/.test(ua)) info.device = 'Mobile';
    if (info.bot) info.device = 'Bot / Script';

    return info;
}

// ── IPv4 Subnet Helper ──
function calcSubnet(input) {
    const ipToInt = ip => {
        const parts = ip.split('.');
        if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p) || +p > 255)) throw new Error(`Invalid IPv4 address: ${ip}`);
        return parts.reduce((acc, p) => (acc * 256) + +p, 0);
    };
    const intToIp = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');

    const [ipPart, maskPart = '32'] = input.trim().split(/\s*\/\s*|\s+/);
    const ip = ipToInt(ipPart);

    let prefix;
    if (/^\d{1,2}$/.test(maskPart)) {
        prefix = +maskPart;
        if (prefix > 32) throw new Error('Prefix must be between 0 and 32');
    } else {
        const m = ipToInt(maskPart);
        const bin = m.toString(2).padStart(32, '0');
        if (!/^1*0*$/.test(bin)) throw new Error('Netmask must be contiguous (e.g. 255.255.255.0)');
        prefix = bin.indexOf('0') === -1 ? 32 : bin.indexOf('0');
    }

    const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix >= 31 ? total : total - 2;
    const first = prefix >= 31 ? network : network + 1;
    const last = prefix >= 31 ? broadcast : broadcast - 1;

    const o1 = ip >>> 24;
    const ipClass = o1 < 128 ? 'A' : o1 < 192 ? 'B' : o1 < 224 ? 'C' : o1 < 240 ? 'D (multicast)' : 'E (reserved)';
    const isPrivate = o1 === 10 || (o1 === 172 && ((ip >>> 16) & 255) >= 16 && ((ip >>> 16) & 255) <= 31) || (o1 === 192 && ((ip >>> 16) & 255) === 168);
    const type = o1 === 127 ? 'Loopback' : (o1 === 169 && ((ip >>> 16) & 255) === 254) ? 'Link-local' : (o1 === 100 && ((ip >>> 16) & 255) >= 64 && ((ip >>> 16) & 255) <= 127) ? 'Shared (CGNAT)' : o1 >= 224 ? 'Multicast / Reserved' : 'Public';

    return {
        address: intToIp(ip), network: intToIp(network), prefix, netmask: intToIp(mask),
        wildcard: intToIp(~mask >>> 0), broadcast: intToIp(broadcast),
        firstHost: intToIp(first), lastHost: intToIp(last), usable, total, ipClass, isPrivate, type,
        binaryMask: mask.toString(2).padStart(32, '0').match(/.{8}/g).join('.'),
        hex: '0x' + ip.toString(16).toUpperCase().padStart(8, '0'),
    };
}
