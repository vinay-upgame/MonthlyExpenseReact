import { Link } from 'react-router-dom';

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 24, 2026</p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Expense Tracker 365 ("we", "our", or "the app") is a personal expense
            tracking application available at{' '}
            <a className="text-blue-600 underline" href="https://expensetracker365.in">
              https://expensetracker365.in
            </a>
            . This Privacy Policy explains what information we access, how we use it,
            and the choices you have.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Information We Access</h2>
            <p>
              The app uses Google Sign-In to authenticate you and requests access to
              Google Drive and Google Sheets in order to store your expense data in a
              spreadsheet inside <em>your own</em> Google Drive. We access:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your basic Google profile (name, email) for sign-in.</li>
              <li>A single spreadsheet file in your Google Drive that the app creates and manages.</li>
              <li>Read/write access to that spreadsheet's contents (your expenses, payments, balances).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <p>
              Your data is used solely to provide the app's functionality: recording
              expenses, weekly payments, monthly balances, and generating reports.
              We do not analyse, sell, share, or transmit your data to any third party.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Where Your Data Lives</h2>
            <p>
              All your financial data is stored in a Google Sheet inside your own
              Google Drive account. The app also caches data locally in your browser
              (via IndexedDB and localStorage) so it can work offline. We do not
              operate any server that stores your data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Google API Services User Data Policy</h2>
            <p>
              Expense Tracker 365's use and transfer of information received from
              Google APIs adheres to the{' '}
              <a
                className="text-blue-600 underline"
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Revoking Access</h2>
            <p>
              You can revoke the app's access to your Google account at any time via{' '}
              <a
                className="text-blue-600 underline"
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Account permissions
              </a>
              . You can also delete the app's spreadsheet from your Google Drive at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Cookies and Tracking</h2>
            <p>
              The app does not use advertising cookies or third-party analytics
              trackers. Authentication tokens issued by Google are stored in your
              browser to keep you signed in.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Children's Privacy</h2>
            <p>
              The app is not directed to children under 13 and we do not knowingly
              collect data from them.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. The "Last updated"
              date at the top will reflect any changes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Contact</h2>
            <p>
              For any questions about this policy, contact{' '}
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

export default PrivacyPolicy;
