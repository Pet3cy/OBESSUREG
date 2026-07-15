
import React, { useState, useMemo } from 'react';
import { EventData, Priority } from '../types';
import { 
  Calendar as CalendarIcon, 
  Filter, 
  X, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Tag,
  ChevronRight,
  Search
} from 'lucide-react';

interface CalendarViewProps {
  events: EventData[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [themeFilter, setThemeFilter] = useState<string>('All');
  const [contactFilter, setContactFilter] = useState<string>('All');
  const currentYear = new Date().getFullYear();
  const [startDateFilter, setStartDateFilter] = useState<string>(`${currentYear}-01-01`);
  const [endDateFilter, setEndDateFilter] = useState<string>(`${currentYear}-12-31`);
  const [calendarView, setCalendarView] = useState<'Week' | 'Month' | 'Trimester' | 'Semester' | 'Year'>('Week');
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // Get unique themes for the filter
  const themes = useMemo(() => {
    const uniqueThemes = new Set(events.map(e => e.analysis.theme));
    return ['All', ...Array.from(uniqueThemes)].sort();
  }, [events]);

  const contacts = useMemo(() => {
    const uniqueContacts = new Set(events.map(e => e.contact.name).filter(Boolean));
    return ['All', ...Array.from(uniqueContacts)].sort();
  }, [events]);

  const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate and filter weeks
  const filteredWeeks = useMemo(() => {
    if (calendarView !== 'Week') return [];
    const weeksArr = [];

    const rangeStart = new Date(startDateFilter);
    const rangeEnd = new Date(endDateFilter);

    // Ensure range dates are valid
    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return [];
    }

    const yearStart = new Date(rangeStart.getFullYear(), 0, 1);
    const dayOfWeek = yearStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const firstMondayTime = new Date(yearStart.getFullYear(), 0, 1 + daysToMonday).getTime();

    for (let i = 0; i < 53 * (rangeEnd.getFullYear() - rangeStart.getFullYear() + 1); i++) {
      const weekStart = new Date(firstMondayTime + i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      // Stop if we've passed the end year
      if (weekStart.getFullYear() > rangeEnd.getFullYear()) break;
      
      // Filter weeks that overlap with the user's selected date range
      if (weekEnd < rangeStart || weekStart > rangeEnd) continue;

      // Find events in this week that match all filters
      const weekEvents = events.filter(event => {
        const eventDate = new Date(event.analysis.date);
        const matchesDate = eventDate >= weekStart && eventDate <= weekEnd;
        const matchesPriority = priorityFilter === 'All' || event.analysis.priority === priorityFilter;
        const matchesTheme = themeFilter === 'All' || event.analysis.theme === themeFilter;
        const matchesContact = contactFilter === 'All' || event.contact.name === contactFilter;
        return matchesDate && matchesPriority && matchesTheme && matchesContact;
      });

      const hasMatches = weekEvents.length > 0;
      if (!hasMatches && (priorityFilter !== 'All' || themeFilter !== 'All' || contactFilter !== 'All')) continue;

      weeksArr.push({
        number: (i % 53) + 1,
        start: weekStart,
        end: weekEnd,
        events: weekEvents
      });
    }
    return weeksArr;
  }, [events, priorityFilter, themeFilter, contactFilter, startDateFilter, endDateFilter, calendarView]);

  const filteredPeriods = useMemo(() => {
    if (calendarView === 'Week') return [];

    const rangeStart = new Date(startDateFilter);
    const rangeEnd = new Date(endDateFilter);

    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return [];
    }
    
    // Filter events first
    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.analysis.date);
        const matchesDate = eventDate >= rangeStart && eventDate <= rangeEnd;
        const matchesPriority = priorityFilter === 'All' || event.analysis.priority === priorityFilter;
        const matchesTheme = themeFilter === 'All' || event.analysis.theme === themeFilter;
        const matchesContact = contactFilter === 'All' || event.contact.name === contactFilter;
        return matchesDate && matchesPriority && matchesTheme && matchesContact;
    });

    // Group events based on viewType
    const grouped = new Map<string, EventData[]>();
    
    filteredEvents.forEach(event => {
        const date = new Date(event.analysis.date);
        let key = '';
        if (calendarView === 'Month') {
            key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        } else if (calendarView === 'Trimester') {
            const month = date.getMonth();
            const trimester = Math.floor(month / 4) + 1; // 0-3 = 1, 4-7 = 2, 8-11 = 3
            key = `Trimester ${trimester} ${date.getFullYear()}`;
        } else if (calendarView === 'Semester') {
            const semester = date.getMonth() < 6 ? 1 : 2;
            key = `Semester ${semester} ${date.getFullYear()}`;
        } else if (calendarView === 'Year') {
            key = `${date.getFullYear()}`;
        }
        
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(event);
    });

    return Array.from(grouped.entries()).map(([title, evs]) => ({
        title,
        events: evs.sort((a, b) => new Date(a.analysis.date).getTime() - new Date(b.analysis.date).getTime())
    }));
  }, [events, calendarView, priorityFilter, themeFilter, contactFilter, startDateFilter, endDateFilter]);

  const currentMonthName = (date: Date) => date.toLocaleString('default', { month: 'long' });

  const resetFilters = () => {
    setPriorityFilter('All');
    setThemeFilter('All');
    setContactFilter('All');
    setStartDateFilter(`${currentYear}-01-01`);
    setEndDateFilter(`${currentYear}-12-31`);
    setCalendarView('Week');
  };

  const isFiltered = priorityFilter !== 'All' || themeFilter !== 'All' || contactFilter !== 'All' || startDateFilter !== `${currentYear}-01-01` || endDateFilter !== `${currentYear}-12-31` || calendarView !== 'Week';

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-policy rounded-2xl text-white shadow-xl shadow-brand-policy/30">
              <CalendarIcon size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Calendar Overview</h2>
              <p className="text-slate-500 text-sm font-medium">Coordinate upcoming advocacy and organizational milestones.</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <span className="text-6xl font-black text-slate-100 select-none">{currentYear}</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 space-y-6">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
            <Filter size={16} className="text-brand-policy" />
            Roadmap Filters
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {/* Priority Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(['All', Priority.High, Priority.Medium, Priority.Low] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      priorityFilter === p 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By Theme</label>
              <select 
                value={themeFilter}
                onChange={(e) => setThemeFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-policy focus:border-brand-policy outline-none"
              >
                {themes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Contact Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By Contact</label>
              <select 
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-policy focus:border-brand-policy outline-none"
              >
                {contacts.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* View Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View</label>
              <select 
                value={calendarView}
                onChange={(e) => setCalendarView(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-policy focus:border-brand-policy outline-none"
              >
                <option value="Week">Week</option>
                <option value="Month">Month</option>
                <option value="Trimester">Trimester</option>
                <option value="Semester">Semester</option>
                <option value="Year">Year</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
              <input 
                type="date" 
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-policy focus:border-brand-policy outline-none"
              />
            </div>

            {/* Date Range End */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-policy focus:border-brand-policy outline-none"
                />
                {isFiltered && (
                    <button 
                        onClick={resetFilters}
                        className="p-2 bg-brand-membership/10 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                        title="Clear all filters"
                    >
                        <X size={16} />
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-12">
          {calendarView === 'Week' ? (
            filteredWeeks.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold text-lg">No roadmap entries found for these filters.</p>
                <p className="text-slate-400 text-sm mt-1">Adjust your date range or priority settings.</p>
                <button 
                  onClick={resetFilters} 
                  className="mt-6 px-6 py-2 bg-brand-policy text-white rounded-full text-sm font-bold shadow-lg shadow-brand-policy/20 hover:bg-brand-policy transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredWeeks.map((week) => {
                const weekDays = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(week.start);
                  d.setDate(week.start.getDate() + i);
                  return d;
                });

                // Month separator logic
                const isFirstWeekOfMonth = week.start.getDate() <= 7;
                const monthLabel = isFirstWeekOfMonth ? (
                  <div className="mb-6 mt-12">
                    <h3 className="text-xl font-black text-brand-policy uppercase tracking-[0.2em] flex items-center gap-4">
                      {currentMonthName(week.start)} 
                      <span className="h-px bg-brand-policy/30 flex-1"></span>
                    </h3>
                  </div>
                ) : null;

                return (
                  <React.Fragment key={week.number}>
                    {monthLabel}
                    <div className={`bg-white rounded-2xl border-2 ${isFirstWeekOfMonth ? 'border-brand-policy/50 shadow-md' : 'border-slate-200 shadow-sm'} overflow-hidden`}>
                      {/* Week Header */}
                      <div className={`flex items-center justify-between px-6 py-3 border-b ${isFirstWeekOfMonth ? 'bg-brand-policy/10/50 border-brand-policy/20' : 'bg-slate-50/80 border-slate-100'}`}>
                          <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded-md">Week {week.number}</span>
                              <span className="text-xs font-bold text-slate-500">{week.start.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {week.end.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                          </div>
                      </div>
                      
                      {/* Days Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                          {weekDays.map(day => {
                              const dateKey = toDateString(day);
                              const dayEvents = week.events.filter(e => e.analysis.date === dateKey);
                              const isToday = toDateString(new Date()) === dateKey;
                              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                              const hasConflict = dayEvents.length > 1 && (
                                  dayEvents.filter(e => e.analysis.priority === Priority.High).length > 1 ||
                                  dayEvents.some((e1, i) => dayEvents.some((e2, j) => i !== j && e1.analysis.time && e2.analysis.time && e1.analysis.time === e2.analysis.time))
                              );

                              return (
                                  <div key={dateKey} className={`min-h-[160px] p-3 flex flex-col group ${isToday ? 'bg-brand-policy/10/20' : isWeekend ? 'bg-slate-50/30' : ''} ${hasConflict ? 'bg-brand-membership/10/30 ring-1 ring-red-200 inset-0' : ''} hover:bg-slate-50 transition-colors`}>
                                      <div className="flex items-center justify-between mb-3">
                                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-brand-policy' : hasConflict ? 'text-brand-membership' : 'text-slate-400'}`}>
                                              {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {hasConflict && <span title="Conflicting time slots or multiple high priority events"><AlertCircle size={12} className="text-red-500" /></span>}
                                            <span className={`text-sm font-bold flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-brand-policy text-white' : hasConflict ? 'bg-red-100 text-red-700' : 'text-slate-700'}`}>
                                                {day.getDate()}
                                            </span>
                                          </div>
                                      </div>
                                      
                                      <div className="flex-1 space-y-2">
                                          {dayEvents.slice(0, 2).map(event => (
                                              <div 
                                                  key={event.id}
                                                  onClick={() => setSelectedEvent(event)}
                                                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm ${
                                                      event.analysis.priority === Priority.High ? 'bg-white border-l-4 border-l-red-500 border-slate-200' :
                                                      'bg-white border-slate-200'
                                                  } ${hasConflict ? 'shadow-sm border-brand-membership/30' : ''}`}
                                                  title={`${event.analysis.eventName} (${event.analysis.priority} Priority)`}
                                              >
                                                  <div className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
                                                      {event.analysis.time && <span className="text-brand-policy mr-1">{event.analysis.time}</span>}
                                                      {event.analysis.eventName}
                                                  </div>
                                                  <div className="text-[10px] text-slate-500 font-medium truncate">
                                                      {event.analysis.venue}
                                                  </div>
                                              </div>
                                          ))}
                                          {dayEvents.length > 2 && (
                                              <div className="text-[10px] font-bold text-slate-500 text-center bg-slate-100 rounded-md py-1 mt-1">
                                                  +{dayEvents.length - 2} more event{dayEvents.length - 2 > 1 ? 's' : ''}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )
          ) : (
            filteredPeriods.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold text-lg">No roadmap entries found for these filters.</p>
                <p className="text-slate-400 text-sm mt-1">Adjust your date range or priority settings.</p>
                <button 
                  onClick={resetFilters} 
                  className="mt-6 px-6 py-2 bg-brand-policy text-white rounded-full text-sm font-bold shadow-lg shadow-brand-policy/20 hover:bg-brand-policy transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredPeriods.map((period) => (
                <div key={period.title} className="mb-12">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-brand-policy uppercase tracking-[0.2em] flex items-center gap-4">
                      {period.title}
                      <span className="h-px bg-brand-policy/30 flex-1"></span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {period.events.map(event => (
                      <div 
                        key={event.id} 
                        onClick={() => setSelectedEvent(event)}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                            event.analysis.priority === Priority.High ? 'bg-red-100 text-red-700' :
                            event.analysis.priority === Priority.Medium ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {event.analysis.priority}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{event.analysis.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1 line-clamp-2" title={event.analysis.eventName}>{event.analysis.eventName}</h4>
                        <p className="text-xs text-slate-500 mb-3 truncate" title={event.analysis.venue}>{event.analysis.venue}</p>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 truncate" title={event.analysis.institution}>
                          <Building2 size={14} className="shrink-0" /> <span className="truncate">{event.analysis.institution}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                    selectedEvent.analysis.priority === Priority.High ? 'bg-red-100 text-red-700' :
                    selectedEvent.analysis.priority === Priority.Medium ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedEvent.analysis.priority} Priority
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedEvent.analysis.theme}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedEvent.analysis.eventName}</h2>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><CalendarIcon size={12}/> Date & Time</span>
                  <p className="text-sm font-medium text-slate-900">{selectedEvent.analysis.date} {selectedEvent.analysis.time ? `@ ${selectedEvent.analysis.time}` : ''}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12}/> Venue</span>
                  <p className="text-sm font-medium text-slate-900">{selectedEvent.analysis.venue}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building2 size={12}/> Institution</span>
                  <p className="text-sm font-medium text-slate-900">{selectedEvent.analysis.institution}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Tag size={12}/> Contact</span>
                  <p className="text-sm font-medium text-slate-900">{selectedEvent.contact.name || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</span>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedEvent.analysis.description}
                </p>
              </div>

              {selectedEvent.analysis.linkedActivities && selectedEvent.analysis.linkedActivities.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linked Activities</span>
                  <ul className="space-y-2">
                    {selectedEvent.analysis.linkedActivities.map((activity, idx) => (
                      <li key={idx} className="text-sm text-brand-policy font-medium bg-brand-policy/10 px-3 py-2 rounded-lg border border-brand-policy/20">
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
