import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Fuel } from 'lucide-react';
import { Footer } from '@/widgets/layout';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Fuel className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>Fuel Tracker</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to Fuel Tracker. We respect your privacy and are committed to
                protecting your personal data. This privacy policy will inform you about
                how we look after your personal data and tell you about your privacy
                rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We may collect, use, store and transfer different kinds of personal data
                about you:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Account Data:</strong> email address, username, password
                </li>
                <li>
                  <strong>Vehicle Data:</strong> Vehicle information (make, model, year,
                  fuel type)
                </li>
                <li>
                  <strong>Fuel Entry Data:</strong> Fuel consumption records, costs,
                  odometer readings
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you use our
                  application
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, browser type, device
                  information
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
              <p className="text-muted-foreground mb-4">
                We use your personal data for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>To provide and maintain our service</li>
                <li>To calculate fuel consumption statistics and analytics</li>
                <li>To send you updates and notifications</li>
                <li>To improve our application and user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We have implemented appropriate security measures to prevent your personal
                data from being accidentally lost, used, or accessed in an unauthorized
                way. We use HTTPS encryption and secure authentication mechanisms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights (GDPR)</h2>
              <p className="text-muted-foreground mb-4">
                Under GDPR, you have the following rights:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Right to Access:</strong> You can request a copy of your
                  personal data
                </li>
                <li>
                  <strong>Right to Rectification:</strong> You can request correction of
                  inaccurate data
                </li>
                <li>
                  <strong>Right to Erasure:</strong> You can request deletion of your
                  data
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> You can export your data
                </li>
                <li>
                  <strong>Right to Object:</strong> You can object to processing of your
                  data
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We will retain your personal data only for as long as necessary to fulfill
                the purposes outlined in this privacy policy. You can delete your account
                and all associated data at any time from the Settings page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use session cookies to maintain your login state and CSRF tokens for
                security. These cookies are essential for the application to function
                properly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this privacy policy or our privacy
                practices, please contact us at: privacy@fueltracker.app
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

