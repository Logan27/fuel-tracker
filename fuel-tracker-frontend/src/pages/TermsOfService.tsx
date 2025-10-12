import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Fuel } from 'lucide-react';
import { Footer } from '@/widgets/layout';

const TermsOfService = () => {
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

          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using Fuel Tracker, you accept and agree to be bound by
                the terms and provisions of this agreement. If you do not agree to these
                terms, please do not use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                Fuel Tracker provides a web application for tracking fuel consumption,
                vehicle maintenance, and related statistics. The service is provided "as
                is" and we reserve the right to modify or discontinue the service at any
                time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  You must provide accurate and complete information when creating an
                  account
                </li>
                <li>
                  You are responsible for maintaining the security of your account
                  credentials
                </li>
                <li>
                  You must not share your account with others or use another user's
                  account
                </li>
                <li>
                  You must notify us immediately of any unauthorized use of your account
                </li>
                <li>
                  You are responsible for all activities that occur under your account
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>
                  Attempt to gain unauthorized access to our systems or other users'
                  accounts
                </li>
                <li>
                  Upload or transmit viruses, malware, or other malicious code
                </li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>
                  Scrape, spider, or use automated means to access the service
                </li>
                <li>Impersonate another person or entity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Ownership</h2>
              <p className="text-muted-foreground mb-4">
                You retain ownership of all data you input into Fuel Tracker. We do not
                claim ownership of your fuel records, vehicle information, or any other
                data you provide. You can export or delete your data at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                The Fuel Tracker application, including its design, features, and
                functionality, is owned by us and protected by copyright, trademark, and
                other intellectual property laws. You may not copy, modify, or distribute
                our application without permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                7. Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground mb-4">
                The service is provided "as is" without warranties of any kind, either
                express or implied. We do not guarantee that the service will be
                uninterrupted, error-free, or free of viruses or other harmful components.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-muted-foreground mb-4">
                We shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages resulting from your use of or inability
                to use the service. This includes loss of data, profits, or other
                intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Account Termination</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to suspend or terminate your account if you violate
                these terms. You may also delete your account at any time from the
                Settings page. Upon termination, all your data will be permanently
                deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these terms at any time. We will notify
                users of any material changes. Continued use of the service after changes
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These terms shall be governed by and construed in accordance with
                applicable laws. Any disputes shall be resolved in the appropriate courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us
                at: support@fueltracker.app
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;

