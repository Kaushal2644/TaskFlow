import { useState, useEffect } from 'react';
import {
  Bell, CheckCheck, Trash2,
  CheckSquare, FolderOpen,
  MessageSquare, UserPlus, Clock
} from 'lucide-react';
import API   from '../api/axios';
import toast from 'react-hot-toast';

// ── Notification icon by type ─────────────────────────────────────────────────
const typeConfig = {
  task_assigned:   { icon: CheckSquare,  color: 'text-blue-400',    bg: 'bg-blue-900 bg-opacity-40'    },
  task_completed:  { icon: CheckSquare,  color: 'text-emerald-400', bg: 'bg-emerald-900 bg-opacity-40' },
  task_updated:    { icon: CheckSquare,  color: 'text-amber-400',   bg: 'bg-amber-900 bg-opacity-40'   },
  comment_added:   { icon: MessageSquare,color: 'text-purple-400',  bg: 'bg-purple-900 bg-opacity-40'  },
  project_created: { icon: FolderOpen,   color: 'text-indigo-400',  bg: 'bg-indigo-900 bg-opacity-40'  },
  project_updated: { icon: FolderOpen,   color: 'text-indigo-400',  bg: 'bg-indigo-900 bg-opacity-40'  },
  member_invited:  { icon: UserPlus,     color: 'text-pink-400',    bg: 'bg-pink-900 bg-opacity-40'    },
  deadline_reminder:{ icon: Clock,       color: 'text-red-400',     bg: 'bg-red-900 bg-opacity-40'     },
};

// ── Time ago ──────────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── Notification Item ─────────────────────────────────────────────────────────
const NotifItem = ({ notif, onRead, onDelete }) => {
  const cfg    = typeConfig[notif.type] || typeConfig['task_assigned'];
  const Icon   = cfg.icon;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border
                  transition-all duration-200 group
                  ${notif.isRead
                    ? 'bg-dark-card border-dark-border'
                    : 'bg-dark-card border-primary border-opacity-30 bg-opacity-80'
                  }`}
    >
      {/* Icon */}
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed
          ${notif.isRead ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
          {notif.message}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-text-muted text-xs">
            {timeAgo(notif.createdAt)}
          </span>
          {!notif.isRead && (
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0
                      opacity-0 group-hover:opacity-100 transition-all">
        {!notif.isRead && (
          <button
            onClick={() => onRead(notif._id)}
            className="p-1.5 text-text-muted hover:text-emerald-400
                       hover:bg-dark-hover rounded-lg transition-all"
            title="Mark as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(notif._id)}
          className="p-1.5 text-text-muted hover:text-red-400
                     hover:bg-dark-hover rounded-lg transition-all"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Main Notifications Page ───────────────────────────────────────────────────
const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('all');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read')   return  n.isRead;
    return true;
  });

  // ── Mark single as read ───────────────────────────────────────────────────
  const handleRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  // ── Mark all as read ──────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/markallread');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  // ── Delete notification ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : '0 unread'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn-secondary w-full text-sm sm:w-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* ── Filter Tabs ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dark-border bg-dark-card p-1">
        {[
          { key: 'all',    label: 'All' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read',   label: 'Read' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter === key
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(notif => (
            <NotifItem
              key={notif._id}
              notif={notif}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-20">
          <Bell className="w-12 h-12 text-text-muted mb-4 opacity-30" />
          <p className="text-text-primary font-semibold">No notifications</p>
          <p className="text-text-muted text-sm mt-1">
            {filter === 'unread'
              ? "You're all caught up!"
              : "We'll notify you when something happens"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;