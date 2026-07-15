import React, { useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const context = useContext(AppContext);
  if (!context) return null;
  const { events } = context;

  const stats = useMemo(() => {
    const total = events.length;
    const priorityCount = { High: 0, Medium: 0, Low: 0 };
    const themeMap: Record<string, number> = {};
    const repMap: Record<string, number> = {};

    events.forEach(e => {
      if (e.priority in priorityCount) priorityCount[e.priority as keyof typeof priorityCount]++;
      
      const theme = e.theme || 'Uncategorized';
      themeMap[theme] = (themeMap[theme] || 0) + 1;

      const rep = e.representative || 'Unassigned';
      repMap[rep] = (repMap[rep] || 0) + 1;
    });

    const themeData = Object.entries(themeMap).map(([name, value]) => ({ name, value }));
    const repData = Object.entries(repMap).map(([name, value]) => ({ name, value }));
    const priorityData = Object.entries(priorityCount).map(([name, value]) => ({ name, value }));

    return { total, themeData, repData, priorityData };
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-500">Analyze and save events to view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-500 mt-1">Live statistics computed from event data.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={stats.total} />
        <StatCard title="High Priority" value={stats.priorityData.find(d => d.name === 'High')?.value || 0} color="text-red-600" />
        <StatCard title="Medium Priority" value={stats.priorityData.find(d => d.name === 'Medium')?.value || 0} color="text-yellow-600" />
        <StatCard title="Low Priority" value={stats.priorityData.find(d => d.name === 'Low')?.value || 0} color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Events by Theme</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.themeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.themeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Representative Load */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Assignments by Representative</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.repData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-indigo-600" }: { title: string; value: number | string; color?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
      <div className={`mt-2 text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}