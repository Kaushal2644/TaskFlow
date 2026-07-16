import { useState, useEffect, useRef } from 'react';
import {
  Plus, X, AlertCircle, Flag,
  Clock, User, FolderOpen, GripVertical,MessageSquare, Send
} from 'lucide-react';
import API   from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// ── Column config ─────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'Backlog',     label: 'Backlog',     color: 'bg-slate-500'   },
  { id: 'Todo',        label: 'Todo',        color: 'bg-blue-500'    },
  { id: 'In Progress', label: 'In Progress', color: 'bg-amber-500'   },
  { id: 'Review',      label: 'Review',      color: 'bg-purple-500'  },
  { id: 'Done',        label: 'Done',        color: 'bg-emerald-500' },
];

const priorityColors = {
  'Low':      'text-emerald-400',
  'Medium':   'text-amber-400',
  'High':     'text-orange-400',
  'Critical': 'text-red-400',
};

// ── Format due date ───────────────────────────────────────────────────────────
const formatDue = (d) => {
  if (!d) return null;
  const date = new Date(d);
  const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
  return {
    label:   date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    overdue: diff < 0,
    urgent:  diff >= 0 && diff <= 2
  };
};

// ── Kanban Task Card ──────────────────────────────────────────────────────────
const KanbanCard = ({
  task, onDragStart, onDragEnd,
  isDragging, onClick
}) => {
  const due = formatDue(task.dueDate);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task)}
      className={`
        bg-dark-bg border border-dark-border rounded-xl p-3
        cursor-grab active:cursor-grabbing
        hover:border-primary hover:border-opacity-50
        transition-all duration-200 select-none
        ${isDragging ? 'opacity-40 rotate-2 scale-95' : ''}
      `}
    >
      {/* Title */}
      <p className="text-text-primary text-xs font-medium mb-2 leading-relaxed">
        {task.title}
      </p>

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 bg-dark-hover
                         text-text-muted rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
          <span className="text-text-muted text-xs">{task.priority}</span>
        </div>

        <div className="flex items-center gap-2">
          {due && (
            <div className={`flex items-center gap-1 text-xs
              ${due.overdue ? 'text-red-400' :
                due.urgent  ? 'text-amber-400' : 'text-text-muted'}`}>
              <Clock className="w-3 h-3" />
              {due.label}
            </div>
          )}

          {task.assignedTo && (
            <div
              className="w-5 h-5 bg-primary rounded-full flex items-center
                         justify-center text-white text-xs font-bold"
              title={task.assignedTo.name}
            >
              {task.assignedTo.name?.[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Kanban Column ─────────────────────────────────────────────────────────────
const KanbanColumn = ({
  column, tasks,
  onDragStart, onDragEnd,
  onDrop, dragOverColumn, setDragOverColumn,
  draggingTask, onCardClick,
  onAddTask
}) => {
  const isOver = dragOverColumn === column.id;

  return (
    <div
      className="flex flex-col min-w-60 w-60 flex-shrink-0"
      onDragOver={e => { e.preventDefault(); setDragOverColumn(column.id); }}
      onDragLeave={() => setDragOverColumn(null)}
      onDrop={() => { onDrop(column.id); setDragOverColumn(null); }}
    >
      {/* Column header */}
      <div className={`
        flex items-center justify-between px-3 py-2.5
        bg-dark-card border border-dark-border rounded-xl mb-3
        ${isOver ? 'border-primary' : ''}
        transition-all duration-200
      `}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
          <span className="text-text-primary text-sm font-semibold">
            {column.label}
          </span>
          <span className="bg-dark-hover text-text-muted text-xs
                           px-1.5 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 text-text-muted hover:text-primary
                     hover:bg-dark-hover rounded transition-all"
          title={`Add task to ${column.label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drop zone */}
      <div className={`
        flex-1 space-y-2 min-h-24 rounded-xl p-1.5 transition-all duration-200
        ${isOver ? 'bg-primary bg-opacity-5 border border-primary border-dashed' : ''}
      `}>
        {tasks.map(task => (
          <KanbanCard
            key={task._id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggingTask?._id === task._id}
            onClick={onCardClick}
          />
        ))}

        {/* Empty column hint */}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-16
                          text-text-muted text-xs border border-dashed
                          border-dark-border rounded-xl">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};

const QuickAddModal = ({ isOpen, onClose, onSave, defaultStatus, projects }) => {
  const { user } = useAuth();

  const [form,    setForm]    = useState({
    title: '', project: '', priority: 'Medium', assignedTo: ''
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [members,  setMembers]  = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultProject = projects[0]?._id || '';
      setForm({
        title:      '',
        project:    defaultProject,
        priority:   'Medium',
        assignedTo: user?._id || ''
      });
      setError('');
      if (defaultProject) fetchMembers(defaultProject);
    }
  }, [isOpen, projects]);

  useEffect(() => {
    if (form.project) fetchMembers(form.project);
    else setMembers([]);
  }, [form.project]);

  const fetchMembers = async (projectId) => {
    setMembersLoading(true);
    try {
      const res = await API.get(`/projects/${projectId}`);
      setMembers(res.data.project.members.map(m => m.user));
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required');          return; }
    if (!form.project)      { setError('Please select a project');    return; }

    setLoading(true);
    try {
      const res = await API.post('/tasks', {
        ...form,
        status:     defaultStatus,
        assignedTo: form.assignedTo || null
      });
      onSave(res.data.task);
      toast.success('Task added!');
      onClose();
    } catch (err) {
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5
                        border-b border-dark-border">
          <h2 className="text-base font-bold text-text-primary">
            Add to {defaultStatus}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary
                       hover:bg-dark-hover rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">

          {/* Title */}
          <input
            autoFocus
            type="text"
            value={form.title}
            onChange={e => {
              setForm(p => ({ ...p, title: e.target.value }));
              setError('');
            }}
            placeholder="Task title..."
            className={`input ${error && !form.title ? 'border-red-500' : ''}`}
          />

          {/* Project */}
          <select
            value={form.project}
            onChange={e => {
              setForm(p => ({ ...p, project: e.target.value, assignedTo: '' }));
              setError('');
            }}
            className={`select ${error && !form.project ? 'border-red-500' : ''}`}
          >
            <option value="">Select project...</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={form.priority}
            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
            className="select"
          >
            {['Low','Medium','High','Critical'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* ── Assign To ──────────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-medium
                               text-text-muted mb-2">
              ASSIGN TO
            </label>

            {!form.project ? (
              <p className="text-text-muted text-xs">
                Select a project to see members
              </p>
            ) : membersLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-primary
                                border-t-transparent rounded-full animate-spin" />
                <span className="text-text-muted text-xs">Loading...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {/* Unassigned */}
                <button
                  onClick={() => setForm(p => ({ ...p, assignedTo: '' }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5
                              rounded-lg text-xs border transition-all
                              ${!form.assignedTo
                                ? 'border-primary bg-primary bg-opacity-20 text-primary'
                                : 'border-dark-border text-text-secondary hover:border-primary hover:border-opacity-40'
                              }`}
                >
                  <User className="w-3 h-3" />
                  Unassigned
                </button>

                {/* Members as pill buttons */}
                {members.map(member => (
                  <button
                    key={member._id}
                    onClick={() => setForm(p => ({
                      ...p,
                      assignedTo: member._id
                    }))}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5
                                rounded-lg text-xs border transition-all
                                ${form.assignedTo === member._id
                                  ? 'border-primary bg-primary bg-opacity-20 text-primary'
                                  : 'border-dark-border text-text-secondary hover:border-primary hover:border-opacity-40'
                                }`}
                    title={member.email}
                  >
                    <div className="w-4 h-4 bg-primary rounded-full
                                    flex items-center justify-center
                                    text-white text-xs font-bold">
                      {getInitials(member.name)}
                    </div>
                    {member.name.split(' ')[0]}
                    {member._id === user?._id && ' (You)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-dark-border">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full animate-spin" />
            ) : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Task Detail Side Panel ────────────────────────────────────────────────────
const TaskPanel = ({ task, onClose, onUpdate, currentUser }) => {
  const { socket } = useSocket();
  const [status,      setStatus]      = useState(task?.status || 'Todo');
  const [loading,     setLoading]     = useState(false);

  const [comments,    setComments]    = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [postingComment,  setPostingComment]  = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [editText,    setEditText]    = useState('');

  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      fetchComments();
    }
  }, [task?._id]);

  useEffect(() => {
    if (!socket || !task) return;

    const handleNewComment = (data) => {
      if (data.taskId === task._id) {
        setComments((prev) => {
          // Avoid duplicate if it's our own comment already added optimistically
          if (prev.some((c) => c._id === data.comment._id)) return prev;
          return [...prev, data.comment];
        });
      }
    };

    socket.on("newComment", handleNewComment);
    return () => socket.off("newComment", handleNewComment);
  }, [socket, task?._id]);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await API.get(`/comments/task/${task._id}`);
      setComments(res.data.comments);
    } catch (err) {
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  if (!task) return null;

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setLoading(true);
    try {
      const res = await API.put(`/tasks/${task._id}`, { status: newStatus });
      onUpdate(res.data.task);

      if (res.data.projectAutoCompleted) {
        toast.success(
          `🎉 "${res.data.projectName}" auto-completed!`,
          { duration: 5000 }
        );
      } else {
        toast.success('Status updated!');
      }
    } catch (err) {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  // ── Post new comment ────────────────────────────────────────────────────
  const handlePostComment = async () => {
  if (!commentText.trim()) return;

  setPostingComment(true);
  try {
    await API.post('/comments', {
      content: commentText.trim(),
      taskId:  task._id
    });
    
    setCommentText('');
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } catch (err) {
    toast.error('Failed to post comment');
  } finally {
    setPostingComment(false);
  }
};

  // ── Edit comment ─────────────────────────────────────────────────────────
  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.content);
  };

  const saveEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const res = await API.put(`/comments/${commentId}`, {
        content: editText.trim()
      });
      setComments(prev => prev.map(c =>
        c._id === commentId ? res.data.comment : c
      ));
      setEditingId(null);
      setEditText('');
      toast.success('Comment updated');
    } catch (err) {
      toast.error('Failed to update comment');
    }
  };

  // ── Delete comment ──────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const timeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const due = formatDue(task.dueDate);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-dark-sidebar border-l
                    border-dark-border z-50 flex flex-col shadow-modal">

      {/* Header */}
      <div className="flex items-center justify-between p-5
                      border-b border-dark-border flex-shrink-0">
        <h3 className="text-text-primary font-bold text-sm">Task Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-text-muted hover:text-text-primary
                     hover:bg-dark-hover rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Task Info Section ─────────────────────────────────────────── */}
        <div className="p-5 space-y-5 border-b border-dark-border">

          <div>
            <h2 className="text-text-primary font-semibold text-sm leading-relaxed">
              {task.title}
            </h2>
            {task.description && (
              <p className="text-text-muted text-xs mt-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">
              STATUS
            </label>
            <div className="grid grid-cols-1 gap-1">
              {COLUMNS.map(col => (
                <button
                  key={col.id}
                  onClick={() => handleStatusChange(col.id)}
                  disabled={loading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg
                              text-xs font-medium transition-all text-left
                              ${status === col.id
                                ? 'bg-primary bg-opacity-20 text-primary border border-primary border-opacity-40'
                                : 'text-text-secondary hover:bg-dark-hover'
                              }`}
                >
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meta info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
              <div>
                <p className="text-text-muted text-xs">Priority</p>
                <p className="text-text-primary text-xs font-medium">
                  {task.priority}
                </p>
              </div>
            </div>

            {due && (
              <div className="flex items-center gap-3">
                <Clock className={`w-4 h-4 ${
                  due.overdue ? 'text-red-400' :
                  due.urgent  ? 'text-amber-400' : 'text-text-muted'
                }`} />
                <div>
                  <p className="text-text-muted text-xs">Due Date</p>
                  <p className={`text-xs font-medium ${
                    due.overdue ? 'text-red-400' :
                    due.urgent  ? 'text-amber-400' : 'text-text-primary'
                  }`}>
                    {due.label} {due.overdue ? '(Overdue)' : ''}
                  </p>
                </div>
              </div>
            )}

            {task.assignedTo && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-primary rounded-full flex items-center
                                justify-center text-white text-xs font-bold">
                  {task.assignedTo.name?.[0]}
                </div>
                <div>
                  <p className="text-text-muted text-xs">Assigned to</p>
                  <p className="text-text-primary text-xs font-medium">
                    {task.assignedTo.name}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <FolderOpen className="w-4 h-4 text-text-muted" />
              <div>
                <p className="text-text-muted text-xs">Project</p>
                <p className="text-text-primary text-xs font-medium">
                  {task.project?.name}
                </p>
              </div>
            </div>
          </div>

          {task.tags?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-2">TAGS</p>
              <div className="flex flex-wrap gap-1">
                {task.tags.map(tag => (
                  <span key={tag}
                    className="text-xs px-2 py-0.5 bg-dark-hover
                               text-text-secondary rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Comments Section ──────────────────────────────────────────── */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-text-muted" />
            <h3 className="text-text-primary font-semibold text-sm">
              Comments
            </h3>
            <span className="bg-dark-hover text-text-muted text-xs
                             px-1.5 py-0.5 rounded-full font-medium">
              {comments.length}
            </span>
          </div>

          {/* Comments list */}
          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary
                              border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {comments.map(comment => {
                const isOwnComment = comment.author?._id === currentUser?._id;
                const isEditing    = editingId === comment._id;

                return (
                  <div key={comment._id} className="flex gap-2.5 group">
                    {/* Avatar */}
                    <div className="w-7 h-7 bg-primary rounded-full
                                    flex items-center justify-center
                                    text-white text-xs font-bold flex-shrink-0
                                    mt-0.5">
                      {comment.author?.name?.[0] ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="bg-dark-hover rounded-xl rounded-tl-sm
                                      px-3 py-2">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-text-primary text-xs font-semibold">
                            {comment.author?.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-text-muted text-xs">
                              {timeAgo(comment.createdAt)}
                              {comment.isEdited && ' (edited)'}
                            </span>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              rows={2}
                              className="input text-xs resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(comment._id)}
                                className="text-primary text-xs font-medium
                                           hover:text-primary-light"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-text-muted text-xs
                                           hover:text-text-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-text-secondary text-xs leading-relaxed">
                            {comment.content}
                          </p>
                        )}
                      </div>

                      {/* Edit/Delete actions — own comments only */}
                      {isOwnComment && !isEditing && (
                        <div className="flex items-center gap-3 mt-1 ml-1
                                        opacity-0 group-hover:opacity-100
                                        transition-all">
                          <button
                            onClick={() => startEdit(comment)}
                            className="text-text-muted hover:text-text-primary
                                       text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-text-muted hover:text-red-400
                                       text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center
                            py-8 text-text-muted">
              <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No comments yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Comment Input — Fixed at bottom ───────────────────────────────── */}
      <div className="p-4 border-t border-dark-border flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center
                          justify-center text-white text-xs font-bold
                          flex-shrink-0">
            {currentUser?.name?.[0] ?? '?'}
          </div>
          <div className="flex-1 relative">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
              placeholder="Write a comment..."
              rows={1}
              className="input text-xs resize-none pr-10 py-2"
            />
          </div>
          <button
            onClick={handlePostComment}
            disabled={!commentText.trim() || postingComment}
            className="p-2 bg-primary hover:bg-primary-hover text-white
                       rounded-lg transition-all disabled:opacity-40
                       disabled:cursor-not-allowed flex-shrink-0"
          >
            {postingComment ? (
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Kanban Page ──────────────────────────────────────────────────────────
const Kanban = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [board,         setBoard]         = useState({
    'Backlog': [], 'Todo': [], 'In Progress': [], 'Review': [], 'Done': []
  });
  const [projects,      setProjects]      = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading,       setLoading]       = useState(true);
  const [draggingTask,  setDraggingTask]  = useState(null);
  const [dragOverCol,   setDragOverCol]   = useState(null);
  const [quickAdd,      setQuickAdd]      = useState(null);
  const [selectedTask,  setSelectedTask]  = useState(null);

  useEffect(() => {
    if (!socket || !selectedProject) return;

    const handleTaskMoved = (data) => {
      // Only update if it belongs to currently viewed project
      if (data.task.project._id !== selectedProject) return;

      setBoard(prev => {
        const next = { ...prev };
        // Remove from all columns first
        Object.keys(next).forEach(col => {
          next[col] = next[col].filter(t => t._id !== data.taskId);
        });
        // Add to new column
        next[data.newStatus] = [data.task, ...(next[data.newStatus] || [])];
        return next;
      });
    };

    const handleTaskCreated = (data) => {
      if (data.task.project?._id !== selectedProject) return;
      setBoard(prev => ({
        ...prev,
        [data.task.status]: [data.task, ...(prev[data.task.status] || [])]
      }));
    };

    socket.on('taskMoved',   handleTaskMoved);
    socket.on('taskCreated', handleTaskCreated);

    return () => {
      socket.off('taskMoved',   handleTaskMoved);
      socket.off('taskCreated', handleTaskCreated);
    };
  }, [socket, selectedProject]);

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => {
    if (selectedProject) fetchTasks();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data.projects);
      if (res.data.projects.length > 0) {
        setSelectedProject(res.data.projects[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load projects');
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/tasks/project/${selectedProject}`);
      setBoard(res.data.kanbanBoard);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (task) => setDraggingTask(task);
  const handleDragEnd   = ()     => {
    setDraggingTask(null);
    setDragOverCol(null);
  };

  const handleDrop = async (targetColumn) => {
    if (!draggingTask || draggingTask.status === targetColumn) return;

    const sourceCol = draggingTask.status;

    // Optimistic update
    setBoard(prev => {
      const updated    = { ...prev };
      updated[sourceCol] = updated[sourceCol].filter(t => t._id !== draggingTask._id);
      updated[targetColumn] = [
        { ...draggingTask, status: targetColumn },
        ...updated[targetColumn]
      ];
      return updated;
    });

    try {
      await API.put(`/tasks/${draggingTask._id}/move`, {
        status: targetColumn,
        order:  0
      });
    } catch (err) {
      // Revert on error
      fetchTasks();
      toast.error('Failed to move task');
    }
  };

  // ── Add task from quick modal ─────────────────────────────────────────────
  const handleQuickAdd = (task) => {
    setBoard(prev => ({
      ...prev,
      [task.status]: [task, ...(prev[task.status] || [])]
    }));
  };

  // ── Update task from panel ────────────────────────────────────────────────
  const handleTaskUpdate = (updated) => {
    setBoard(prev => {
      const next = { ...prev };
      // Remove from old column
      Object.keys(next).forEach(col => {
        next[col] = next[col].filter(t => t._id !== updated._id);
      });
      // Add to new column
      next[updated.status] = [updated, ...(next[updated.status] || [])];
      return next;
    });
    setSelectedTask(updated);
  };

  const totalTasks = Object.values(board).flat().length;

  return (
    <div className="space-y-5 h-full flex flex-col">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="page-subtitle">{totalTasks} tasks across all columns</p>
        </div>

        {/* Project selector */}
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="select w-56"
        >
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* ── Board ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={board[column.id] || []}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              dragOverColumn={dragOverCol}
              setDragOverColumn={setDragOverCol}
              draggingTask={draggingTask}
              onCardClick={task => setSelectedTask(task)}
              onAddTask={status => setQuickAdd(status)}
            />
          ))}
        </div>
      )}

      {/* ── Quick Add Modal ───────────────────────────────────────────────── */}
      <QuickAddModal
        isOpen={!!quickAdd}
        onClose={() => setQuickAdd(null)}
        onSave={handleQuickAdd}
        defaultStatus={quickAdd}
        projects={projects}
      />

      {/* ── Task Detail Panel ────────────────────────────────────────────── */}
      {selectedTask && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelectedTask(null)}
          />
          <TaskPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
            currentUser={user}
          />
        </>
      )}
    </div>
  );
};

export default Kanban;