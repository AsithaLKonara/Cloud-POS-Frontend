"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayoutClient({ children, session }: { children: React.ReactNode, session?: any }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dashboard-theme flex h-screen w-full bg-background overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:ml-[240px] h-screen overflow-hidden w-full transition-all bg-background text-foreground">
        
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} session={session} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
