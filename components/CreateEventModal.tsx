import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EventData, Priority, RepresentativeRole } from '../types';

import { AlertCircle } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventData) => void;
  existingEvents?: EventData[];
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated, existingEvents = [] }) => {
  const [tagsStr, setTagsStr] = useState('');
  const [overlapWarning, setOverlapWarning] = useState('');
  const [eventName, setEventName] = useState('');
  const [institution, setInstitution] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.Medium);

  if (!isOpen) return null;

  const checkOverlap = (selectedDate: string) => {
    const overlapping = existingEvents.find(e => e.analysis.date === selectedDate);
    if (overlapping) {
      setOverlapWarning('Warning: An event (' + overlapping.analysis.eventName + ') already exists on this date.');
    } else {
      setOverlapWarning('');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setDate(d);
    checkOverlap(d);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const newEvent: EventData = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      originalText: `Manually created event: ${eventName}`,
      tags,
      analysis: {
        sender: 'Manual Entry',
        institution,
        eventName,
        theme: 'General',
        description: 'Manually created event',
        priority,
        priorityScore: 50,
        priorityReasoning: 'Manually created.',
        date,
        venue,
        initialDeadline: date,
        finalDeadline: date,
        linkedActivities: [],
      },
      contact: {
        name: '',
        email: '',
        role: '',
        organization: '',
        repRole: 'Participant',
        polContact: '',
        notes: '',
      },
      followUp: {
        prepResources: '',
        briefing: '',
        commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
        postEventNotes: '',
        status: 'To Respond',
      },
    };
    onEventCreated(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Create New Event</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Event Name</label>
            <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Institution</label>
            <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Date</label>
              <input type="date" value={date} onChange={handleDateChange} className="w-full mt-1 p-2 border border-slate-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg">
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Venue</label>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tags (comma separated)</label>
            <input type="text" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="e.g. Workshop, Important" className="w-full mt-1 p-2 border border-slate-300 rounded-lg" />
          </div>
          {overlapWarning && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg text-sm font-medium">
              <AlertCircle size={16} />
              {overlapWarning}
            </div>
          )}
          <button className="w-full bg-brand-policy text-white py-2 rounded-lg font-bold hover:bg-brand-policy">Create Event</button>
        </form>
      </div>
    </div>
  );
};
