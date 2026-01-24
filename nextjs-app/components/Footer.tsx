'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

const SITE_URL = 'https://community-energy.dev';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <span className="font-display font-bold text-gray-900 text-lg">
                                Community Energy Calculator
                            </span>
                        </div>
                        <p className="text-gray-600 mb-4 max-w-md">
                            An open-source tool to help communities understand the impact of data center
                            development on electricity costs.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="https://github.com/DougMackenzie/community-energy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-primary-600 transition-colors"
                                aria-label="GitHub"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path
                                        fillRule="evenodd"
                                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-display font-semibold text-gray-900 mb-4">Quick Links</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/"
                                    className="text-gray-600 hover:text-primary-600 transition-colors"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/calculator"
                                    className="text-gray-600 hover:text-primary-600 transition-colors"
                                >
                                    Calculator
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/methodology"
                                    className="text-gray-600 hover:text-primary-600 transition-colors"
                                >
                                    Methodology
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-display font-semibold text-gray-900 mb-4">Resources</h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="https://github.com/DougMackenzie/community-energy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-primary-600 transition-colors"
                                >
                                    Source Code
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/DougMackenzie/community-energy/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-primary-600 transition-colors"
                                >
                                    Report Issues
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/DougMackenzie/community-energy/blob/main/LICENSE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-primary-600 transition-colors"
                                >
                                    MIT License
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="font-display font-semibold text-gray-900 mb-4">Share</h3>
                        <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <QRCodeSVG
                                value={SITE_URL}
                                size={80}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center md:text-left">
                            Scan for mobile
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            © {currentYear} Community Energy Calculator. Open source under MIT License.
                        </p>
                        <p className="text-sm text-gray-500 text-center md:text-right">
                            Built for communities. Not affiliated with any data center company or utility.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
