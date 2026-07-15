const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

// Render tags input in editor mode
const tagsEditorJSX = `
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
                            <input 
                                className="w-full text-sm font-medium text-slate-700 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-policy/50"
                                value={(localEvent.tags || []).join(', ')}
                                onChange={(e) => setLocalEvent({...localEvent, tags: e.target.value.split(',').map(t=>t.trim()).filter(Boolean)})}
                                placeholder="e.g. Online, Workshop"
                            />
                        </div>
                    </div>`;

content = content.replace(
  `                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date & Time</label>`,
  tagsEditorJSX + `\n                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date & Time</label>`
);

// Render tags in viewer mode
const tagsViewerJSX = `
                            {localEvent.tags && localEvent.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {localEvent.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
`;

content = content.replace(
  `                       <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{localEvent.analysis.eventName}</h2>
                           <button `,
  `                       <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{localEvent.analysis.eventName}</h2>` + tagsViewerJSX + `\n                           <button `
);

fs.writeFileSync(file, content);
