import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from '../staff/StaffSidebar';
import StaffHeader from '../staff/StaffHeader';

const StaffLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <StaffSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main area: offset by sidebar width on desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <StaffHeader onToggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
