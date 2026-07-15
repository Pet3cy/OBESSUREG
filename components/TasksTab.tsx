import React, { useState } from 'react';
import { Task } from '../types';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { createGoogleTask } from '../services/googleIntegration';
import { useToast } from '../contexts/ToastContext';
import { getAccessToken } from '../src/lib/firebase';

interface TasksTabProps {
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ tasks, onUpdateTasks }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const { showToast, showError } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncTasks = async () => {
    setIsSyncing(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        showError('Please sign in with Google to sync tasks. Guest users cannot sync with external Google services.');
        return;
      }
      showToast('Syncing tasks...', 'info');
      for (const t of tasks.filter(t => !t.completed)) {
        await createGoogleTask(t.title, `Due: ${t.dueDate}\nAssignee: ${t.assignee}`);
      }
      showToast('Tasks synced successfully', 'success');
    } catch (e: any) {
      showError('Failed to sync tasks: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const addTask = () => {
    if (!newTaskTitle) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      dueDate: newTaskDueDate,
      assignee: newTaskAssignee,
      completed: false,
    };
    onUpdateTasks([...(tasks || []), newTask]);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskAssignee('');
  };

  const toggleTask = (taskId: string) => {
    onUpdateTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (taskId: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== taskId));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Add New Task</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <input 
            type="date"
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
          />
          <input 
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            placeholder="Assignee"
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={addTask} className="bg-brand-policy text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-policy/90">Add Task</button>
          <button onClick={syncTasks} disabled={isSyncing} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50">Sync to Google Tasks</button>
        </div>
      </div>

      <div className="space-y-2">
        {(tasks || []).map(task => (
          <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleTask(task.id)}>
                {task.completed ? <CheckCircle className="text-brand-projects" /> : <Circle className="text-slate-400" />}
              </button>
              <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-900'}>{task.title}</span>
            </div>
            <div className="text-xs text-slate-500">Due: {task.dueDate} | {task.assignee}</div>
            <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
