import React, { useState } from 'react';
import { analyzeInvitation } from '../services/gemmaService';
import { EventData } from '../types';
import { EventCard } from './EventCard';
import { Loader2, Trash2, Wand2, Mail, Download } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { getAccessToken } from '../src/lib/firebase';

interface EmailParserViewProps {
  onEventsExtracted: (events: EventData[]) => void;
}

export const EmailParserView: React.FC<EmailParserViewProps> = ({ onEventsExtracted }) => {
  const [emailContent, setEmailContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingGmail, setIsFetchingGmail] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<EventData[]>([]);
  const [error, setError] = useState('');
  const { showError, showToast } = useToast();

  const handleFetchFromGmail = async () => {
    setIsFetchingGmail(true);
    setError('');
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please sign in to Google first to access Gmail.');
      }

      // Fetch the last 5 emails from Inbox
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=in:inbox`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch from Gmail');
      
      const data = await res.json();
      if (!data.messages || data.messages.length === 0) {
        showToast('No recent emails found in inbox.', 'info');
        return;
      }

      let fullText = '';
      for (const msg of data.messages) {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const subjectHeader = msgData.payload?.headers?.find((h: any) => h.name === 'Subject');
          const snippet = msgData.snippet || '';
          fullText += `Subject: ${subjectHeader ? subjectHeader.value : 'No Subject'}\nSnippet: ${snippet}\n\n`;
        }
      }

      setEmailContent(prev => prev + (prev ? '\n\n---\n\n' : '') + fullText);
      showToast('Successfully fetched recent emails from Gmail', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch from Gmail');
      showError(err.message || 'Failed to fetch from Gmail');
    } finally {
      setIsFetchingGmail(false);
    }
  };

  const handleAnalyze = async () => {
    if (!emailContent.trim()) {
      setError('Please paste some email content first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const results = await analyzeInvitation({ text: emailContent });
      
      const newEvents: EventData[] = results.map(result => ({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        originalText: emailContent,
        analysis: result,
        contact: { contactId: '', name: '', email: '', role: '', organization: '', notes: '', polContact: '', repRole: 'Participant' },
        followUp: { 
          briefing: '', postEventNotes: '', status: 'To Respond', prepResources: '',
          commsPack: { remarks: '', representative: '', datePlace: `${result.date} @ ${result.venue}`, additionalInfo: '' }
        }
      }));

      setExtractedEvents(prev => [...newEvents, ...prev]);
      onEventsExtracted(newEvents);
      showToast(`Extracted ${newEvents.length} event(s) successfully`, 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to extract events. Please try again.');
      showError(err.message || 'Failed to extract events. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setEmailContent('');
    setExtractedEvents([]);
    setError('');
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 bg-slate-50/50 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="text-brand-policy" /> Email Parser
          </h2>
          <p className="text-slate-500 text-sm mt-1">Extract event details from emails manually or fetch from Gmail.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Trash2 size={16} /> Clear
          </button>
          <button
            onClick={handleFetchFromGmail}
            disabled={isFetchingGmail}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isFetchingGmail ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Fetch Gmail
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !emailContent.trim()}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-brand-policy rounded-xl hover:bg-brand-policy disabled:opacity-50 transition-colors shadow-md shadow-brand-policy/30"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Extract Events
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Content</label>
          <textarea
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono leading-relaxed resize-none focus:ring-2 focus:ring-brand-policy/20 outline-none"
            placeholder="Paste email content here..."
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
          />
          {error && <div className="text-red-500 text-sm font-medium p-2 bg-brand-membership/10 rounded-lg border border-red-100">{error}</div>}
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Extracted Events ({extractedEvents.length})</label>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {extractedEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                <Wand2 size={32} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">No events extracted yet.</p>
                <p className="text-xs mt-1">Paste an email and click Extract Events.</p>
              </div>
            ) : (
              extractedEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  isSelected={false}
                  onClick={() => {}}
                  onDelete={() => {
                    setExtractedEvents(prev => prev.filter(e => e.id !== event.id));
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
