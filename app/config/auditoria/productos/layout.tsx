// app/dashboard/layout.tsx

import Sidebar from "@/app/components/dashboard/Sidebar";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 transition-all duration-300 p-8">
        {children}
      </main>
    </div>
  );
}