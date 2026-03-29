import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  MessageSquare,
  DollarSign,
  CheckSquare,
  Settings,
  Zap,
  TrendingUp,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Clients", icon: Users, path: "/clients" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Approvals", icon: CheckSquare, path: "/approvals" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  { label: "Billing", icon: DollarSign, path: "/billing" },
  { label: "Value", icon: TrendingUp, path: "/value" },
];

const AppSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  const renderNav = (onNav?: () => void) => (
    <>
      {/* Logo */}
      <div className={`p-4 ${collapsed ? "px-3" : "p-6"} flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary flex-shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-heading text-lg font-bold text-foreground tracking-tight">
            ClientOS
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              {!collapsed && item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 space-y-1">
        <NavLink
          to="/settings"
          onClick={onNav}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-all"
        >
          <Settings className="w-4 h-4" />
          {!collapsed && "Settings"}
        </NavLink>
        <button
          onClick={() => signOut()}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            {renderNav(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen ${sidebarWidth} bg-sidebar border-r border-sidebar-border flex-col z-40 transition-all duration-300`}>
        {renderNav()}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-2 mb-3 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-sidebar-accent/50 transition"
        >
          {collapsed ? "→" : "← Collapse"}
        </button>
      </aside>
    </>
  );
};

export default AppSidebar;

export const useSidebarWidth = () => {
  // This is a simple approach — for collapsed state to propagate,
  // we'd need context. For now, default to full width.
  return "lg:ml-64";
};
