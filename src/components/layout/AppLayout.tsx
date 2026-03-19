import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { BottomNav } from "./BottomNav";
import { Skeleton } from "@/components/ui/skeleton";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DesktopSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-20 md:pb-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
