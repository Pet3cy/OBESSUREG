const fs = require('fs');
const file = 'components/EventDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update imports
content = content.replace(
  `import { createGoogleDoc, createGoogleSlide, createGoogleTask, getChatSpaces, sendChatMessage } from "../services/googleIntegration";`,
  `import { createGoogleDoc, createGoogleSlide, createGoogleTask, getChatSpaces, sendChatMessage, createGoogleMeet, createGoogleForm, createGoogleKeepNote } from "../services/googleIntegration";`
);

// Add handlers
const handlers = `
  const handleCreateMeet = async () => {
    try {
      showToast('Creating Google Meet...', 'info');
      const url = await createGoogleMeet();
      showToast('Meet created successfully', 'success');
      window.open(url, '_blank');
    } catch (e) {
      showError('Failed to create Meet: ' + e.message);
    }
  };

  const handleCreateForm = async () => {
    try {
      showToast('Creating Google Form...', 'info');
      const url = await createGoogleForm(localEvent.analysis.eventName + ' Feedback');
      showToast('Form created successfully', 'success');
      window.open(url, '_blank');
    } catch (e) {
      showError('Failed to create Form: ' + e.message);
    }
  };

  const handleSaveToKeep = async () => {
    try {
      showToast('Saving to Google Keep...', 'info');
      await createGoogleKeepNote(localEvent.analysis.eventName, localEvent.analysis.description);
      showToast('Saved to Keep successfully', 'success');
    } catch (e) {
      showError('Failed to save to Keep: ' + e.message);
    }
  };
`;

content = content.replace(
  `const handleExportBriefingToDocs = async () => {`,
  handlers + '\n  const handleExportBriefingToDocs = async () => {'
);

fs.writeFileSync(file, content);
