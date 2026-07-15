import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Upload, Loader2, FileText, CheckCircle2, Link as LinkIcon, FileSpreadsheet, ListChecks, Mail, HardDrive, File as FileIcon, Calendar, CheckSquare, Users, StickyNote } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import type { Event } from '../types';

interface Section {
  id: string;
  title: string;
  content: string;
  selected: boolean;
}

export default function Analyze() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Partial<Event> | null>(null);
  
  // Workspace Import state
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'drive' | 'gmail' | 'calendar' | 'tasks' | 'contacts' | 'keep'>('url');
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [keepNotes, setKeepNotes] = useState<any[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  const context = useContext(AppContext);
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      setShowWorkspaceModal(true);
    },
    scope: 'https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly https://mail.google.com/ https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/keep.readonly',
    onError: () => setError('Login Failed'),
  });

  const extractIdFromUrl = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url; // If not URL, assume it's just ID
  };

  const handleFetchWorkspace = async () => {
    if (!workspaceUrl || !accessToken) return;
    setIsLoadingWorkspace(true);
    setError('');
    setSections([]);

    const fileId = extractIdFromUrl(workspaceUrl);
    const isSheet = workspaceUrl.includes('spreadsheets');

    try {
      if (isSheet) {
        // Fetch Spreadsheet
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}?includeGridData=true`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch Spreadsheet');
        const data = await res.json();
        
        const extractedSections: Section[] = data.sheets.map((sheet: any) => {
          let content = '';
          const grid = sheet.data?.[0];
          if (grid && grid.rowData) {
            content = grid.rowData.map((row: any) => {
              if (!row.values) return '';
              return row.values.map((v: any) => v.formattedValue || '').join(' | ');
            }).join('\n');
          }
          return {
            id: sheet.properties.sheetId.toString(),
            title: sheet.properties.title,
            content,
            selected: true,
          };
        });
        setSections(extractedSections);

      } else {
        // Fetch Document
        const res = await fetch(`https://docs.googleapis.com/v1/documents/${fileId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch Document');
        const data = await res.json();

        // Extract text and split by Headings
        let currentSection: Section = { id: 'root', title: 'Start of Document', content: '', selected: true };
        const extractedSections: Section[] = [];

        data.body?.content?.forEach((element: any) => {
          if (element.paragraph) {
            const style = element.paragraph.paragraphStyle?.namedStyleType || '';
            const textContent = element.paragraph.elements?.map((el: any) => el.textRun?.content || '').join('') || '';
            
            if (style.startsWith('HEADING')) {
              if (currentSection.content.trim() || currentSection.title !== 'Start of Document') {
                extractedSections.push({ ...currentSection, content: currentSection.content.trim() });
              }
              currentSection = {
                id: Math.random().toString(36).substr(2, 9),
                title: textContent.trim() || 'Heading',
                content: textContent,
                selected: true,
              };
            } else {
              currentSection.content += textContent;
            }
          }
        });
        if (currentSection.content.trim()) {
          extractedSections.push({ ...currentSection, content: currentSection.content.trim() });
        }
        
        setSections(extractedSections);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching document');
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    if (showWorkspaceModal && accessToken) {
      if (activeTab === 'drive' && driveFiles.length === 0) fetchDriveFiles();
      if (activeTab === 'gmail' && emails.length === 0) fetchEmails();
      if (activeTab === 'calendar' && calendarEvents.length === 0) fetchCalendarEvents();
      if (activeTab === 'tasks' && tasksList.length === 0) fetchTasks();
      if (activeTab === 'contacts' && contactsList.length === 0) fetchContacts();
      if (activeTab === 'keep' && keepNotes.length === 0) fetchKeepNotes();
    }
  }, [activeTab, showWorkspaceModal, accessToken]);

  const fetchCalendarEvents = async () => {
    try {
      setIsLoadingWorkspace(true);
      const timeMin = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=10&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setCalendarEvents(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoadingWorkspace(true);
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/users/@me/lists`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      const defaultList = data.items?.[0];
      if (defaultList) {
        const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList.id}/tasks?maxResults=10`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const taskData = await taskRes.json();
        setTasksList(taskData.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setIsLoadingWorkspace(true);
      const res = await fetch(`https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=10`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setContactsList(data.connections || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const fetchKeepNotes = async () => {
    try {
      setIsLoadingWorkspace(true);
      const res = await fetch(`https://keep.googleapis.com/v1/notes`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setKeepNotes(data.notes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const handleCalendarSelect = (event: any) => {
    let details = `Event: ${event.summary}\n`;
    if (event.start?.dateTime) details += `Time: ${event.start.dateTime}\n`;
    if (event.location) details += `Location: ${event.location}\n`;
    if (event.description) details += `\nDescription:\n${event.description}`;
    setText(details);
    setShowWorkspaceModal(false);
  };

  const handleTaskSelect = (task: any) => {
    let details = `Task: ${task.title}\n`;
    if (task.notes) details += `\nNotes:\n${task.notes}`;
    setText(details);
    setShowWorkspaceModal(false);
  };

  const handleContactSelect = (contact: any) => {
    const name = contact.names?.[0]?.displayName || 'Unknown';
    const email = contact.emailAddresses?.[0]?.value || '';
    setText(`Contact: ${name}${email ? ` (${email})` : ''}`);
    setShowWorkspaceModal(false);
  };

  const handleKeepSelect = (note: any) => {
    let details = `Note: ${note.title}\n\n`;
    if (note.body?.text?.text) {
      details += note.body.text.text;
    }
    setText(details);
    setShowWorkspaceModal(false);
  };

  const fetchDriveFiles = async () => {
    try {
      setIsLoadingWorkspace(true);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet'&orderBy=modifiedTime desc&pageSize=15`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const fetchEmails = async () => {
    try {
      setIsLoadingWorkspace(true);
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (!data.messages) {
        setEmails([]);
        return;
      }
      const detailedMessages = await Promise.all(data.messages.map(async (msg: any) => {
        const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return await mRes.json();
      }));
      setEmails(detailedMessages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const handleDriveFileSelect = (file: any) => {
    const isSheet = file.mimeType.includes('spreadsheet');
    setWorkspaceUrl(`https://docs.google.com/${isSheet ? 'spreadsheets' : 'document'}/d/${file.id}`);
    setActiveTab('url');
  };

  const handleEmailSelect = (email: any) => {
    const subject = email.payload.headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
    let body = email.snippet || '';
    
    const getBodyText = (parts: any[]): string => {
      let text = '';
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          text += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else if (part.parts) {
          text += getBodyText(part.parts);
        }
      }
      return text;
    };

    if (email.payload.parts) {
      const extracted = getBodyText(email.payload.parts);
      if (extracted) body = extracted;
    } else if (email.payload.body?.data) {
      try {
        body = atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } catch (e) {}
    }

    setText(`Subject: ${subject}\n\n${body}`);
    setShowWorkspaceModal(false);
  };

  const applyWorkspaceSelection = () => {
    const selectedContent = sections
      .filter(s => s.selected)
      .map(s => `--- ${s.title} ---\n${s.content}`)
      .join('\n\n');
    setText(prev => prev + (prev ? '\n\n' : '') + selectedContent);
    setShowWorkspaceModal(false);
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  if (!context) return null;

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text or a Google Workspace URL to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    let contentToAnalyze = text;
    const urlMatch = text.trim().match(/^https:\/\/docs\.google\.com\/(spreadsheets|document)\/d\/([a-zA-Z0-9-_]+)/);

    try {
      if (urlMatch) {
        if (!accessToken) {
          setIsAnalyzing(false);
          setWorkspaceUrl(text.trim());
          login();
          return;
        }

        const isSheet = urlMatch[1] === 'spreadsheets';
        const fileId = urlMatch[2];

        if (isSheet) {
          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}?includeGridData=true`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (!res.ok) throw new Error('Failed to fetch Spreadsheet. Check permissions.');
          const data = await res.json();
          contentToAnalyze = data.sheets.map((sheet: any) => {
            const grid = sheet.data?.[0];
            if (!grid || !grid.rowData) return '';
            return `--- ${sheet.properties.title} ---\n` + grid.rowData.map((row: any) => {
              if (!row.values) return '';
              return row.values.map((v: any) => v.formattedValue || '').join(' | ');
            }).join('\n');
          }).join('\n\n');
        } else {
          const res = await fetch(`https://docs.google.com/v1/documents/${fileId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (!res.ok) throw new Error('Failed to fetch Document. Check permissions.');
          const data = await res.json();
          let docText = '';
          data.body?.content?.forEach((element: any) => {
            if (element.paragraph) {
              docText += element.paragraph.elements?.map((el: any) => el.textRun?.content || '').join('') || '';
            }
          });
          contentToAnalyze = docText;
        }
      }

      const response = await fetch('/api/events/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contentToAnalyze })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze event text.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;

    const newEvent: Event = {
      id: Math.random().toString(36).substring(7),
      title: result.title || 'Untitled Event',
      date: result.date || 'TBD',
      location: result.location || 'TBD',
      organizer: result.organizer || 'Unknown',
      priority: (result.priority as any) || 'Medium',
      status: 'Pending',
      representative: result.representative || 'Unassigned',
      theme: result.theme || 'General',
      description: result.description || '',
      targetAudience: result.targetAudience || '',
      objectives: result.objectives || '',
      cost: result.cost || '',
      deadline: result.deadline || '',
      format: result.format || '',
      language: result.language || '',
      contactPerson: result.contactPerson || '',
      contactEmail: result.contactEmail || '',
      website: result.website || '',
      requiredPreparation: result.requiredPreparation || '',
      notes: result.notes || ''
    };

    context.setEvents([...context.events, newEvent]);
    
    // Increment representative count if found
    if (newEvent.representative && newEvent.representative !== 'Unassigned') {
      const repLower = newEvent.representative.toLowerCase();
      const updatedStaff = context.staff.map(s => {
        if (repLower.includes(s.name.split(' ')[0].toLowerCase())) {
          return { ...s, eventCount: s.eventCount + 1 };
        }
        return s;
      });
      context.setStaff(updatedStaff);
    }

    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto flex gap-8 relative">
      {/* Input Section */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analyze Invitation</h2>
            <p className="text-gray-500 mt-1">Paste the event invitation text below to extract structured data.</p>
          </div>
          <button
            onClick={() => accessToken ? setShowWorkspaceModal(true) : login()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Import from Google Docs/Sheets
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <textarea
            className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-sans"
            placeholder="Paste email, document text, or invitation details here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Extract Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-[400px]">
        {result ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-indigo-50 border-b border-indigo-100 p-4">
              <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold">Extraction Complete</h3>
              </div>
              <p className="text-sm text-indigo-600">Review the extracted fields before saving.</p>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <Field label="Title" value={result.title} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date" value={result.date} />
                <Field label="Location" value={result.location} />
              </div>
              <Field label="Organizer" value={result.organizer} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Priority" value={result.priority} isBadge />
                <Field label="Suggested Rep" value={result.representative} />
              </div>
              <Field label="Theme" value={result.theme} />
              <Field label="Format" value={result.format} />
              <Field label="Deadline" value={result.deadline} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSave}
                className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Save to Pipeline
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-gray-50/50">
            <Upload className="w-12 h-12 text-gray-300 mb-4" />
            <p>Analysis results will appear here</p>
          </div>
        )}
      </div>

      {/* Workspace Import Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Import from Google Workspace</h3>
              <button onClick={() => setShowWorkspaceModal(false)} className="text-gray-400 hover:text-gray-500">×</button>
            </div>
            
            <div className="flex border-b border-gray-200 px-6 pt-2 gap-4 overflow-x-auto whitespace-nowrap">
              <button 
                onClick={() => setActiveTab('url')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'url' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <LinkIcon className="w-4 h-4" /> Docs/Sheets
              </button>
              <button 
                onClick={() => setActiveTab('drive')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'drive' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <HardDrive className="w-4 h-4" /> Drive
              </button>
              <button 
                onClick={() => setActiveTab('gmail')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'gmail' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Mail className="w-4 h-4" /> Gmail
              </button>
              <button 
                onClick={() => setActiveTab('calendar')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'calendar' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Calendar className="w-4 h-4" /> Calendar
              </button>
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <CheckSquare className="w-4 h-4" /> Tasks
              </button>
              <button 
                onClick={() => setActiveTab('contacts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'contacts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Users className="w-4 h-4" /> Contacts
              </button>
              <button 
                onClick={() => setActiveTab('keep')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'keep' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <StickyNote className="w-4 h-4" /> Keep
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {activeTab === 'url' && (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Google Doc or Sheet URL..."
                      value={workspaceUrl}
                      onChange={(e) => setWorkspaceUrl(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleFetchWorkspace}
                      disabled={isLoadingWorkspace || !workspaceUrl}
                      className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoadingWorkspace ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                      Fetch
                    </button>
                  </div>
                  {sections.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                        <ListChecks className="w-4 h-4" />
                        Select sections to import
                      </div>
                      <div className="space-y-2 border border-gray-200 rounded-lg p-2 max-h-64 overflow-y-auto bg-gray-50">
                        {sections.map(section => (
                          <label key={section.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md cursor-pointer hover:bg-indigo-50">
                            <input
                              type="checkbox"
                              checked={section.selected}
                              onChange={() => toggleSection(section.id)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="font-medium text-gray-800 text-sm">{section.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'drive' && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoadingWorkspace ? (
                    <div className="flex justify-center p-8 text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : driveFiles.length > 0 ? (
                    driveFiles.map(file => (
                      <div key={file.id} onClick={() => handleDriveFileSelect(file)} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer flex items-center gap-3">
                        <FileIcon className={`w-5 h-5 ${file.mimeType.includes('spreadsheet') ? 'text-green-600' : 'text-blue-600'}`} />
                        <span className="font-medium text-gray-800 text-sm">{file.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent documents found.</p>
                  )}
                </div>
              )}

              {activeTab === 'gmail' && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoadingWorkspace ? (
                    <div className="flex justify-center p-8 text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : emails.length > 0 ? (
                    emails.map(email => {
                      const subject = email.payload.headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                      const from = email.payload.headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
                      return (
                        <div key={email.id} onClick={() => handleEmailSelect(email)} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer flex flex-col gap-1">
                          <span className="font-bold text-gray-800 text-sm">{subject}</span>
                          <span className="text-xs text-gray-500">{from}</span>
                          <span className="text-sm text-gray-600 truncate">{email.snippet}</span>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent emails found.</p>
                  )}
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoadingWorkspace ? (
                    <div className="flex justify-center p-8 text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : calendarEvents.length > 0 ? (
                    calendarEvents.map(event => (
                      <div key={event.id} onClick={() => handleCalendarSelect(event)} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer flex flex-col gap-1">
                        <span className="font-bold text-gray-800 text-sm">{event.summary || 'Untitled Event'}</span>
                        {event.start?.dateTime && <span className="text-xs text-gray-500">{new Date(event.start.dateTime).toLocaleString()}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No upcoming events found.</p>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoadingWorkspace ? (
                    <div className="flex justify-center p-8 text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : tasksList.length > 0 ? (
                    tasksList.map(task => (
                      <div key={task.id} onClick={() => handleTaskSelect(task)} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer flex flex-col gap-1">
                        <span className="font-bold text-gray-800 text-sm">{task.title || 'Untitled Task'}</span>
                        {task.notes && <span className="text-xs text-gray-500 truncate">{task.notes}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No tasks found.</p>
                  )}
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoadingWorkspace ? (
                    <div className="flex justify-center p-8 text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : contactsList.length > 0 ? (
                    contactsList.map(contact => {
                      const name = contact.names?.[0]?.displayName || 'Unknown';
                      const email = contact.emailAddresses?.[0]?.value || '';
                      return (
                        <div key={contact.resourceName} onClick={() => handleContactSelect(contact)} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer flex flex-col gap-1">
                          <span className="font-bold text-gray-800 text-sm">{name}</span>
                          {email && <span className="text-xs text-gray-500">{email}</span>}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">No contacts found.</p>
                  )}
                </div>
              )}

              {activeTab === 'keep' && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoadingWorkspace ? (
                    <div className="flex justify-center p-8 text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : keepNotes.length > 0 ? (
                    keepNotes.map(note => (
                      <div key={note.name} onClick={() => handleKeepSelect(note)} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer flex flex-col gap-1">
                        <span className="font-bold text-gray-800 text-sm">{note.title || 'Untitled Note'}</span>
                        {note.body?.text?.text && <span className="text-xs text-gray-500 truncate">{note.body.text.text}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No keep notes found.</p>
                  )}
                </div>
              )}

            </div>
            {activeTab === 'url' && sections.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={applyWorkspaceSelection}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                >
                  Import Selected Sections
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, isBadge = false }: { label: string; value?: string; isBadge?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</div>
      {isBadge ? (
        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-md border border-gray-200">
          {value}
        </span>
      ) : (
        <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">
          {value}
        </div>
      )}
    </div>
  );
}