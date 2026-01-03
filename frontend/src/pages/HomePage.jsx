import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Top Bar */}
        <div className="mb-12 flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-gray-900">
            Visa Evaluation Tool
          </div>
          <Link
            to="/evaluate"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Multi-Country{' '}
            <span className="text-blue-700">Visa Evaluation</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 md:text-xl">
            Upload required documents and receive an instant score with clear recommendations.
          </p>

          <Link
            to="/evaluate"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Evaluation
            <span>→</span>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">🌍</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Multiple Countries</h3>
            <p className="text-sm text-gray-600">
              Evaluate visas for the U.S., Ireland, Poland, France, Netherlands, Germany, and more.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">📄</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Document Upload</h3>
            <p className="text-sm text-gray-600">
              Upload required documents and get real-time scoring based on completeness.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">📊</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Instant Results</h3>
            <p className="text-sm text-gray-600">
              Receive a detailed evaluation score with personalized recommendations.
            </p>
          </div>
        </div>

        {/* Supported Countries */}
        <div className="mt-16 md:mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Supported Countries</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['🇺🇸 United States', '🇮🇪 Ireland', '🇵🇱 Poland', '🇫🇷 France', '🇳🇱 Netherlands', '🇩🇪 Germany'].map(
              (country) => (
                <div
                  key={country}
                  className="rounded-full border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700"
                >
                  {country}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
