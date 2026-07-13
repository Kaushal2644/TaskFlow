import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, CheckSquare,
  Clock, AlertTriangle
} from 'lucide-react';
import API   from '../api/axios';
import toast from 'react-hot-toast';

const COLORS = {
  'Backlog':     '#64748b',
  'Todo':        '#3b82f6',
  'In Progress': '#f59e0b',
  'Review':      '#8b5cf6',
  'Done':        '#10b981',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-card border border-dark-border
                      rounded-lg px-3 py-2 shadow-modal">
        <p className="text-text-secondary text-xs">{payload[0].name}</p>
        <p className="text-text-primary text-sm font-bold">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const [dashRes, projectsRes] = await Promise.all([
        API.get('/projects/stats/dashboard'),
        API.get('/projects')
      ]);

      const dash     = dashRes.data.stats;
      const projects = projectsRes.data.projects;

      // Build workload distribution per member across all projects
      const memberMap = {};
      projects.forEach(p => {
        p.members?.forEach(m => {
          const name = m.user?.name || 'Unknown';
          if (!memberMap[name]) memberMap[name] = 0;
          memberMap[name] += p.taskCounts?.total || 0;
        });
      });

      const workload = Object.entries(memberMap)
        .map(([name, tasks]) => ({ name: name.split(' ')[0], tasks }))
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 6);

      // Project progress data
      const projectProgress = projects.map(p => ({
        name:     p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
        progress: p.completionRate || 0,
        total:    p.taskCounts?.total || 0,
      }));

      setStats({ ...dash, workload, projectProgress });
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary
                        border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = stats?.taskDistribution?.filter(d => d.value > 0) || [];

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Track team performance and project progress</p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Completion Rate',
            value: `${stats?.completionRate ?? 0}%`,
            icon:  TrendingUp,
            color: 'text-emerald-400',
            bg:    'bg-emerald-900 bg-opacity-40'
          },
          {
            label: 'Total Tasks',
            value: stats?.totalTasks ?? 0,
            icon:  CheckSquare,
            color: 'text-blue-400',
            bg:    'bg-blue-900 bg-opacity-40'
          },
          {
            label: 'In Progress',
            value: stats?.taskDistribution?.find(d => d.name === 'In Progress')?.value ?? 0,
            icon:  Clock,
            color: 'text-amber-400',
            bg:    'bg-amber-900 bg-opacity-40'
          },
          {
            label: 'Overdue',
            value: stats?.upcomingDeadlines?.length ?? 0,
            icon:  AlertTriangle,
            color: 'text-red-400',
            bg:    'bg-red-900 bg-opacity-40'
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-text-muted text-xs mt-0.5">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Task Status Pie */}
        <div className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Task Status Distribution
          </h2>
          {pieData.length > 0 ? (
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <ResponsiveContainer width="100%" height={180} className="md:w-[50%]">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex-1 space-y-2">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[item.name] || '#6366f1' }}
                      />
                      <span className="text-text-secondary text-xs">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-text-primary text-xs font-bold">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-text-muted">
              No task data available
            </div>
          )}
        </div>

        {/* Workload Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Workload Distribution
          </h2>
          {stats?.workload?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={stats.workload}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a2d3e"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="tasks"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-text-muted">
              No workload data available
            </div>
          )}
        </div>
      </div>

      {/* ── Project Progress ───────────────────────────────────────────────── */}
      <div className="card">
        <h2 className="text-base font-semibold text-text-primary mb-6">
          Project Progress
        </h2>
        {stats?.projectProgress?.length > 0 ? (
          <div className="space-y-4">
            {stats.projectProgress.map(p => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-text-secondary text-sm">{p.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted text-xs">
                      {p.total} tasks
                    </span>
                    <span className="text-text-primary text-sm font-bold w-10 text-right">
                      {p.progress}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-dark-border rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${p.progress}%`,
                      backgroundColor:
                        p.progress >= 75 ? '#10b981' :
                        p.progress >= 40 ? '#6366f1' : '#f59e0b'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-text-muted">
            No project data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;