import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { visaApi } from '../services/api';
import ResultsDashboard from '../components/ResultsDashboard';

export default function EmbedPage() {
  const [searchParams] = useSearchParams();
  const apiKey = searchParams.get('apiKey');

  const [countries, setCountries] = useState([]);
  const [visasByCountry, setVisasByCountry] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '',
    visaTypeId: '',
  });
  
  const [uploadedFile, setUploadedFile] = useState(null);
  const [evaluationId, setEvaluationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Load countries and visa types
  useEffect(() => {
    Promise.all([visaApi.getCountries()])
      .then(async ([countriesRes]) => {
        setCountries(countriesRes.data || []);
        
        // Preload all visa types for each country
        const visasMap = {};
        for (const country of countriesRes.data || []) {
          try {
            const visasRes = await visaApi.getVisasByCountry(country.code);
            visasMap[country.code] = visasRes.data || [];
          } catch {
            visasMap[country.code] = [];
          }
        }
        setVisasByCountry(visasMap);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load visa data');
        setLoading(false);
      });
  }, []);

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    setFormData({
      ...formData,
      countryCode,
      visaTypeId: '', // Reset visa type when country changes
    });
  };

  const handleVisaChange = (e) => {
    setFormData({
      ...formData,
      visaTypeId: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name) {
      setError('Name is required');
      return;
    }
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    if (!formData.countryCode) {
      setError('Country is required');
      return;
    }
    if (!formData.visaTypeId) {
      setError('Visa type is required');
      return;
    }
    if (!uploadedFile) {
      setError('Please upload a resume');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create evaluation
      const evalRes = await visaApi.createEvaluation({
        name: formData.name,
        email: formData.email,
        countryCode: formData.countryCode,
        visaTypeId: formData.visaTypeId,
      });

      const id = evalRes.data.id;
      setEvaluationId(id);

      // Step 2: Upload document
      setUploading(true);
      try {
        await visaApi.uploadDocument(id, 'resume', uploadedFile);
      } catch (uploadErr) {
        console.error('Upload error:', uploadErr);
        // Continue even if upload has issues - evaluation still created
      }

      // Show results
      setShowResults(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="rounded-lg border border-red-200 bg-white p-6 max-w-md">
          <h1 className="text-lg font-bold text-red-900">Invalid Embed</h1>
          <p className="mt-2 text-sm text-red-700">Missing API key. Check your embed URL.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  const selectedCountry = countries.find(c => c.code === formData.countryCode);
  const selectedVisa = visasByCountry[formData.countryCode]?.find(
    v => v.id === formData.visaTypeId
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Get a Free AI Visa Evaluation</h1>
          <p className="mt-2 text-gray-600">Complete your visa eligibility assessment in minutes</p>
        </div>

        {showResults && evaluationId ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <ResultsDashboard evaluationId={evaluationId} />
            <button
              onClick={() => {
                setShowResults(false);
                setEvaluationId(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  countryCode: '',
                  visaTypeId: '',
                });
                setUploadedFile(null);
              }}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Start New Evaluation
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            {/* Error Display */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Section 1: Enter Your Information */}
            <div className="mb-8">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Enter Your Information</h2>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-xs text-gray-500">(optional)</span></label>
                  <input
                    type="tel"
                    placeholder="Enter phone number (optional)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Country *</label>
                  <select
                    required
                    value={formData.countryCode}
                    onChange={handleCountryChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visa Type */}
                {formData.countryCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Visa Type *</label>
                    <select
                      required
                      value={formData.visaTypeId}
                      onChange={handleVisaChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select a visa type</option>
                      {(visasByCountry[formData.countryCode] || []).map((visa) => (
                        <option key={visa.id} value={visa.id}>
                          {visa.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Upload Documents */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Upload Documents for Evaluation *</h2>
              <p className="mb-6 text-sm text-gray-600">Upload your resume to receive a tailored evaluation.</p>

              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => e.preventDefault()}
                onDrop={handleDragDrop}
                className="rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 p-8 text-center transition hover:border-purple-400"
              >
                <div className="mb-3 text-4xl">☁️</div>
                <p className="font-medium text-gray-900">Drag and drop files here or click to browse</p>
                <p className="mt-2 text-sm text-gray-500">Allowed formats: PDF, DOCX, DOC, JPEG, PNG</p>
                <p className="text-xs text-gray-500 mt-1">Maximum 5MB</p>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="mt-4 inline-block rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700 cursor-pointer"
                >
                  Choose File
                </label>
              </div>

              {/* Uploaded File Display */}
              {uploadedFile && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">✓ {uploadedFile.name}</p>
                      <p className="text-xs text-green-700">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting || uploading ? 'Processing...' : 'Get Your Evaluation'}
              </button>
            </div>

            {/* Footer Note */}
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>✓ Free evaluation • ✓ Instant results • ✓ No credit card required</p>
            </div>
          </form>
        )}

        {/* Powered By */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Powered by LegalBridge Visa Evaluation</p>
        </div>
      </div>
    </div>
  );
}
