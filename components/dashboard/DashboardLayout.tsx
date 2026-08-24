"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  pageTitle: string;
  userEmail: string | null;
  children: ReactNode;
  isAdmin?: boolean;
}

/**
 * Authenticated dashboard shell: persistent sidebar on desktop, off-canvas
 * sidebar on mobile (toggled from the header), and a scrollable content
 * area. `children` can be server-rendered content — only the open/close
 * state needs to live on the client.
 */
export function DashboardLayout({ pageTitle, userEmail, children, isAdmin = false }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          pageTitle={pageTitle}
          userEmail={userEmail}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
