const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'ocean/js/app.js');
let content = fs.readFileSync(appPath, 'utf8');

// replace renderAnalytics
const startMarker = 'function renderAnalytics($el) {';
const startIndex = content.indexOf(startMarker);

if (startIndex !== -1) {
    let openBraces = 0;
    let endIndex = -1;

    // Find matching closing brace starting from the opening brace of function
    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') openBraces++;
        if (content[i] === '}') openBraces--;

        if (openBraces === 0 && i > startIndex) {
            endIndex = i;
            break;
        }
    }

    if (endIndex !== -1) {
        const newBody = `function renderAnalytics($el) {\n    import('./modules/views.js').then(module => module.renderAnalytics($el));\n}`;
        content = content.slice(0, startIndex) + newBody + content.slice(endIndex + 1);
        console.log('Replaced renderAnalytics');
    } else {
        console.log('Could not find end of renderAnalytics');
    }
} else {
    console.log('Could not find renderAnalytics');
}

fs.writeFileSync(appPath, content);
