import { createGoogleDoc, createGoogleSlide, createGoogleTask, getChatSpaces, sendChatMessage, createGoogleMeet, createGoogleForm, createGoogleKeepNote } from "../services/googleIntegration";

import React, { useState, useEffect, useRef } from 'react';
import { TasksTab } from './TasksTab';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { EventData, Priority, RepresentativeRole, Contact } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { 
  Calendar, MapPin, Building2, AlertCircle, FileText,
  Mail, CheckCircle, Save, Loader2, Sparkles, X, ExternalLink, Briefcase, Trash2, Users, User, FileJson, Plus, Search, Edit2, CalendarPlus, Target, ShieldAlert, ArrowRight, Volume2, Square, ChevronUp, ChevronDown, FileSpreadsheet, Cloud
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateBriefing, generateSpeech, researchOrganization, searchLocation } from '../services/gemmaService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useToast } from '../contexts/ToastContext';

interface EventDetailProps {
  event: EventData;
  onUpdate: (updatedEvent: EventData) => void;
  onDelete: () => void;
  contacts?: Contact[];
  onViewContact?: (contactId: string) => void;
  onAddContact?: (contact: Omit<Contact, 'id'>) => void;
  allEvents?: EventData[];
}

type TabType = 'context' | 'logistics' | 'prep' | 'outcomes' | 'tasks' | 'raw';
type ViewMode = 'report' | 'editor';

export const EventDetail: React.FC<EventDetailProps> = ({
 event, onUpdate, onDelete, contacts = [], onViewContact, onAddContact, allEvents = [] }) => {
  
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [viewMode, setViewMode] = useState<ViewMode>('report');
  const [activeTab, setActiveTab] = useState<TabType>('context');
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [overlapWarning, setOverlapWarning] = useState('');
  
  const checkOverlap = (selectedDate: string) => {
    const overlapping = allEvents.find(e => e.id !== localEvent.id && e.analysis.date === selectedDate);
    if (overlapping) {
      setOverlapWarning('Warning: Another event (' + overlapping.analysis.eventName + ') overlaps on this date.');
    } else {
      setOverlapWarning('');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setLocalEvent({ ...localEvent, analysis: { ...localEvent.analysis, date: d }});
    checkOverlap(d);
  };

  
  // States for link editing
  const [isEditingRegLink, setIsEditingRegLink] = useState(false);
  const [isEditingProgLink, setIsEditingProgLink] = useState(false);
  const [newActivity, setNewActivity] = useState('');

  // States for Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isEditingBriefing, setIsEditingBriefing] = useState(false);
  const [briefingEditBuffer, setBriefingEditBuffer] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Refs for click outside
  const calendarMenuRef = useRef<HTMLDivElement>(null);
  const { showToast, showError } = useToast();
  
  

  const [researchResult, setResearchResult] = useState<{ title: string, text: string, urls: string[] } | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  const draftRef = useRef({
    isEditing: isEditingBriefing,
    buffer: briefingEditBuffer,
    original: localEvent.followUp.briefing,
    id: localEvent.id
  });

  useEffect(() => {
    draftRef.current = {
      isEditing: isEditingBriefing,
      buffer: briefingEditBuffer,
      original: localEvent.followUp.briefing,
      id: localEvent.id
    };
  }, [isEditingBriefing, briefingEditBuffer, localEvent.followUp.briefing, localEvent.id]);

  const handleResearchInstitution = async () => {
    if (!localEvent.analysis.institution) return;
    setIsResearching(true);
    try {
      const result = await researchOrganization(localEvent.analysis.institution);
      setResearchResult({ title: `Research: ${localEvent.analysis.institution}`, text: result.text, urls: result.urls });
    } catch (e: any) {
      showError(e.message || "Failed to research institution.");
    } finally {
      setIsResearching(false);
    }
  };

  const handleResearchVenue = async () => {
    if (!localEvent.analysis.venue) return;
    setIsResearching(true);
    try {
      const result = await searchLocation(localEvent.analysis.venue);
      setResearchResult({ title: `Venue Info: ${localEvent.analysis.venue}`, text: result.text, urls: result.urls });
    } catch (e: any) {
      showError(e.message || "Failed to research venue.");
    } finally {
      setIsResearching(false);
    }
  };

  useEffect(() => {
    const { isEditing, buffer, original, id } = draftRef.current;
    if (id !== event.id && isEditing && buffer !== original) {
      if (window.confirm("You have unsaved changes in your briefing. Do you want to save them as a draft to local storage?")) {
        localStorage.setItem(`draft_briefing_${id}`, buffer);
      }
      setIsEditingBriefing(false);
      setBriefingEditBuffer('');
    }

    setLocalEvent(JSON.parse(JSON.stringify(event)));
    setIsEditing(false);
    setIsEditingRegLink(false);
    setIsEditingProgLink(false);
  }, [event]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { isEditing, buffer, original, id } = draftRef.current;
      if (isEditing && buffer !== original) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const { isEditing, buffer, original, id } = draftRef.current;
      if (isEditing && buffer !== original) {
        if (window.confirm("You have unsaved changes in your briefing. Do you want to save them as a draft to local storage?")) {
          localStorage.setItem(`draft_briefing_${id}`, buffer);
        }
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false);
      }
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(event.target as Node)) {
        setShowCalendarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleChange = (section: keyof EventData, field: string, value: any) => {
    setLocalEvent(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
    setIsEditing(true);
  };

  const handleStatusChange = (newStatus: string) => {
    setLocalEvent(prev => {
      const history = prev.followUp.statusHistory ? [...prev.followUp.statusHistory] : [];
      history.push({
        status: newStatus,
        date: new Date().toISOString(),
        user: 'Current User' // In a real app, this would be the logged-in user
      });
      return {
        ...prev,
        followUp: {
          ...prev.followUp,
          status: newStatus as any,
          statusHistory: history
        }
      };
    });
    setIsEditing(true);
  };

  const handleRecurrenceChange = (field: string, value: any) => {
    setLocalEvent(prev => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        recurrence: {
          ...(prev.analysis.recurrence || { isRecurring: false, frequency: 'Weekly', interval: 1 }),
          [field]: value
        }
      }
    }));
    setIsEditing(true);
  };

  const handleBriefingGen = async () => {
    setIsGeneratingBrief(true);
    try {
      const result = await generateBriefing(localEvent);
      setLocalEvent(prev => ({
        ...prev,
        followUp: {
          ...prev.followUp,
          briefing: result.briefing,
          actionableInsights: result.actionableInsights
        }
      }));
      setIsEditing(true);
    } catch (e: any) {
      showError(e.message || "Failed to generate briefing.");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handlePlayBriefing = async () => {
    if (isPlayingAudio) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!localEvent.followUp.briefing) return;

    setIsGeneratingAudio(true);
    try {
      const base64Audio = await generateSpeech(localEvent.followUp.briefing);
      if (!base64Audio) throw new Error("Failed to generate audio.");

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;

      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => setIsPlayingAudio(false);
      sourceNodeRef.current = source;
      
      source.start(0);
      setIsPlayingAudio(true);
    } catch (error) {
      console.error("Audio playback failed:", error);
      showError("Failed to play audio briefing.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePickContact = (contact: Contact) => {
    setLocalEvent(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        role: contact.role,
        organization: contact.organization
      }
    }));
    setIsEditing(true);
    setShowContactPicker(false);
    setContactSearch('');
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.organization.toLowerCase().includes(contactSearch.toLowerCase())
  );

  
  
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
      await sendChatMessage(spaces[0].name, 'New Event: ' + localEvent.analysis.eventName + '\nDate: ' + localEvent.analysis.date);
      showToast('Shared to Chat successfully', 'success');
    } catch (e) {
      showError('Failed to share to Chat: ' + e.message);
    }
  };

  // --- Export Functions ---

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(localEvent, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `${localEvent.analysis.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  };

  const handleExportCSV = () => {
    const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
      return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
          acc[pre + k] = obj[k].join('; ');
        } else {
          acc[pre + k] = String(obj[k]);
        }
        return acc;
      }, {});
    };

    const flatEvent = flattenObject(localEvent);
    const headers = Object.keys(flatEvent);
    const values = Object.values(flatEvent).map(v => `"${v.replace(/"/g, '""')}"`);

    const csvContent = headers.join(",") + "\n" + values.join(",");

    const fileName = `${localEvent.analysis.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", url);
    linkElement.setAttribute("download", fileName);
    linkElement.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
      return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
          acc[pre + k] = obj[k].join('; ');
        } else {
          acc[pre + k] = obj[k];
        }
        return acc;
      }, {});
    };

    const flatEvent = flattenObject(localEvent);
    const worksheet = XLSX.utils.json_to_sheet([flatEvent]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Event");
    
    const fileName = `${localEvent.analysis.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // --- Calendar Functions ---

  const getEventDates = () => {
    const dateStr = localEvent.analysis.date;
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) {
        const now = new Date();
        return { start: now, end: new Date(now.getTime() + 60*60*1000) };
    }
    if (start.getHours() === 0 && start.getMinutes() === 0) {
        start.setHours(9, 0, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000); 
    return { start, end };
  };

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const handleGoogleCalendar = () => {
    const { start, end } = getEventDates();
    const { eventName, description, venue } = localEvent.analysis;
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', eventName);
    url.searchParams.append('dates', `${formatDateForGoogle(start)}/${formatDateForGoogle(end)}`);
    url.searchParams.append('details', description);
    url.searchParams.append('location', venue);
    window.open(url.toString(), '_blank');
    setShowCalendarMenu(false);
  };

  const handleOutlookCalendar = () => {
    const { start, end } = getEventDates();
    const { eventName, description, venue } = localEvent.analysis;
    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.append('subject', eventName);
    url.searchParams.append('body', description);
    url.searchParams.append('startdt', start.toISOString());
    url.searchParams.append('enddt', end.toISOString());
    url.searchParams.append('location', venue);
    window.open(url.toString(), '_blank');
    setShowCalendarMenu(false);
  };

  const handleDownloadICS = () => {
    const { start, end } = getEventDates();
    const { eventName, description, venue } = localEvent.analysis;
    
    const escapeICS = (str: string) => 
      str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');

    const foldLine = (line: string) => {
      if (line.length <= 75) return line;
      const chunks = [];
      chunks.push(line.substring(0, 75));
      let i = 75;
      while (i < line.length) {
        chunks.push(' ' + line.substring(i, i + 74));
        i += 74;
      }
      return chunks.join('\r\n');
    };

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OBESSU//Event Analyzer//EN',
      'BEGIN:VEVENT',
      `UID:${crypto.randomUUID()}`,
      `DTSTAMP:${formatDateForGoogle(new Date())}`,
      `DTSTART:${formatDateForGoogle(start)}`,
      `DTEND:${formatDateForGoogle(end)}`,
      `SUMMARY:${escapeICS(eventName)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `LOCATION:${escapeICS(venue)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const icsContent = icsLines.map(foldLine).join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${eventName.replace(/[^a-z0-9]/gi, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCalendarMenu(false);
  };

  const handleSave = () => {
    onUpdate(localEvent);
    setIsEditing(false);
    setIsEditingRegLink(false);
    setIsEditingProgLink(false);
  };

  const splitBriefing = (text: string) => {
    // Simple logic to extract potential "red lines" if the AI generated them
    // This assumes the AI output format in gemmaService
    const parts = text.split(/Red Lines|RED LINES|Red lines/);
    if (parts.length > 1) {
        return {
            objectives: parts[0],
            redLines: parts[1]
        };
    }
    return { objectives: text, redLines: '' };
  };

  const briefingContent = splitBriefing(localEvent.followUp.briefing);

  // --- Render ---

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Toggle Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0B0F19]">
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-brand-projects/20 text-emerald-400 flex items-center justify-center">
                    <Building2 size={16} />
                 </div>
                 <span className="text-xs font-bold tracking-[0.2em] text-white">OBESSU EVENT MANAGEMENT</span>
            </div>
            
            <div className="flex bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('report')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'report' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Briefing
                </button>
                <button 
                    onClick={() => setViewMode('editor')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'editor' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Editor
                </button>
            </div>

            <div className="flex items-center gap-2">
                 {/* Shared Actions */}
                 <div className="flex items-center gap-1">
                    
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

                    <div className="w-px h-6 bg-slate-700 mx-2"></div>
                    <button onClick={handleExportJSON} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Export JSON"><FileJson size={16}/></button>
                    <button onClick={handleExportCSV} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Export CSV"><FileText size={16}/></button>
                    <button onClick={handleExportExcel} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Export Excel"><FileSpreadsheet size={16}/></button>
                    <div className="relative" ref={calendarMenuRef}>
                        <button onClick={() => setShowCalendarMenu(!showCalendarMenu)} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Calendar">
                            <CalendarPlus size={16}/>
                        </button>
                        {showCalendarMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50 overflow-hidden text-slate-300">
                                <button onClick={handleGoogleCalendar} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Google Calendar</button>
                                <button onClick={handleOutlookCalendar} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Outlook Web</button>
                                <button onClick={handleDownloadICS} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Download .ICS</button>
                            </div>
                        )}
                    </div>
                    {viewMode === 'editor' && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    )}
                 </div>
            </div>
        </div>

        {viewMode === 'report' ? (
            // --- REPORT MODE ---
            <div className="flex-1 overflow-y-auto bg-[#0B0F19] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto p-8 space-y-8">
                    
                    {/* Header */}
                    <header>
                        <div className="inline-block px-3 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full mb-4 border border-emerald-900/50">
                            {localEvent.analysis.theme} Report
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-8">
                            {localEvent.analysis.eventName}
                        </h1>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-t border-slate-800 pt-6">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</span>
                                <span className="text-sm font-medium text-slate-200">{localEvent.analysis.venue}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dates</span>
                                <span className="text-sm font-medium text-slate-200">{localEvent.analysis.date} {localEvent.analysis.time ? `@ ${localEvent.analysis.time}` : ''}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Deadline</span>
                                <span className="text-sm font-medium text-emerald-400">{localEvent.analysis.finalDeadline}</span>
                            </div>
                        </div>
                    </header>

                    {/* Event Purpose */}
                    <section className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50">
                        <h3 className="text-lg font-bold text-white mb-4">Event Purpose</h3>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            {localEvent.analysis.description}
                        </p>
                        
                        {localEvent.analysis.institutionDetails && (
                            <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-800/50 rounded-xl">
                                <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Building2 size={14} /> Institution Details
                                </h4>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    {localEvent.analysis.institutionDetails}
                                </p>
                            </div>
                        )}

                        {/* Actionable Insights */}
                        <div className="mb-6 p-4 bg-brand-policy/20 border border-brand-policy/50 rounded-xl">
                            <h4 className="text-brand-policy text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Target size={14} /> Actionable Insights
                            </h4>
                            {localEvent.followUp.actionableInsights && localEvent.followUp.actionableInsights.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm leading-relaxed">
                                    {localEvent.followUp.actionableInsights.map((insight, idx) => (
                                        <li key={idx}>{insight}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 text-sm italic">No actionable insights available.</p>
                            )}
                        </div>

                        {localEvent.analysis.threadSummary && (
                            <div className="mb-6 p-4 bg-brand-policy/20 border border-brand-policy/50 rounded-xl">
                                <h4 className="text-brand-policy text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Sparkles size={14} /> Thread Summary
                                </h4>
                                <p className="text-brand-policy/30/80 text-sm leading-relaxed italic">
                                    {localEvent.analysis.threadSummary}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {localEvent.analysis.linkedActivities.length > 0 ? (
                                localEvent.analysis.linkedActivities.slice(0, 2).map((act, i) => (
                                    <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                        <span className="text-brand-projects text-xs font-bold uppercase mb-1 block">Context {i + 1}</span>
                                        <p className="text-slate-300 font-medium text-sm">{act}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                    <span className="text-brand-projects text-xs font-bold uppercase mb-1 block">Context</span>
                                    <p className="text-slate-300 font-medium text-sm">No linked activities found.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Priority */}
                        <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50 flex flex-col justify-between relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-3 opacity-10">
                                 <Target size={100} className="text-brand-projects" />
                             </div>
                             <div className="relative z-10">
                                 <span className="text-6xl font-black text-white tracking-tighter block mb-2">{localEvent.analysis.priorityScore}</span>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority Score</span>
                             </div>
                             <div className="mt-6 relative z-10">
                                 <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                                     localEvent.analysis.priority === Priority.High ? 'bg-brand-projects text-slate-900' : 
                                     localEvent.analysis.priority === Priority.Medium ? 'bg-orange-500 text-white' : 
                                     'bg-slate-700 text-slate-300'
                                 }`}>
                                     {localEvent.analysis.priority} Level
                                 </span>
                             </div>
                        </div>

                        {/* Assigned */}
                        <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50 flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Assigned Individual</span>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold text-emerald-400 border border-slate-700">
                                    {localEvent.contact.name ? localEvent.contact.name.charAt(0) : '?'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {localEvent.contact.name || 'Unassigned'}
                                    </h3>
                                    <p className="text-brand-projects font-medium text-sm">
                                        {localEvent.contact.role || 'No Role'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Strip */}
                    <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Contact Secretariat</span>
                            <span className="text-white font-medium text-lg">{localEvent.analysis.senderEmail || localEvent.contact.email || 'No email available'}</span>
                        </div>
                        <a href={`mailto:${localEvent.analysis.senderEmail || localEvent.contact.email}`} className="w-12 h-12 rounded-full bg-brand-projects flex items-center justify-center text-slate-900 hover:bg-emerald-400 transition-colors">
                            <Mail size={20} />
                        </a>
                    </div>

                    {/* Strategic Analysis */}
                    <section>
                         <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Strategic Analysis</h2>
                         
                         <div className="space-y-6">
                            <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xl font-black text-brand-projects">01</span>
                                    <h3 className="text-lg font-bold text-white">Relevance Assessment</h3>
                                </div>
                                <p className="text-slate-400 italic mb-4 pl-9 border-l-2 border-slate-700">
                                    "{localEvent.analysis.priorityReasoning}"
                                </p>
                            </div>

                            <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xl font-black text-brand-projects">02</span>
                                    <h3 className="text-lg font-bold text-white">Portfolio Alignment</h3>
                                </div>
                                <div className="pl-9">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Lead Member</span>
                                    <h4 className="text-xl font-bold text-white mb-4">{localEvent.contact.name || 'TBD'}</h4>
                                    
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Focus Areas</span>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-slate-300 border border-slate-700">{localEvent.analysis.theme}</span>
                                        {localEvent.analysis.linkedActivities.map((act, i) => (
                                            <span key={i} className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-slate-300 border border-slate-700">{act}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         </div>
                    </section>

                    {/* Executive Briefing */}
                    <section>
                         <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-2">
                             <h2 className="text-2xl font-bold text-white">Executive Briefing</h2>
                             <div className="flex gap-2">
                                 {localEvent.followUp.briefing && !isEditingBriefing && (
                                     <button
                                         onClick={() => {
                                             const draft = localStorage.getItem(`draft_briefing_${localEvent.id}`);
                                             if (draft && draft !== localEvent.followUp.briefing) {
                                                 if (window.confirm("You have an unsaved draft for this briefing. Do you want to restore it?")) {
                                                     setBriefingEditBuffer(draft);
                                                 } else {
                                                     setBriefingEditBuffer(localEvent.followUp.briefing);
                                                     localStorage.removeItem(`draft_briefing_${localEvent.id}`);
                                                 }
                                             } else {
                                                 setBriefingEditBuffer(localEvent.followUp.briefing);
                                             }
                                             setIsEditingBriefing(true);
                                         }}
                                         className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
                                     >
                                         <Edit2 size={14} /> Edit Briefing
                                     </button>
                                 )}
                                 {localEvent.followUp.briefing && (
                                     <button
                                         onClick={handlePlayBriefing}
                                         disabled={isGeneratingAudio}
                                         className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                             isPlayingAudio 
                                                 ? 'bg-brand-projects/20 text-emerald-400 border border-brand-projects/50' 
                                                 : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                                         }`}
                                     >
                                         {isGeneratingAudio ? (
                                             <Loader2 size={14} className="animate-spin" />
                                         ) : isPlayingAudio ? (
                                             <Square size={14} />
                                         ) : (
                                             <Volume2 size={14} />
                                         )}
                                         {isGeneratingAudio ? 'Generating Audio...' : isPlayingAudio ? 'Stop Audio' : 'Listen to Briefing'}
                                     </button>
                                 )}
                             </div>
                         </div>
                         
                         {isEditingBriefing ? (
                             <div className="mb-8">
                                 <textarea
                                     className="w-full p-4 bg-[#131B2C] border border-slate-700 rounded-xl text-slate-300 leading-relaxed focus:ring-2 focus:ring-brand-projects outline-none resize-y min-h-[300px]"
                                     value={briefingEditBuffer}
                                     onChange={(e) => setBriefingEditBuffer(e.target.value)}
                                     placeholder="Edit the executive briefing here..."
                                 />
                                 <div className="flex justify-end gap-3 mt-4">
                                     <button 
                                         onClick={() => {
                                             if (briefingEditBuffer !== localEvent.followUp.briefing) {
                                                 if (window.confirm("You have unsaved changes. Do you want to save them as a draft to local storage?")) {
                                                     localStorage.setItem(`draft_briefing_${localEvent.id}`, briefingEditBuffer);
                                                 } else {
                                                     localStorage.removeItem(`draft_briefing_${localEvent.id}`);
                                                 }
                                             }
                                             setIsEditingBriefing(false);
                                         }}
                                         className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                     >
                                         Cancel
                                     </button>
                                     <button 
                                         onClick={() => {
                                             const updatedEvent = {
                                                 ...localEvent,
                                                 followUp: {
                                                     ...localEvent.followUp,
                                                     briefing: briefingEditBuffer
                                                 }
                                             };
                                             setLocalEvent(updatedEvent);
                                             onUpdate(updatedEvent);
                                             setIsEditingBriefing(false);
                                             localStorage.removeItem(`draft_briefing_${localEvent.id}`);
                                         }}
                                         className="flex items-center gap-2 px-4 py-2 bg-brand-projects text-white rounded-lg text-sm font-bold hover:bg-brand-projects transition-colors"
                                     >
                                         <Save size={16} /> Save Briefing
                                     </button>
                                 </div>
                             </div>
                         ) : (
                             <>
                                 <div className="mb-8">
                                     <h4 className="text-brand-projects text-xs font-bold uppercase tracking-widest mb-4">Key Objectives</h4>
                                     <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50 text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {briefingContent.objectives || "Briefing not generated yet."}
                                     </div>
                                 </div>

                                 {briefingContent.redLines && (
                                     <div className="mb-8 bg-red-950/20 rounded-2xl p-6 border border-red-900/30">
                                         <h4 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                             <ShieldAlert size={14}/> Red Lines
                                         </h4>
                                         <div className="text-red-200/80 whitespace-pre-wrap leading-relaxed">
                                             {briefingContent.redLines}
                                         </div>
                                     </div>
                                 )}
                             </>
                         )}

                         {localEvent.followUp.commsPack.remarks && (
                             <div>
                                 <h4 className="text-brand-projects text-xs font-bold uppercase tracking-widest mb-4">Opening Statements</h4>
                                 <div className="bg-[#131B2C] rounded-2xl p-6 border-l-4 border-brand-projects italic text-slate-300">
                                     "{localEvent.followUp.commsPack.remarks}"
                                 </div>
                             </div>
                         )}
                    </section>

                    {/* Footer Application Details */}
                    <section className="bg-brand-projects rounded-3xl p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-projects to-emerald-700 opacity-50 z-0"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Application Details</h2>
                            <p className="text-emerald-900 font-medium mb-8 max-w-md mx-auto">
                                Confirm guidelines and prepare materials for the upcoming deadline.
                            </p>
                            
                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                {localEvent.analysis.registrationLink && (
                                    <a 
                                        href={localEvent.analysis.registrationLink} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-transform hover:scale-105 shadow-xl"
                                    >
                                        Register for Event <ArrowRight size={18} />
                                    </a>
                                )}
                                <button 
                                    onClick={handleGoogleCalendar}
                                    className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-transform hover:scale-105 shadow-xl border border-slate-200"
                                >
                                    <CalendarPlus size={18} className="text-brand-policy" /> Google Calendar
                                </button>
                                <button 
                                    onClick={handleOutlookCalendar}
                                    className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-transform hover:scale-105 shadow-xl border border-slate-200"
                                >
                                    <CalendarPlus size={18} className="text-brand-policy" /> Outlook
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block mb-1">Status</span>
                                    <span className="text-white font-bold text-lg">{localEvent.followUp.status}</span>
                                </div>
                                <div className="bg-emerald-900/20 backdrop-blur-sm p-4 rounded-xl border border-emerald-900/10">
                                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block mb-1">Deadline</span>
                                    <span className="text-slate-900 font-bold text-lg">{localEvent.analysis.finalDeadline}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        ) : (
            // --- EDITOR MODE (Previous UI) ---
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
                {/* Header (Light) */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex-1 min-w-0 pr-4">
                       <div className="flex items-center gap-3 mb-2">
                           <PriorityBadge priority={localEvent.analysis.priority} />
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{localEvent.analysis.theme}</span>
                       </div>
                       <div className="flex items-center gap-3 mb-2">
                           <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{localEvent.analysis.eventName}</h2>
                            {localEvent.tags && localEvent.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {localEvent.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                           <button 
                               onClick={handleBriefingGen}
                               disabled={isGeneratingBrief}
                               className="bg-slate-900 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-all disabled:opacity-50"
                               title="Generate Briefing & Actionable Insights"
                           >
                               {isGeneratingBrief ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} className="text-yellow-400"/>}
                               AI Generate Briefing
                           </button>
                       </div>
                       <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                           <span className="flex items-center gap-1.5">
                               <Building2 size={16} className="text-slate-400"/> 
                               {localEvent.analysis.institution}
                               <button 
                                   onClick={handleResearchInstitution}
                                   disabled={isResearching}
                                   className="ml-2 bg-brand-policy/20 text-brand-policy px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-brand-policy/30 transition-colors flex items-center gap-1"
                               >
                                   {isResearching ? <Loader2 size={10} className="animate-spin"/> : <Search size={10}/>}
                                   Research
                               </button>
                           </span>
                           <span className="flex items-center gap-1.5"><Calendar size={16} className="text-slate-400"/> {localEvent.analysis.date}</span>
                       </div>
                    </div>
                    {isEditing && (
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-policy text-white font-bold rounded-lg shadow-lg shadow-brand-policy/30 hover:bg-brand-policy transition-all"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 bg-white">
                    <TabButton active={activeTab === 'context'} onClick={() => setActiveTab('context')} icon={<FileText size={16}/>} label="Context & Analysis" />
                    <TabButton active={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} icon={<MapPin size={16}/>} label="Logistics & Links" />
                    <TabButton active={activeTab === 'prep'} onClick={() => setActiveTab('prep')} icon={<Briefcase size={16}/>} label="Briefing & Prep" />
                    <TabButton active={activeTab === 'outcomes'} onClick={() => setActiveTab('outcomes')} icon={<CheckCircle size={16}/>} label="Outcomes" />
                    <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Target size={16}/>} label="Tasks" />
                    <TabButton active={activeTab === 'raw'} onClick={() => setActiveTab('raw')} icon={<FileJson size={16}/>} label="Raw Data" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 text-slate-900">
                    {activeTab === 'context' && (
                        <div className="space-y-6 max-w-3xl">
                            <Section title="Event Description">
                                <textarea 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-brand-policy/20 outline-none resize-none h-32"
                                    value={localEvent.analysis.description}
                                    onChange={(e) => handleChange('analysis', 'description', e.target.value)}
                                />
                            </Section>

                            <Section title="Tags">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(localEvent.tags || []).map((tag, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-brand-policy/20 text-brand-policy rounded-full text-xs font-bold">
                                            {tag}
                                            <button 
                                                onClick={() => {
                                                    const newTags = (localEvent.tags || []).filter((_, i) => i !== idx);
                                                    setLocalEvent(prev => ({ ...prev, tags: newTags }));
                                                    setIsEditing(true);
                                                }}
                                                className="hover:text-brand-policy"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Add a tag and press Enter..."
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-brand-policy/20 outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            e.preventDefault();
                                            const newTag = e.currentTarget.value.trim();
                                            if (!(localEvent.tags || []).includes(newTag)) {
                                                setLocalEvent(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
                                                setIsEditing(true);
                                            }
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </Section>

                            {localEvent.analysis.threadSummary && (
                                <Section title="Thread Summary (AI Generated)">
                                    <div className="w-full p-4 bg-brand-policy/10 border border-brand-policy/20 rounded-xl text-brand-policy leading-relaxed text-sm italic">
                                        {localEvent.analysis.threadSummary}
                                    </div>
                                </Section>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <Section title="Strategic Priority">
                                    <div className="bg-white p-4 border border-slate-200 rounded-xl">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-slate-700">Relevance Score</span>
                                            <span className="text-2xl font-black text-brand-policy">{localEvent.analysis.priorityScore}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                                            <div className="bg-brand-policy h-2 rounded-full" style={{width: `${localEvent.analysis.priorityScore}%`}}></div>
                                        </div>
                                        <p className="text-sm text-slate-500 italic">{localEvent.analysis.priorityReasoning}</p>
                                    </div>
                                </Section>
                                <Section title="Related Activities">
                                     <div className="bg-white p-4 border border-slate-200 rounded-xl h-full space-y-4">
                                        {localEvent.analysis.linkedActivities.length > 0 ? (
                                            <ul className="space-y-2">
                                                {localEvent.analysis.linkedActivities.map((act, i) => (
                                                    <li key={i} className="flex items-center justify-between gap-2 text-sm text-brand-policy font-medium group">
                                                        <div className="flex items-center gap-2 truncate">
                                                            <ExternalLink size={14} className="shrink-0" /> 
                                                            <span className="truncate">{act}</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                const updated = localEvent.analysis.linkedActivities.filter((_, index) => index !== i);
                                                                handleChange('analysis', 'linkedActivities', updated);
                                                            }}
                                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-slate-400 text-sm">No linked internal activities found.</p>}
                                        
                                        <div className="pt-3 border-t border-slate-100">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text"
                                                    placeholder="Add activity or position..."
                                                    className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-policy/20"
                                                    value={newActivity}
                                                    onChange={(e) => setNewActivity(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newActivity.trim()) {
                                                            const updated = [...localEvent.analysis.linkedActivities, newActivity.trim()];
                                                            handleChange('analysis', 'linkedActivities', updated);
                                                            setNewActivity('');
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    onClick={() => {
                                                        if (newActivity.trim()) {
                                                            const updated = [...localEvent.analysis.linkedActivities, newActivity.trim()];
                                                            handleChange('analysis', 'linkedActivities', updated);
                                                            setNewActivity('');
                                                        }
                                                    }}
                                                    className="p-2 bg-brand-policy text-white rounded-lg hover:bg-brand-policy transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                     </div>
                                </Section>
                            </div>

                            {localEvent.analysis.suggestedRepresentative && (
                                <Section title="Suggested Representative">
                                    <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-policy/15 flex items-center justify-center text-brand-policy font-bold">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 text-sm block">{localEvent.analysis.suggestedRepresentative}</span>
                                                <span className="text-xs text-slate-500">Suggested based on portfolio and strategic theme alignment.</span>
                                            </div>
                                        </div>
                                        {localEvent.followUp.commsPack.representative !== localEvent.analysis.suggestedRepresentative && (
                                            <button 
                                                onClick={() => {
                                                    const updated = {
                                                        ...localEvent,
                                                        followUp: {
                                                            ...localEvent.followUp,
                                                            commsPack: {
                                                                ...localEvent.followUp.commsPack,
                                                                representative: localEvent.analysis.suggestedRepresentative
                                                            }
                                                        }
                                                    };
                                                    setLocalEvent(updated);
                                                    onUpdate(updated);
                                                    showToast(`Assigned ${localEvent.analysis.suggestedRepresentative} as representative`, 'success');
                                                }}
                                                className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                Assign This Person
                                            </button>
                                        )}
                                    </div>
                                </Section>
                            )}
                        </div>
                    )}

                    {activeTab === 'logistics' && (
                        <div className="space-y-6 max-w-3xl">
                            <div className="grid grid-cols-2 gap-6">
                                 <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                                        <input 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-brand-policy/20 outline-none"
                                            value={localEvent.analysis.date}
                                            onChange={(e) => handleChange('analysis', 'date', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
                                        <input 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-brand-policy/20 outline-none"
                                            value={localEvent.analysis.time || ''}
                                            onChange={(e) => handleChange('analysis', 'time', e.target.value)}
                                            placeholder="e.g. 14:00 CET"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Venue / Platform</label>
                                            <button 
                                                onClick={handleResearchVenue}
                                                disabled={isResearching || !localEvent.analysis.venue}
                                                className="bg-brand-policy/20 text-brand-policy px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-brand-policy/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {isResearching ? <Loader2 size={10} className="animate-spin"/> : <Search size={10}/>}
                                                Research
                                            </button>
                                        </div>
                                        <input 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-brand-policy/20 outline-none"
                                            value={localEvent.analysis.venue}
                                            onChange={(e) => handleChange('analysis', 'venue', e.target.value)}
                                        />
                                    </div>

                                     {/* Recurrence Section */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Recurrence Pattern</label>
                                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="isRecurring"
                                                    className="w-4 h-4 text-brand-policy rounded focus:ring-brand-policy"
                                                    checked={localEvent.analysis.recurrence?.isRecurring || false}
                                                    onChange={(e) => handleRecurrenceChange('isRecurring', e.target.checked)}
                                                />
                                                <label htmlFor="isRecurring" className="text-sm font-bold text-slate-700">Recurring Event</label>
                                            </div>
                                            
                                            {localEvent.analysis.recurrence?.isRecurring && (
                                                <div className="grid grid-cols-2 gap-3 pl-6 animate-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Frequency</label>
                                                        <select 
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
                                                            value={localEvent.analysis.recurrence?.frequency || 'Weekly'}
                                                            onChange={(e) => handleRecurrenceChange('frequency', e.target.value)}
                                                        >
                                                            <option value="Daily">Daily</option>
                                                            <option value="Weekly">Weekly</option>
                                                            <option value="Monthly">Monthly</option>
                                                            <option value="Yearly">Yearly</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Until</label>
                                                        <input 
                                                            type="date"
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
                                                            value={localEvent.analysis.recurrence?.endDate || ''}
                                                            onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Section title="Remarks (Comms Pack)">
                                        <div className="flex gap-2">
                                            <textarea 
                                                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-brand-policy/20 outline-none h-32"
                                                value={localEvent.followUp.commsPack.remarks || ''}
                                                onChange={(e) => handleChange('followUp', 'commsPack', { ...localEvent.followUp.commsPack, remarks: e.target.value })}
                                            />
                                            <button 
                                                onClick={() => onUpdate(localEvent)}
                                                className="px-4 py-2 bg-brand-policy text-white font-bold rounded-lg shadow-lg hover:bg-brand-policy transition-all"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </Section>

                                 </div>
                                 <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Deadline</label>
                                        <input 
                                            type="date"
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-brand-policy/20 outline-none"
                                            value={localEvent.analysis.finalDeadline}
                                            onChange={(e) => handleChange('analysis', 'finalDeadline', e.target.value)}
                                        />
                                    </div>
                                    
                                    {/* Interactive Links Section */}
                                    <div className="space-y-4 pt-2">
                                        {/* Registration Link */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Link</label>
                                            {localEvent.analysis.registrationLink && !isEditingRegLink ? (
                                                <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-brand-policy/50 transition-colors">
                                                    <a 
                                                        href={localEvent.analysis.registrationLink} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-brand-policy underline text-sm font-medium truncate flex-1 mr-2"
                                                    >
                                                        {localEvent.analysis.registrationLink}
                                                    </a>
                                                    <div className="flex gap-2">
                                                         <button 
                                                            onClick={() => setIsEditingRegLink(true)} 
                                                            className="p-1.5 text-slate-400 hover:text-brand-policy hover:bg-brand-policy/10 rounded-lg transition-colors"
                                                            title="Edit Link"
                                                         >
                                                            <Edit2 size={14}/>
                                                         </button>
                                                         <a 
                                                            href={localEvent.analysis.registrationLink} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="p-1.5 text-slate-400 hover:text-brand-policy hover:bg-brand-policy/10 rounded-lg transition-colors"
                                                            title="Open Link"
                                                         >
                                                            <ExternalLink size={14}/>
                                                         </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-policy/20"
                                                        value={localEvent.analysis.registrationLink || ''}
                                                        onChange={(e) => handleChange('analysis', 'registrationLink', e.target.value)}
                                                        onBlur={() => { if(localEvent.analysis.registrationLink) setIsEditingRegLink(false); }}
                                                        placeholder="https://..."
                                                        autoFocus={isEditingRegLink}
                                                    />
                                                    {localEvent.analysis.registrationLink && (
                                                        <button 
                                                            onClick={() => setIsEditingRegLink(false)}
                                                            className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Calendar Integration */}
                                        <div className="space-y-2 pt-4 border-t border-slate-100">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add to Calendar</label>
                                            <div className="flex gap-2">
                                                <button onClick={handleGoogleCalendar} className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Google</button>
                                                <button onClick={handleOutlookCalendar} className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Outlook</button>
                                                <button onClick={handleDownloadICS} className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">.ICS</button>
                                            </div>
                                        </div>

                                        {/* Programme Link */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Programme / Agenda Link</label>
                                            {localEvent.analysis.programmeLink && !isEditingProgLink ? (
                                                <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-brand-policy/50 transition-colors">
                                                    <a 
                                                        href={localEvent.analysis.programmeLink} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-brand-policy underline text-sm font-medium truncate flex-1 mr-2"
                                                    >
                                                        {localEvent.analysis.programmeLink}
                                                    </a>
                                                    <div className="flex gap-2">
                                                         <button 
                                                            onClick={() => setIsEditingProgLink(true)} 
                                                            className="p-1.5 text-slate-400 hover:text-brand-policy hover:bg-brand-policy/10 rounded-lg transition-colors"
                                                            title="Edit Link"
                                                         >
                                                            <Edit2 size={14}/>
                                                         </button>
                                                         <a 
                                                            href={localEvent.analysis.programmeLink} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="p-1.5 text-slate-400 hover:text-brand-policy hover:bg-brand-policy/10 rounded-lg transition-colors"
                                                            title="Open Link"
                                                         >
                                                            <ExternalLink size={14}/>
                                                         </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-policy/20"
                                                        value={localEvent.analysis.programmeLink || ''}
                                                        onChange={(e) => handleChange('analysis', 'programmeLink', e.target.value)}
                                                        onBlur={() => { if(localEvent.analysis.programmeLink) setIsEditingProgLink(false); }}
                                                        placeholder="https://..."
                                                        autoFocus={isEditingProgLink}
                                                    />
                                                    {localEvent.analysis.programmeLink && (
                                                        <button 
                                                            onClick={() => setIsEditingProgLink(false)}
                                                            className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                 </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'prep' && (
                        <div className="space-y-8 max-w-4xl">
                             {/* Representative Assignment */}
                             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><User size={18} /> Assigned Representative</h3>
                                    <div className="relative">
                                        <button 
                                            onClick={() => {
                                                setShowContactPicker(!showContactPicker);
                                                setContactSearch('');
                                            }}
                                            className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1"
                                        >
                                            <Users size={12}/> {localEvent.contact.name ? 'Change Person' : 'Assign Person'}
                                        </button>
                                        {localEvent.contact.name && (
                                            <button 
                                                onClick={() => setShowMeetingModal(true)}
                                                className="text-xs font-bold bg-brand-policy text-white px-3 py-1.5 rounded-lg hover:bg-brand-policy transition-colors flex items-center gap-1 mt-2"
                                            >
                                                <Calendar size={12}/> Schedule Meeting
                                            </button>
                                        )}
                                        {showContactPicker && (
                                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden flex flex-col">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Contact</div>
                                                    <div className="relative">
                                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                        <input 
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search people..." 
                                                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-policy/20 outline-none text-slate-700"
                                                            value={contactSearch}
                                                            onChange={(e) => setContactSearch(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredContacts.length > 0 ? (
                                                        filteredContacts.map(c => (
                                                        <button 
                                                            key={c.id} 
                                                            onClick={() => handlePickContact(c)}
                                                            className="w-full text-left px-4 py-2 hover:bg-brand-policy/10 text-sm font-medium text-slate-700 truncate border-b border-slate-50 last:border-0"
                                                        >
                                                            <div className="font-bold text-slate-800">{c.name}</div>
                                                            <div className="text-xs text-slate-500 truncate">{c.role} {c.organization ? `@ ${c.organization}` : ''}</div>
                                                        </button>
                                                    ))) : (
                                                        <div className="p-4 text-center text-xs text-slate-400 italic">No contacts match "{contactSearch}"</div>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => { 
                                                        const name = prompt("Enter contact name:");
                                                        if (name) {
                                                            onAddContact?.({ name, email: '', role: '', organization: '', notes: '' });
                                                            setShowContactPicker(false);
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-brand-policy border-t border-slate-100 bg-slate-50/50"
                                                >
                                                    + Create New Contact
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {showMeetingModal && (
                                    <ScheduleMeetingModal 
                                        contact={{
                                            id: localEvent.contact.contactId || 'unknown',
                                            name: localEvent.contact.name,
                                            email: localEvent.contact.email,
                                            role: localEvent.contact.role,
                                            organization: localEvent.contact.organization,
                                            notes: localEvent.contact.notes
                                        }} 
                                        onClose={() => setShowMeetingModal(false)}
                                    />
                                )}
                                
                                {localEvent.contact.name ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-brand-policy/20 flex items-center justify-center text-brand-policy font-bold text-lg">
                                            {localEvent.contact.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-900">{localEvent.contact.name}</div>
                                            <div className="text-sm text-slate-500">{localEvent.contact.role} @ {localEvent.contact.organization}</div>
                                        </div>
                                        <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Role at Event</label>
                                            <select 
                                                className="bg-transparent font-bold text-sm text-slate-700 outline-none"
                                                value={localEvent.contact.repRole}
                                                onChange={(e) => handleChange('contact', 'repRole', e.target.value)}
                                            >
                                                <option value="Participant">Participant</option>
                                                <option value="Speaker">Speaker</option>
                                                <option value="Activity Host">Activity Host</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle size={16}/> No representative assigned yet.
                                    </div>
                                )}
                             </div>

                             <Section title="Briefing & Key Messages">
                                <div className="relative">
                                    <textarea 
                                        className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-brand-policy/20 outline-none h-48 resize-none"
                                        placeholder="Key points to raise, red lines, and strategic objectives..."
                                        value={localEvent.followUp.briefing}
                                        onChange={(e) => handleChange('followUp', 'briefing', e.target.value)}
                                    />
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                        {localEvent.followUp.briefing && (
                                            <button 
                                                onClick={handlePlayBriefing}
                                                disabled={isGeneratingAudio}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                                    isPlayingAudio 
                                                        ? 'bg-brand-policy/20 text-brand-policy border border-brand-policy/30' 
                                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {isGeneratingAudio ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : isPlayingAudio ? (
                                                    <Square size={12} />
                                                ) : (
                                                    <Volume2 size={12} />
                                                )}
                                                {isGeneratingAudio ? 'Generating...' : isPlayingAudio ? 'Stop' : 'Listen'}
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleBriefingGen}
                                            disabled={isGeneratingBrief}
                                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                                        >
                                            {isGeneratingBrief ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} className="text-yellow-400"/>}
                                            AI Generate Briefing
                                        </button>
                                    </div>
                                </div>
                             </Section>

                             {localEvent.followUp.actionableInsights && localEvent.followUp.actionableInsights.length > 0 && (
                                 <Section title="Actionable Insights">
                                     <div className="bg-brand-policy/10 border border-brand-policy/20 rounded-xl p-6">
                                         <ul className="list-disc pl-5 space-y-2">
                                             {localEvent.followUp.actionableInsights.map((insight, idx) => (
                                                 <li key={idx} className="text-sm text-brand-policy font-medium">
                                                     {insight}
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>
                                 </Section>
                             )}
                        </div>
                    )}

                    {activeTab === 'outcomes' && (
                        <div className="space-y-6 max-w-3xl">
                            <Section title="Post-Event Report">
                                <textarea 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-brand-policy/20 outline-none h-32 resize-none"
                                    placeholder="Summary of outcomes, key contacts made, and follow-up tasks..."
                                    value={localEvent.followUp.postEventNotes}
                                    onChange={(e) => handleChange('followUp', 'postEventNotes', e.target.value)}
                                />
                            </Section>
                            
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                 <div className="flex items-center justify-between">
                                     <div>
                                         <h4 className="font-bold text-slate-900 mb-1">Status</h4>
                                         <p className="text-sm text-slate-500">Current workflow stage</p>
                                     </div>
                                     <select 
                                        className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-slate-700 outline-none min-w-[240px]"
                                        value={localEvent.followUp.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                     >
                                        <option value="To Respond">To Respond</option>
                                        <option value="Responded - On hold for updates">Responded - On hold for updates</option>
                                        <option value="Confirmation - To be briefed">Confirmation - To be briefed</option>
                                        <option value="Prep ready">Prep ready</option>
                                        <option value="Completed - No follow up">Completed - No follow up</option>
                                        <option value="Completed - Follow Up">Completed - Follow Up</option>
                                        <option value="MOs comms">MOs comms</option>
                                        <option value="Not Relevant">Not Relevant</option>
<option value="Follow-up scheduled">Follow-up scheduled</option>
<option value="Information requested">Information requested</option>
<option value="Action pending">Action pending</option>
<option value="Completed - Actioned">Completed - Actioned</option>
                                     </select>
                                 </div>
                                 
                                 {localEvent.followUp.statusHistory && localEvent.followUp.statusHistory.length > 0 && (
                                     <div className="mt-4 pt-4 border-t border-slate-100">
                                         <button 
                                            onClick={() => setIsStatusHistoryOpen(!isStatusHistoryOpen)}
                                            className="flex items-center justify-between w-full text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 hover:text-slate-700 transition-colors"
                                         >
                                             <span>Status History</span>
                                             {isStatusHistoryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                         </button>
                                         {isStatusHistoryOpen && (
                                             <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-1">
                                                 {localEvent.followUp.statusHistory.map((historyItem, idx) => (
                                                     <div key={idx} className="flex items-start gap-3 text-sm relative">
                                                         <div className="absolute -left-[13px] top-1.5 w-2 h-2 rounded-full bg-brand-policy ring-4 ring-white"></div>
                                                         <div>
                                                             <div className="font-bold text-slate-700">{historyItem.status}</div>
                                                             <div className="text-xs text-slate-500">
                                                                 {new Date(historyItem.date).toLocaleString()} {historyItem.user ? `by ${historyItem.user}` : ''}
                                                             </div>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 )}
                            </div>

                            <Section title="Follow-up Reminders">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reminder Date & Time</label>
                                        <input 
                                            type="datetime-local"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-brand-policy/20 outline-none"
                                            value={localEvent.followUp.reminderDate || ''}
                                            onChange={(e) => handleChange('followUp', 'reminderDate', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <TasksTab 
                            tasks={localEvent.followUp.tasks || []} 
                            onUpdateTasks={(tasks) => {
                                setLocalEvent(prev => ({
                                    ...prev,
                                    followUp: { ...prev.followUp, tasks }
                                }));
                                setIsEditing(true);
                            }}
                        />
                    )}

                    {activeTab === 'raw' && (
                        <div className="space-y-6 max-w-4xl">
                            <Section title="Extracted JSON Data">
                                <div className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800 h-[500px] overflow-y-auto">
                                    {JSON.stringify(localEvent, null, 2)}
                                </div>
                            </Section>
                            <Section title="Original Source Text">
                                <div className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800 h-[200px] overflow-y-auto">
                                    {localEvent.originalText || "No original text available."}
                                </div>
                            </Section>
                            <div className="p-4 bg-brand-policy/10 text-brand-policy rounded-lg text-xs flex items-center gap-2 border border-brand-policy/20">
                                <AlertCircle size={14}/> 
                                Use this view to verify the AI's extraction accuracy against the source email.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        <ConfirmDeleteModal 
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={onDelete}
            title="Delete Event?"
            message="Are you sure you want to remove this event and all associated data? This action cannot be undone."
        />

        {researchResult && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Search size={20} className="text-brand-policy"/>
                            {researchResult.title}
                        </h2>
                        <button onClick={() => setResearchResult(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="prose prose-sm max-w-none text-slate-700">
                            {researchResult.text.split('\n').map((line, i) => (
                                <p key={i} className="mb-2">{line}</p>
                            ))}
                        </div>
                        {researchResult.urls && researchResult.urls.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Sources & Links</h4>
                                <ul className="space-y-2">
                                    {researchResult.urls.map((url, i) => (
                                        <li key={i}>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-policy hover:underline text-sm break-all">
                                                {url}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button onClick={() => setResearchResult(null)} className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
        {children}
    </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-colors ${
            active ? 'border-brand-policy text-brand-policy' : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
        {icon} {label}
    </button>
);
