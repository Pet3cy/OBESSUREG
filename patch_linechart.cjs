const fs = require('fs');
const file = 'components/Overview.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<AreaChart /g,
  '<LineChart '
).replace(
  /<\/AreaChart>/g,
  '</LineChart>'
).replace(
  /<Area type="monotone"/g,
  '<Line type="monotone"'
).replace(
  /fill="url\(#colorPriority\)"/g,
  ''
);

fs.writeFileSync(file, content);
