'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

// Top-level nav links (left side, before dropdowns)
const PRIMARY_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/calculator', label: 'Calculator' },
];

// Resources dropdown — research framework + supporting data
const RESOURCES_LINKS = [
    { href: '/methodology', label: 'Methodology' },
    { href: '/utilities', label: 'Utility Data' },
    { href: '/map', label: 'Territory Map' },
    { href: '/energy-view', label: 'Energy View' },
];

// Learn More dropdown — community-facing material
const LEARN_MORE_LINKS = [
    { href: '/learn-more', label: 'Community Guide' },
    { href: '/share/community-guide', label: 'Community Leader 1-Pager' },
    { href: '/story', label: 'AI Energy Explorer' },
];

const Navigation = () => {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isResourcesOpen, setIsResourcesOpen] = useState(false);
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
    const resourcesRef = useRef<HTMLDivElement>(null);
    const learnMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
                setIsResourcesOpen(false);
            }
            if (learnMoreRef.current && !learnMoreRef.current.contains(event.target as Node)) {
                setIsLearnMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isResourcesActive = RESOURCES_LINKS.some((l) => pathname === l.href);
    const isLearnMoreActive = LEARN_MORE_LINKS.some((l) => pathname === l.href);

    return (
        <nav
            className={`sticky top-0 z-50 transition-all duration-300 ${
                isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white border-b border-gray-200'
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
                        {PRIMARY_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`font-medium transition-colors duration-200 ${
                                    pathname === link.href
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-primary-600'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Resources Dropdown */}
                        <div className="relative" ref={resourcesRef}>
                            <button
                                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                                className={`font-medium transition-colors duration-200 flex items-center gap-1 ${
                                    isResourcesActive
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-primary-600'
                                }`}
                            >
                                Resources
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                        isResourcesOpen ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {isResourcesOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    {RESOURCES_LINKS.map((subPage) => (
                                        <Link
                                            key={subPage.href}
                                            href={subPage.href}
                                            onClick={() => setIsResourcesOpen(false)}
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
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                        isLearnMoreOpen ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {isLearnMoreOpen && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    {LEARN_MORE_LINKS.map((subPage) => (
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
                            {PRIMARY_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`font-medium py-2 transition-colors ${
                                        pathname === link.href
                                            ? 'text-primary-600'
                                            : 'text-gray-600 hover:text-primary-600'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            <div className="border-t border-gray-100 pt-3">
                                <span
                                    className={`font-medium py-2 block ${
                                        isResourcesActive ? 'text-primary-600' : 'text-gray-600'
                                    }`}
                                >
                                    Resources
                                </span>
                                <div className="ml-4 flex flex-col gap-2 mt-2">
                                    {RESOURCES_LINKS.map((subPage) => (
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

                            <div className="border-t border-gray-100 pt-3">
                                <span
                                    className={`font-medium py-2 block ${
                                        isLearnMoreActive ? 'text-primary-600' : 'text-gray-600'
                                    }`}
                                >
                                    Learn More
                                </span>
                                <div className="ml-4 flex flex-col gap-2 mt-2">
                                    {LEARN_MORE_LINKS.map((subPage) => (
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
        </nav>
    );
};

export default Navigation;
