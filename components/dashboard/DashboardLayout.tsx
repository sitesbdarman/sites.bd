"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { DeveloperCredit } from "@/components/DeveloperCredit";

interface DashboardLayoutProps {
  pageTitle: string;
  userEmail: string | null;
  avatarUrl?: string | null;
  fullName?: string | null;
  children: ReactNode;
}

export function DashboardLayout({
  pageTitle,
  userEmail,
  avatarUrl,
  fullName,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          pageTitle={pageTitle}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          fullName={fullName}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <DeveloperCredit />
    </div>
  );
}
