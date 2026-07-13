import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      <div
        className={`fixed inset-0 z-30 bg-black/70 transition-opacity duration-300 lg:hidden ${mobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto bg-dark-bg p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;