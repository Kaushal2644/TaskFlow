import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../api/axios';

const Navbar = ({ onMenuClick }) => {
  const navigate        = useNavigate();
  const { user, logout } = useAuth();

  const [search,          setSearch]          = useState('');
  const [showUserMenu,    setShowUserMenu]     = useState(false);
  const [unreadCount,     setUnreadCount]      = useState(0);

  const userMenuRef = useRef(null);

  // ── Get initials ────────────────────────────────────
  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ── Fetch unread notification count ─────────────────
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await API.get('/notifications');
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // silent fail
      }
    };
    fetchUnread();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Close menu on outside click ──────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Logout ───────────────────────────────────────────
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // ── Search submit ────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/projects?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between gap-2 border-b border-dark-border bg-dark-sidebar px-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-all duration-200 hover:bg-dark-hover hover:text-text-primary lg:hidden"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* ── Search Bar ─────────────────────────────────── */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, tasks, people..."
              className="w-full rounded-lg border border-dark-border bg-dark-input py-2 pl-9 pr-4 text-sm text-text-primary placeholder-text-muted transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </form>
      </div>

      {/* ── Right Side Actions ─────────────────────────── */}
      <div className="ml-2 flex items-center gap-1.5 sm:gap-2">

        {/* Theme toggle (visual only for now) */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-all duration-200 hover:bg-dark-hover hover:text-text-primary"
          title="Toggle theme"
        >
          {/* <Sun className="w-4 h-4" /> */}
        </button>

        {/* Notifications bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-all duration-200 hover:bg-dark-hover hover:text-text-primary"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 
                             bg-red-500 text-white text-xs rounded-full 
                             flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 rounded-lg py-1 pl-1.5 pr-1 transition-all duration-200 hover:bg-dark-hover sm:gap-2 sm:pl-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {getInitials(user?.name)}
            </div>
            <ChevronDown className={`w-3 h-3 text-text-muted transition-transform 
                                     duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52
                            bg-dark-card border border-dark-border 
                            rounded-xl shadow-modal z-50 overflow-hidden">

              {/* User info */}
              <div className="px-4 py-3 border-b border-dark-border">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-text-muted truncate mt-0.5">
                  {user?.email}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5
                             text-sm text-text-secondary 
                             hover:text-text-primary hover:bg-dark-hover
                             transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5
                             text-sm text-red-400 hover:text-red-300 
                             hover:bg-dark-hover transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;