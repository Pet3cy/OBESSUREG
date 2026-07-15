const fs = require('fs');
const file = 'components/TasksTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Task } from '../types';", "import { Task } from '../types';\nimport { createGoogleTask } from '../services/googleIntegration';\nimport { useToast } from '../contexts/ToastContext';");

const hook = `  const { showToast, showError } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncTasks = async () => {
    setIsSyncing(true);
    try {
      showToast('Syncing tasks...', 'info');
      for (const t of tasks.filter(t => !t.completed)) {
        await createGoogleTask(t.title, \`Due: \${t.dueDate}\\nAssignee: \${t.assignee}\`);
      }
      showToast('Tasks synced successfully', 'success');
    } catch (e) {
      showError('Failed to sync tasks: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };`;

content = content.replace('  const addTask = () => {', hook + '\n\n  const addTask = () => {');

const btn = `
          <button onClick={syncTasks} disabled={isSyncing} className="mt-4 ml-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50">Sync to Google Tasks</button>
        </div>`;
content = content.replace('        <button onClick={addTask} className="mt-4 bg-brand-policy text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-policy">Add Task</button>\n      </div>', '        <button onClick={addTask} className="mt-4 bg-brand-policy text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-policy">Add Task</button>' + btn + '\n      </div>');

fs.writeFileSync(file, content);
