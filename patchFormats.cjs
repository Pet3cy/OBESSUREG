const fs = require('fs');
const file = 'components/UploadModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `} else if (selectedFile.name.endsWith('.eml') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.pptx') || selectedFile.name.endsWith('.ppt')) {`,
  `} else if (selectedFile.name.endsWith('.eml') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.ics') || selectedFile.name.endsWith('.pptx') || selectedFile.name.endsWith('.ppt')) {`
);

content = content.replace(
  `setError("Unsupported file format. Please use PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, EML, TXT, CSV, MP3, or M4P.");`,
  `setError("Unsupported file format. Please use PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, EML, TXT, CSV, ICS, MP3, or M4P.");`
);

content = content.replace(
  `accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.eml,.txt,.csv,.mp3,.m4p"`,
  `accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.eml,.txt,.csv,.ics,.mp3,.m4p"`
);

content = content.replace(
  `'Drop Image, PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, EML, TXT, CSV, MP3, or M4P invitation'`,
  `'Drop Image, PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, EML, TXT, CSV, ICS, MP3, or M4P invitation'`
);

fs.writeFileSync(file, content);
