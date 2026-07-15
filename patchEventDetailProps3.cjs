const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "export const EventDetail: React.FC<EventDetailProps> = ({\n event, onUpdate, onDelete, contacts = [], onViewContact, onAddContact }) => {",
  "export const EventDetail: React.FC<EventDetailProps> = ({\n event, onUpdate, onDelete, contacts = [], onViewContact, onAddContact, allEvents = [] }) => {"
);

fs.writeFileSync(file, content);
