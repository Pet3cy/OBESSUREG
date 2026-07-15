import React, { useState } from 'react';
import { X, Calendar, Clock, Mail, Link as LinkIcon } from 'lucide-react';
import { Contact } from '../types';

interface ScheduleMeetingModalProps {
    contact: Contact;
    onClose: () => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({ contact, onClose }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [subject, setSubject] = useState('Meeting regarding OBESSU Event');

    const generateGoogleCalendarLink = () => {
        if (!date || !time) return '#';
        const start = new Date(`${date}T${time}`).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(new Date(`${date}T${time}`).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(subject)}&dates=${start}/${end}&details=Meeting+with+${encodeURIComponent(contact.name)}&location=Online`;
    };

    const generateOutlookCalendarLink = () => {
        if (!date || !time) return '#';
        const start = new Date(`${date}T${time}`).toISOString();
        const end = new Date(new Date(`${date}T${time}`).getTime() + 60 * 60 * 1000).toISOString();
        return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(subject)}&startdt=${start}&enddt=${end}&body=Meeting+with+${encodeURIComponent(contact.name)}&location=Online`;
    };

    const generateEmailDraft = () => {
        const body = `Hi ${contact.name},%0D%0A%0D%0AI would like to schedule a meeting to discuss the event.%0D%0A%0D%0ADate: ${date || 'TBD'}%0D%0ATime: ${time || 'TBD'}%0D%0A%0D%0ABest regards,`;
        return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${body}`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Schedule Meeting with {contact.name}</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <input type="date" className="w-full p-2 border rounded" value={date} onChange={(e) => setDate(e.target.value)} />
                    <input type="time" className="w-full p-2 border rounded" value={time} onChange={(e) => setTime(e.target.value)} />
                    <input type="text" className="w-full p-2 border rounded" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
                    
                    <div className="flex flex-col gap-2 pt-4">
                        <a href={generateEmailDraft()} className="flex items-center gap-2 p-2 bg-brand-policy/10 text-brand-policy rounded hover:bg-brand-policy/20"><Mail size={16} /> Draft Email</a>
                        <a href={generateGoogleCalendarLink()} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 text-slate-700 rounded hover:bg-slate-100"><Calendar size={16} /> Google Calendar</a>
                        <a href={generateOutlookCalendarLink()} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 text-slate-700 rounded hover:bg-slate-100"><Calendar size={16} /> Outlook Calendar</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
