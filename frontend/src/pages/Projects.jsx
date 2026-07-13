import { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FolderOpen,
  Calendar, Users, MoreVertical,
  Edit2, Trash2, X, AlertCircle
} from 'lucide-react';
import API   from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ── Status + Priority color maps ──────────────────────────────────────────────
const statusColors = {
  'Planning':   'badge bg-slate-700 text-slate-300',
  'Active':     'badge bg-emerald-900 text-emerald-300',
  'On Hold':    'badge bg-amber-900 text-amber-300',
  'Completed':  'badge bg-blue-900 text-blue-300',
  'Cancelled':  'badge bg-red-900 text-red-300',
};

const priorityColors = {
  'Low':      'badge-low',
  'Medium':   'badge-medium',
  'High':     'badge-high',
  'Critical': 'badge-critical',
};

// ── Project Card ──────────────────────────────────────────────────────────────
const ProjectCard = ({ project, onEdit, onDelete, currentUserId }) => {
  const [menu, setMenu] = useState(false);
  const isOwner = project.owner?._id === currentUserId;

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="card hover:border-primary hover:border-opacity-50
                    transition-all duration-200 relative group">

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-sm truncate">
            {project.name}
          </h3>
          <p className="text-text-muted text-xs mt-1 line-clamp-2">
            {project.description || 'No description'}
          </p>
        </div>

        {/* Menu */}
        {isOwner && (
          <div className="relative ml-2">
            <button
              onClick={() => setMenu(!menu)}
              className="p-1 text-text-muted hover:text-text-primary
                         hover:bg-dark-hover rounded transition-all opacity-0
                         group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menu && (
              <div className="absolute right-0 top-6 w-36 bg-dark-card
                              border border-dark-border rounded-lg shadow-modal
                              py-1 z-20">
                <button
                  onClick={() => { onEdit(project); setMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2
                             text-text-secondary hover:text-text-primary
                             hover:bg-dark-hover text-xs transition-all"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => { onDelete(project); setMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2
                             text-red-400 hover:text-red-300
                             hover:bg-dark-hover text-xs transition-all"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Badges ───────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={statusColors[project.status] || 'badge bg-slate-700 text-slate-300'}>
          {project.status}
        </span>
        <span className={priorityColors[project.priority] || 'badge-medium'}>
          {project.priority}
        </span>
      </div>

      {/* ── Progress bar ─────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-text-muted text-xs">Progress</span>
          <span className="text-text-secondary text-xs font-medium">
            {project.completionRate ?? 0}%
          </span>
        </div>
        <div className="w-full bg-dark-border rounded-full h-1.5">
          <div
            className="bg-primary rounded-full h-1.5 transition-all duration-500"
            style={{ width: `${project.completionRate ?? 0}%` }}
          />
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-text-muted">

        {/* Dates */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(project.endDate)}</span>
        </div>

        {/* Task count */}
        <div className="flex items-center gap-1">
          <span className="text-text-secondary font-medium">
            {project.taskCounts?.total ?? 0}
          </span>
          <span>tasks</span>
        </div>

        {/* Members avatars */}
        <div className="flex -space-x-1.5">
          {project.members?.slice(0, 3).map((m, i) => (
            <div
              key={i}
              className="w-6 h-6 bg-primary rounded-full border-2
                         border-dark-card flex items-center justify-center
                         text-white text-xs font-bold"
              title={m.user?.name}
            >
              {m.user?.name?.[0] ?? '?'}
            </div>
          ))}
          {project.members?.length > 3 && (
            <div className="w-6 h-6 bg-dark-border rounded-full border-2
                            border-dark-card flex items-center justify-center
                            text-text-muted text-xs">
              +{project.members.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── New / Edit Project Modal ──────────────────────────────────────────────────
const ProjectModal = ({ isOpen, onClose, onSave, editProject }) => {
  const { user } = useAuth();
  const isEdit   = !!editProject;

  const defaultForm = {
    name: '', description: '',
    status: 'Planning', priority: 'Medium',
    startDate: '', endDate: ''
  };

  const [form,    setForm]    = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // Populate form when editing
  useEffect(() => {
    if (editProject) {
      setForm({
        name:        editProject.name        || '',
        description: editProject.description || '',
        status:      editProject.status      || 'Planning',
        priority:    editProject.priority    || 'Medium',
        startDate:   editProject.startDate
          ? new Date(editProject.startDate).toISOString().split('T')[0] : '',
        endDate:     editProject.endDate
          ? new Date(editProject.endDate).toISOString().split('T')[0]   : '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [editProject, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      if (isEdit) {
        const res = await API.put(`/projects/${editProject._id}`, form);
        onSave(res.data.project, true);
        toast.success('Project updated!');
      } else {
        const res = await API.post('/projects', {
          ...form,
          members: [{ user: user._id, role: user.role }]
        });
        onSave(res.data.project, false);
        toast.success('Project created!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-lg font-bold text-text-primary">
            {isEdit ? 'Edit Project' : 'New Project'}
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

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => {
                setForm(p => ({ ...p, name: e.target.value }));
                if (errors.name) setErrors(p => ({ ...p, name: '' }));
              }}
              placeholder="Enter project name"
              className={`input ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="select"
              >
                {['Planning','Active','On Hold','Completed','Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          {/* Team Members info */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Team Members
            </label>
            <div className="flex items-center gap-2 p-3 bg-dark-hover
                            rounded-lg border border-dark-border">
              <div className="w-7 h-7 bg-primary rounded-full flex items-center
                              justify-center text-white text-xs font-bold">
                {user?.name?.[0]}
              </div>
              <span className="text-text-secondary text-sm">{user?.name}</span>
              <span className="badge bg-primary bg-opacity-20 text-primary text-xs ml-auto">
                Owner
              </span>
            </div>
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
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Create Project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ project, onClose, onConfirm, loading }) => {
  if (!project) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-900 rounded-xl flex items-center
                            justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-text-primary font-bold">Delete Project</h3>
              <p className="text-text-muted text-sm">This cannot be undone</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-6">
            Are you sure you want to delete{' '}
            <span className="text-text-primary font-semibold">
              "{project.name}"
            </span>
            ? All tasks and data will be permanently removed.
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

// ── Main Projects Page ────────────────────────────────────────────────────────
const Projects = () => {
  const { user }  = useAuth();
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('All Status');
  const [priorityFilter,setPriorityFilter]= useState('All Priority');
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editProject,   setEditProject]   = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data.projects);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // ── Filter projects locally ───────────────────────────────────────────────
  const filtered = projects.filter(p => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase())
      || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = statusFilter   === 'All Status'   || p.status   === statusFilter;
    const matchPriority = priorityFilter === 'All Priority' || p.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  // ── Save handler (create or update) ──────────────────────────────────────
  const handleSave = (saved, isEdit) => {
    if (isEdit) {
      setProjects(prev => prev.map(p => p._id === saved._id ? saved : p));
    } else {
      setProjects(prev => [saved, ...prev]);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await API.delete(`/projects/${deleteProject._id}`);
      setProjects(prev => prev.filter(p => p._id !== deleteProject._id));
      toast.success('Project deleted');
      setDeleteProject(null);
    } catch (err) {
      toast.error('Failed to delete project');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} projects</p>
        </div>
        <button
          onClick={() => { setEditProject(null); setModalOpen(true); }}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input pl-9"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="select pl-9 pr-8 w-full sm:w-40"
          >
            {['All Status','Planning','Active','On Hold','Completed','Cancelled']
              .map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Priority filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-text-muted" />
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="select pl-9 pr-8 w-full sm:w-40"
          >
            {['All Priority','Low','Medium','High','Critical']
              .map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* ── Projects Grid ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              currentUserId={user?._id}
              onEdit={(p) => { setEditProject(p); setModalOpen(true); }}
              onDelete={(p) => setDeleteProject(p)}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="card flex flex-col items-center justify-center
                        py-20 text-center">
          <FolderOpen className="w-12 h-12 text-text-muted mb-4 opacity-40" />
          <h3 className="text-text-primary font-semibold mb-1">
            No projects found
          </h3>
          <p className="text-text-muted text-sm mb-4">
            {search || statusFilter !== 'All Status' || priorityFilter !== 'All Priority'
              ? 'Try adjusting your filters'
              : 'Create your first project to get started'}
          </p>
          {!search && (
            <button
              onClick={() => { setEditProject(null); setModalOpen(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProject(null); }}
        onSave={handleSave}
        editProject={editProject}
      />

      <DeleteModal
        project={deleteProject}
        onClose={() => setDeleteProject(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Projects;