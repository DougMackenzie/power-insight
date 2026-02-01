'use client';

/**
 * Calculator Tab
 *
 * Contains the interactive bill impact calculator.
 * This tab links to the main calculator page and provides
 * quick access to calculator features.
 */
export default function CalculatorTab() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-600 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Bill Impact Calculator</h2>
                        <p className="text-gray-700">
                            Model how data center loads affect residential electricity bills under different
                            operational strategies. Compare baseline, firm load, flexible, and optimized scenarios.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Multi-scenario bill trajectory modeling</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Endogenous capacity pricing (VRR curve)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Revenue adequacy analysis (E3 methodology)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Configurable utility and data center parameters</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Scenario Comparison</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            <span className="text-sm text-gray-600">Baseline (no data center)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm text-gray-600">Firm Load (100% peak)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-sm text-gray-600">Flexible (75% peak)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm text-gray-600">Optimized (flex + dispatch)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Ready to Model Bill Impacts?</h3>
                <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                    Use the interactive calculator to see how data center operational strategies
                    affect residential electricity bills in your utility service territory.
                </p>
                <a
                    href="/calculator"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                    <span>Open Calculator</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </a>
            </div>
        </div>
    );
}
