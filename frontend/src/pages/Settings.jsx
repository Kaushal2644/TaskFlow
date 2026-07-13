import { useState }    from 'react';
import { useAuth }     from '../context/AuthContext';
import API             from '../api/axios';
import toast           from 'react-hot-toast';
import {
  User, Bell, Palette,
  Save, Lock, Eye, EyeOff
} from 'lucide-react';

// ── Toggle Switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-all duration-200
      ${checked ? 'bg-primary' : 'bg-dark-border'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white
                      rounded-full transition-all duration-200
                      ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab]        = useState('profile');
  const [saving, setSaving]  = useState(false);

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: user?.name || '',
  });

  // ── Password form ─────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: ''
  });
  const [showPw, setShowPw] = useState({
    current: false, new: false, confirm: false
  });
  const [pwErrors, setPwErrors] = useState({});

  // ── Notification prefs ────────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    //email: user?.notificationPreferences?.email ?? true,
    push:  user?.notificationPreferences?.push  ?? true,
  });

  // ── Appearance ────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(
    user?.appearance?.theme || 'dark'
  );

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Save profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!profile.name.trim()) {
      toast.error('Name cannot be empty'); return;
    }
    setSaving(true);
    try {
      const res = await API.put('/auth/updateprofile', {
        name: profile.name
      });
      updateUser(res.data.user);
      toast.success('Profile saved!');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── Save password ─────────────────────────────────────────────────────────
  const savePassword = async () => {
    const e = {};
    if (!passwords.currentPassword) e.current = 'Required';
    if (!passwords.newPassword || passwords.newPassword.length < 6)
      e.new = 'Min 6 characters';
    if (passwords.newPassword !== passwords.confirmPassword)
      e.confirm = 'Passwords do not match';

    if (Object.keys(e).length) { setPwErrors(e); return; }

    setSaving(true);
    try {
      await API.put('/auth/updatepassword', {
        currentPassword: passwords.currentPassword,
        newPassword:     passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
      toast.success('Password updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  // ── Save notifications ────────────────────────────────────────────────────
  const saveNotifications = async () => {
    setSaving(true);
    try {
      const res = await API.put('/auth/updateprofile', {
        notificationPreferences: notifPrefs
      });
      updateUser(res.data.user);
      toast.success('Notification preferences saved!');
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // ── Save appearance ───────────────────────────────────────────────────────
  const saveAppearance = async () => {
    setSaving(true);
    try {
      const res = await API.put('/auth/updateprofile', {
        appearance: { theme }
      });
      updateUser(res.data.user);
      toast.success('Appearance saved!');
    } catch (err) {
      toast.error('Failed to save appearance');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'profile',      label: 'Profile',      icon: User    },
    // { key: 'appearance',   label: 'Appearance',   icon: Palette },
    { key: 'notifications',label: 'Notifications', icon: Bell    },
    { key: 'security',     label: 'Security',      icon: Lock    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-dark-border bg-dark-card p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg
                        text-sm font-medium transition-all flex-1 justify-center
              ${tab === key
                ? 'bg-dark-hover text-text-primary border border-dark-border'
                : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Profile Tab ────────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="card space-y-5">
          <h2 className="text-base font-semibold text-text-primary">
            Profile Information
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center
                            justify-center text-white text-xl font-bold">
              {getInitials(user?.name)}
            </div>
            <div>
              <p className="text-text-primary font-semibold">{user?.name}</p>
              <p className="text-text-muted text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className="input"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input opacity-50 cursor-not-allowed"
            />
          </div>

          {/* Role (read-only) */}
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">Role</span>
            <span className="badge bg-primary bg-opacity-20 text-primary">
              {user?.role}
            </span>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      )}

      {/* ── Appearance Tab ─────────────────────────────────────────────────── */}
      {/* {tab === 'appearance' && (
        <div className="card space-y-5">
          <h2 className="text-base font-semibold text-text-primary">
            Appearance
          </h2>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['dark', 'light'].map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-4 rounded-xl border-2 transition-all text-left
                    ${theme === t
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-dark-border hover:border-primary hover:border-opacity-40'
                    }`}
                >
                  <div className={`w-full h-12 rounded-lg mb-3 flex items-end p-2
                    ${t === 'dark'
                      ? 'bg-gray-900 border border-gray-700'
                      : 'bg-gray-100 border border-gray-300'
                    }`}>
                    <div className={`w-8 h-2 rounded ${t === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}`} />
                  </div>
                  <p className="text-text-primary text-sm font-medium capitalize">
                    {t} Mode
                  </p>
                  {theme === t && (
                    <p className="text-primary text-xs mt-0.5">Currently active</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveAppearance}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Appearance
          </button>
        </div>
      )} */}

      {/* ── Notifications Tab ──────────────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="card space-y-5">
          <h2 className="text-base font-semibold text-text-primary">
            Notification Preferences
          </h2>

          <div className="space-y-4">
            {[
              // {
              //   key:   'email',
              //   label: 'Email Notifications',
              //   desc:  'Receive email updates about activity'
              // },
              {
                key:   'push',
                label: 'Push Notifications',
                desc:  'Get in-app alert notifications'
              },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between
                                        p-4 bg-dark-hover rounded-xl">
                <div>
                  <p className="text-text-primary text-sm font-medium">
                    {label}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">{desc}</p>
                </div>
                <Toggle
                  checked={notifPrefs[key]}
                  onChange={val => setNotifPrefs(p => ({ ...p, [key]: val }))}
                />
              </div>
            ))}
          </div>

          <button
            onClick={saveNotifications}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      )}

      {/* ── Security Tab ───────────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="card space-y-5">
          <h2 className="text-base font-semibold text-text-primary">
            Change Password
          </h2>

          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-text-muted" />
              <input
                type={showPw.current ? 'text' : 'password'}
                value={passwords.currentPassword}
                onChange={e => {
                  setPasswords(p => ({ ...p, currentPassword: e.target.value }));
                  if (pwErrors.current) setPwErrors(p => ({ ...p, current: '' }));
                }}
                className={`input pl-10 pr-10 ${pwErrors.current ? 'border-red-500' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-text-muted hover:text-text-secondary"
              >
                {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwErrors.current && (
              <p className="text-red-400 text-xs mt-1">{pwErrors.current}</p>
            )}
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-text-muted" />
              <input
                type={showPw.new ? 'text' : 'password'}
                value={passwords.newPassword}
                onChange={e => {
                  setPasswords(p => ({ ...p, newPassword: e.target.value }));
                  if (pwErrors.new) setPwErrors(p => ({ ...p, new: '' }));
                }}
                className={`input pl-10 pr-10 ${pwErrors.new ? 'border-red-500' : ''}`}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-text-muted hover:text-text-secondary"
              >
                {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwErrors.new && (
              <p className="text-red-400 text-xs mt-1">{pwErrors.new}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-text-muted" />
              <input
                type={showPw.confirm ? 'text' : 'password'}
                value={passwords.confirmPassword}
                onChange={e => {
                  setPasswords(p => ({ ...p, confirmPassword: e.target.value }));
                  if (pwErrors.confirm) setPwErrors(p => ({ ...p, confirm: '' }));
                }}
                className={`input pl-10 pr-10 ${pwErrors.confirm ? 'border-red-500' : ''}`}
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-text-muted hover:text-text-secondary"
              >
                {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwErrors.confirm && (
              <p className="text-red-400 text-xs mt-1">{pwErrors.confirm}</p>
            )}
          </div>

          <button
            onClick={savePassword}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Update Password
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;