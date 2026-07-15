import React, { useState } from 'react';
import { Contact, EventData } from '../types';
import { Users, Mail, Building, Search, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { syncGoogleContacts } from '../services/googleIntegration';
import { useToast } from '../contexts/ToastContext';
import { getAccessToken } from '../src/lib/firebase';

interface ContactsViewProps {
  contacts: Contact[];
  events: EventData[];
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onUpdateEvent: (event: EventData) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  events,
  onUpdateContact,
  onDeleteContact,
  selectedContactId,
  setSelectedContactId
}) => {
  const { showToast, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncContacts = async () => {
    setIsSyncing(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        showError('Please sign in with Google to sync contacts. Guest users cannot sync with external Google services.');
        return;
      }
      showToast('Syncing contacts...', 'info');
      await syncGoogleContacts(contacts);
      showToast('Contacts synced successfully', 'success');
    } catch (e: any) {
      showError('Failed to sync contacts: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-brand-policy" /> Contacts</h2>
            <button className="p-2 bg-brand-policy/10 text-brand-policy rounded-lg hover:bg-brand-policy/20">
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-policy focus:bg-white transition-all"
            />
          </div>
          <button 
            onClick={handleSyncContacts} 
            disabled={isSyncing}
            className="w-full mt-4 py-2 bg-brand-policy text-white rounded-lg font-bold hover:bg-brand-policy/90 disabled:opacity-50"
          >
            Sync to Google Contacts
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setSelectedContactId(contact.id)}
              className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedContactId === contact.id ? 'bg-brand-policy/5 border-l-4 border-l-brand-policy' : 'hover:bg-slate-50'}`}
            >
              <h3 className="font-bold text-slate-900">{contact.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Building size={14} /> {contact.organization}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
        {selectedContactId ? (
          (() => {
            const contact = contacts.find(c => c.id === selectedContactId);
            if (!contact) return null;
            return (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 mb-2">{contact.name}</h1>
                      <div className="flex items-center gap-4 text-slate-600 font-medium">
                        <span className="flex items-center gap-1"><Building size={18} className="text-slate-400" /> {contact.organization}</span>
                        <span className="flex items-center gap-1"><Mail size={18} className="text-slate-400" /> {contact.email}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-brand-policy rounded-lg bg-slate-50 hover:bg-brand-policy/10 transition-colors"><Edit2 size={18}/></button>
                      <button onClick={() => { onDeleteContact(contact.id); setSelectedContactId(null); }} className="p-2 text-slate-400 hover:text-red-500 rounded-lg bg-slate-50 hover:bg-red-50 transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Notes</h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[100px] text-slate-700">
                      {contact.notes || 'No notes added.'}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Associated Events</h3>
                    <div className="space-y-3">
                      {events.filter(e => e.contact?.contactId === contact.id).length > 0 ? (
                        events.filter(e => e.contact?.contactId === contact.id).map(event => (
                          <div key={event.id} className="p-4 border border-slate-200 rounded-xl bg-white flex justify-between items-center group">
                            <div>
                              <h4 className="font-bold text-slate-900 group-hover:text-brand-policy transition-colors">{event.analysis.eventName}</h4>
                              <p className="text-sm text-slate-500">{event.analysis.date} • {event.analysis.venue}</p>
                            </div>
                            <ExternalLink size={18} className="text-slate-300 group-hover:text-brand-policy transition-colors" />
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 italic text-sm">No events associated with this contact.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Users size={64} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium">Select a contact to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
