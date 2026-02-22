import Sidebar from "@/components/app/Sidebar";
import ErrorBoundary from "@/components/app/ErrorBoundary";

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
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
