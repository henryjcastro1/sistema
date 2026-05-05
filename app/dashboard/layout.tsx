// app/dashboard/layout.tsx
"use client";

import Sidebar from "../components/dashboard/Sidebar";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize); 
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* Contenido principal con margen izquierdo igual al ancho del sidebar (w-64 = 256px) */}
      <main className={`flex-1 transition-all duration-300 ${!isMobile ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}