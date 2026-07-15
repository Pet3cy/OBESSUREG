const fs = require('fs');
const file = 'services/gemmaService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `        temperature: 0.2,
        responseMimeType: 'application/json',`,
  `        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',`
);

fs.writeFileSync(file, content);
