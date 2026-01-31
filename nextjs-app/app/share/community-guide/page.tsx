'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';

export default function CommunityGuidePage() {
  const siteUrl = 'https://power-insight.org';

  // Auto-trigger print dialog when page loads (optional)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('print') === 'true') {
      setTimeout(() => window.print(), 500);
    }
  }, []);

  return (
    <>
      {/* Print-optimized styles for exact 1-page output */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0;
          }

          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Hide site navigation and footer */
          nav, footer, header {
            display: none !important;
          }

          /* Main wrapper shouldn't have min-height */
          main {
            min-height: auto !important;
          }

          /* Ensure our content displays */
          .screen-wrapper {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            min-height: auto !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            display: flex !important;
            width: 8.5in !important;
            height: 11in !important;
            padding: 0.4in 0.5in !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            flex-direction: column !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            background: white !important;
            box-shadow: none !important;
          }

          /* Header */
          .print-header {
            padding-bottom: 0.12in !important;
            border-bottom: 3px solid #d97706 !important;
            margin-bottom: 0.15in !important;
          }

          .print-brand {
            font-size: 11pt !important;
            color: #475569 !important;
          }

          .print-title {
            font-size: 20pt !important;
            line-height: 1.15 !important;
            margin: 0.05in 0 !important;
            color: #1e293b !important;
          }

          .print-subtitle {
            font-size: 10pt !important;
            margin: 0 !important;
            color: #64748b !important;
          }

          /* Stats Banner */
          .print-stats-banner {
            display: flex !important;
            gap: 0.15in !important;
            margin-bottom: 0.15in !important;
            padding: 0.12in !important;
            background: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 6px !important;
          }

          .print-stat {
            flex: 1 !important;
            text-align: center !important;
          }

          .print-stat-number {
            font-size: 16pt !important;
            font-weight: 700 !important;
            color: #b45309 !important;
            line-height: 1.1 !important;
            margin-bottom: 2pt !important;
          }

          .print-stat-label {
            font-size: 7.5pt !important;
            color: #475569 !important;
            line-height: 1.2 !important;
          }

          /* FAQ Grid */
          .print-faq-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.12in !important;
            margin-bottom: 0.15in !important;
          }

          .print-faq-card {
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 0.1in !important;
            background: #f8fafc !important;
          }

          .print-faq-q {
            font-size: 10pt !important;
            font-weight: 700 !important;
            margin: 0 0 3pt 0 !important;
            color: #1e293b !important;
          }

          .print-faq-a {
            font-size: 9pt !important;
            font-weight: 600 !important;
            margin: 0 0 3pt 0 !important;
            color: #b45309 !important;
          }

          .print-faq-detail {
            font-size: 8pt !important;
            line-height: 1.25 !important;
            margin: 0 !important;
            color: #475569 !important;
          }

          /* Checklist */
          .print-checklist {
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 0.12in !important;
            background: #f1f5f9 !important;
            margin-bottom: 0.12in !important;
          }

          .print-checklist-title {
            font-size: 12pt !important;
            font-weight: 700 !important;
            text-align: center !important;
            margin: 0 0 0.08in 0 !important;
            color: #1e293b !important;
          }

          .print-checklist-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 0.15in !important;
          }

          .print-checklist-category {
            font-size: 9pt !important;
            font-weight: 700 !important;
            margin: 0 0 4pt 0 !important;
          }

          .print-checklist-item {
            font-size: 8pt !important;
            line-height: 1.3 !important;
            display: flex !important;
            align-items: flex-start !important;
            gap: 4pt !important;
            margin-bottom: 4pt !important;
            color: #334155 !important;
          }

          .print-checkbox {
            width: 9pt !important;
            height: 9pt !important;
            border: 1.5px solid #64748b !important;
            border-radius: 2px !important;
            flex-shrink: 0 !important;
            margin-top: 1pt !important;
          }

          /* Why This Matters */
          .print-why-section {
            border: 2px solid #d97706 !important;
            border-radius: 6px !important;
            padding: 0.12in !important;
            background: #fffbeb !important;
            flex: 1 !important;
          }

          .print-why-title {
            font-size: 12pt !important;
            font-weight: 700 !important;
            text-align: center !important;
            margin: 0 0 0.06in 0 !important;
            color: #78350f !important;
          }

          .print-why-quote {
            font-size: 9pt !important;
            font-style: italic !important;
            text-align: center !important;
            color: #78350f !important;
            margin: 0 0 0.08in 0 !important;
            padding: 0 0.2in !important;
            line-height: 1.3 !important;
          }

          .print-why-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 0.1in !important;
          }

          .print-why-item {
            font-size: 8pt !important;
            line-height: 1.25 !important;
            display: flex !important;
            align-items: flex-start !important;
            gap: 4pt !important;
            color: #334155 !important;
          }

          .print-why-check {
            color: #d97706 !important;
            font-size: 11pt !important;
            font-weight: bold !important;
            flex-shrink: 0 !important;
            line-height: 1 !important;
          }

          /* Footer */
          .print-footer {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
            padding-top: 0.1in !important;
            border-top: 2px solid #e2e8f0 !important;
            margin-top: 0.1in !important;
          }

          .print-footer-text {
            font-size: 8pt !important;
            color: #64748b !important;
            margin: 0 !important;
          }

          .print-footer-url {
            font-size: 11pt !important;
            font-weight: 700 !important;
            color: #1e293b !important;
            margin: 0 !important;
          }

          .print-qr {
            width: 0.7in !important;
            height: 0.7in !important;
          }

          .print-qr svg {
            width: 100% !important;
            height: 100% !important;
          }
        }

        /* Screen styles */
        .print-page {
          max-width: 8.5in;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        @media screen {
          .screen-wrapper {
            min-height: 100vh;
            background: #f1f5f9;
            padding: 1rem;
          }
        }
      `}</style>

      {/* Screen wrapper with controls */}
      <div className="screen-wrapper">
        {/* Web controls - hidden on print */}
        <div className="no-print max-w-[8.5in] mx-auto mb-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Back to Power Insight
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as PDF
          </button>
        </div>

        {/* Printable page - exactly 8.5 x 11 inches */}
        <div className="print-page bg-white p-6 md:p-8">
          {/* Header */}
          <div className="print-header pb-3 border-b-[3px] border-amber-600 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="print-brand text-sm font-bold text-slate-500 uppercase tracking-wide">POWER INSIGHT</span>
              <span className="text-sm text-slate-400">power-insight.org</span>
            </div>
            <h1 className="print-title text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
              What Communities Are Asking About Data Centers
            </h1>
            <p className="print-subtitle text-base text-slate-500 mt-1">
              Evidence-based answers to common questions
            </p>
          </div>

          {/* Stats Banner */}
          <div className="print-stats-banner flex gap-4 mb-4 p-4 bg-slate-100 border border-slate-300 rounded-lg">
            <div className="print-stat flex-1 text-center">
              <div className="print-stat-number text-2xl font-bold text-amber-700">4% → 9%</div>
              <div className="print-stat-label text-xs text-slate-600">Share of U.S. electricity demand from data centers by 2030</div>
            </div>
            <div className="print-stat flex-1 text-center border-l border-slate-300 pl-4">
              <div className="print-stat-number text-2xl font-bold text-amber-700">~50-60 GW+</div>
              <div className="print-stat-label text-xs text-slate-600">New data center capacity expected by 2030</div>
            </div>
            <div className="print-stat flex-1 text-center border-l border-slate-300 pl-4">
              <div className="print-stat-number text-2xl font-bold text-amber-700">~1-5%+</div>
              <div className="print-stat-label text-xs text-slate-600">Potential bill reduction with responsible development</div>
            </div>
          </div>

          {/* FAQ Cards - 2x2 Grid */}
          <div className="print-faq-grid grid grid-cols-2 gap-3 mb-4">
            {/* Question 1 */}
            <div className="print-faq-card rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="print-faq-q text-sm font-bold text-slate-800 mb-1">
                &quot;Will my electric bill go up?&quot;
              </p>
              <p className="print-faq-a text-sm font-semibold text-amber-700 mb-1">
                With the right policy, data centers apply downward pressure on rates.
              </p>
              <p className="print-faq-detail text-sm text-slate-500 leading-snug">
                Large customers bring new revenue that helps cover shared infrastructure costs. Research shows data centers can lower nearby bills by 1-5%.
              </p>
            </div>

            {/* Question 2 */}
            <div className="print-faq-card rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="print-faq-q text-sm font-bold text-slate-800 mb-1">
                &quot;Who pays for all the new infrastructure?&quot;
              </p>
              <p className="print-faq-a text-sm font-semibold text-amber-700 mb-1">
                Industrial tariffs ensure data centers pay their full cost of service.
              </p>
              <p className="print-faq-detail text-sm text-slate-500 leading-snug">
                Utilities are creating dedicated rate classes with demand charges that recover transmission and distribution costs directly from large loads.
              </p>
            </div>

            {/* Question 3 */}
            <div className="print-faq-card rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="print-faq-q text-sm font-bold text-slate-800 mb-1">
                &quot;What happens if the data center leaves?&quot;
              </p>
              <p className="print-faq-a text-sm font-semibold text-amber-700 mb-1">
                Tariff structures include minimum contract terms for full cost recovery.
              </p>
              <p className="print-faq-detail text-sm text-slate-500 leading-snug">
                Policies like AEP Ohio&apos;s 12-year minimum demand requirements and exit fees protect ratepayers from stranded asset risk.
              </p>
            </div>

            {/* Question 4 */}
            <div className="print-faq-card rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="print-faq-q text-sm font-bold text-slate-800 mb-1">
                &quot;Will I have power outages?&quot;
              </p>
              <p className="print-faq-a text-sm font-semibold text-amber-700 mb-1">
                Modern data centers actually help stabilize the grid.
              </p>
              <p className="print-faq-detail text-sm text-slate-500 leading-snug">
                Data centers can reduce operations and activate on-site generators during peak demand. Many include battery storage for grid backup.
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="print-checklist rounded-lg bg-slate-100 p-4 border border-slate-200 mb-3">
            <h2 className="print-checklist-title text-lg font-bold text-slate-800 text-center mb-3">
              Questions to Ask About Any Proposal
            </h2>

            <div className="print-checklist-grid grid grid-cols-3 gap-5">
              {/* Cost Allocation */}
              <div>
                <h4 className="print-checklist-category text-sm font-bold text-amber-700 mb-2">Cost Allocation</h4>
                <div className="space-y-1.5">
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>What rate schedule will the data center be on?</span>
                  </div>
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>Does the rate cover full cost-of-service?</span>
                  </div>
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>Who pays for grid upgrades?</span>
                  </div>
                </div>
              </div>

              {/* Grid Reliability */}
              <div>
                <h4 className="print-checklist-category text-sm font-bold text-blue-700 mb-2">Grid Reliability</h4>
                <div className="space-y-1.5">
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>Is any of the load flexible?</span>
                  </div>
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>Can operations be curtailed during emergencies?</span>
                  </div>
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>Is on-site generation or storage included?</span>
                  </div>
                </div>
              </div>

              {/* Risk Protection */}
              <div>
                <h4 className="print-checklist-category text-sm font-bold text-amber-700 mb-2">Risk Protection</h4>
                <div className="space-y-1.5">
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>Are there minimum purchase requirements?</span>
                  </div>
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>What if the data center closes?</span>
                  </div>
                  <div className="print-checklist-item flex items-start gap-2 text-sm text-slate-600">
                    <span className="print-checkbox w-3.5 h-3.5 border-2 border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                    <span>Who bears stranded asset risk?</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why This Matters */}
          <div className="print-why-section rounded-lg bg-amber-50 p-4 border-2 border-amber-600 flex-1">
            <h2 className="print-why-title text-lg font-bold text-amber-900 text-center mb-2">
              Why This Matters
            </h2>
            <p className="print-why-quote text-sm italic text-amber-900 text-center mb-3 px-4">
              The question isn&apos;t whether to build — it&apos;s how to build responsibly so that communities benefit and household bills stay affordable.
            </p>
            <div className="print-why-grid grid grid-cols-3 gap-4">
              <div className="print-why-item flex items-start gap-2 text-sm text-slate-600">
                <span className="print-why-check text-amber-600 text-lg font-bold">✓</span>
                <span><strong>Energy growth drives progress</strong> — from electrification to the internet, expanding energy has powered human advancement.</span>
              </div>
              <div className="print-why-item flex items-start gap-2 text-sm text-slate-600">
                <span className="print-why-check text-amber-600 text-lg font-bold">✓</span>
                <span><strong>AI accelerates breakthroughs</strong> — data centers power research in medicine, materials science, and clean energy.</span>
              </div>
              <div className="print-why-item flex items-start gap-2 text-sm text-slate-600">
                <span className="print-why-check text-amber-600 text-lg font-bold">✓</span>
                <span><strong>Smart policy protects ratepayers</strong> — with the right tariffs, large customers can lower bills for everyone.</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="print-footer flex items-end justify-between pt-3 border-t-2 border-slate-200 mt-3">
            <div>
              <p className="print-footer-url text-base font-bold text-slate-800">power-insight.org</p>
              <p className="print-footer-text text-sm text-slate-500">Open Data for Smarter Energy Decisions</p>
            </div>
            <div className="print-qr">
              <QRCodeSVG
                value={siteUrl}
                size={75}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
