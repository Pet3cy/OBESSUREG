const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state for workspace menu
content = content.replace(
  `const [showCalendarMenu, setShowCalendarMenu] = useState(false);`,
  `const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);`
);

// Close workspace menu when clicking outside
content = content.replace(
  `if (calendarMenuRef.current && !calendarMenuRef.current.contains(e.target as Node)) {`,
  `if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setShowWorkspaceMenu(false);
      }
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(e.target as Node)) {`
);

// Import a generic "Cloud" or similar icon
content = content.replace(
  `FileSpreadsheet`,
  `FileSpreadsheet, Cloud`
);

// Render workspace menu
const workspaceJSX = `
                    <div className="relative" ref={workspaceMenuRef}>
                        <button onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all" title="Google Workspace Integrations">
                            <Cloud size={14} /> Workspace
                        </button>
                        {showWorkspaceMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50 overflow-hidden text-slate-300">
                                <button onClick={handleExportBriefingToDocs} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Export Briefing to Docs</button>
                                <button onClick={handleCreateSlides} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Create Slides</button>
                                <button onClick={handleShareToChat} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Share to Chat</button>
                                <button onClick={handleCreateMeet} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Create Meet Link</button>
                                <button onClick={handleCreateForm} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Create Form</button>
                                <button onClick={handleSaveToKeep} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Save to Keep</button>
                            </div>
                        )}
                    </div>
`;

content = content.replace(
  `<div className="flex items-center gap-1">
                    <button onClick={handleExportJSON}`,
  `<div className="flex items-center gap-1">
                    ` + workspaceJSX + `
                    <div className="w-px h-6 bg-slate-700 mx-2"></div>
                    <button onClick={handleExportJSON}`
);

fs.writeFileSync(file, content);
