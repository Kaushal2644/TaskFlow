import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Kanban,
  Calendar,
  Users,
  BarChart3,
  Bell,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/",
  },
  {
    label: "Projects",
    icon: FolderKanban,
    to: "/projects",
  },
  {
    label: "My Tasks",
    icon: CheckSquare,
    to: "/my-tasks",
  },
  {
    label: "Kanban",
    icon: Kanban,
    to: "/kanban",
  },
  {
    label: "Calendar",
    icon: Calendar,
    to: "/calendar",
  },
  {
    label: "Team",
    icon: Users,
    to: "/team",
  },
  {
    label: "Reports",
    icon: BarChart3,
    to: "/reports",
  },
  {
    label: "Notifications",
    icon: Bell,
    to: "/notifications",
  },
  {
    label: "Settings",
    icon: Settings,
    to: "/settings",
  },
];

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Get initials from name
  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex h-screen w-72 max-w-[85vw] flex-col border-r border-dark-border bg-dark-sidebar
        transition-transform duration-300 ease-in-out lg:static lg:w-48 lg:max-w-none lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        ${collapsed ? "lg:w-16" : "lg:w-48"}
      `}
    >
      {/* ── Logo ───────────────────────────────────────── */}
      <div
        className={`
        flex h-14 flex-shrink-0 items-center border-b border-dark-border px-3
        ${collapsed ? "justify-center" : "gap-2.5"}
      `}
      >
        <div
          className="w-8 h-8 bg-primary rounded-lg flex items-center 
                        justify-center flex-shrink-0"
        >
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="whitespace-nowrap text-base font-bold text-text-primary">
              TaskFlow
            </span>
            <span
              className="flex-shrink-0 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-white"
            >
              Pro
            </span>
          </div>
        )}
        <button
          onClick={onClose}
          className="ml-auto rounded-lg p-2 text-text-muted transition-all duration-200 hover:bg-dark-hover hover:text-text-primary lg:hidden"
          title="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Nav Items ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => {
          // Exact match for dashboard, startsWith for others
          const isActive =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              onClick={onClose}
              className={`
                flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium
                transition-all duration-200 cursor-pointer
                ${collapsed ? "justify-center" : ""}
                ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-text-primary hover:bg-dark-hover"
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden">
                  {label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User Info ──────────────────────────────────── */}
      {!collapsed && user && (
        <div className="px-3 py-3 border-t border-dark-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full bg-primary flex items-center 
                            justify-center text-white text-xs font-bold flex-shrink-0"
            >
              {getInitials(user.name)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-text-primary truncate">
                {user.name}
              </p>
              <p className="text-xs text-text-muted truncate">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Collapse Toggle ────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden h-10 flex-shrink-0 items-center justify-center border-t border-dark-border text-text-muted transition-all duration-200 hover:bg-dark-hover hover:text-text-primary lg:flex"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;