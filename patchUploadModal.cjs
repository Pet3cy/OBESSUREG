const fs = require('fs');
const file = 'components/UploadModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the required check for eventTitle
content = content.replace(
  `if (!eventTitle.trim()) { setError("Event Title is required."); return; }`,
  `// if (!eventTitle.trim()) { setError("Event Title is required."); return; }`
);

// Remove the * from the UI
content = content.replace(
  `<label className="block text-sm font-bold text-slate-700 mb-1">Event Title <span className="text-red-500">*</span></label>`,
  `<label className="block text-sm font-bold text-slate-700 mb-1">Event Title (Optional)</label>`
);

// Remove the required prop
content = content.replace(
  `type="text" 
              required`,
  `type="text"`
);

fs.writeFileSync(file, content);
