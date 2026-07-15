const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

const handlers = `
  const handleExportBriefingToDocs = async () => {
    try {
      showToast('Creating Google Doc...', 'info');
      const url = await createGoogleDoc('Briefing: ' + localEvent.analysis.eventName, localEvent.followUp.briefing || 'No briefing available.');
      showToast('Doc created successfully', 'success');
      window.open(url, '_blank');
    } catch (e) {
      showError('Failed to create Doc: ' + e.message);
    }
  };

  const handleCreateSlides = async () => {
    try {
      showToast('Creating Google Slides...', 'info');
      const url = await createGoogleSlide(localEvent.analysis.eventName + ' Presentation');
      showToast('Slides created successfully', 'success');
      window.open(url, '_blank');
    } catch (e) {
      showError('Failed to create Slides: ' + e.message);
    }
  };

  const handleShareToChat = async () => {
    try {
      showToast('Fetching chat spaces...', 'info');
      const spaces = await getChatSpaces();
      if (!spaces.length) {
        showToast('No chat spaces found or missing permissions.', 'info');
        return;
      }
      await sendChatMessage(spaces[0].name, 'New Event: ' + localEvent.analysis.eventName + '\\nDate: ' + localEvent.analysis.date);
      showToast('Shared to Chat successfully', 'success');
    } catch (e) {
      showError('Failed to share to Chat: ' + e.message);
    }
  };
`;

content = content.replace('// --- Export Functions ---', handlers + '\n  // --- Export Functions ---');

const buttons = `
  <div className="flex gap-2 mb-6">
    <button onClick={handleExportBriefingToDocs} className="flex-1 py-2 px-4 bg-brand-policy text-white font-bold rounded-lg shadow-sm hover:bg-brand-policy/90 transition-colors">Export Briefing to Docs</button>
    <button onClick={handleCreateSlides} className="flex-1 py-2 px-4 bg-brand-projects text-white font-bold rounded-lg shadow-sm hover:bg-brand-projects/90 transition-colors">Create Slides Skeleton</button>
    <button onClick={handleShareToChat} className="flex-1 py-2 px-4 bg-slate-800 text-white font-bold rounded-lg shadow-sm hover:bg-slate-700 transition-colors">Notify in Chat</button>
  </div>
`;

content = content.replace('{/* AI Summary & Priority - Full Width */}', buttons + '\n                    {/* AI Summary & Priority - Full Width */}');

fs.writeFileSync(file, content);
