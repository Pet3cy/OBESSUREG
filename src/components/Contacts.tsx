import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Mail, CalendarDays } from 'lucide-react';

export default function Contacts() {
  const context = useContext(AppContext);
  if (!context) return null;
  const { staff } = context;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Directory</h2>
        <p className="text-gray-500 mt-1">OBESSU team members and their event assignments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((person) => (
          <div key={person.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 border-2 border-indigo-50">
                <span className="text-2xl font-bold text-indigo-700">
                  {person.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
              <p className="text-sm font-medium text-indigo-600 mb-4">{person.role}</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`mailto:${person.email}`} className="hover:text-indigo-600 transition-colors">
                    {person.email}
                  </a>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Assigned Events: </span>
                  <span className="ml-2 font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                    {person.eventCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}