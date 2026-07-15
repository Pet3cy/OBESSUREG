const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /interface EventDetailProps \{\n  event: EventData;\n  onUpdate: \(updatedEvent: EventData\) => void;\n  onDelete: \(\) => void;\n  contacts\?: Contact\[\];\n  onViewContact\?: \(contactId: string\) => void;\n  onAddContact\?: \(contact: Omit<Contact, 'id'>\) => void;\n\}/g,
  `interface EventDetailProps {
  event: EventData;
  onUpdate: (updatedEvent: EventData) => void;
  onDelete: () => void;
  contacts?: Contact[];
  onViewContact?: (contactId: string) => void;
  onAddContact?: (contact: Omit<Contact, 'id'>) => void;
  allEvents?: EventData[];
}`
);

// also we need to extract allEvents from props:
content = content.replace(
  /const EventDetail: React\.FC<EventDetailProps> = \(\{ event, onUpdate, onDelete, contacts = \[\], onViewContact, onAddContact \}\) => \{/g,
  `const EventDetail: React.FC<EventDetailProps> = ({ event, onUpdate, onDelete, contacts = [], onViewContact, onAddContact, allEvents = [] }) => {`
);

fs.writeFileSync(file, content);
