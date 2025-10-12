import { ReactNode } from 'react';
import { Navigation } from '@/widgets/navigation';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-secondary/30">
      <Navigation />
      <main>{children}</main>
    </div>
  );
};

