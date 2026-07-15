const fs = require('fs');
const file = 'components/UploadModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `<label className="block text-sm font-bold text-slate-700 mb-1">Event Date</label>`,
  `<label className="block text-sm font-bold text-slate-700 mb-1">Event Date (Optional)</label>`
);

content = content.replace(
  `<label className="block text-sm font-bold text-slate-700 mb-1">Event Time</label>`,
  `<label className="block text-sm font-bold text-slate-700 mb-1">Event Time (Optional)</label>`
);

fs.writeFileSync(file, content);
