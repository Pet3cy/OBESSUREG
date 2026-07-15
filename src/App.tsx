import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calendar, BarChart3, Users, LayoutDashboard, FileText } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analyze from './components/Analyze';
import Contacts from './components/Contacts';
import Reports from './components/Reports';
import type { Event, Staff } from './types';
import { initialEvents } from './data';

interface AppContextType {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
}

export const AppContext = createContext<AppContextType | null>(null);

const defaultStaff: Staff[] = [
  // Board
  { id: 'b1', name: 'Alessandro Di Miceli', role: 'Board Member', email: 'alessandro@obessu.org', eventCount: 0 },
  { id: 'b2', name: 'Ívar Máni Hrannarsson', role: 'Board Member', email: 'ivar@obessu.org', eventCount: 0 },
  { id: 'b3', name: 'Lauren Bond', role: 'Board Member', email: 'lauren@obessu.org', eventCount: 0 },
  { id: 'b4', name: 'Elodie Böhling', role: 'Board Member', email: 'elodie@obessu.org', eventCount: 0 },
  { id: 'b5', name: 'Kacper Bogalecki', role: 'Board Member', email: 'kacper@obessu.org', eventCount: 0 },
  // Secretariat
  { id: 's1', name: 'Rui Teixeira', role: 'Secretary General', email: 'rui@obessu.org', eventCount: 0 },
  { id: 's2', name: 'Raquel Moreno Beneit', role: 'Communications Coordinator', email: 'raquel@obessu.org', eventCount: 0 },
  { id: 's3', name: 'Amira Bakr', role: 'Policy and Outreach Assistant', email: 'amira@obessu.org', eventCount: 0 },
  { id: 's4', name: 'Yolanda Sangucho', role: 'Projects & Governance Assistant', email: 'yolanda@obessu.org', eventCount: 0 },
  { id: 's5', name: 'Panagiotis Chatzimichail', role: 'Head of External Affairs', email: 'panagiotis@obessu.org', eventCount: 0 },
  { id: 's6', name: 'Daniele Sabato', role: 'Project & Policy Coordinator', email: 'daniele@obessu.org', eventCount: 0 },
  { id: 's7', name: 'Francesca Osima', role: 'Head of Projects and Operations', email: 'francesca@obessu.org', eventCount: 0 },
  { id: 's8', name: 'Paolo Ferraresi', role: 'External Financial Manager', email: 'paolo.ferraresi@gmail.com', eventCount: 0 },
  { id: 's9', name: 'Riccardo Ferraresi', role: 'Finance and HR Officer', email: 'riccardo@obessu.org', eventCount: 0 }
];

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const context = useContext(AppContext);
  const pendingCount = context?.events.filter(e => e.status === 'Pending').length || 0;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, badge: pendingCount },
    { name: 'Analyze', path: '/analyze', icon: <FileText className="w-5 h-5" /> },
    { name: 'Contacts', path: '/contacts', icon: <Users className="w-5 h-5" /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-700">OBESSU Analyzer</h1>
          <p className="text-xs text-gray-500 mt-1">Strategic Event Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.name}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {navItems.find((n) => n.path === location.pathname)?.name || 'App'}
          </h2>
        </header>
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [staff, setStaff] = useState<Staff[]>(defaultStaff);

  useEffect(() => {
    // Calculate staff event counts based on initial events
    if (events.length > 0 && staff.every(s => s.eventCount === 0)) {
      const newStaff = [...staff];
      events.forEach(event => {
        if (event.representative && event.representative !== 'Unassigned') {
          const repNames = event.representative.split(/ and |,|&/).map(n => n.trim().toLowerCase());
          repNames.forEach(name => {
            const matchedStaff = newStaff.find(s => s.name.toLowerCase().includes(name));
            if (matchedStaff) {
              matchedStaff.eventCount += 1;
            } else {
               // maybe add them to staff?
               // The user wants pre-loaded 6 members. Let's just match them if we can.
            }
          });
        }
      });
      setStaff(newStaff);
    }
  }, []);

  return (
    <AppContext.Provider value={{ events, setEvents, staff, setStaff }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
