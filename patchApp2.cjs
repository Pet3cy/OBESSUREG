const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `        <CreateEventModal 
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onEventCreated={handleAnalysisComplete}
        />`,
  `        <CreateEventModal 
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onEventCreated={handleAnalysisComplete}
          existingEvents={events}
        />`
);

fs.writeFileSync(file, content);
