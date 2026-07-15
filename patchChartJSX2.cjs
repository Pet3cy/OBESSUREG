const fs = require('fs');
const file = 'components/Overview.tsx';
let content = fs.readFileSync(file, 'utf8');

const chartJSX = `        ) : (
        <div>
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Priority Score Trend (Last 3 Months)</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      labelStyle={{fontWeight: 'bold', color: '#0f172a', marginBottom: '4px'}}
                    />
                    <Line type="monotone" dataKey="averagePriority" stroke="#4f46e5" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-950/5">`;

content = content.replace(
  `        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-950/5">`,
  chartJSX
);

fs.writeFileSync(file, content);
