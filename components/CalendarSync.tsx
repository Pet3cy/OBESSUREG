import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { EventData, Priority } from '../types';
import { useToast } from '../contexts/ToastContext';
import { getAccessToken } from '../src/lib/firebase';

interface CalendarSyncProps {
  onEventsSynced: (events: EventData[]) => void;
}

export const CALENDAR_OWNER_MAP: Record<string, string> = {
  'panagiotis@obessu.org': 'Panagiotis Chatzimichail',
  'panagiotischatzimichail@gmail.com': 'Panagiotis Chatzimichail',
  'amira@obessu.org': 'Amira Bakr',
  'daniele@obessu.org': 'Daniele Sabato',
  'francesca@obessu.org': 'Francesca Osima',
  'rui@obessu.org': 'Rui Teixeira',
};

export function CalendarSync({ onEventsSynced }: CalendarSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError, showToast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please sign in to Google first.');
      }

      const timeMin = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=50&orderBy=startTime&singleEvents=true`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch calendar events: ${res.statusText}`);
      }

      const data = await res.json();
      const items = data.items || [];
      
      const newEvents: EventData[] = items.map((event: any) => {
        const contactName = CALENDAR_OWNER_MAP[event.creator?.email || ''] ?? event.creator?.email ?? 'Unknown';

        return {
          id: `cal-${event.id}`,
          createdAt: Date.now(),
          originalText: event.description || '',
          analysis: {
            sender: event.creator?.email || 'Unknown',
            institution: 'Google Calendar',
            eventName: event.summary || 'Untitled Event',
            theme: 'Synced Event',
            description: event.description || '',
            priority: Priority.Medium,
            priorityScore: 50,
            priorityReasoning: 'Imported from Google Calendar',
            date: event.start?.dateTime?.split('T')[0] || event.start?.date || '',
            time: event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            venue: event.location || 'Unknown',
            initialDeadline: '',
            finalDeadline: '',
            linkedActivities: [],
          },
          contact: {
            contactId: '',
            name: contactName,
            email: event.creator?.email || '',
            role: '',
            organization: '',
            notes: '',
            polContact: '',
            repRole: 'Participant'
          },
          followUp: {
            briefing: '',
            postEventNotes: '',
            status: 'To Respond',
            prepResources: '',
            commsPack: {
              remarks: '',
              representative: '',
              datePlace: '',
              additionalInfo: ''
            }
          }
        };
      });

      onEventsSynced(newEvents);
      showToast('Calendar synced successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showError(err.message || 'Failed to sync calendar events');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </span>
      )}
      <button 
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
      >
        {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <CalendarIcon size={16} />}
        {isSyncing ? 'Syncing...' : 'Sync Calendars'}
      </button>
    </div>
  );
}
