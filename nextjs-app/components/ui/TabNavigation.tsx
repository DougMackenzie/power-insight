'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  /** Use URL parameters for tab state */
  useUrlParams?: boolean;
  /** URL parameter name for tab */
  paramName?: string;
}

/**
 * Reusable tab navigation component with URL parameter support
 *
 * Features:
 * - Desktop: Horizontal tab bar with icons + labels
 * - Mobile: Dropdown selector
 * - Optional URL parameter persistence
 * - Badge support for highlighting new features
 */
export default function TabNavigation({
  tabs,
  defaultTab,
  onTabChange,
  className = '',
  useUrlParams = true,
  paramName = 'tab',
}: TabNavigationProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get initial tab from URL or default
  const getInitialTab = () => {
    if (useUrlParams) {
      const urlTab = searchParams.get(paramName);
      if (urlTab && tabs.some(t => t.id === urlTab)) {
        return urlTab;
      }
    }
    return defaultTab || tabs[0]?.id || '';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync with URL params on mount and when they change
  useEffect(() => {
    if (useUrlParams) {
      const urlTab = searchParams.get(paramName);
      if (urlTab && tabs.some(t => t.id === urlTab) && urlTab !== activeTab) {
        setActiveTab(urlTab);
      }
    }
  }, [searchParams, paramName, tabs, activeTab, useUrlParams]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);

    // Update URL if using URL params
    if (useUrlParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set(paramName, tabId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }

    // Call callback
    onTabChange?.(tabId);
  };

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className={`${className}`}>
      {/* Desktop Tab Bar */}
      <div className="hidden md:block">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    group relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'text-primary-700 border-b-2 border-primary-600 -mb-px bg-primary-50/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b-2 border-transparent'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.icon && (
                    <span className={`
                      ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}
                    `}>
                      {tab.icon}
                    </span>
                  )}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`
                      ml-1 px-1.5 py-0.5 text-xs font-semibold rounded
                      ${tab.badgeColor || 'bg-primary-100 text-primary-700'}
                    `}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg text-left"
            aria-haspopup="listbox"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="flex items-center gap-2">
              {activeTabData?.icon && (
                <span className="text-primary-600">{activeTabData.icon}</span>
              )}
              <span className="font-medium text-slate-900">{activeTabData?.label}</span>
              {activeTabData?.badge && (
                <span className={`
                  px-1.5 py-0.5 text-xs font-semibold rounded
                  ${activeTabData.badgeColor || 'bg-primary-100 text-primary-700'}
                `}>
                  {activeTabData.badge}
                </span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
              <ul className="py-1" role="listbox">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => handleTabClick(tab.id)}
                        className={`
                          w-full flex items-center gap-2 px-4 py-3 text-left
                          ${isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-slate-700 hover:bg-slate-50'
                          }
                        `}
                        role="option"
                        aria-selected={isActive}
                      >
                        {tab.icon && (
                          <span className={isActive ? 'text-primary-600' : 'text-slate-400'}>
                            {tab.icon}
                          </span>
                        )}
                        <span className="font-medium">{tab.label}</span>
                        {tab.badge && (
                          <span className={`
                            ml-auto px-1.5 py-0.5 text-xs font-semibold rounded
                            ${tab.badgeColor || 'bg-primary-100 text-primary-700'}
                          `}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to get the current active tab from URL parameters
 */
export function useActiveTab(tabs: Tab[], defaultTab?: string, paramName = 'tab') {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get(paramName);

  if (urlTab && tabs.some(t => t.id === urlTab)) {
    return urlTab;
  }
  return defaultTab || tabs[0]?.id || '';
}

/**
 * Common icons for methodology tabs
 */
export const TabIcons = {
  map: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  globe: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calculator: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  database: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
};
