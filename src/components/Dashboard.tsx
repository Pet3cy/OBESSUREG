import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Calendar, MapPin, Tag } from 'lucide-react';

export default function Dashboard() {
  const context = useContext(AppContext);
  if (!context) return null;
  const { events } = context;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-400';
      case 'Reviewed': return 'bg-blue-400';
      case 'Accepted': return 'bg-green-500';
      case 'Declined': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Pipeline</h2>
          <p className="text-gray-500 mt-1">Chronological list of all analyzed events</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">No events have been added yet.</p>
          <a href="/analyze" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Analyze New Invitation
          </a>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {events.map((event) => (
              <li key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(event.status)}`} title={`Status: ${event.status}`} />
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(event.priority)}`}>
                        {event.priority} Priority
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {event.theme}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Suggested Rep:</span>
                      <span className="text-sm font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                        {event.representative || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}