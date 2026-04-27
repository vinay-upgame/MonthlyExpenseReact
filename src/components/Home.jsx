import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">E</div>
          <span className="text-lg font-semibold text-gray-900">Expense Tracker 365</span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <a href="#features" className="text-gray-700 hover:text-gray-900">Features</a>
          <a href="#data" className="text-gray-700 hover:text-gray-900">Data &amp; Privacy</a>
          <Link to="/monthly-balance" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Open App
          </Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-10 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
          Track your monthly expenses,<br className="hidden sm:block" />
          stored in <span className="text-blue-600">your own</span> Google Drive.
        </h1>
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
          Expense Tracker 365 is a simple, private personal finance app. Record daily
          expenses, weekly payments, and monthly balances — your data lives in a
          Google Sheet you own, not on our servers.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/monthly-balance"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Sign in with Google
          </Link>
          <a
            href="#features"
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-800 font-medium hover:bg-gray-50"
          >
            Learn more
          </a>
        </div>
      </section>

      <section id="features" className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center">What it does</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Daily Expenses',
              body: 'Log day-to-day spending with categories, notes, and amounts.',
            },
            {
              title: 'Weekly Payments',
              body: 'Track recurring weekly outflows like rent, EMIs, or subscriptions.',
            },
            {
              title: 'Monthly Balance',
              body: 'See income vs. spending at a glance and your remaining budget.',
            },
            {
              title: 'Monthly Reports',
              body: 'Generate clean, readable summaries of each month for review.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="data" className="max-w-5xl mx-auto px-6 py-14">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900">Why we ask for Google access</h2>
          <p className="mt-3 text-gray-700 leading-relaxed">
            Expense Tracker 365 uses your Google account so you own and control your
            data. We request the following scopes — and only use them for the purposes
            below:
          </p>
          <ul className="mt-5 space-y-3 text-gray-700">
            <li>
              <strong>Google Sign-In (basic profile):</strong> to identify you and
              keep you signed in to your own account.
            </li>
            <li>
              <strong>Google Drive (app-created files):</strong> to create and access
              a single spreadsheet inside <em>your</em> Drive that the app uses to
              store your expenses.
            </li>
            <li>
              <strong>Google Sheets (read/write):</strong> to read and update the rows
              in that spreadsheet as you add expenses, payments, and balances.
            </li>
          </ul>
          <p className="mt-5 text-gray-700 leading-relaxed">
            We do not run a server that stores your financial data, and we do not
            share, sell, or transmit your data to any third party. Our use of
            information received from Google APIs adheres to the{' '}
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
          <p className="mt-5 text-gray-700">
            Read the full{' '}
            <Link to="/privacy-policy" className="text-blue-600 underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/terms-of-service" className="text-blue-600 underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </section>

      <footer className="border-t border-gray-200 mt-10">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div>© {new Date().getFullYear()} Expense Tracker 365</div>
          <div className="flex items-center gap-5">
            <Link to="/privacy-policy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-gray-900">Terms of Service</Link>
            <a href="mailto:vinay@upgame.co" className="hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
