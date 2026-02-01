'use client';

/**
 * Utility Benchmarks Page
 *
 * EXAMPLE: This page demonstrates how to protect sensitive content.
 * The utility scoring data is gated behind registration.
 */

import ProtectedContent from '@/components/ProtectedContent';
import { useAuth } from '@/hooks/useAuth';
import { UTILITY_PROFILES, type UtilityProfile } from '@/lib/utilityData';

// ============================================
// PREVIEW COMPONENT (shown blurred to unregistered users)
// ============================================

function BenchmarksPreview() {
  // Show a teaser of what the data looks like
  const previewUtilities = Object.values(UTILITY_PROFILES).slice(0, 5);

  return (
    <div className="p-6">
      <div className="grid gap-4">
        {previewUtilities.map((utility, idx) => (
          <div key={idx} className="bg-white rounded-lg border p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-900">Sample Utility {idx + 1}</div>
              <div className="text-sm text-gray-500">State • Region</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">XX</div>
              <div className="text-xs text-gray-500">Readiness Score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ACTUAL BENCHMARKS (shown to registered users)
// ============================================

function UtilityBenchmarks() {
  const { user } = useAuth();
  const utilities = Object.values(UTILITY_PROFILES);

  // Sort by system peak MW (largest utilities first)
  const sortedUtilities = [...utilities].sort((a, b) =>
    (b.systemPeakMW || 0) - (a.systemPeakMW || 0)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Utility Benchmarks</h1>
        <p className="text-gray-600">
          Compare utility readiness for large load integration across {utilities.length} utilities.
        </p>
        {user && (
          <p className="text-sm text-gray-500 mt-2">
            Logged in as {user.name} ({user.organization})
          </p>
        )}
      </div>

      {/* Methodology note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <h3 className="font-semibold text-amber-900 mb-2">Important Context</h3>
        <p className="text-sm text-amber-800">
          These scores reflect utility readiness based on publicly available tariff data,
          market structure, and regulatory environment. Higher scores indicate better
          infrastructure for integrating large loads without adverse ratepayer impacts.
          Scores should be interpreted with appropriate expertise and are not rankings
          of utility "quality."
        </p>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Utility</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">State</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Market</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">System Peak (MW)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Residential Customers</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">DC Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedUtilities.map((utility, idx) => (
                <tr key={utility.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{utility.name}</div>
                    <div className="text-xs text-gray-500">{utility.id}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{utility.state}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      utility.market?.type === 'regulated'
                        ? 'bg-purple-100 text-purple-700'
                        : utility.market?.type === 'ercot'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {utility.market?.type || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {utility.systemPeakMW?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {utility.residentialCustomers?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                      utility.hasDataCenterActivity
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {utility.hasDataCenterActivity ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export options (for registered users) */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => {
            // TODO: Implement CSV export
            alert('CSV export coming soon');
          }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Export CSV
        </button>
        <button
          onClick={() => {
            // TODO: Implement methodology link
            window.location.href = '/methodology';
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View Full Methodology
        </button>
      </div>
    </div>
  );
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function BenchmarksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedContent
        title="Utility Benchmarks"
        description="Access detailed utility readiness scores and comparative analysis across 88+ utilities."
        preview={<BenchmarksPreview />}
        registrationReason="Utility benchmarks require expert interpretation. By registering, you help us ensure this data is used responsibly and allow us to provide appropriate context for your use case."
      >
        <UtilityBenchmarks />
      </ProtectedContent>
    </div>
  );
}
