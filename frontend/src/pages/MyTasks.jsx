import { useState, useEffect } from 'react';
import {
  Search, Filter, CheckSquare, Calendar,
  Flag, FolderOpen, Clock, CheckCircle,
  Circle, AlertCircle, X, Edit2, Trash2,
  Plus, ChevronDown, User
} from 'lucide-react';
import API   from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ── Badge helpers ─────────────────────────────────────────────────────────────
const statusClass = {
  'Backlog':     'badge-backlog',
  'Todo':        'badge-todo',
  'In Progress': 'badge-inprogress',
  'Review':      'badge-review',
  'Done':        'badge-done',
};

const priorityClass = {
  'Low':      'badge-low',
  'Medium':   'badge-medium',
  'High':     'badge-high',
  'Critical': 'badge-critical',
};

const priorityIcon = {
  'Low':      <Flag className="w-3 h-3 text-emerald-400" />,
  'Medium':   <Flag className="w-3 h-3 text-amber-400" />,
  'High':     <Flag className="w-3 h-3 text-orange-400" />,
  'Critical': <Flag className="w-3 h-3 text-red-400" />,
};

// ── Format date ───────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return null;
  const date  = new Date(d);
  const now   = new Date();
  const diff  = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  const label = date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short'
  });
  return { label, overdue: diff < 0, urgent: diff >= 0 && diff <= 2 };
};

// ── Task Row ──────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onEdit, onDelete, onStatusChange }) => {
  const due      = formatDate(task.dueDate);
  const [menu, setMenu] = useState(false);

  return (
    <div className="flex items-center gap-4 p-4 bg-dark-card border
                    border-dark-border rounded-xl hover:border-primary
                    hover:border-opacity-40 transition-all duration-200 group">

      {/* Status toggle circle */}
      <button
        onClick={() => onStatusChange(task)}
        className="flex-shrink-0"
        title="Toggle status"
      >
        {task.status === 'Done'
          ? <CheckCircle className="w-5 h-5 text-emerald-400" />
          : <Circle      className="w-5 h-5 text-text-muted
                                    hover:text-primary transition-colors" />
        }
      </button>

      {/* Title + project */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate
          ${task.status === 'Done'
            ? 'text-text-muted line-through'
            : 'text-text-primary'
          }`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <FolderOpen className="w-3 h-3 text-text-muted" />
          <span className="text-text-muted text-xs truncate">
            {task.project?.name ?? 'No project'}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <span className={`badge ${statusClass[task.status]} hidden sm:inline-flex`}>
        {task.status}
      </span>

      {/* Priority */}
      <div className="hidden md:flex items-center gap-1">
        {priorityIcon[task.priority]}
        <span className={`badge ${priorityClass[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {/* Due date */}
      {due ? (
        <div className={`hidden lg:flex items-center gap-1 text-xs font-medium
          ${due.overdue ? 'text-red-400' : due.urgent ? 'text-amber-400' : 'text-text-muted'}`}>
          <Clock className="w-3 h-3" />
          {due.label}
        </div>
      ) : (
        <span className="hidden lg:block text-text-muted text-xs">No due date</span>
      )}

      {/* Actions */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenu(!menu)}
          className="p-1.5 text-text-muted hover:text-text-primary
                     hover:bg-dark-hover rounded-lg transition-all
                     opacity-0 group-hover:opacity-100"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {menu && (
          <div className="absolute right-0 top-7 w-36 bg-dark-card border
                          border-dark-border rounded-lg shadow-modal py-1 z-20">
            <button
              onClick={() => { onEdit(task); setMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2
                         text-text-secondary hover:text-text-primary
                         hover:bg-dark-hover text-xs transition-all"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => { onDelete(task); setMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2
                         text-red-400 hover:text-red-300
                         hover:bg-dark-hover text-xs transition-all"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Task Modal (Create / Edit) ────────────────────────────────────────────────
const TaskModal = ({ isOpen, onClose, onSave, editTask, projects }) => {
  const { user }  = useAuth();
  const isEdit    = !!editTask;

  const defaultForm = {
    title:       '',
    description: '',
    status:      'Todo',
    priority:    'Medium',
    project:     '',
    assignedTo:  '',
    dueDate:     ''
  };

  const [form,      setForm]      = useState(defaultForm);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});
  const [members,   setMembers]   = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // ── Fetch members when project changes ───────────────────────────────────
  useEffect(() => {
    if (!form.project) {
      setMembers([]);
      return;
    }
    fetchProjectMembers(form.project);
  }, [form.project]);

  const fetchProjectMembers = async (projectId) => {
    setMembersLoading(true);
    try {
      const res = await API.get(`/projects/${projectId}`);
      const projectMembers = res.data.project.members.map(m => m.user);
      setMembers(projectMembers);
    } catch (err) {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (editTask) {
      setForm({
        title:       editTask.title       || '',
        description: editTask.description || '',
        status:      editTask.status      || 'Todo',
        priority:    editTask.priority    || 'Medium',
        project:     editTask.project?._id || editTask.project || '',
        assignedTo:  editTask.assignedTo?._id
                       || editTask.assignedTo
                       || '',
        dueDate:     editTask.dueDate
          ? new Date(editTask.dueDate).toISOString().split('T')[0] : ''
      });
    } else {
      setForm({
        ...defaultForm,
        assignedTo: user?._id || ''   // default assign to self
      });
    }
    setErrors({});
  }, [editTask, isOpen, user]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title   = 'Task title is required';
    if (!form.project)      e.project = 'Please select a project';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo || null
      };

      if (isEdit) {
        const res = await API.put(`/tasks/${editTask._id}`, payload);
        onSave(res.data.task, true);
        toast.success('Task updated!');
      } else {
        const res = await API.post('/tasks', payload);
        onSave(res.data.task, false);
        toast.success('Task created!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6
                        border-b border-dark-border">
          <h2 className="text-lg font-bold text-text-primary">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary
                       hover:bg-dark-hover rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium
                               text-text-secondary mb-1.5">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => {
                setForm(p => ({ ...p, title: e.target.value }));
                if (errors.title) setErrors(p => ({ ...p, title: '' }));
              }}
              placeholder="Enter task title"
              className={`input ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium
                               text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Task details..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium
                               text-text-secondary mb-1.5">
              Project <span className="text-red-400">*</span>
            </label>
            <select
              value={form.project}
              onChange={e => {
                setForm(p => ({ ...p, project: e.target.value, assignedTo: '' }));
                if (errors.project) setErrors(p => ({ ...p, project: '' }));
              }}
              className={`select ${errors.project ? 'border-red-500' : ''}`}
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {errors.project && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.project}
              </p>
            )}
          </div>

          {/* ── Assign To ────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium
                               text-text-secondary mb-1.5">
              Assign To
            </label>

            {!form.project ? (
              <div className="input text-text-muted text-sm
                              flex items-center gap-2 cursor-not-allowed
                              opacity-60">
                <User className="w-4 h-4" />
                Select a project first
              </div>
            ) : membersLoading ? (
              <div className="input flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary
                                border-t-transparent rounded-full animate-spin" />
                <span className="text-text-muted text-sm">
                  Loading members...
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Unassigned option */}
                <div
                  onClick={() => setForm(p => ({ ...p, assignedTo: '' }))}
                  className={`flex items-center gap-3 p-3 rounded-xl
                              border cursor-pointer transition-all
                              ${!form.assignedTo
                                ? 'border-primary bg-primary bg-opacity-10'
                                : 'border-dark-border hover:border-primary hover:border-opacity-40'
                              }`}
                >
                  <div className="w-8 h-8 bg-dark-hover rounded-full
                                  flex items-center justify-center
                                  border-2 border-dashed border-dark-border">
                    <User className="w-4 h-4 text-text-muted" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-secondary text-sm">Unassigned</p>
                  </div>
                  {!form.assignedTo && (
                    <div className="w-4 h-4 bg-primary rounded-full
                                    flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>

                {/* Member options */}
                {members.map(member => (
                  <div
                    key={member._id}
                    onClick={() => setForm(p => ({
                      ...p,
                      assignedTo: member._id
                    }))}
                    className={`flex items-center gap-3 p-3 rounded-xl
                                border cursor-pointer transition-all
                                ${form.assignedTo === member._id
                                  ? 'border-primary bg-primary bg-opacity-10'
                                  : 'border-dark-border hover:border-primary hover:border-opacity-40'
                                }`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-primary rounded-full
                                    flex items-center justify-center
                                    text-white text-xs font-bold flex-shrink-0">
                      {getInitials(member.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium
                                    truncate">
                        {member.name}
                        {member._id === user?._id && (
                          <span className="text-primary text-xs ml-1">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-text-muted text-xs truncate">
                        {member.email}
                      </p>
                    </div>

                    {/* Selected tick */}
                    {form.assignedTo === member._id && (
                      <div className="w-4 h-4 bg-primary rounded-full
                                      flex items-center justify-center
                                      flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                                 text-text-secondary mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="select"
              >
                {['Backlog','Todo','In Progress','Review','Done'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium
                                 text-text-secondary mb-1.5">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="select"
              >
                {['Low','Medium','High','Critical'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium
                               text-text-secondary mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              className="input"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6
                        border-t border-dark-border">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin" />
                Saving...
              </>
            ) : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm ────────────────────────────────────────────────────────────
const DeleteModal = ({ task, onClose, onConfirm, loading }) => {
  if (!task) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-900 rounded-xl flex items-center
                            justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-text-primary font-bold">Delete Task</h3>
              <p className="text-text-muted text-sm">This cannot be undone</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-6">
            Delete{' '}
            <span className="text-text-primary font-semibold">
              "{task.title}"
            </span>?
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="btn-danger flex-1 justify-center
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main My Tasks Page ────────────────────────────────────────────────────────
const MyTasks = () => {
  const { user }  = useAuth();
  const [tasks,         setTasks]         = useState([]);
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('All Status');
  const [priorityFilter,setPriorityFilter]= useState('All Priority');
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editTask,      setEditTask]      = useState(null);
  const [deleteTask,    setDeleteTask]    = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/projects')
      ]);
      setTasks(tasksRes.data.tasks);
      setProjects(projectsRes.data.projects);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // ── Filter tasks ──────────────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = statusFilter   === 'All Status'   || t.status   === statusFilter;
    const matchPriority = priorityFilter === 'All Priority' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  // ── Group by status for summary ───────────────────────────────────────────
  const counts = {
    total:      tasks.length,
    done:       tasks.filter(t => t.status === 'Done').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    overdue:    tasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
    ).length
  };

  // ── Toggle task done/todo ─────────────────────────────────────────────────
  const handleStatusToggle = async (task) => {
    const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
    try {
      const res = await API.put(`/tasks/${task._id}`, { status: newStatus });
      setTasks(prev => prev.map(t =>
        t._id === task._id ? res.data.task : t
      ));
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  // ── Save task ─────────────────────────────────────────────────────────────
  const handleSave = (saved, isEdit) => {
    if (isEdit) {
      setTasks(prev => prev.map(t => t._id === saved._id ? saved : t));
    } else {
      // Only add to list if assigned to current user
      if (!saved.assignedTo || saved.assignedTo._id === user?._id) {
        setTasks(prev => [saved, ...prev]);
      }
    }
  };

  // ── Delete task ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await API.delete(`/tasks/${deleteTask._id}`);
      setTasks(prev => prev.filter(t => t._id !== deleteTask._id));
      toast.success('Task deleted');
      setDeleteTask(null);
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            {counts.total} tasks assigned to you
          </p>
        </div>
        <button
          onClick={() => { setEditTask(null); setModalOpen(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total',       value: counts.total,      color: 'text-text-primary' },
          { label: 'Completed',   value: counts.done,       color: 'text-emerald-400'  },
          { label: 'In Progress', value: counts.inProgress, color: 'text-amber-400'    },
          { label: 'Overdue',     value: counts.overdue,    color: 'text-red-400'      },
        ].map(({ label, value, color }) => (
          <div key={label} className="card py-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-text-muted text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="input pl-9"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="select pl-9 w-full sm:w-40"
          >
            {['All Status','Backlog','Todo','In Progress','Review','Done']
              .map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-text-muted" />
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="select pl-9 w-full sm:w-40"
          >
            {['All Priority','Low','Medium','High','Critical']
              .map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* ── Task List ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(task => (
            <TaskRow
              key={task._id}
              task={task}
              onEdit={t => { setEditTask(t); setModalOpen(true); }}
              onDelete={t => setDeleteTask(t)}
              onStatusChange={handleStatusToggle}
            />
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center
                        py-20 text-center">
          <CheckSquare className="w-12 h-12 text-text-muted mb-4 opacity-40" />
          <h3 className="text-text-primary font-semibold mb-1">
            No tasks found
          </h3>
          <p className="text-text-muted text-sm mb-4">
            {search || statusFilter !== 'All Status' || priorityFilter !== 'All Priority'
              ? 'Try adjusting your filters'
              : "You're all caught up!"}
          </p>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        onSave={handleSave}
        editTask={editTask}
        projects={projects}
      />
      <DeleteModal
        task={deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default MyTasks;