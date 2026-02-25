/**
 * DevToys - Tool Registry
 * Central metadata for every tool in the app.
 * Each tool: { id, name, description, icon, color, category, render(container), [gradient] }
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
  { id: 'cron-parser',       name: 'Cron Parser',              description: 'Parse & describe cron expressions',     icon: 'fas fa-clock',          gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'converters' },
  { id: 'date-converter',    name: 'Date',                     description: 'Convert between date formats',          icon: 'fas fa-calendar-alt',   gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', category: 'converters' },
  { id: 'json-table-csv',    name: 'JSON Array to Table, CSV', description: 'Convert JSON arrays to table or CSV',   icon: 'fas fa-table',          gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', category: 'converters' },
  { id: 'json-yaml',         name: 'JSON <> YAML',             description: 'Convert between JSON and YAML',         icon: 'fas fa-file-code',      gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', category: 'converters' },
  { id: 'number-base',       name: 'Number Base',              description: 'Convert between number bases',          icon: 'fas fa-hashtag',        gradient: 'linear-gradient(135deg,#fa709a,#fee140)', category: 'converters' },

  // ── Encoders / Decoders ──
  { id: 'base64-image',      name: 'Base64 Image',             description: 'Encode/decode images to Base64',        icon: 'fas fa-image',          gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', category: 'encoders' },
  { id: 'base64-text',       name: 'Base64 Text',              description: 'Encode/decode text to Base64',          icon: 'fas fa-file-alt',       gradient: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', category: 'encoders' },
  { id: 'certificate',       name: 'Certificate',              description: 'Decode X.509 certificates',             icon: 'fas fa-certificate',    gradient: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'encoders' },
  { id: 'gzip',              name: 'GZIP',                     description: 'Compress/decompress with GZIP',         icon: 'fas fa-file-archive',   gradient: 'linear-gradient(135deg,#89f7fe,#66a6ff)', category: 'encoders' },
  { id: 'html-encoder',      name: 'HTML',                     description: 'Encode/decode HTML entities',           icon: 'fab fa-html5',          gradient: 'linear-gradient(135deg,#f5576c,#ff6a88)', category: 'encoders' },
  { id: 'jwt-decoder',       name: 'JWT',                      description: 'Decode JSON Web Tokens',                icon: 'fas fa-key',            gradient: 'linear-gradient(135deg,#c471f5,#fa71cd)', category: 'encoders' },
  { id: 'qr-code',           name: 'QR Code',                  description: 'Generate QR codes from text',           icon: 'fas fa-qrcode',         gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'encoders' },
  { id: 'url-encoder',       name: 'URL',                      description: 'Encode/decode URL components',          icon: 'fas fa-link',           gradient: 'linear-gradient(135deg,#48c6ef,#6f86d6)', category: 'encoders' },

  // ── Formatters ──
  { id: 'json-formatter',    name: 'JSON',                     description: 'Format & minify JSON',                  icon: 'fas fa-code',           gradient: 'linear-gradient(135deg,#f9d423,#ff4e50)', category: 'formatters' },
  { id: 'sql-formatter',     name: 'SQL',                      description: 'Format SQL queries',                    icon: 'fas fa-database',       gradient: 'linear-gradient(135deg,#0acffe,#495aff)', category: 'formatters' },
  { id: 'xml-formatter',     name: 'XML',                      description: 'Format & minify XML',                   icon: 'fas fa-file-code',      gradient: 'linear-gradient(135deg,#e8198b,#c7eafd)', category: 'formatters' },

  // ── Generators ──
  { id: 'hash-generator',    name: 'Hash / Checksum',          description: 'Generate MD5, SHA hashes',              icon: 'fas fa-fingerprint',    gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'generators' },
  { id: 'lorem-ipsum',       name: 'Lorem Ipsum',              description: 'Generate placeholder text',             icon: 'fas fa-paragraph',      gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', category: 'generators' },
  { id: 'password-gen',      name: 'Password',                 description: 'Generate secure passwords',             icon: 'fas fa-shield-alt',     gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', category: 'generators' },
  { id: 'uuid-gen',          name: 'UUID',                     description: 'Generate UUIDs / GUIDs',                icon: 'fas fa-barcode',        gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', category: 'generators' },

  // ── Text ──
  { id: 'escape-unescape',   name: 'Escape / Unescape',       description: 'Escape & unescape strings',             icon: 'fas fa-shield-alt',     gradient: 'linear-gradient(135deg,#ffecd2,#fcb69f)', category: 'text' },
  { id: 'list-comparer',     name: 'List Comparer',            description: 'Compare two lists of items',            icon: 'fas fa-list',           gradient: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)', category: 'text' },
  { id: 'markdown-preview',  name: 'Markdown Preview',         description: 'Preview Markdown in real-time',         icon: 'fab fa-markdown',       gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'text' },
  { id: 'text-analyzer',     name: 'Analyzer & Utilities',     description: 'Analyze text: words, chars, lines',     icon: 'fas fa-chart-bar',      gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', category: 'text' },
  { id: 'text-comparer',     name: 'Text Comparer',            description: 'Compare two texts side by side',        icon: 'fas fa-columns',        gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', category: 'text' },

  // ── Graphic ──
  { id: 'color-blind-sim',   name: 'Color Blind Simulator',    description: 'Simulate color blindness vision',       icon: 'fas fa-eye',            gradient: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'graphic' },
  { id: 'image-converter',   name: 'Image Converter',          description: 'Convert images between formats',        icon: 'fas fa-file-image',     gradient: 'linear-gradient(135deg,#89f7fe,#66a6ff)', category: 'graphic' },

  // ── Testers ──
  { id: 'jsonpath-tester',   name: 'JSONPath',                 description: 'Test JSONPath expressions',             icon: 'fas fa-search',         gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', category: 'testers' },
  { id: 'regex-tester',      name: 'Regular Expression',       description: 'Test regex patterns',                   icon: 'fas fa-asterisk',       gradient: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', category: 'testers' },
  { id: 'xml-xsd-tester',    name: 'XML / XSD',                description: 'Validate XML against XSD',              icon: 'fas fa-check-circle',   gradient: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'testers' },

  // ── Third Party ──
  { id: 'duplicate-detector', name: 'Duplicate Detector',      description: 'Find duplicate lines in text',          icon: 'fas fa-copy',           gradient: 'linear-gradient(135deg,#667eea,#764ba2)', category: 'thirdparty' },
  { id: 'file-splitter',      name: 'File Splitter',           description: 'Split text files by lines',             icon: 'fas fa-cut',            gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', category: 'thirdparty' },
  { id: 'json-schema',        name: 'JSON Schema',             description: 'Generate JSON Schema from data',        icon: 'fas fa-project-diagram',gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', category: 'thirdparty' },
  { id: 'json-to-php',        name: 'JSON to PHP',             description: 'Convert JSON to PHP array',             icon: 'fab fa-php',            gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', category: 'thirdparty' },
  { id: 'json-to-csharp',     name: 'JSON to C#',              description: 'Generate C# classes from JSON',         icon: 'fas fa-code',           gradient: 'linear-gradient(135deg,#fa709a,#fee140)', category: 'thirdparty' },
  { id: 'png-compressor',     name: 'PNG Compressor',          description: 'Compress PNG images client-side',       icon: 'fas fa-compress',       gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', category: 'thirdparty' },
  { id: 'randomizer',         name: 'Randomizer',              description: 'Random number, pick, shuffle',          icon: 'fas fa-dice',           gradient: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)', category: 'thirdparty' },
  { id: 'resx-translator',    name: 'RESX Translator',         description: 'Parse .resx XML resource files',        icon: 'fas fa-language',       gradient: 'linear-gradient(135deg,#f6d365,#fda085)', category: 'thirdparty' },
  { id: 'rsa-generator',      name: 'RSA Generator',           description: 'Generate RSA key pairs',               icon: 'fas fa-key',            gradient: 'linear-gradient(135deg,#89f7fe,#66a6ff)', category: 'thirdparty' },
  { id: 'semver-calculator',  name: 'Semver Calculator',       description: 'Parse & compare semver versions',       icon: 'fas fa-code-branch',    gradient: 'linear-gradient(135deg,#c471f5,#fa71cd)', category: 'thirdparty' },
  { id: 'text-delimiter',     name: 'Text Delimiter',          description: 'Add/remove text delimiters',            icon: 'fas fa-grip-lines',     gradient: 'linear-gradient(135deg,#48c6ef,#6f86d6)', category: 'thirdparty' },
  { id: 'ulid-generator',     name: 'ULID Generator',          description: 'Generate ULIDs',                       icon: 'fas fa-fingerprint',    gradient: 'linear-gradient(135deg,#f9d423,#ff4e50)', category: 'thirdparty' },
  { id: 'xsd-generator',      name: 'XSD Generator',           description: 'Generate XSD from XML',                icon: 'fas fa-sitemap',        gradient: 'linear-gradient(135deg,#0acffe,#495aff)', category: 'thirdparty' },
];

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
 * Utility: find a tool by ID
 */
function getToolById(id) {
  return TOOLS.find(t => t.id === id);
}

/**
 * Utility: search tools
 */
function searchTools(query) {
  const q = query.toLowerCase();
  return TOOLS.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  );
}
