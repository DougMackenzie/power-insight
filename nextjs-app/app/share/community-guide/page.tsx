'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function CommunityGuidePage() {
  const siteUrl = 'https://power-insight.org';

  return (
    <div className="min-h-screen bg-white">
      {/* Print-optimized styles for 1-page output */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.4in;
          }

          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          /* Compact everything for 1 page */
          .print-container {
            font-size: 9pt;
          }

          .print-title {
            font-size: 16pt !important;
            margin-bottom: 2pt !important;
          }

          .print-subtitle {
            font-size: 10pt !important;
            margin-bottom: 8pt !important;
          }

          .print-section-title {
            font-size: 11pt !important;
            margin-bottom: 4pt !important;
          }

          .print-faq-grid {
            gap: 6pt !important;
          }

          .print-faq-card {
            padding: 6pt !important;
            border: 1pt solid #e2e8f0 !important;
          }

          .print-faq-question {
            font-size: 9pt !important;
            margin-bottom: 1pt !important;
          }

          .print-faq-answer {
            font-size: 8pt !important;
            margin-bottom: 2pt !important;
          }

          .print-faq-detail {
            font-size: 7pt !important;
            line-height: 1.2 !important;
          }

          .print-checklist {
            padding: 6pt !important;
          }

          .print-checklist-title {
            font-size: 10pt !important;
            margin-bottom: 4pt !important;
          }

          .print-checklist-category {
            font-size: 8pt !important;
          }

          .print-checklist-item {
            font-size: 7pt !important;
            line-height: 1.3 !important;
          }

          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex !important;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 0.4in;
          }

          .print-qr {
            width: 60px !important;
            height: 60px !important;
          }
        }

        /* Hide print-only elements on screen */
        .print-only {
          display: none;
        }
      `}</style>

      {/* Web Header - simple breadcrumb, no duplicate banner */}
      <header className="bg-slate-50 border-b border-slate-200 py-4 no-print">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Back to Power Insight
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 print-container">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2 print-only">
            <span className="font-bold text-slate-800">POWER INSIGHT</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 text-sm">power-insight.org</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 print-title">
            What Communities Are Asking About Data Centers
          </h1>
          <p className="text-slate-600 print-subtitle">
            Evidence-based answers to common questions
          </p>
        </div>

        {/* FAQ Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 print-faq-grid">
          {/* Question 1 */}
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 print-faq-card">
            <h3 className="text-sm font-semibold text-slate-800 mb-1 print-faq-question">
              &quot;Will my electric bill go up?&quot;
            </h3>
            <p className="text-xs text-amber-600 font-medium mb-1 print-faq-answer">
              With the right policy, data centers apply downward pressure on rates.
            </p>
            <p className="text-xs text-slate-500 print-faq-detail">
              Large customers bring new revenue that helps cover shared infrastructure costs.
              The E3 study found data centers can lower nearby bills by 1-2%.
            </p>
          </div>

          {/* Question 2 */}
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 print-faq-card">
            <h3 className="text-sm font-semibold text-slate-800 mb-1 print-faq-question">
              &quot;Who pays for all the new infrastructure?&quot;
            </h3>
            <p className="text-xs text-amber-600 font-medium mb-1 print-faq-answer">
              Industrial tariffs ensure data centers pay their full cost of service.
            </p>
            <p className="text-xs text-slate-500 print-faq-detail">
              Utilities are creating dedicated rate classes with demand charges that recover
              transmission and distribution costs directly from large loads.
            </p>
          </div>

          {/* Question 3 */}
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 print-faq-card">
            <h3 className="text-sm font-semibold text-slate-800 mb-1 print-faq-question">
              &quot;What happens if the data center leaves?&quot;
            </h3>
            <p className="text-xs text-amber-600 font-medium mb-1 print-faq-answer">
              Tariff structures include minimum contract terms for cost recovery.
            </p>
            <p className="text-xs text-slate-500 print-faq-detail">
              Policies like AEP Ohio&apos;s 12-year minimum demand requirements and exit fees
              protect ratepayers from stranded asset risk.
            </p>
          </div>

          {/* Question 4 */}
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 print-faq-card">
            <h3 className="text-sm font-semibold text-slate-800 mb-1 print-faq-question">
              &quot;Will I have power outages?&quot;
            </h3>
            <p className="text-xs text-amber-600 font-medium mb-1 print-faq-answer">
              Modern data centers actually help stabilize the grid.
            </p>
            <p className="text-xs text-slate-500 print-faq-detail">
              Data centers can reduce operations and activate on-site generators during peak demand,
              helping prevent brownouts. Many include battery storage for grid backup.
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="rounded-lg bg-slate-100 p-5 mb-6 border border-slate-200 print-checklist">
          <h2 className="text-base font-bold text-slate-800 mb-3 text-center print-checklist-title">
            Questions to Ask About Any Proposal
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {/* Cost Allocation */}
            <div>
              <h4 className="text-xs font-semibold text-amber-600 mb-2 print-checklist-category">Cost Allocation</h4>
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  What rate schedule will they be on?
                </li>
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  Full cost-of-service w/ demand charges?
                </li>
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  Who pays for grid upgrades?
                </li>
              </ul>
            </div>

            {/* Grid Reliability */}
            <div>
              <h4 className="text-xs font-semibold text-green-600 mb-2 print-checklist-category">Grid Reliability</h4>
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  Is any of the load flexible?
                </li>
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  Curtailable during grid emergencies?
                </li>
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  On-site generation or batteries?
                </li>
              </ul>
            </div>

            {/* Risk Protection */}
            <div>
              <h4 className="text-xs font-semibold text-amber-600 mb-2 print-checklist-category">Risk Protection</h4>
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  Minimum purchase requirements?
                </li>
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  What if they close or reduce load?
                </li>
                <li className="flex items-start gap-1.5 text-xs text-slate-600 print-checklist-item">
                  <span className="w-3 h-3 border border-slate-400 rounded flex-shrink-0 mt-0.5"></span>
                  Who bears stranded asset risk?
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Web Footer with QR and actions */}
        <div className="flex items-end justify-between no-print">
          <div>
            <p className="text-sm text-slate-500 mb-2">
              Generated from{' '}
              <a href={siteUrl} className="text-amber-600 hover:underline font-medium">
                Power Insight
              </a>
              {' '}&mdash; Open Data for Smarter Energy Decisions
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print this Guide
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-slate-900 text-sm font-medium rounded-lg hover:bg-amber-300 transition-colors"
              >
                Visit Full Site
              </Link>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm inline-block">
              <QRCodeSVG
                value={siteUrl}
                size={80}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Scan to visit</p>
          </div>
        </div>

        {/* Print-only Footer */}
        <div className="print-footer print-only">
          <div>
            <p className="text-xs text-slate-600 font-medium">power-insight.org</p>
            <p className="text-xs text-slate-400">Open Data for Smarter Energy Decisions</p>
          </div>
          <div className="print-qr">
            <QRCodeSVG
              value={siteUrl}
              size={60}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
