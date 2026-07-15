const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /export const EventDetail: React\.FC<EventDetailProps> = \(\{\n  event,\n  onUpdate,\n  onDelete,\n  contacts = \[\],\n  onViewContact,\n  onAddContact\n\}\) => \{/g,
  `export const EventDetail: React.FC<EventDetailProps> = ({
  event,
  onUpdate,
  onDelete,
  contacts = [],
  onViewContact,
  onAddContact,
  allEvents = []
}) => {`
);

fs.writeFileSync(file, content);
