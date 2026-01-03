import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { visaApi } from "../services/api";

function ResultsDashboard({ evaluationId }) {
  const [evaluation, setEvaluation] = useState(null);
  const [visaDetails, setVisaDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!evaluationId) return;

    visaApi
      .getEvaluation(evaluationId)
      .then((res) => {
        setEvaluation(res.data);
        // Fetch visa details for requirement breakdown
        return visaApi.getVisaDetails(res.data.visaTypeId);
      })
      .then((visaRes) => {
        setVisaDetails(visaRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!evaluation) {
    return <div className="text-center text-gray-500">No evaluation found</div>;
  }

  const safeCap = typeof evaluation.scoreCap === "number" && evaluation.scoreCap > 0 ? evaluation.scoreCap : 100;
  const scorePercentage = Math.min(100, (evaluation.score / safeCap) * 100);
  const scoreColor =
    evaluation.score >= 70
      ? "text-green-600"
      : evaluation.score >= 40
      ? "text-yellow-600"
      : "text-red-600";

  // Build requirement checklist
  const requiredDocs = visaDetails?.requiredDocuments || [];
  const uploadedDocTypes = new Set(
    (evaluation.documents || []).map((d) => d.documentType)
  );

  const requirements = requiredDocs.map((docType) => ({
    name: docType.replace(/_/g, " "),
    documentType: docType,
    status: uploadedDocTypes.has(docType) ? "pass" : "pending",
  }));

  return (
    <div className="space-y-6">
      {/* Header with Visa Type */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-bold text-gray-900">{visaDetails?.name || evaluation.visaTypeId}</h2>
        <p className="mt-2 text-gray-600">{visaDetails?.description || ""}</p>
      </div>

      {/* Score Display - Main Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Chance of Success */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 shadow-sm">
          <div className="text-center">
            <p className="mb-4 text-sm font-semibold text-gray-600">Chance of Success</p>
            <div className={`text-5xl font-bold ${scoreColor}`}>
              {scorePercentage.toFixed(0)}%
            </div>
            <p className="mt-2 text-xs text-gray-500">Based on document completeness</p>

            {/* Circular Progress */}
            <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full bg-gray-100">
              <div className="relative h-28 w-28">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={
                      scorePercentage >= 70
                        ? "#16a34a"
                        : scorePercentage >= 40
                        ? "#eab308"
                        : "#dc2626"
                    }
                    strokeWidth="4"
                    strokeDasharray={`${scorePercentage * 2.83} 283`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">
                    {scorePercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Overview</h3>
          <p className="leading-relaxed text-gray-700">{evaluation.summary}</p>
          <div className="mt-4 flex gap-2 pt-4">
            {evaluation.score >= 70 && (
              <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Strong Application
              </span>
            )}
            {evaluation.score >= 40 && evaluation.score < 70 && (
              <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                Needs Improvement
              </span>
            )}
            {evaluation.score < 40 && (
              <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Incomplete Application
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Criteria Analysis */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700">Expand All</button>
        </div>

        <div className="space-y-3">
          {requirements.map((req, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="flex-shrink-0">
                {req.status === "pass" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <span className="text-green-600">✓</span>
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <span className="text-red-600">✗</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 capitalize">{req.name}</p>
                <p className="text-xs text-gray-500">
                  {req.status === "pass"
                    ? "Document uploaded"
                    : "Please upload this document"}
                </p>
              </div>
              <div>
                {req.status === "pass" ? (
                  <span className="text-xs font-semibold text-green-600">UPLOADED</span>
                ) : (
                  <span className="text-xs font-semibold text-red-600">PENDING</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Progress:</strong> {uploadedDocTypes.size} of {requiredDocs.length} documents uploaded
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Recommendations for Improvement
          </h3>
          <ul className="space-y-3">
            {evaluation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                <span className="mt-1 flex-shrink-0 text-blue-600">→</span>
                <span className="text-sm text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conclusion */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm md:p-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Next Steps</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">If documents are pending:</p>
            <p className="mt-2 text-sm text-gray-600">
              Upload the missing documents to improve your evaluation score and chances of success.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">Once complete:</p>
            <p className="mt-2 text-sm text-gray-600">
              Review your complete application and consider consulting with an immigration specialist.
            </p>
          </div>
        </div>
      </div>

      {/* Applicant Info Footer */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Applicant Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Full Name</p>
            <p className="mt-1 text-gray-900">{evaluation.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Email Address</p>
            <p className="mt-1 text-gray-900">{evaluation.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Visa Program</p>
            <p className="mt-1 text-gray-900">{evaluation.visaTypeId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Evaluation ID</p>
            <p className="mt-1 font-mono text-xs text-gray-600">{evaluation.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

ResultsDashboard.propTypes = {
  evaluationId: PropTypes.string.isRequired,
};

export default ResultsDashboard;
