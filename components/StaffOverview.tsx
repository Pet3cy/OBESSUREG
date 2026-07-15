import React, { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { EventData } from '../types';

interface StaffOverviewProps {
  events: EventData[];
}

export const StaffOverview: React.FC<StaffOverviewProps> = ({ events }) => {
  const currentYear = new Date().getFullYear();
  const missionChartRef = useRef<HTMLCanvasElement>(null);
  const focusChartRef = useRef<HTMLCanvasElement>(null);
  const missionChartInstance = useRef<Chart | null>(null);
  const focusChartInstance = useRef<Chart | null>(null);

  const missionDaysByPerson = useMemo(() => {
    const counts: Record<string, number> = {};
    events
      .filter(e => e.followUp.status.startsWith('Completed'))
      .forEach(e => {
        const name = e.contact.name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    return counts;
  }, [events]);

  useEffect(() => {
    // --- 1. Label Processing Utility ---
    const processLabels = (labels: string[]) => {
      return labels.map(label => {
        if (label.length > 16) {
          const words = label.split(' ');
          const lines: string[] = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            if ((currentLine + " " + words[i]).length <= 16) {
              currentLine += " " + words[i];
            } else {
              lines.push(currentLine);
              currentLine = words[i];
            }
          }
          lines.push(currentLine);
          return lines;
        }
        return label;
      });
    };

    const commonTooltipOptions = {
      callbacks: {
        title: function(tooltipItems: any) {
          const item = tooltipItems[0];
          let label = item.chart.data.labels[item.dataIndex];
          if (Array.isArray(label)) {
            return label.join(' ');
          } else {
            return label;
          }
        }
      }
    };

    // Chart 1: Mission Days vs Office Days (Stacked Bar)
    if (missionChartRef.current) {
      if (missionChartInstance.current) {
        missionChartInstance.current.destroy();
      }
      const ctxMission = missionChartRef.current.getContext('2d');
      const rawLabelsMission = ['Panagiotis Chatzimichail', 'Amira Bakr', 'Daniele Sabato', 'Francesca Osima', 'Rui Teixeira'];
      const processedLabelsMission = processLabels(rawLabelsMission);
      const missionDays = rawLabelsMission.map(name => missionDaysByPerson[name] || 0);

      if (ctxMission) {
        missionChartInstance.current = new Chart(ctxMission, {
          type: 'bar',
          data: {
            labels: processedLabelsMission,
            datasets: [
              {
                label: 'Mission Days (Travel)',
                data: missionDays,
                backgroundColor: '#EC4899', // Brand Pink
                borderRadius: 4,
              },
              {
                label: 'Office/Remote Days',
                data: missionDays.map(days => Math.max(0, 220 - days)), // Assuming ~220 working days/year
                backgroundColor: '#312E81', // Brand Dark
                borderRadius: 4,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true },
              y: { 
                stacked: true,
                beginAtZero: true 
              }
            },
            plugins: {
              tooltip: commonTooltipOptions,
              legend: {
                position: 'bottom',
                labels: { usePointStyle: true }
              }
            }
          }
        });
      }
    }

    // Chart 2: Focus Area Distribution (Doughnut)
    if (focusChartRef.current) {
      if (focusChartInstance.current) {
        focusChartInstance.current.destroy();
      }
      const ctxFocus = focusChartRef.current.getContext('2d');
      const rawLabelsFocus = ['Statutory Meetings', 'Project Implementation', 'External Advocacy', 'Internal Membership', 'Communications'];
      const processedLabelsFocus = processLabels(rawLabelsFocus);

      if (ctxFocus) {
        focusChartInstance.current = new Chart(ctxFocus, {
          type: 'doughnut',
          data: {
            labels: processedLabelsFocus,
            datasets: [{
              data: [25, 30, 20, 15, 10],
              backgroundColor: [
                '#312E81', // Dark (Statutory)
                '#84CC16', // Lime (Projects)
                '#EC4899', // Pink (Advocacy)
                '#06B6D4', // Cyan (Membership)
                '#4B5563'  // Grey (Comms)
              ],
              borderWidth: 0,
              hoverOffset: 10
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              tooltip: commonTooltipOptions,
              legend: {
                position: 'right',
                labels: { 
                  boxWidth: 12,
                  font: { size: 11 }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (missionChartInstance.current) missionChartInstance.current.destroy();
      if (focusChartInstance.current) focusChartInstance.current.destroy();
    };
  }, [missionDaysByPerson]);

  return (
    <div className="bg-[#F3F4F6] text-gray-800 font-sans min-h-full">
      <style>{`
        .hide-scroll::-webkit-scrollbar {
            display: none;
        }
        .hide-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .chart-container {
            position: relative;
            width: 100%;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            height: 300px;
            max-height: 400px;
        }
        @media (min-width: 768px) {
            .chart-container {
                height: 350px;
            }
        }
        .material-card {
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .material-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* HEADER SECTION */}
      <header className="bg-[#312E81] text-white pt-12 pb-24 px-6 relative overflow-hidden rounded-t-xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 font-bold text-9xl select-none">{currentYear}</div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">Strategic Horizon <span className="text-[#06B6D4]">{currentYear}</span></h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            An integrated overview of key milestones, statutory meetings, and team portfolio distribution for Panagiotis, Amira, Daniele, Francesca, and Rui.
          </p>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 -mt-16 space-y-16 pb-20 relative z-20">

        {/* SECTION 1: GLOBAL TIMELINE */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 border-l-4 border-[#EC4899] pl-4">
            <h2 className="text-2xl font-bold text-gray-800">{currentYear} Statutory Roadmap</h2>
            <p className="text-gray-600 mt-1">
              A chronological projection of major institutional events. This timeline anchors the team's schedule, dictating "Mission Days" versus "Office Days."
            </p>
          </div>
          
          {/* Timeline Container */}
          <div className="overflow-x-auto pb-4 hide-scroll">
            <div className="min-w-[1000px] grid grid-cols-12 gap-2 text-center">
              {/* Months Header */}
              <div className="font-bold text-gray-400">JAN</div>
              <div className="font-bold text-gray-400">FEB</div>
              <div className="font-bold text-gray-400">MAR</div>
              <div className="font-bold text-gray-400">APR</div>
              <div className="font-bold text-gray-400">MAY</div>
              <div className="font-bold text-gray-400">JUN</div>
              <div className="font-bold text-gray-400">JUL</div>
              <div className="font-bold text-gray-400">AUG</div>
              <div className="font-bold text-gray-400">SEP</div>
              <div className="font-bold text-gray-400">OCT</div>
              <div className="font-bold text-gray-400">NOV</div>
              <div className="font-bold text-gray-400">DEC</div>
            </div>

            {/* Timeline Tracks */}
            <div className="min-w-[1000px] relative mt-4 space-y-4">
              {/* Track 1: Statutory */}
              <div className="h-12 w-full bg-gray-100 rounded-lg relative flex items-center">
                <div className="absolute left-0 w-[5%] h-full bg-[#312E81] rounded-l-lg opacity-20"></div>
                
                {/* Event: Board Meeting */}
                <div className="absolute left-[5%] w-[8%] h-8 bg-[#312E81] text-white text-xs flex items-center justify-center rounded shadow-md font-bold z-10 hover:bg-[#EC4899] transition-colors cursor-pointer" title="Board Meeting 1 - Brussels">
                  BM #1
                </div>
                
                {/* Event: Council of Members */}
                <div className="absolute left-[25%] w-[12%] h-8 bg-[#EC4899] text-white text-xs flex items-center justify-center rounded shadow-md font-bold z-10" title="Council of Members - Spring">
                  COM (Spring)
                </div>

                {/* Event: Summer School */}
                <div className="absolute left-[50%] w-[10%] h-8 bg-[#06B6D4] text-white text-xs flex items-center justify-center rounded shadow-md font-bold z-10" title="Summer School">
                  Summer Sch.
                </div>

                {/* Event: General Assembly */}
                <div className="absolute left-[80%] w-[12%] h-8 bg-[#312E81] text-white text-xs flex items-center justify-center rounded shadow-md font-bold z-10" title="General Assembly - Autumn">
                  GA {currentYear}
                </div>
              </div>
              <div className="text-xs text-gray-500 font-semibold tracking-wider">STATUTORY & GOVERNANCE</div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WORKLOAD DISTRIBUTION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Travel vs Office */}
          <div className="bg-white rounded-xl shadow-lg p-6 material-card">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800">Projected Mission Distribution</h3>
              <p className="text-sm text-gray-500">
                Comparing "Days on Mission" (travel) vs. "Office/Home" based on the {currentYear} calendar events. This highlights who is carrying the heaviest external representation burden.
              </p>
            </div>
            <div className="flex justify-center w-full">
              <div className="chart-container">
                <canvas ref={missionChartRef}></canvas>
              </div>
            </div>
          </div>

          {/* Card 2: Focus Areas */}
          <div className="bg-white rounded-xl shadow-lg p-6 material-card">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800">Portfolio Focus Areas</h3>
              <p className="text-sm text-gray-500">
                A breakdown of the thematic focus for {currentYear}. This data informs resource allocation and strategic prioritization for the team.
              </p>
            </div>
            <div className="flex justify-center w-full">
              <div className="chart-container">
                <canvas ref={focusChartRef}></canvas>
              </div>
            </div>
          </div>

        </section>

        {/* SECTION 3: TEAM CALENDARS */}
        <section>
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-8 w-2 bg-[#06B6D4] rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-800">Individual Portfolios {currentYear}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Person 1: Panagiotis */}
            <div className="bg-white rounded-lg shadow border-t-4 border-[#312E81] p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#312E81]">Panagiotis C.</h3>
                <span className="bg-[#312E81] text-white text-xs px-2 py-1 rounded">Coordination & Ext. Affairs</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Focus: Statutory oversight, external representation to institutional partners, and financial strategy.</p>
              <ul className="text-sm space-y-3">
                {events
                  .filter(e => e.followUp.commsPack.representative.toLowerCase().includes('panagiotis'))
                  .map(e => (
                    <li key={e.id} className="flex flex-col text-gray-700 mb-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-brand-policy rounded-full mr-2 flex-shrink-0"></span>
                        <span className="font-semibold text-sm">{e.analysis.eventName}</span>
                      </div>
                      <div className="ml-4 text-xs text-gray-500">
                        {e.analysis.date} {e.analysis.time ? `at ${e.analysis.time}` : ''} {e.analysis.venue ? `| ${e.analysis.venue}` : ''}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Person 2: Amira */}
            <div className="bg-white rounded-lg shadow border-t-4 border-[#EC4899] p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#312E81]">Amira B.</h3>
                <span className="bg-[#EC4899] text-white text-xs px-2 py-1 rounded">Advocacy</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Focus: Policy development, working groups on education rights, and solidarity campaigns.</p>
              <ul className="text-sm space-y-2">
                {events
                  .filter(e => e.followUp.commsPack.representative.toLowerCase().includes('amira'))
                  .map(e => (
                    <li key={e.id} className="flex flex-col text-gray-700 mb-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-[#EC4899] rounded-full mr-2 flex-shrink-0"></span>
                        <span className="font-semibold text-sm">{e.analysis.eventName}</span>
                      </div>
                      <div className="ml-4 text-xs text-gray-500">
                        {e.analysis.date} {e.analysis.time ? `at ${e.analysis.time}` : ''} {e.analysis.venue ? `| ${e.analysis.venue}` : ''}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Person 3: Daniele */}
            <div className="bg-white rounded-lg shadow border-t-4 border-[#06B6D4] p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#312E81]">Daniele S.</h3>
                <span className="bg-[#06B6D4] text-white text-xs px-2 py-1 rounded">Membership</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Focus: Member organization outreach, capacity building, and regional cooperation.</p>
              <ul className="text-sm space-y-2">
                {events
                  .filter(e => e.followUp.commsPack.representative.toLowerCase().includes('daniele'))
                  .map(e => (
                    <li key={e.id} className="flex flex-col text-gray-700 mb-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-[#06B6D4] rounded-full mr-2 flex-shrink-0"></span>
                        <span className="font-semibold text-sm">{e.analysis.eventName}</span>
                      </div>
                      <div className="ml-4 text-xs text-gray-500">
                        {e.analysis.date} {e.analysis.time ? `at ${e.analysis.time}` : ''} {e.analysis.venue ? `| ${e.analysis.venue}` : ''}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Person 4: Francesca */}
            <div className="bg-white rounded-lg shadow border-t-4 border-[#84CC16] p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#312E81]">Francesca O.</h3>
                <span className="bg-[#84CC16] text-white text-xs px-2 py-1 rounded">Projects</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Focus: EU project implementation, study sessions, and training methodologies.</p>
              <ul className="text-sm space-y-2">
                {events
                  .filter(e => e.followUp.commsPack.representative.toLowerCase().includes('francesca'))
                  .map(e => (
                    <li key={e.id} className="flex flex-col text-gray-700 mb-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-[#84CC16] rounded-full mr-2 flex-shrink-0"></span>
                        <span className="font-semibold text-sm">{e.analysis.eventName}</span>
                      </div>
                      <div className="ml-4 text-xs text-gray-500">
                        {e.analysis.date} {e.analysis.time ? `at ${e.analysis.time}` : ''} {e.analysis.venue ? `| ${e.analysis.venue}` : ''}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Person 5: Rui */}
            <div className="bg-white rounded-lg shadow border-t-4 border-gray-800 p-6 md:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#312E81]">Rui T.</h3>
                <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">Comms</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Focus: Digital strategy, campaign visibility, and website development.</p>
              <ul className="text-sm space-y-2">
                {events
                  .filter(e => e.followUp.commsPack.representative.toLowerCase().includes('rui'))
                  .map(e => (
                    <li key={e.id} className="flex flex-col text-gray-700 mb-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></span>
                        <span className="font-semibold text-sm">{e.analysis.eventName}</span>
                      </div>
                      <div className="ml-4 text-xs text-gray-500">
                        {e.analysis.date} {e.analysis.time ? `at ${e.analysis.time}` : ''} {e.analysis.venue ? `| ${e.analysis.venue}` : ''}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

          </div>
        </section>

        {/* SECTION 4: ACTIVITY HEATMAP */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentYear} Monthly Intensity Heatmap</h2>
              <p className="text-sm text-gray-500 mt-1">Estimated team workload density based on statutory calendar.</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0 text-xs">
              <div className="w-4 h-4 bg-gray-100 rounded"></div> <span>Low</span>
              <div className="w-4 h-4 bg-[#06B6D4] opacity-50 rounded"></div> <span>Med</span>
              <div className="w-4 h-4 bg-[#EC4899] rounded"></div> <span>High</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {/* Jan */}
            <div className="p-4 bg-[#06B6D4] bg-opacity-20 rounded border border-[#06B6D4] border-opacity-30 flex flex-col items-center">
              <span className="font-bold text-[#312E81]">JAN</span>
              <span className="text-xs text-gray-600 mt-1">Planning</span>
            </div>
            {/* Feb */}
            <div className="p-4 bg-gray-100 rounded flex flex-col items-center">
              <span className="font-bold text-gray-500">FEB</span>
              <span className="text-xs text-gray-400 mt-1">Remote</span>
            </div>
            {/* Mar */}
            <div className="p-4 bg-[#EC4899] text-white rounded shadow-md flex flex-col items-center transform scale-105">
              <span className="font-bold">MAR</span>
              <span className="text-xs text-white opacity-90 mt-1">COM</span>
            </div>
            {/* Apr */}
            <div className="p-4 bg-[#06B6D4] bg-opacity-20 rounded flex flex-col items-center">
              <span className="font-bold text-[#312E81]">APR</span>
              <span className="text-xs text-gray-600 mt-1">WGs</span>
            </div>
            {/* May */}
            <div className="p-4 bg-[#EC4899] bg-opacity-60 text-white rounded flex flex-col items-center">
              <span className="font-bold">MAY</span>
              <span className="text-xs text-white opacity-90 mt-1">Study Sess.</span>
            </div>
            {/* Jun */}
            <div className="p-4 bg-gray-100 rounded flex flex-col items-center">
              <span className="font-bold text-gray-500">JUN</span>
              <span className="text-xs text-gray-400 mt-1">Wrap-up</span>
            </div>
            {/* Jul */}
            <div className="p-4 bg-[#EC4899] text-white rounded shadow-md flex flex-col items-center transform scale-105">
              <span className="font-bold">JUL</span>
              <span className="text-xs text-white opacity-90 mt-1">Summer Sch</span>
            </div>
            {/* Aug */}
            <div className="p-4 bg-gray-100 rounded flex flex-col items-center">
              <span className="font-bold text-gray-500">AUG</span>
              <span className="text-xs text-gray-400 mt-1">Holiday</span>
            </div>
            {/* Sep */}
            <div className="p-4 bg-[#06B6D4] bg-opacity-20 rounded flex flex-col items-center">
              <span className="font-bold text-[#312E81]">SEP</span>
              <span className="text-xs text-gray-600 mt-1">Reset</span>
            </div>
            {/* Oct */}
            <div className="p-4 bg-[#312E81] text-white rounded shadow-md flex flex-col items-center transform scale-105">
              <span className="font-bold">OCT</span>
              <span className="text-xs text-white opacity-90 mt-1">GA {currentYear}</span>
            </div>
            {/* Nov */}
            <div className="p-4 bg-[#06B6D4] bg-opacity-20 rounded flex flex-col items-center">
              <span className="font-bold text-[#312E81]">NOV</span>
              <span className="text-xs text-gray-600 mt-1">Handovers</span>
            </div>
            {/* Dec */}
            <div className="p-4 bg-gray-100 rounded flex flex-col items-center">
              <span className="font-bold text-gray-500">DEC</span>
              <span className="text-xs text-gray-400 mt-1">Eval</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};
