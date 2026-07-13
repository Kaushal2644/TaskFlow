import { useState, useEffect } from 'react';
import {
  Search, UserPlus, Mail, Shield,
  Crown, User, X, AlertCircle,
  Trash2, MoreVertical
} from 'lucide-react';
import API   from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ── Role badge config ─────────────────────────────────────────────────────────
const roleBadge = {
  'Admin':           { class: 'bg-purple-900 text-purple-300', icon: Crown  },
  'Project Manager': { class: 'bg-blue-900   text-blue-300',   icon: Shield },
  'Team Member':     { class: 'bg-slate-700  text-slate-300',  icon: User   },
};

// ── Member Card ───────────────────────────────────────────────────────────────
const MemberCard = ({ member, currentUser, onRemove, onRoleChange }) => {
  const [menu, setMenu] = useState(false);
  const isAdmin   = currentUser?.role === 'Admin';
  const isYou     = member._id === currentUser?._id;
  const { class: cls, icon: Icon } = roleBadge[member.role] || roleBadge['Team Member'];

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const colors = ['bg-indigo-600','bg-violet-600','bg-blue-600',
                  'bg-emerald-600','bg-amber-600','bg-rose-600'];
  const colorIdx = member.name?.charCodeAt(0) % colors.length;

  return (
    <div className="card flex items-center gap-4 hover:border-primary
                    hover:border-opacity-40 transition-all duration-200 group">

      {/* Avatar */}
      <div className={`w-12 h-12 ${colors[colorIdx]} rounded-xl flex items-center
                       justify-center text-white font-bold text-lg flex-shrink-0`}>
        {getInitials(member.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-text-primary font-semibold text-sm truncate">
            {member.name}
          </p>
          {isYou && (
            <span className="badge bg-primary bg-opacity-20 text-primary text-xs">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Mail className="w-3 h-3 text-text-muted" />
          <p className="text-text-muted text-xs truncate">{member.email}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <Icon className="w-3 h-3 text-text-muted" />
          <span className={`badge ${cls} text-xs`}>{member.role}</span>
        </div>
      </div>

      {/* Member menu (admin only, not self) */}
      {isAdmin && !isYou && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenu(!menu)}
            className="p-1.5 text-text-muted hover:text-text-primary
                       hover:bg-dark-hover rounded-lg transition-all
                       opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menu && (
            <div className="absolute right-0 top-7 w-48 bg-dark-card
                            border border-dark-border rounded-xl
                            shadow-modal py-2 z-20">

              {/* Change role options */}
              <p className="px-3 py-1 text-text-muted text-xs font-medium">
                Change Role
              </p>
              {['Admin','Project Manager','Team Member'].map(role => (
                <button
                  key={role}
                  onClick={() => { onRoleChange(member._id, role); setMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs
                              hover:bg-dark-hover transition-all
                              ${member.role === role
                                ? 'text-primary font-medium'
                                : 'text-text-secondary'
                              }`}
                >
                  {member.role === role ? '✓ ' : '  '}{role}
                </button>
              ))}

              <div className="border-t border-dark-border my-1" />

              {/* Remove */}
              <button
                onClick={() => { onRemove(member); setMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs
                           text-red-400 hover:text-red-300
                           hover:bg-dark-hover transition-all
                           flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> Remove Member
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Invite Modal ──────────────────────────────────────────────────────────────
const InviteModal = ({ isOpen, onClose, onInvite }) => {
  const [form,    setForm]    = useState({ email: '', role: 'Team Member' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    if (isOpen) { setForm({ email: '', role: 'Team Member' }); setErrors({}); }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.email.trim())            e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const res = await API.post('/team/invite', form);
      onInvite(res.data.member);
      toast.success(`Invitation sent to ${form.email}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-lg font-bold text-text-primary">
            Invite Team Member
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary
                       hover:bg-dark-hover rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-text-muted" />
              <input
                type="email"
                value={form.email}
                onChange={e => {
                  setForm(p => ({ ...p, email: e.target.value }));
                  if (errors.email) setErrors(p => ({ ...p, email: '' }));
                }}
                placeholder="colleague@company.com"
                className={`input pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.email}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2
                                 w-4 h-4 text-text-muted" />
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="select pl-10"
              >
                {['Admin','Project Manager','Team Member'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Role descriptions */}
          <div className="bg-dark-hover rounded-lg p-3 space-y-2">
            {[
              { role: 'Admin',           desc: 'Full access to all settings and data'     },
              { role: 'Project Manager', desc: 'Can create and manage projects and tasks'  },
              { role: 'Team Member',     desc: 'Can view projects and manage assigned tasks'},
            ].map(({ role, desc }) => (
              <div key={role} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
                  ${form.role === role ? 'bg-primary' : 'bg-dark-border'}`}
                />
                <div>
                  <p className={`text-xs font-medium
                    ${form.role === role ? 'text-primary' : 'text-text-secondary'}`}>
                    {role}
                  </p>
                  <p className="text-text-muted text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-dark-border">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Send Invite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Team Page ────────────────────────────────────────────────────────────
const Team = () => {
  const { user }  = useAuth();
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [inviteOpen,   setInviteOpen]   = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeLoading,setRemoveLoading]= useState(false);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await API.get('/team');
      setMembers(res.data.members);
    } catch (err) {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  // Role counts
  const roleCounts = {
    Admin:          members.filter(m => m.role === 'Admin').length,
    'Project Manager': members.filter(m => m.role === 'Project Manager').length,
    'Team Member':  members.filter(m => m.role === 'Team Member').length,
  };

  const handleInvite = (member) => {
    setMembers(prev => [member, ...prev]);
  };

  const handleRoleChange = async (memberId, role) => {
    try {
      await API.put(`/team/${memberId}/role`, { role });
      setMembers(prev => prev.map(m =>
        m._id === memberId ? { ...m, role } : m
      ));
      toast.success('Role updated');
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleRemove = async () => {
    setRemoveLoading(true);
    try {
      await API.delete(`/team/${removeTarget._id}`);
      setMembers(prev => prev.filter(m => m._id !== removeTarget._id));
      toast.success('Member removed');
      setRemoveTarget(null);
    } catch (err) {
      toast.error('Failed to remove member');
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{members.length} members</p>
        </div>
        {user?.role === 'Admin' && (
          <button
            onClick={() => setInviteOpen(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* ── Role summary ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Object.entries(roleCounts).map(([role, count]) => {
          const { class: cls, icon: Icon } = roleBadge[role];
          return (
            <div key={role} className="card py-4 text-center">
              <Icon className="w-5 h-5 text-text-muted mx-auto mb-2" />
              <p className="text-2xl font-bold text-text-primary">{count}</p>
              <p className="text-text-muted text-xs mt-1">{role}s</p>
            </div>
          );
        })}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2
                         w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members..."
          className="input pl-9"
        />
      </div>

      {/* ── Members Grid ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(member => (
            <MemberCard
              key={member._id}
              member={member}
              currentUser={user}
              onRemove={setRemoveTarget}
              onRoleChange={handleRoleChange}
            />
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-20">
          <User className="w-12 h-12 text-text-muted mb-4 opacity-40" />
          <p className="text-text-primary font-semibold">No members found</p>
          <p className="text-text-muted text-sm mt-1">Try a different search</p>
        </div>
      )}

      {/* ── Invite Modal ────────────────────────────────────────────────────── */}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />

      {/* ── Remove Confirm ─────────────────────────────────────────────────── */}
      {removeTarget && (
        <div className="modal-overlay" onClick={() => setRemoveTarget(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-900 rounded-xl flex items-center
                                justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-text-primary font-bold">Remove Member</h3>
                  <p className="text-text-muted text-sm">
                    This will remove them from all projects
                  </p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-6">
                Remove{' '}
                <span className="text-text-primary font-semibold">
                  {removeTarget.name}
                </span>{' '}
                from your team?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRemoveTarget(null)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemove}
                  disabled={removeLoading}
                  className="btn-danger flex-1 justify-center
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removeLoading ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;