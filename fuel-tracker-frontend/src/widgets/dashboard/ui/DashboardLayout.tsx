import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/features/auth';
import { useAuthStore } from '@/app/stores';
import { ROUTES } from '@/shared/lib/constants';
import { Footer } from '@/widgets/layout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
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
  LogOut,
} from 'lucide-react';

const sidebarItems = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: ROUTES.ENTRIES,
    label: 'Fuel Entries',
    icon: List,
  },
  {
    path: ROUTES.VEHICLES,
    label: 'Vehicles',
    icon: Car,
  },
  {
    path: ROUTES.STATISTICS,
    label: 'Statistics',
    icon: BarChart3,
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { signOut, isSigningOut } = useAuth();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.display_name) {
      const names = user.display_name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return user.display_name.substring(0, 2).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };
  
  const getUserDisplayName = () => {
    return user?.display_name || user?.email || 'User';
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Desktop header - horizontal navigation */}
      <header className="hidden lg:block bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to={ROUTES.DASHBOARD}
              className="flex items-center gap-2 font-bold text-xl"
              aria-label="Fuel Tracker Home"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Fuel className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>Fuel Tracker</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-1">
              {sidebarItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-2 flex-shrink-0 h-4 w-4',
                      isActive(item.path) ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.location.href = '/entries/new'}
                className="gradient-hero"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.SETTINGS} className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="lg:hidden bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <Link
                to={ROUTES.DASHBOARD}
                className="flex items-center gap-2 font-bold text-xl"
                aria-label="Fuel Tracker Home"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-primary-foreground" />
                </div>
                <span>Fuel Tracker</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.location.href = '/entries/new'}
                className="gradient-hero"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Add Entry</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/50"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile sidebar - left side */}
        {mobileMenuOpen && (
          <aside className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-card border-r shadow-lg">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Link
                  to={ROUTES.DASHBOARD}
                  className="flex items-center gap-2 font-bold text-xl"
                  onClick={closeMobileMenu}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Fuel className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span>Fuel Tracker</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMobileMenu}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={cn(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5',
                        isActive(item.path) ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}
                    />
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* User Profile */}
              <div className="border-t border-border p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium mr-3">
                          {getUserInitials()}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">{getUserDisplayName()}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.SETTINGS} className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {isSigningOut ? 'Signing out...' : 'Sign out'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-1 p-6">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};