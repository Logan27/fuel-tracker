import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Fuel, TrendingUp, Coins, BarChart3 } from 'lucide-react';
import { Footer } from '@/widgets/layout';
import { useAuthStore } from '@/app/stores';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Fuel className="w-6 h-6 text-primary-foreground" />
            </div>
            <span>Fuel Tracker</span>
          </div>
          <Button onClick={() => navigate("/auth")} className="gradient-hero">
            Get Started
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Track Your Fuel
          <br />
          <span className="text-primary">Save Money</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Monitor fuel consumption, analyze costs, and optimize your vehicle expenses
          with our powerful fuel tracking application
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/auth")} className="gradient-hero">
            Start Tracking Free
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need to Track Fuel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 rounded-lg bg-card shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Fuel className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Entry</h3>
            <p className="text-muted-foreground">
              Quickly log fuel fill-ups with all relevant details
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Consumption Stats</h3>
            <p className="text-muted-foreground">
              Track fuel efficiency and consumption patterns
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Cost Analysis</h3>
            <p className="text-muted-foreground">
              Monitor spending and cost per liter/kilometer
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Vehicle</h3>
            <p className="text-muted-foreground">
              Manage multiple vehicles in one place
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-card rounded-2xl shadow-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of drivers tracking their fuel consumption and saving money
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="gradient-hero">
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
