'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import RegistrationForm from './RegistrationForm';

// Methodology sub-pages for dropdown (public pages only)
const methodologySubPages = [
    { href: '/methodology?tab=research', label: 'Research & Framework' },
    { href: '/methodology?tab=calculator', label: 'Calculator' },
    { href: '/methodology?tab=energy', label: 'Energy View' },
];

// Utility Portal sub-pages (protected - requires registration)
const utilityPortalSubPages = [
    { href: '/methodology?tab=utility', label: 'Utility Data' },
    { href: '/methodology?tab=geographic', label: 'Geographic View' },
];

// Learn More sub-pages for dropdown
const learnMoreSubPages = [
    { href: '/learn-more', label: 'Community Guide' },
    { href: '/share/community-guide', label: 'Community Leader 1-Pager' },
];

// Inner component that uses searchParams
const NavigationInner = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isRegistered, openRegistration, user, showRegistration } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
    const [isUtilityPortalOpen, setIsUtilityPortalOpen] = useState(false);
    const methodologyRef = useRef<HTMLDivElement>(null);
    const learnMoreRef = useRef<HTMLDivElement>(null);
    const utilityPortalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (methodologyRef.current && !methodologyRef.current.contains(event.target as Node)) {
                setIsMethodologyOpen(false);
            }
            if (learnMoreRef.current && !learnMoreRef.current.contains(event.target as Node)) {
                setIsLearnMoreOpen(false);
            }
            if (utilityPortalRef.current && !utilityPortalRef.current.contains(event.target as Node)) {
                setIsUtilityPortalOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/story', label: 'AI Energy Explorer' },
    ];

    // Check if we're on methodology page or learn more pages
    const currentTab = searchParams.get('tab');
    const isMethodologyActive = pathname === '/methodology' && ['research', 'calculator', 'energy'].includes(currentTab || '');
    const isLearnMoreActive = pathname === '/learn-more' || pathname === '/share/community-guide';
    const isUtilityPortalActive = pathname === '/methodology' && ['utility', 'geographic'].includes(currentTab || '');

    // Handle utility portal link clicks - require registration
    const handleUtilityPortalClick = (href: string) => {
        if (isRegistered && user?.status === 'active') {
            // User is registered, allow navigation
            setIsUtilityPortalOpen(false);
            window.location.href = href;
        } else {
            // User not registered, show registration modal
            setIsUtilityPortalOpen(false);
            openRegistration();
        }
    };

    return (
        <nav
            className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-md'
                    : 'bg-white border-b border-gray-200'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
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
                        <span className="font-display font-bold text-gray-900 text-lg hidden sm:inline">
                            Power Insight
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`font-medium transition-colors duration-200 ${pathname === link.href
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-primary-600'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Learn More Dropdown */}
                        <div className="relative" ref={learnMoreRef}>
                            <button
                                onClick={() => setIsLearnMoreOpen(!isLearnMoreOpen)}
                                className={`font-medium transition-colors duration-200 flex items-center gap-1 ${
                                    isLearnMoreActive
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-primary-600'
                                }`}
                            >
                                Learn More
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${isLearnMoreOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isLearnMoreOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    {learnMoreSubPages.map((subPage) => (
                                        <Link
                                            key={subPage.href}
                                            href={subPage.href}
                                            onClick={() => setIsLearnMoreOpen(false)}
                                            className={`block px-4 py-2 text-sm transition-colors ${
                                                pathname === subPage.href
                                                    ? 'bg-primary-50 text-primary-600'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                                            }`}
                                        >
                                            {subPage.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Methodology Dropdown */}
                        <div className="relative" ref={methodologyRef}>
                            <button
                                onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
                                className={`font-medium transition-colors duration-200 flex items-center gap-1 ${
                                    isMethodologyActive
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-primary-600'
                                }`}
                            >
                                Methodology
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${isMethodologyOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isMethodologyOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    {methodologySubPages.map((subPage) => (
                                        <Link
                                            key={subPage.href}
                                            href={subPage.href}
                                            onClick={() => setIsMethodologyOpen(false)}
                                            className={`block px-4 py-2 text-sm transition-colors ${
                                                pathname === '/methodology' && searchParams.get('tab') === subPage.href.split('tab=')[1]
                                                    ? 'bg-primary-50 text-primary-600'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                                            }`}
                                        >
                                            {subPage.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Utility Portal Dropdown (Protected) */}
                        <div className="relative" ref={utilityPortalRef}>
                            <button
                                onClick={() => setIsUtilityPortalOpen(!isUtilityPortalOpen)}
                                className={`font-medium transition-colors duration-200 flex items-center gap-1 ${
                                    isUtilityPortalActive
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-primary-600'
                                }`}
                            >
                                <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                                Utility Portal
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${isUtilityPortalOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isUtilityPortalOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    {/* Registration status indicator */}
                                    <div className={`px-4 py-2 text-xs border-b border-gray-100 ${isRegistered ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                                        {isRegistered ? (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Registered Access
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                Registration Required
                                            </span>
                                        )}
                                    </div>
                                    {utilityPortalSubPages.map((subPage) => (
                                        <button
                                            key={subPage.href}
                                            onClick={() => handleUtilityPortalClick(subPage.href)}
                                            className={`w-full text-left block px-4 py-2 text-sm transition-colors ${
                                                pathname === '/methodology' && searchParams.get('tab') === subPage.href.split('tab=')[1]
                                                    ? 'bg-primary-50 text-primary-600'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                                            }`}
                                        >
                                            {subPage.label}
                                        </button>
                                    ))}
                                    {!isRegistered && (
                                        <div className="px-4 py-2 border-t border-gray-100 mt-1">
                                            <button
                                                onClick={() => {
                                                    setIsUtilityPortalOpen(false);
                                                    openRegistration();
                                                }}
                                                className="w-full text-center text-sm bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-md transition-colors"
                                            >
                                                Register for Free Access
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <a
                            href="https://github.com/DougMackenzie/power-insight"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    fillRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="hidden lg:inline">GitHub</span>
                        </a>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="w-6 h-6 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {isMobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 animate-slide-down">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`font-medium py-2 transition-colors ${pathname === link.href
                                            ? 'text-primary-600'
                                            : 'text-gray-600 hover:text-primary-600'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* Learn More Section */}
                            <div className="border-t border-gray-100 pt-3">
                                <span className={`font-medium py-2 block ${isLearnMoreActive ? 'text-primary-600' : 'text-gray-600'}`}>
                                    Learn More
                                </span>
                                <div className="ml-4 flex flex-col gap-2 mt-2">
                                    {learnMoreSubPages.map((subPage) => (
                                        <Link
                                            key={subPage.href}
                                            href={subPage.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`text-sm py-1 transition-colors ${
                                                pathname === subPage.href
                                                    ? 'text-primary-600'
                                                    : 'text-gray-500 hover:text-primary-600'
                                            }`}
                                        >
                                            {subPage.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Methodology Section */}
                            <div className="border-t border-gray-100 pt-3">
                                <span className={`font-medium py-2 block ${isMethodologyActive ? 'text-primary-600' : 'text-gray-600'}`}>
                                    Methodology
                                </span>
                                <div className="ml-4 flex flex-col gap-2 mt-2">
                                    {methodologySubPages.map((subPage) => (
                                        <Link
                                            key={subPage.href}
                                            href={subPage.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`text-sm py-1 transition-colors ${
                                                pathname === '/methodology' && searchParams.get('tab') === subPage.href.split('tab=')[1]
                                                    ? 'text-primary-600'
                                                    : 'text-gray-500 hover:text-primary-600'
                                            }`}
                                        >
                                            {subPage.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Utility Portal Section (Protected) */}
                            <div className="border-t border-gray-100 pt-3">
                                <span className={`font-medium py-2 flex items-center gap-2 ${isUtilityPortalActive ? 'text-primary-600' : 'text-gray-600'}`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Utility Portal
                                </span>
                                <div className={`ml-4 text-xs mb-2 ${isRegistered ? 'text-green-600' : 'text-amber-600'}`}>
                                    {isRegistered ? 'Registered Access' : 'Registration Required'}
                                </div>
                                <div className="ml-4 flex flex-col gap-2">
                                    {utilityPortalSubPages.map((subPage) => (
                                        <button
                                            key={subPage.href}
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleUtilityPortalClick(subPage.href);
                                            }}
                                            className={`text-sm py-1 text-left transition-colors ${
                                                pathname === '/methodology' && searchParams.get('tab') === subPage.href.split('tab=')[1]
                                                    ? 'text-primary-600'
                                                    : 'text-gray-500 hover:text-primary-600'
                                            }`}
                                        >
                                            {subPage.label}
                                        </button>
                                    ))}
                                    {!isRegistered && (
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                openRegistration();
                                            }}
                                            className="text-sm bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-md transition-colors mt-2"
                                        >
                                            Register for Free Access
                                        </button>
                                    )}
                                </div>
                            </div>

                            <a
                                href="https://github.com/DougMackenzie/power-insight"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-fit"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path
                                        fillRule="evenodd"
                                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                View on GitHub
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* Registration Modal */}
            {showRegistration && <RegistrationForm />}
        </nav>
    );
};

// Wrapper component with Suspense boundary for useSearchParams
const Navigation = () => {
    return (
        <Suspense fallback={
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg" />
                    </div>
                </div>
            </nav>
        }>
            <NavigationInner />
        </Suspense>
    );
};

export default Navigation;
