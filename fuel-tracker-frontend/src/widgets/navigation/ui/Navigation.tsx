import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet';
import {
  Fuel,
  LayoutDashboard,
  List,
  Car,
  Settings,
  LogOut,
  BarChart3,
  Menu,
  User,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useAuthStore } from '@/app/stores';
import { ROUTES } from '@/shared/lib/constants';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

const navItems = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: ROUTES.ENTRIES,
    label: 'Entries',
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

export const Navigation = () => {
  const location = useLocation();
  const { signOut, isSigningOut } = useAuth();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-card border-b shadow-sm sticky top-0 z-40" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={ROUTES.DASHBOARD}
            className="flex items-center gap-2 font-bold text-xl"
            aria-label="Fuel Tracker Home"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <Fuel className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline">Fuel Tracker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to={item.path} className="gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </Button>
            ))}

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 ml-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm">
                    {user?.email || 'User'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={ROUTES.SETTINGS} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col gap-4 mt-8">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">
                      {user?.username || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Mobile Menu Items */}
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? 'secondary' : 'ghost'}
                      className="justify-start gap-3"
                      asChild
                      onClick={closeMobileMenu}
                    >
                      <Link to={item.path}>
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </Button>
                  ))}

                  <Button
                    variant={isActive(ROUTES.SETTINGS) ? 'secondary' : 'ghost'}
                    className="justify-start gap-3"
                    asChild
                    onClick={closeMobileMenu}
                  >
                    <Link to={ROUTES.SETTINGS}>
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start gap-3 text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <LogOut className="w-4 h-4" />
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

