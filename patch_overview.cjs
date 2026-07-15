const fs = require('fs');
const file = 'components/Overview.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add recharts imports
content = content.replace(
  `import { StaffOverview } from './StaffOverview';`,
  `import { StaffOverview } from './StaffOverview';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';`
);

// Add chart data memo
const chartDataMemo = `
  const chartData = useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const filtered = events.filter(e => {
      const d = new Date(e.analysis.date);
      return !isNaN(d.getTime()) && d >= threeMonthsAgo;
    });

    const grouped: Record<string, { totalScore: number, count: number }> = {};
    filtered.forEach(e => {
      const d = new Date(e.analysis.date);
      if (isNaN(d.getTime())) return;
      const dateStr = d.toISOString().split('T')[0];
      if (!grouped[dateStr]) grouped[dateStr] = { totalScore: 0, count: 0 };
      grouped[dateStr].totalScore += e.analysis.priorityScore;
      grouped[dateStr].count += 1;
    });

    return Object.keys(grouped).sort().map(date => ({
      date,
      averagePriority: Math.round(grouped[date].totalScore / grouped[date].count)
    }));
  }, [events]);
`;

content = content.replace(
  `const stakeholders = useMemo(() => {`,
  chartDataMemo + '\n  const stakeholders = useMemo(() => {'
);

const chartJSX = `
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Priority Score Trend (Last 3 Months)</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPriority" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      labelStyle={{fontWeight: 'bold', color: '#0f172a', marginBottom: '4px'}}
                    />
                    <Area type="monotone" dataKey="averagePriority" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPriority)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
`;

content = content.replace(
  `        ) : (
        <div>`,
  `        ) : (
        <div>` + chartJSX
);

fs.writeFileSync(file, content);
