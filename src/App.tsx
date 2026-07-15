import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calendar, BarChart3, Users, LayoutDashboard, FileText } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analyze from './components/Analyze';
import Contacts from './components/Contacts';
import Reports from './components/Reports';
import type { Event, Staff } from './types';

interface AppContextType {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
}

export const AppContext = createContext<AppContextType | null>(null);

const defaultStaff: Staff[] = [
  { id: '1', name: 'Alice Smith', role: 'Board Member', email: 'alice@obessu.org', eventCount: 0 },
  { id: '2', name: 'Bob Johnson', role: 'Secretary General', email: 'bob@obessu.org', eventCount: 0 },
  { id: '3', name: 'Charlie Davis', role: 'Project Officer', email: 'charlie@obessu.org', eventCount: 0 },
  { id: '4', name: 'Diana Evans', role: 'Advocacy Officer', email: 'diana@obessu.org', eventCount: 0 },
  { id: '5', name: 'Eve Carter', role: 'Communications Officer', email: 'eve@obessu.org', eventCount: 0 },
  { id: '6', name: 'Frank Miller', role: 'Policy Officer', email: 'frank@obessu.org', eventCount: 0 },
];

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.name}
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
  const [events, setEvents] = useState<Event[]>([]);
  const [staff, setStaff] = useState<Staff[]>(defaultStaff);

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
