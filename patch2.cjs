const fs = require('fs');
const file = 'services/gemmaService.ts';
let content = fs.readFileSync(file, 'utf8');

const oldFunc = `function extractJSON(rawText: string): any {
  try { return JSON.parse(rawText.trim()); } catch {}
  
  const stripped = rawText.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  
  const match = rawText.match(/\\{[\\s\\S]*\\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  
  throw new Error('Could not extract valid JSON from model response. Raw: ' + rawText.substring(0, 200));
}`;

const newFunc = `function extractJSON(rawText: string): any {
  try { return JSON.parse(rawText.trim()); } catch {}
  
  const stripped = rawText.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  
  const matchArray = rawText.match(/\\[[\\s\\S]*\\]/);
  if (matchArray) {
    try { return JSON.parse(matchArray[0]); } catch {}
  }

  const matchObj = rawText.match(/\\{[\\s\\S]*\\}/);
  if (matchObj) {
    try { return JSON.parse(matchObj[0]); } catch {}
  }
  
  console.error("Failed to parse JSON. Full raw text:", rawText);
  throw new Error('Could not extract valid JSON from model response. Raw: ' + rawText.substring(0, 500));
}`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync(file, content);
