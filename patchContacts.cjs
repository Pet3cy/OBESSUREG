const fs = require('fs');
const file = 'components/ContactsView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Contact } from '../types';", "import { Contact } from '../types';\nimport { syncGoogleContacts } from '../services/googleIntegration';\nimport { useToast } from '../contexts/ToastContext';");

const hook = `  const { showToast, showError } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncContacts = async () => {
    setIsSyncing(true);
    try {
      showToast('Syncing contacts...', 'info');
      await syncGoogleContacts(contacts);
      showToast('Contacts synced successfully', 'success');
    } catch (e) {
      showError('Failed to sync contacts: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };`;

content = content.replace('  const [searchTerm, setSearchTerm] = useState(\'\');', hook + '\n  const [searchTerm, setSearchTerm] = useState(\'\');');

const btn = `<button onClick={handleSyncContacts} disabled={isSyncing} className="ml-4 px-4 py-2 bg-brand-policy text-white font-bold rounded-lg hover:bg-brand-policy/90 disabled:opacity-50">Sync to Google Contacts</button>
        </div>`;
content = content.replace(/<\/div>\s*<\/div>\s*<div className="flex gap-4">/, btn + '\n      </div>\n      <div className="flex gap-4">');

fs.writeFileSync(file, content);
