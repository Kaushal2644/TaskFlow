import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FolderOpen, CheckSquare, CheckCircle,
  Clock, Plus, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API           from '../api/axios';
import StatCard      from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge         from '../components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

// ── Custom Tooltip for chart ──────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border
                      rounded-lg px-3 py-2 shadow-modal">
        <p className="text-text-secondary text-xs">{label}</p>
        <p className="text-primary font-bold text-sm">
          {payload[0].value} tasks
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/projects/stats/dashboard');
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    {
      title:       'Active Projects',
      value:       stats?.activeProjects   ?? 0,
      icon:        FolderOpen,
      iconBg:      'bg-blue-900 text-blue-400',
      change:      12,
      changeLabel: 'vs last month'
    },
    {
      title:       'Total Tasks',
      value:       stats?.totalTasks       ?? 0,
      icon:        CheckSquare,
      iconBg:      'bg-emerald-900 text-emerald-400',
      change:      8,
      changeLabel: 'vs last month'
    },
    {
      title:       'Completed',
      value:       stats?.completedTasks   ?? 0,
      icon:        CheckCircle,
      iconBg:      'bg-amber-900 text-amber-400',
    },
    {
      title:       'Pending',
      value:       stats?.pendingTasks     ?? 0,
      icon:        Clock,
      iconBg:      'bg-red-900 text-red-400',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">
            Here's what's happening with your projects today.
          </p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* ── Stat Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* ── Charts Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Task Distribution Chart */}
        <div className="card xl:col-span-2">
          <h2 className="text-text-primary font-semibold mb-4">
            Task Distribution
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stats?.taskDistribution || []}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2a2d3e"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <h2 className="text-text-primary font-semibold mb-4">
            Upcoming Deadlines
          </h2>
          {!stats?.upcomingDeadlines?.length ? (
            <div className="flex flex-col items-center justify-center
                            py-8 text-center">
              <CheckCircle className="w-10 h-10 text-text-muted mb-2" />
              <p className="text-text-muted text-sm">
                No upcoming deadlines
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  className="flex items-start gap-3 p-3
                             bg-dark-hover rounded-lg"
                >
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5
                                  flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-text-primary text-sm font-medium
                                  truncate">
                      {task.title}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {task.project?.name}
                    </p>
                    <p className="text-amber-400 text-xs mt-0.5">
                      Due {formatDistanceToNow(
                        new Date(task.dueDate),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Activity */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold">
              Recent Activity
            </h2>
            <button
              onClick={() => navigate('/my-tasks')}
              className="flex items-center gap-1 text-primary
                         text-sm hover:text-primary-light transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {!stats?.recentActivity?.length ? (
            <div className="flex flex-col items-center justify-center
                            py-8 text-center">
              <CheckSquare className="w-10 h-10 text-text-muted mb-2" />
              <p className="text-text-muted text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center gap-3 rounded-lg bg-dark-hover p-3 hover:bg-dark-border transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-primary rounded-full
                                  flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {task.createdBy?.name?.charAt(0) || 'U'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-text-primary text-sm font-medium truncate">
                      {task.title}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {task.project?.name} •{' '}
                      {formatDistanceToNow(
                        new Date(task.updatedAt),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>

                  {/* Badge */}
                  <Badge type="status" value={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completion Rate */}
        <div className="card flex flex-col items-center justify-center">
          <h2 className="text-text-primary font-semibold mb-6 self-start">
            Completion Rate
          </h2>

          {/* Circle */}
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="#2a2d3e"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="#6366f1"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${
                  2 * Math.PI * 50 * (1 - (stats?.completionRate ?? 0) / 100)
                }`}
                className="transition-all duration-1000"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col
                            items-center justify-center">
              <span className="text-2xl font-bold text-text-primary">
                {stats?.completionRate ?? 0}%
              </span>
            </div>
          </div>

          <p className="text-text-muted text-sm mt-4">tasks completed</p>

          {/* Mini stats */}
          <div className="flex gap-6 mt-6 w-full justify-center">
            <div className="text-center">
              <p className="text-emerald-400 font-bold text-lg">
                {stats?.completedTasks ?? 0}
              </p>
              <p className="text-text-muted text-xs">Done</p>
            </div>
            <div className="text-center">
              <p className="text-amber-400 font-bold text-lg">
                {stats?.pendingTasks ?? 0}
              </p>
              <p className="text-text-muted text-xs">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;