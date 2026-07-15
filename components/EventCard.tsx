
import React, { useState } from 'react';
import { EventData } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { Calendar, MapPin, Building2, User, Trash2, Repeat } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface EventCardProps {
  event: EventData;
  onClick: () => void;
  onDelete: () => void;
  isSelected: boolean;
  showCheckbox?: boolean;
  isChecked?: boolean;
  onToggleSelect?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onClick, 
  onDelete, 
  isSelected,
  showCheckbox,
  isChecked,
  onToggleSelect
}) => {
  const { analysis } = event;
  const [showConfirm, setShowConfirm] = useState(false);

  const getStatusColor = (status: string) => {
    if (status.startsWith('Completed')) return 'text-green-600';
    if (status === 'Not Relevant') return 'text-slate-400';
    if (status === 'To Respond') return 'text-brand-policy';
    if (status.startsWith('Responded')) return 'text-orange-600';
    if (status.startsWith('Confirmation')) return 'text-indigo-600';
    if (status === 'Prep ready') return 'text-purple-600';
    if (status === 'MOs comms') return 'text-pink-600';
    return 'text-slate-500';
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) onToggleSelect();
  };

  return (
    <>
      <div 
        onClick={onClick}
        className={`p-4 mb-3 rounded-lg border cursor-pointer transition-all hover:shadow-md group/card relative ${
          isSelected ? 'border-brand-policy bg-brand-policy/10 ring-1 ring-brand-policy' : 'border-slate-200 bg-white'
        }`}
      >
        {/* Quick Action Delete */}
        <button 
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-brand-membership hover:bg-brand-membership/10 rounded-md transition-all opacity-0 group-hover/card:opacity-100 z-10"
          title="Delete Event"
        >
          <Trash2 size={14} />
        </button>

        <div className="flex items-start gap-3 pr-6 mb-2">
          {showCheckbox && (
             <div 
               onClick={handleCheckboxClick}
               className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                 isChecked 
                  ? 'bg-brand-policy border-brand-policy shadow-sm' 
                  : 'border-slate-300 bg-white hover:border-brand-policy'
               }`}
             >
               {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
             </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-800 line-clamp-1 flex items-center gap-2">
                {analysis.eventName}
                {analysis.recurrence?.isRecurring && (
                  <span title={`Recurs ${analysis.recurrence.frequency}`}>
                    <Repeat size={14} className="text-brand-policy shrink-0" />
                  </span>
                )}
              </h3>
              <div className="shrink-0 ml-2">
                  <PriorityBadge priority={analysis.priority} />
              </div>
            </div>
          </div>
        </div>
        
        <div className={`text-sm text-slate-600 space-y-1 ${showCheckbox ? 'pl-8' : ''}`}>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-slate-400" />
              <span className="truncate font-medium">{analysis.institution}</span>
            </div>
            {analysis.institutionDetails && (
              <div className="text-xs text-slate-500 pl-6 line-clamp-2 italic">
                {analysis.institutionDetails}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="truncate">{analysis.date} {analysis.time ? `@ ${analysis.time}` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-400" />
            <span className="truncate">{analysis.venue}</span>
          </div>
        </div>

        <div className={`mt-3 flex items-center justify-between text-xs border-t pt-2 border-slate-100 ${showCheckbox ? 'pl-8' : ''}`}>
          <div className="flex items-center gap-1 text-slate-500">
             <User size={12} /> 
             {event.contact.name ? `Contact: ${event.contact.name}` : 'No contact assigned'}
          </div>
          <div className={`font-medium ${getStatusColor(event.followUp.status)}`}>
            {event.followUp.status}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onDelete}
        title="Delete Invitation?"
        message={`Are you sure you want to delete "${analysis.eventName}"? All extracted analysis and assigned tasks will be lost.`}
      />
    </>
  );
};
