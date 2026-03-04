/**
 * words.js — Word pools for TypeWarrior
 * Contains common English words and code snippets for Developer Mode.
 */

export const ENGLISH_WORDS = [
    // Top 200 common English words for typing tests
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
    "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "her", "she", "or",
    "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about",
    "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know",
    "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than",
    "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two",
    "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give",
    "day", "most", "us", "great", "between", "need", "large", "often", "those", "turn", "long", "more",
    "write", "been", "had", "each", "made", "find", "here", "thing", "many", "right", "still", "own",
    "say", "help", "through", "much", "before", "line", "too", "mean", "old", "move", "same", "tell",
    "does", "set", "three", "hand", "high", "keep", "last", "let", "begin", "life", "under", "should",
    "never", "state", "while", "found", "world", "again", "run", "point", "went", "city", "every",
    "read", "why", "few", "might", "part", "real", "place", "around", "small", "home", "end", "head",
    "study", "water", "room", "mother", "light", "country", "follow", "father", "door", "night", "car",
    "close", "give", "hard", "question", "play", "change", "off", "press", "learn", "power", "kind",
    "hold", "sure", "such", "open", "side", "once", "seem", "mind", "house", "love", "page", "stand",
    "left", "start", "story", "watch", "young", "stop", "face", "area", "leave", "game", "plan", "air",
    "group", "sound", "idea", "name", "number", "problem", "fact", "system", "program", "human", "party",
    "result", "level", "market", "money", "form", "order", "company", "build", "force", "call", "land",
    "type", "school", "late", "class", "test", "case", "cover", "hit", "raise", "base", "try", "eye",
    "else", "pass", "full", "body", "clear", "best", "however", "act", "war", "quite", "special", "age",
    "above", "able", "rate", "record", "table", "early", "position", "nothing", "speak", "model", "next",
    "happy", "paper", "short", "course", "return", "voice", "cut", "white", "several", "less", "road",
    "sure", "bring", "already", "both", "along", "note", "care", "during", "whose", "cost", "second",
    "figure", "field", "consider", "girl", "boy", "morning", "week", "toward", "believe", "child", "cup",
    "window", "simple", "woman", "against", "local", "free", "music", "across", "river", "blue", "art",
    "fish", "bit", "color", "heart", "sun", "tree", "food", "nature", "book", "rain", "fire", "past",
    "rock", "earth", "wind", "stone", "sea", "dark", "warm", "cold", "fast", "slow", "deep", "wide",
    "bright", "wild", "black", "green", "red", "gold", "silver", "soft", "sharp", "calm", "sweet", "rich",
    "dream", "hope", "fear", "luck", "brave", "smile", "laugh", "dance", "sing", "sleep", "walk", "jump",
    "climb", "swim", "sail", "drive", "build", "grow", "break", "push", "pull", "lift", "drop", "throw",
    "catch", "hold", "touch", "feel", "watch", "hear", "speak", "think", "know", "learn", "teach", "show",
    "hide", "seek", "choose", "decide", "accept", "agree", "allow", "avoid", "begin", "carry", "change",
    "create", "design", "develop", "enjoy", "explore", "finish", "focus", "handle", "improve", "join",
    "manage", "notice", "offer", "prepare", "provide", "reach", "receive", "remain", "serve", "solve",
    "support", "travel", "understand", "value", "wonder", "achieve", "believe", "compare", "control",
    "deliver", "discover", "discuss", "express", "forget", "gather", "imagine", "include", "involve",
    "measure", "mention", "observe", "perform", "prefer", "protect", "realize", "reflect", "remove",
    "replace", "require", "respond", "reveal", "select", "suggest", "survive", "complete", "consider",
    "continue", "determine", "establish", "experience", "identify", "indicate", "introduce", "maintain",
    "operate", "organize", "recognize", "recommend", "represent", "separate", "communicate", "appreciate"
];

export const CODE_SNIPPETS = [
    // JavaScript snippets
    "function greet(name) {",
    "  return `Hello, ${name}!`;",
    "}",
    "const sum = (a, b) => a + b;",
    "let items = [1, 2, 3, 4, 5];",
    "items.filter(x => x > 2);",
    "items.map(x => x * 2);",
    "items.reduce((a, b) => a + b, 0);",
    "console.log('Hello World');",
    "if (x > 10) {",
    "  return true;",
    "} else {",
    "  return false;",
    "}",
    "for (let i = 0; i < n; i++) {",
    "  arr.push(i * 2);",
    "}",
    "while (queue.length > 0) {",
    "  process(queue.shift());",
    "}",
    "class User {",
    "  constructor(name, email) {",
    "    this.name = name;",
    "    this.email = email;",
    "  }",
    "  greet() {",
    "    return `Hi, ${this.name}`;",
    "  }",
    "}",
    "const fetchData = async () => {",
    "  const res = await fetch(url);",
    "  const data = await res.json();",
    "  return data;",
    "};",
    "try {",
    "  parseJSON(input);",
    "} catch (err) {",
    "  console.error(err.message);",
    "}",
    "export default App;",
    "import React from 'react';",
    "const [count, setCount] = useState(0);",
    "useEffect(() => {",
    "  fetchData();",
    "}, []);",
    "document.querySelector('.btn');",
    "element.addEventListener('click', handler);",
    "setTimeout(() => callback(), 1000);",
    "Promise.all([p1, p2, p3]);",
    "Object.keys(obj).forEach(key => {",
    "  console.log(key, obj[key]);",
    "});",
    "const { name, age } = person;",
    "const copy = [...original];",
    "const merged = { ...obj1, ...obj2 };",
    "arr.find(item => item.id === id);",
    "arr.some(item => item.active);",
    "arr.every(item => item.valid);",
    "new Map([['a', 1], ['b', 2]]);",
    "new Set([1, 2, 3, 3, 4]);",
    "JSON.stringify(data, null, 2);",
    "JSON.parse(localStorage.getItem('key'));",

    // HTML snippets
    "<div class='container'>",
    "  <h1>Title</h1>",
    "  <p>Content here</p>",
    "</div>",
    "<a href='/page' target='_blank'>Link</a>",
    "<img src='photo.jpg' alt='desc' />",
    "<input type='text' placeholder='Name' />",
    "<button onclick='submit()'>Send</button>",
    "<ul><li>Item 1</li><li>Item 2</li></ul>",
    "<form method='POST' action='/api'>",
    "  <label for='email'>Email:</label>",
    "  <input id='email' type='email' />",
    "</form>",
    "<!DOCTYPE html>",
    "<meta charset='UTF-8' />",
    "<link rel='stylesheet' href='styles.css' />",
    "<script src='app.js' defer></script>",

    // Python snippets
    "def fibonacci(n):",
    "    if n <= 1: return n",
    "    return fibonacci(n-1) + fibonacci(n-2)",
    "for i in range(10):",
    "    print(f'Value: {i}')",
    "data = [x**2 for x in range(20)]",
    "with open('file.txt', 'r') as f:",
    "    content = f.read()",
    "import numpy as np",
    "arr = np.array([1, 2, 3, 4])",
    "class Animal:",
    "    def __init__(self, name):",
    "        self.name = name",
    "    def speak(self):",
    "        raise NotImplementedError",
    "try:",
    "    result = divide(a, b)",
    "except ZeroDivisionError:",
    "    print('Cannot divide by zero')",
    "lambda x: x * 2 + 1",
    "dict_comp = {k: v for k, v in items}",

    // CSS snippets
    ".container { display: flex; }",
    ".grid { display: grid; gap: 1rem; }",
    "body { margin: 0; padding: 0; }",
    "@media (max-width: 768px) {",
    "  .sidebar { display: none; }",
    "}",
    ":root { --primary: #6c5ce7; }",
    "transition: all 0.3s ease;",
    "box-shadow: 0 4px 6px rgba(0,0,0,0.1);",
    "border-radius: 8px;",
    "background: linear-gradient(135deg, #667eea, #764ba2);"
];

/**
 * Get a shuffled array of words for a typing test
 * @param {string} mode - 'english' or 'developer'
 * @param {number} count - Number of words to return
 * @returns {string[]} Array of words
 */
export function getWords(mode = 'english', count = 200) {
    const pool = mode === 'developer' ? CODE_SNIPPETS : ENGLISH_WORDS;
    let words = [];

    if (mode === 'developer') {
        // For developer mode, split snippets into tokens (words) by spaces
        // but filter out empty strings and keep symbols attached to words
        const allTokens = [];
        pool.forEach(snippet => {
            snippet.split(/\s+/).filter(t => t.length > 0).forEach(token => {
                allTokens.push(token);
            });
        });

        for (let i = 0; i < count; i++) {
            words.push(allTokens[Math.floor(Math.random() * allTokens.length)]);
        }
    } else {
        for (let i = 0; i < count; i++) {
            words.push(pool[Math.floor(Math.random() * pool.length)]);
        }
    }

    return words;
}
