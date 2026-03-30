import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-64 p-4 pt-16 lg:pt-8 lg:p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
