import Sidebar from "@/components/app/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#EFEFEF]">
      <div className="flex min-h-screen max-w-screen-xl mx-auto bg-white shadow-card rounded-xl overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-[#EFEFEF] p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
