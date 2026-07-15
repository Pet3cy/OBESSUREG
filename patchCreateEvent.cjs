const fs = require('fs');
const file = 'components/CreateEventModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventData) => void;
}`,
  `import { AlertCircle } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventData) => void;
  existingEvents?: EventData[];
}`
);

content = content.replace(
  `export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {`,
  `export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated, existingEvents = [] }) => {
  const [tagsStr, setTagsStr] = useState('');
  const [overlapWarning, setOverlapWarning] = useState('');`
);

const handleSubmitReplace = `  const checkOverlap = (selectedDate: string) => {
    const overlapping = existingEvents.find(e => e.analysis.date === selectedDate);
    if (overlapping) {
      setOverlapWarning('Warning: An event (' + overlapping.analysis.eventName + ') already exists on this date.');
    } else {
      setOverlapWarning('');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setDate(d);
    checkOverlap(d);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const newEvent: EventData = {`;

content = content.replace(
  `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: EventData = {`,
  handleSubmitReplace
);

content = content.replace(
  `      originalText: \`Manually created event: \${eventName}\`,`,
  `      originalText: \`Manually created event: \${eventName}\`,
      tags,`
);

content = content.replace(
  `onChange={(e) => setDate(e.target.value)}`,
  `onChange={handleDateChange}`
);

const extraFields = `          <div>
            <label className="block text-sm font-medium text-slate-700">Tags (comma separated)</label>
            <input type="text" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="e.g. Workshop, Important" className="w-full mt-1 p-2 border border-slate-300 rounded-lg" />
          </div>
          {overlapWarning && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg text-sm font-medium">
              <AlertCircle size={16} />
              {overlapWarning}
            </div>
          )}
          <button`;

content = content.replace(
  `          <button type="submit"`,
  extraFields
);

fs.writeFileSync(file, content);
