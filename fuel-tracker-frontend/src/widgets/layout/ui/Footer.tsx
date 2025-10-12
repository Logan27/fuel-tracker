import { Link } from 'react-router-dom';
import { Fuel } from 'lucide-react';
import { ROUTES } from '@/shared/lib/constants';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Fuel className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Fuel Tracker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Track your fuel consumption and expenses with ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to={ROUTES.DASHBOARD}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.ENTRIES}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Fuel Entries
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.VEHICLES}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Vehicles
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.STATISTICS}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Statistics
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to={ROUTES.PRIVACY}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.TERMS}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Fuel Tracker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

