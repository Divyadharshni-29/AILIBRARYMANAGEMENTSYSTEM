import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import GlobalNav from './GlobalNav';
import Breadcrumbs from './Breadcrumbs';
import Sidebar from './Sidebar';
import ChatWidget from './ChatWidget';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* 1. Top Navbar */}
      <Navbar />

      {/* 2. Persistent Global Navigation Strip with Back Button */}
      <GlobalNav />

      {/* 3. Main Workspace Shell */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar (Desktop / Tablet) */}
        <Sidebar />

        {/* Content Viewport with Breadcrumbs */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Breadcrumb Trail */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>

          {/* Page Outlet or Children */}
          {children || <Outlet />}
        </main>
      </div>

      {/* 4. AI Chat Assistant Widget */}
      <ChatWidget />
    </div>
  );
}
