/**
 * DevToys - Tool Registry
 * Central metadata for every tool in the app.
 * Each tool: { id, name, description, icon, color, category, keywords, render(container), [gradient] }
 */

const TOOL_CATEGORIES = [
  { id: 'converters',  name: 'Converters',          icon: 'fas fa-exchange-alt' },
  { id: 'encoders',    name: 'Encoders / Decoders',  icon: 'fas fa-lock' },
  { id: 'formatters',  name: 'Formatters',           icon: 'fas fa-indent' },
  { id: 'generators',  name: 'Generators',           icon: 'fas fa-magic' },
  { id: 'text',        name: 'Text',                 icon: 'fas fa-font' },
  { id: 'graphic',     name: 'Graphic',              icon: 'fas fa-palette' },
  { id: 'testers',     name: 'Testers',              icon: 'fas fa-flask' },
  { id: 'thirdparty',  name: 'Third Party',          icon: 'fas fa-puzzle-piece' },
];

const TOOLS = [
  // ── Converters ──
  { id: 'cron-parser',       name: 'Cron Parser',              description: 'Parse & describe cron expressions',     icon: 'fas fa-clock',          gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'converters',  keywords: ['crontab','schedule','timer','job'] },
  { id: 'date-converter',    name: 'Date',                     description: 'Convert between date formats',          icon: 'fas fa-calendar-alt',   gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', category: 'converters',  keywords: ['timestamp','unix','epoch','iso','time'] },
  { id: 'json-table-csv',    name: 'JSON Array to Table, CSV', description: 'Convert JSON arrays to table or CSV',   icon: 'fas fa-table',          gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', category: 'converters',  keywords: ['spreadsheet','data','export'] },
  { id: 'json-yaml',         name: 'JSON <> YAML',             description: 'Convert between JSON and YAML',         icon: 'fas fa-file-code',      gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', category: 'converters',  keywords: ['config','configuration','yml'] },
  { id: 'number-base',       name: 'Number Base',              description: 'Convert between number bases',          icon: 'fas fa-hashtag',        gradient: 'linear-gradient(135deg,#fa709a,#fee140)', category: 'converters',  keywords: ['binary','hex','hexadecimal','octal','decimal'] },

  // ── Encoders / Decoders ──
  { id: 'base64-image',      name: 'Base64 Image',             description: 'Encode/decode images to Base64',        icon: 'fas fa-image',          gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', category: 'encoders',    keywords: ['data uri','picture','photo','png','jpg'] },
  { id: 'base64-text',       name: 'Base64 Text',              description: 'Encode/decode text to Base64',          icon: 'fas fa-file-alt',       gradient: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', category: 'encoders',    keywords: ['encode','decode','btoa','atob'] },
  { id: 'certificate',       name: 'Certificate',              description: 'Decode X.509 certificates',             icon: 'fas fa-certificate',    gradient: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'encoders',    keywords: ['pem','x509','ssl','tls','cert','fingerprint'] },
  { id: 'gzip',              name: 'GZIP',                     description: 'Compress/decompress with GZIP',         icon: 'fas fa-file-archive',   gradient: 'linear-gradient(135deg,#89f7fe,#66a6ff)', category: 'encoders',    keywords: ['compress','decompress','zip','deflate'] },
  { id: 'html-encoder',      name: 'HTML',                     description: 'Encode/decode HTML entities',           icon: 'fab fa-html5',          gradient: 'linear-gradient(135deg,#f5576c,#ff6a88)', category: 'encoders',    keywords: ['entities','escape','amp','special characters'] },
  { id: 'jwt-decoder',       name: 'JWT',                      description: 'Decode JSON Web Tokens',                icon: 'fas fa-key',            gradient: 'linear-gradient(135deg,#c471f5,#fa71cd)', category: 'encoders',    keywords: ['token','auth','authorization','bearer','claims'] },
  { id: 'qr-code',           name: 'QR Code',                  description: 'Generate QR codes from text',           icon: 'fas fa-qrcode',         gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'encoders',    keywords: ['barcode','scan','link','url'] },
  { id: 'url-encoder',       name: 'URL',                      description: 'Encode/decode URL components',          icon: 'fas fa-link',           gradient: 'linear-gradient(135deg,#48c6ef,#6f86d6)', category: 'encoders',    keywords: ['percent','uri','query string','parameter'] },

  // ── Formatters ──
  { id: 'json-formatter',    name: 'JSON',                     description: 'Format & minify JSON',                  icon: 'fas fa-code',           gradient: 'linear-gradient(135deg,#f9d423,#ff4e50)', category: 'formatters',  keywords: ['prettify','beautify','indent','minify'] },
  { id: 'sql-formatter',     name: 'SQL',                      description: 'Format SQL queries',                    icon: 'fas fa-database',       gradient: 'linear-gradient(135deg,#0acffe,#495aff)', category: 'formatters',  keywords: ['query','database','select','mysql','postgres'] },
  { id: 'xml-formatter',     name: 'XML',                      description: 'Format & minify XML',                   icon: 'fas fa-file-code',      gradient: 'linear-gradient(135deg,#e8198b,#c7eafd)', category: 'formatters',  keywords: ['prettify','beautify','indent','soap'] },

  // ── Generators ──
  { id: 'hash-generator',    name: 'Hash / Checksum',          description: 'Generate MD5, SHA hashes',              icon: 'fas fa-fingerprint',    gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'generators',  keywords: ['md5','sha','sha256','sha512','checksum','digest'] },
  { id: 'lorem-ipsum',       name: 'Lorem Ipsum',              description: 'Generate placeholder text',             icon: 'fas fa-paragraph',      gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', category: 'generators',  keywords: ['dummy','filler','placeholder','text','lipsum'] },
  { id: 'password-gen',      name: 'Password',                 description: 'Generate secure passwords',             icon: 'fas fa-shield-alt',     gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', category: 'generators',  keywords: ['random','secure','strong','passphrase'] },
  { id: 'uuid-gen',          name: 'UUID',                     description: 'Generate UUIDs / GUIDs',                icon: 'fas fa-barcode',        gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', category: 'generators',  keywords: ['guid','unique','identifier','v4','v1'] },

  // ── Text ──
  { id: 'escape-unescape',   name: 'Escape / Unescape',       description: 'Escape & unescape strings',             icon: 'fas fa-shield-alt',     gradient: 'linear-gradient(135deg,#ffecd2,#fcb69f)', category: 'text',        keywords: ['json','html','url','xml','backslash','special'] },
  { id: 'list-comparer',     name: 'List Comparer',            description: 'Compare two lists of items',            icon: 'fas fa-list',           gradient: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)', category: 'text',        keywords: ['diff','difference','common','merge'] },
  { id: 'markdown-preview',  name: 'Markdown Preview',         description: 'Preview Markdown in real-time',         icon: 'fab fa-markdown',       gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'text',        keywords: ['md','readme','documentation','preview'] },
  { id: 'text-analyzer',     name: 'Analyzer & Utilities',     description: 'Analyze text: words, chars, lines',     icon: 'fas fa-chart-bar',      gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', category: 'text',        keywords: ['count','words','characters','frequency','case','uppercase','lowercase'] },
  { id: 'text-comparer',     name: 'Text Comparer',            description: 'Compare two texts side by side',        icon: 'fas fa-columns',        gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', category: 'text',        keywords: ['diff','merge','side by side','changes'] },

  // ── Graphic ──
  { id: 'color-blind-sim',   name: 'Color Blind Simulator',    description: 'Simulate color blindness vision',       icon: 'fas fa-eye',            gradient: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'graphic',     keywords: ['protanopia','deuteranopia','tritanopia','accessibility','a11y','vision'] },
  { id: 'image-converter',   name: 'Image Converter',          description: 'Convert images between formats',        icon: 'fas fa-file-image',     gradient: 'linear-gradient(135deg,#89f7fe,#66a6ff)', category: 'graphic',     keywords: ['png','jpg','jpeg','webp','bmp','resize'] },

  // ── Testers ──
  { id: 'jsonpath-tester',   name: 'JSONPath',                 description: 'Test JSONPath expressions',             icon: 'fas fa-search',         gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', category: 'testers',     keywords: ['query','jpath','xpath','selector'] },
  { id: 'regex-tester',      name: 'Regular Expression',       description: 'Test regex patterns',                   icon: 'fas fa-asterisk',       gradient: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', category: 'testers',     keywords: ['regexp','pattern','match','replace','test'] },
  { id: 'xml-xsd-tester',    name: 'XML / XSD',                description: 'Validate XML against XSD',              icon: 'fas fa-check-circle',   gradient: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'testers',     keywords: ['schema','validate','well-formed'] },

  // ── Third Party ──
  { id: 'duplicate-detector', name: 'Duplicate Detector',      description: 'Find duplicate lines in text',          icon: 'fas fa-copy',           gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'thirdparty', keywords: ['duplicates','unique','dedup','remove'] },
  { id: 'file-splitter',      name: 'File Splitter',           description: 'Split text files by lines',             icon: 'fas fa-cut',            gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', category: 'thirdparty', keywords: ['split','chunk','divide','parts'] },
  { id: 'json-schema',        name: 'JSON Schema',             description: 'Generate JSON Schema from data',        icon: 'fas fa-project-diagram',gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', category: 'thirdparty', keywords: ['schema','validate','draft07','infer'] },
  { id: 'json-to-php',        name: 'JSON to PHP',             description: 'Convert JSON to PHP array',             icon: 'fab fa-php',            gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', category: 'thirdparty', keywords: ['php','array','laravel','wordpress'] },
  { id: 'json-to-csharp',     name: 'JSON to C#',              description: 'Generate C# classes from JSON',         icon: 'fas fa-code',           gradient: 'linear-gradient(135deg,#fa709a,#fee140)', category: 'thirdparty', keywords: ['csharp','dotnet','class','model','poco'] },
  { id: 'png-compressor',     name: 'PNG Compressor',          description: 'Compress PNG images client-side',       icon: 'fas fa-compress',       gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', category: 'thirdparty', keywords: ['compress','optimize','image','reduce','size'] },
  { id: 'randomizer',         name: 'Randomizer',              description: 'Random number, pick, shuffle',          icon: 'fas fa-dice',           gradient: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', category: 'thirdparty', keywords: ['random','number','pick','shuffle','dice','lottery'] },
  { id: 'resx-translator',    name: 'RESX Translator',         description: 'Parse .resx XML resource files',        icon: 'fas fa-language',       gradient: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'thirdparty', keywords: ['resource','translation','localization','i18n','dotnet'] },
  { id: 'rsa-generator',      name: 'RSA Generator',           description: 'Generate RSA key pairs',               icon: 'fas fa-key',            gradient: 'linear-gradient(135deg,#89f7fe,#66a6ff)', category: 'thirdparty', keywords: ['key','keypair','public','private','encryption','crypto'] },
  { id: 'semver-calculator',  name: 'Semver Calculator',       description: 'Parse & compare semver versions',       icon: 'fas fa-code-branch',    gradient: 'linear-gradient(135deg,#c471f5,#fa71cd)', category: 'thirdparty', keywords: ['version','semantic','bump','major','minor','patch'] },
  { id: 'text-delimiter',     name: 'Text Delimiter',          description: 'Add/remove text delimiters',            icon: 'fas fa-grip-lines',     gradient: 'linear-gradient(135deg,#48c6ef,#6f86d6)', category: 'thirdparty', keywords: ['join','split','comma','csv','separator'] },
  { id: 'ulid-generator',     name: 'ULID Generator',          description: 'Generate ULIDs',                       icon: 'fas fa-fingerprint',    gradient: 'linear-gradient(135deg,#f9d423,#ff4e50)', category: 'thirdparty', keywords: ['unique','identifier','sortable','uuid alternative'] },
  { id: 'xsd-generator',      name: 'XSD Generator',           description: 'Generate XSD from XML',                icon: 'fas fa-sitemap',        gradient: 'linear-gradient(135deg,#0acffe,#495aff)', category: 'thirdparty', keywords: ['schema','xml','validation','generate'] },
];

// ── Pre-built search index for O(1)-ish lookups ──
const TOOL_MAP = new Map();
const SEARCH_INDEX = [];

(function buildIndex() {
  TOOLS.forEach(t => {
    TOOL_MAP.set(t.id, t);
    // Pre-compute normalized search text
    const searchText = [
      t.name,
      t.description,
      t.category,
      ...(t.keywords || [])
    ].join(' ').toLowerCase();
    SEARCH_INDEX.push({ tool: t, searchText });
  });
})();

/**
 * Utility: get tools grouped by category
 */
function getToolsByCategory() {
  const map = {};
  TOOL_CATEGORIES.forEach(c => map[c.id] = []);
  TOOLS.forEach(t => {
    if (map[t.category]) map[t.category].push(t);
  });
  return map;
}

/**
 * Utility: find a tool by ID (O(1) via Map)
 */
function getToolById(id) {
  return TOOL_MAP.get(id) || null;
}

/**
 * Utility: search tools using pre-built index
 */
function searchTools(query) {
  const q = query.toLowerCase();
  return SEARCH_INDEX
    .filter(entry => entry.searchText.includes(q))
    .map(entry => entry.tool);
}
