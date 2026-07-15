const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `                        contacts={contacts}
                        onViewContact={handleViewContactProfile}`,
  `                        contacts={contacts}
                        onViewContact={handleViewContactProfile}
                        allEvents={events}`
);

fs.writeFileSync(file, content);
