import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./button";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { Badge } from "./badge";
import { useResponsive } from "../hooks/useResponsive";
import { cn } from "@/shared/lib/utils";
import {
  Fuel,
  LayoutDashboard,
  List,
  Car,
  Settings,
  BarChart3,
  Menu,
  X,
  Plus,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  onClick?: () => void;
}

interface MobileNavigationProps {
  navItems: NavItem[];
  user?: {
    email: string;
    name?: string;
  };
  onSignOut?: () => void;
  onAddEntry?: () => void;
  onAddVehicle?: () => void;
  className?: string;
}

export const MobileNavigation = React.forwardRef<HTMLDivElement, MobileNavigationProps>(
  ({
    navItems,
    user,
    onSignOut,
    onAddEntry,
    onAddVehicle,
    className,
    ...props
  }, ref) => {
    const location = useLocation();
    const { isMobile } = useResponsive();
    const [isOpen, setIsOpen] = React.useState(false);

    const isActive = (path: string) => location.pathname === path;

    const handleItemClick = (item: NavItem) => {
      if (item.onClick) {
        item.onClick();
      }
      setIsOpen(false);
    };

    const getUserInitials = () => {
      if (!user?.email) return 'U';
      return user.email.charAt(0).toUpperCase();
    };

    if (!isMobile) return null;

    return (
      <div ref={ref} className={cn("lg:hidden", className)} {...props}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 font-bold text-xl"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Fuel className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span>Fuel Tracker</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAddEntry?.();
                      setIsOpen(false);
                    }}
                    className="justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAddVehicle?.();
                      setIsOpen(false);
                    }}
                    className="justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>

              {/* User Section */}
              {user && (
                <div className="p-4 border-t">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Link
                      to="/settings"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onSignOut?.();
                        setIsOpen(false);
                      }}
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }
);
MobileNavigation.displayName = "MobileNavigation";

// Bottom navigation for mobile
export const BottomNavigation = ({ navItems }: { navItems: NavItem[] }) => {
  const location = useLocation();
  const { isMobile } = useResponsive();

  const isActive = (path: string) => location.pathname === path;

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t lg:hidden z-50">
      <nav className="flex items-center justify-around py-2">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-colors",
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
};
