import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Clock,
  FolderOpen, Flag, CalendarDays
} from 'lucide-react';
import API   from '../api/axios';
import toast from 'react-hot-toast';

// ── Month names + Day names ───────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const priorityColors = {
  'Low':      'bg-emerald-900 text-emerald-300',
  'Medium':   'bg-amber-900   text-amber-300',
  'High':     'bg-orange-900  text-orange-300',
  'Critical': 'bg-red-900     text-red-300',
};

const statusDot = {
  'Backlog':     'bg-slate-400',
  'Todo':        'bg-blue-400',
  'In Progress': 'bg-amber-400',
  'Review':      'bg-purple-400',
  'Done':        'bg-emerald-400',
};

// ── Build calendar grid ───────────────────────────────────────────────────────
const buildCalendar = (year, month) => {
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  const cells = [];

  // Prev month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, current: false, date: new Date(year, month - 1, daysInPrev - i) });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  }
  // Next month fill
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, date: new Date(year, month + 1, d) });
  }

  return cells;
};

// ── Weekly view helpers ───────────────────────────────────────────────────────
const getWeekDays = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const Calendar = () => {
  const today = new Date();

  const [view,         setView]         = useState('monthly');
  const [currentDate,  setCurrentDate]  = useState(new Date(today));
  const [selectedDate, setSelectedDate] = useState(new Date(today));
  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => { fetchAllTasks(); }, []);

  const fetchAllTasks = async () => {
    try {
      // Fetch tasks from all projects
      const projectsRes = await API.get('/projects');
      const projects    = projectsRes.data.projects;

      const allTasks = [];
      await Promise.all(
        projects.map(async (p) => {
          const res = await API.get(`/tasks/project/${p._id}`);
          res.data.tasks.forEach(t => allTasks.push(t));
        })
      );
      setTasks(allTasks);
    } catch (err) {
      toast.error('Failed to load calendar tasks');
    } finally {
      setLoading(false);
    }
  };

  // ── Get tasks for a specific date ─────────────────────────────────────────
  const getTasksForDate = (date) =>
    tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date));

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const prevWeek  = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek  = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });

  const cells    = buildCalendar(currentDate.getFullYear(), currentDate.getMonth());
  const weekDays = getWeekDays(currentDate);

  const selectedTasks = getTasksForDate(selectedDate);

  const formatSelectedDate = (d) =>
    d.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric'
    });

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Track deadlines and milestones</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${view === 'monthly'
                ? 'bg-primary text-white'
                : 'bg-dark-card border border-dark-border text-text-secondary hover:text-text-primary'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${view === 'weekly'
                ? 'bg-primary text-white'
                : 'bg-dark-card border border-dark-border text-text-secondary hover:text-text-primary'
              }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* ── Monthly View ───────────────────────────────────────────────────── */}
      {view === 'monthly' && (
        <div className="card">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 text-text-muted hover:text-text-primary
                         hover:bg-dark-hover rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-text-primary">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 text-text-muted hover:text-text-primary
                         hover:bg-dark-hover rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-text-muted
                                      text-xs font-medium py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              const cellTasks = getTasksForDate(cell.date);
              const isToday   = isSameDay(cell.date, today);
              const isSelected = isSameDay(cell.date, selectedDate);

              return (
                <div
                  key={idx}
                  onClick={() => cell.current && setSelectedDate(cell.date)}
                  className={`
                    min-h-16 p-1.5 rounded-lg cursor-pointer transition-all
                    ${!cell.current ? 'opacity-30' : ''}
                    ${isSelected && cell.current
                      ? 'bg-primary bg-opacity-20 border border-primary border-opacity-50'
                      : cell.current
                        ? 'hover:bg-dark-hover border border-transparent hover:border-dark-border'
                        : ''
                    }
                  `}
                >
                  {/* Day number */}
                  <div className="flex justify-center mb-1">
                    <span className={`
                      w-7 h-7 flex items-center justify-center
                      rounded-full text-sm font-medium
                      ${isToday && cell.current
                        ? 'bg-primary text-white'
                        : cell.current
                          ? 'text-text-primary'
                          : 'text-text-muted'
                      }
                    `}>
                      {cell.day}
                    </span>
                  </div>

                  {/* Task dots */}
                  {cellTasks.slice(0, 3).map(t => (
                    <div
                      key={t._id}
                      className="text-xs px-1 py-0.5 rounded mb-0.5
                                 bg-primary bg-opacity-30 text-primary
                                 truncate leading-tight"
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                  {cellTasks.length > 3 && (
                    <div className="text-xs text-text-muted px-1">
                      +{cellTasks.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Weekly View ────────────────────────────────────────────────────── */}
      {view === 'weekly' && (
        <div className="card">
          {/* Week nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevWeek}
              className="p-2 text-text-muted hover:text-text-primary
                         hover:bg-dark-hover rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-text-primary">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextWeek}
              className="p-2 text-text-muted hover:text-text-primary
                         hover:bg-dark-hover rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {weekDays.map((day, i) => {
              const dayTasks  = getTasksForDate(day);
              const isToday   = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    rounded-xl p-3 cursor-pointer transition-all min-h-28
                    ${isSelected
                      ? 'bg-primary bg-opacity-10 border border-primary border-opacity-40'
                      : 'bg-dark-hover border border-dark-border hover:border-primary hover:border-opacity-30'
                    }
                  `}
                >
                  <p className="text-text-muted text-xs font-medium text-center">
                    {DAYS_SHORT[day.getDay()]}
                  </p>
                  <div className="flex justify-center mt-1 mb-3">
                    <span className={`
                      w-8 h-8 flex items-center justify-center
                      rounded-full text-sm font-bold
                      ${isToday ? 'bg-primary text-white' : 'text-text-primary'}
                    `}>
                      {day.getDate()}
                    </span>
                  </div>

                  {dayTasks.slice(0, 3).map(t => (
                    <div
                      key={t._id}
                      className="text-xs px-1.5 py-1 rounded mb-1
                                 bg-dark-card border border-dark-border
                                 text-text-secondary truncate"
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-xs text-text-muted text-center">
                      +{dayTasks.length - 3}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Selected Day Tasks ─────────────────────────────────────────────── */}
      <div className="card">
        <h2 className="text-base font-semibold text-text-primary mb-4">
          {formatSelectedDate(selectedDate)}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-6 h-6 border-3 border-primary
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedTasks.length > 0 ? (
          <div className="space-y-3">
            {selectedTasks.map(task => (
              <div
                key={task._id}
                className="flex items-start gap-3 p-3 bg-dark-hover
                           rounded-xl border border-dark-border"
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0
                  ${statusDot[task.status] || 'bg-slate-400'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-text-muted text-xs">
                      <FolderOpen className="w-3 h-3" />
                      {task.project?.name}
                    </div>
                    <span className={`badge text-xs ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <span className={`
                  badge text-xs flex-shrink-0
                  ${task.status === 'Done'        ? 'badge-done'       :
                    task.status === 'In Progress' ? 'badge-inprogress' :
                    task.status === 'Review'      ? 'badge-review'     :
                    task.status === 'Todo'        ? 'badge-todo'       :
                    'badge-backlog'}
                `}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center
                          py-10 text-text-muted">
            <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Nothing scheduled for this day</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;