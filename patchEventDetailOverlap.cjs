const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

// Interface Update
content = content.replace(
  `interface EventDetailProps {
  event: EventData;
  onUpdate: (e: EventData) => void;
  onDelete: () => void;
  contacts: Contact[];
  onViewContact: (id: string) => void;
}`,
  `interface EventDetailProps {
  event: EventData;
  onUpdate: (e: EventData) => void;
  onDelete: () => void;
  contacts: Contact[];
  onViewContact: (id: string) => void;
  allEvents?: EventData[];
}`
);

// Component props
content = content.replace(
  `export const EventDetail: React.FC<EventDetailProps> = ({ event, onUpdate, onDelete, contacts, onViewContact }) => {`,
  `export const EventDetail: React.FC<EventDetailProps> = ({ event, onUpdate, onDelete, contacts, onViewContact, allEvents = [] }) => {`
);

// Date change handler with overlap check
const overlapCheck = `
  const [overlapWarning, setOverlapWarning] = useState('');
  
  const checkOverlap = (selectedDate: string) => {
    const overlapping = allEvents.find(e => e.id !== localEvent.id && e.analysis.date === selectedDate);
    if (overlapping) {
      setOverlapWarning('Warning: Another event (' + overlapping.analysis.eventName + ') overlaps on this date.');
    } else {
      setOverlapWarning('');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setLocalEvent({ ...localEvent, analysis: { ...localEvent.analysis, date: d }});
    checkOverlap(d);
  };
`;

content = content.replace(
  `  const [contactSearch, setContactSearch] = useState('');`,
  `  const [contactSearch, setContactSearch] = useState('');` + overlapCheck
);

// Bind the change handler
content = content.replace(
  `onChange={(e) => setLocalEvent({ ...localEvent, analysis: { ...localEvent.analysis, date: e.target.value } })}`,
  `onChange={handleDateChange}`
);

// Add the warning UI below the Date input
const warningJSX = `
                            {overlapWarning && (
                                <div className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg text-xs font-medium">
                                    <AlertCircle size={14} />
                                    {overlapWarning}
                                </div>
                            )}
`;

content = content.replace(
  `placeholder="YYYY-MM-DD"
                            />
                        </div>
                        <div className="flex-1">`,
  `placeholder="YYYY-MM-DD"
                            />` + warningJSX + `
                        </div>
                        <div className="flex-1">`
);


fs.writeFileSync(file, content);
