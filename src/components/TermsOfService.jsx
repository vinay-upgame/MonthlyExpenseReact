import { Link } from 'react-router-dom';

function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 24, 2026</p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            These Terms of Service ("Terms") govern your access to and use of
            Expense Tracker 365 (the "app"), available at{' '}
            <a className="text-blue-600 underline" href="https://expensetracker365.in">
              https://expensetracker365.in
            </a>
            . By using the app, you agree to these Terms. If you do not agree, do
            not use the app.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. The Service</h2>
            <p>
              Expense Tracker 365 is a personal finance tool that helps you record
              expenses, weekly payments, and monthly balances. Your data is stored
              in a Google Sheet inside your own Google Drive account; the app does
              not run a server that stores your financial data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Eligibility &amp; Account</h2>
            <p>
              You must be at least 13 years old and have a Google account to use
              the app. You are responsible for activity that occurs through your
              Google account while signed in to the app.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the app for any unlawful purpose or in violation of any applicable law.</li>
              <li>Attempt to interfere with, disrupt, or compromise the integrity or security of the app.</li>
              <li>Reverse engineer, decompile, or attempt to extract source code except as permitted by law.</li>
              <li>Use the app to store, process, or transmit data you do not have the right to handle.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Your Data</h2>
            <p>
              You retain all rights to your data. The app accesses your Google
              Drive and Google Sheets only to provide its features, as described
              in our{' '}
              <Link to="/privacy-policy" className="text-blue-600 underline">
                Privacy Policy
              </Link>
              . You are responsible for backing up your spreadsheet if you wish
              to retain a copy independent of Google Drive.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Third-Party Services</h2>
            <p>
              The app relies on Google Sign-In, Google Drive, and Google Sheets.
              Your use of those services is governed by Google's own terms and
              policies. We are not responsible for outages, data loss, or changes
              caused by third-party services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. No Financial Advice</h2>
            <p>
              The app is provided for personal record-keeping only. It does not
              provide financial, tax, investment, or legal advice. You are solely
              responsible for any decisions made based on the information you
              record in the app.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Availability &amp; Changes</h2>
            <p>
              The app is provided on an "as is" and "as available" basis. We may
              modify, suspend, or discontinue any part of the app at any time
              without prior notice.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Disclaimer of Warranties</h2>
            <p>
              To the maximum extent permitted by law, the app is provided without
              warranties of any kind, whether express or implied, including
              warranties of merchantability, fitness for a particular purpose,
              and non-infringement.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, in no event shall the app's
              operators be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of data, profits,
              or revenue arising out of your use of the app.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Termination</h2>
            <p>
              You may stop using the app at any time and revoke its access via{' '}
              <a
                className="text-blue-600 underline"
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Account permissions
              </a>
              . We may suspend or terminate access to the app for any user who
              violates these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">11. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. The "Last updated"
              date at the top will reflect any changes. Continued use of the app
              after changes constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">12. Contact</h2>
            <p>
              For questions about these Terms, contact{' '}
              <a className="text-blue-600 underline" href="mailto:vinay@upgame.co">
                vinay@upgame.co
              </a>
              .
            </p>
          </div>
        </section>

        <div className="mt-10">
          <Link to="/" className="text-blue-600 underline">← Back to app</Link>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
