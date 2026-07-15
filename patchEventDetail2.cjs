const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const { showToast')) {
    content = content.replace('const EventDetail: React.FC<EventDetailProps> = ({', 'const EventDetail: React.FC<EventDetailProps> = ({\n');
    content = content.replace('  const [localEvent, setLocalEvent] = useState(event);', '  const { showToast, showError } = useToast();\n  const [localEvent, setLocalEvent] = useState(event);');
    fs.writeFileSync(file, content);
}
