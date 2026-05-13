'use client';

/**
 * Preview Page: Community Trust Redesign
 *
 * This page shows the proposed new homepage structure optimized for:
 * - Building trust with skeptical community members
 * - Providing council members with shareable facts
 * - Acknowledging fears before providing reassurance
 * - Visual-first communication
 */

import Link from 'next/link';
import {
  TrustHero,
  CommunityQuestions,
  ResearchFactCards,
  OutcomesComparison,
  CommunityLeadersSection,
  QuestionsChecklist
} from '@/components/CommunityTrust';

export default function PreviewTrustPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Banner indicating this is a preview */}
      <div className="bg-amber-500 text-amber-950 py-3 px-4 text-center text-sm font-medium sticky top-0 z-50">
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          PREVIEW: Proposed Homepage Redesign — <Link href="/" className="underline">View Current Homepage</Link>
        </span>
      </div>

      {/* 1. Revised Hero - Neutral, trust-building */}
      <TrustHero />

      {/* 2. What Communities Are Asking - Names fears explicitly */}
      <CommunityQuestions />

      {/* 3. What Research Shows - Visual fact cards */}
      <ResearchFactCards />

      {/* 4. When It Goes Well / Wrong - Side by side comparison */}
      <OutcomesComparison />

      {/* 5. Questions Checklist - Actionable, shareable */}
      <QuestionsChecklist />

      {/* 6. For Community Leaders - Talking points */}
      <CommunityLeadersSection />

      {/* Keep existing calculator CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Calculate for Your Community
            </h3>
            <p className="text-slate-600 mb-6">
              Enter your utility's actual numbers to see projections specific to your situation.
            </p>
            <Link
              href="/calculator"
              className="inline-block px-6 py-3 bg-slate-700 text-white font-semibold rounded-full hover:bg-slate-600 transition-colors"
            >
              Open Calculator
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Explore the Data
            </h3>
            <p className="text-slate-600 mb-6">
              Understand the scale of data center growth from the chip level to community impact.
            </p>
            <Link
              href="/story"
              className="inline-block px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-full hover:bg-slate-300 transition-colors"
            >
              AI Energy Explorer
            </Link>
          </div>
        </div>
      </section>

      {/* Keep open source section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-sm border border-slate-200">
          <h3 className="text-3xl font-bold text-slate-800 mb-4">
            Open Source & Independent
          </h3>
          <p className="text-lg text-slate-600 mb-2 max-w-2xl mx-auto">
            This site is not affiliated with any data center company, utility, or advocacy group.
          </p>
          <p className="text-slate-500 mb-6 max-w-2xl mx-auto">
            All research cited is from independent academic institutions, government agencies, and peer-reviewed sources.
            Our code is open source so you can verify our methodology.
          </p>
          <a
            href="https://github.com/DougMackenzie/power-insight"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">View on GitHub</span>
          </a>
        </div>
      </section>
    </div>
  );
}
