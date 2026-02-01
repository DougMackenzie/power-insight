# Methodology Section Restructuring Recommendation

## Executive Summary

This document outlines a recommended restructuring of the Power Insight methodology page to accommodate the new Large Load Tariff Database while improving overall navigation and user experience. The proposal transforms the current single-page methodology section into a tabbed interface with four distinct content areas.

---

## 1. Current State Analysis

### Current Structure
The methodology page (`/app/methodology/page.tsx`) currently uses expandable `Section` components organized linearly:
- Model Overview
- Core Calculation Logic
- Capacity Market Dynamics
- Workload Flexibility Model
- Data Sources & Assumptions
- Carbon Footprint

### Pain Points
1. **Long scroll distance** - Users must scroll extensively to find specific information
2. **No content categorization** - Technical and practical content mixed together
3. **Limited discoverability** - New features like tariff data need prominent placement
4. **Mobile navigation challenges** - Accordion pattern on mobile requires many taps

---

## 2. Proposed Structure

### 2.1 Top-Level Navigation

Transform the methodology page into a **tabbed interface** with four primary sections:

```
┌─────────────────────────────────────────────────────────────────┐
│  Methodology & Technical Documentation                          │
├─────────────┬─────────────┬───────────────────┬────────────────┤
│ Energy View │ Calculator  │ Research &        │ Utility Data   │
│             │             │ Framework         │ [NEW]          │
└─────────────┴─────────────┴───────────────────┴────────────────┘
```

### 2.2 Tab Descriptions

| Tab | Purpose | Content |
|-----|---------|---------|
| **Energy View** | Visual exploration of grid impacts | Scrollytelling components, maps, 3D views |
| **Calculator** | Interactive impact modeling | Core calculation tools, scenario builder |
| **Research & Framework** | Technical methodology | Current methodology content, data sources |
| **Utility Data** | Tariff database & comparisons | NEW tariff explorer, protection matrix |

---

## 3. Detailed Tab Content

### 3.1 Energy View Tab

**Target Users:** General public, policymakers, journalists

**Content:**
- Interactive US data center map (existing `USDataCenterHeatMap`)
- Scrollytelling narrative (existing scrollytelling components)
- Regional impact visualizations
- Key statistics dashboard

**Components to integrate:**
- `ScrollyMap.tsx`
- `MicroView.tsx` / `MicroView3D.tsx`
- `MapView.tsx`

### 3.2 Calculator Tab

**Target Users:** Utility analysts, researchers, ratepayer advocates

**Content:**
- Bill impact calculator (core functionality)
- Scenario comparison tools
- Sensitivity analysis
- Export/share functionality

**Components to integrate:**
- Main calculator interface
- `EscalationControls.tsx`
- `TrajectoryChart.tsx`
- `SummaryCards.tsx`

### 3.3 Research & Framework Tab

**Target Users:** Academics, regulators, utility planners

**Content (current methodology sections):**
- Model Overview
- Core Calculation Logic
- Endogenous Capacity Pricing
- Workload Flexibility Model
- Data Sources & Assumptions
- Carbon Footprint Methodology

**Components:**
- Existing expandable `Section` components
- Technical documentation
- Academic references

### 3.4 Utility Data Tab (NEW)

**Target Users:** Utility analysts, data center developers, regulators

**Content:**
1. **Large Load Tariff Database** - Comprehensive tariff explorer
2. **Protection Mechanisms Matrix** - Cross-utility comparison
3. **Proposed Tariffs Tracker** - Regulatory proceedings
4. **ISO/RTO Requirements** - Interconnection details

**New Components Required:**
- `TariffExplorer.tsx` - Main container
- `TariffTable.tsx` - Sortable data table
- `ProtectionMatrix.tsx` - Heat map visualization
- `TariffCompare.tsx` - Side-by-side comparison
- `ProposedTracker.tsx` - Regulatory status cards
- `ISORequirements.tsx` - Accordion by ISO

---

## 4. Implementation Approach

### Phase 1: Tab Infrastructure (1 week)

**File Changes:**

```tsx
// /app/methodology/page.tsx
'use client';

import { useState } from 'react';
import { EnergyViewTab } from '@/components/methodology/EnergyViewTab';
import { CalculatorTab } from '@/components/methodology/CalculatorTab';
import { ResearchTab } from '@/components/methodology/ResearchTab';
import { UtilityDataTab } from '@/components/methodology/UtilityDataTab';

const TABS = [
  { id: 'energy', label: 'Energy View', icon: 'MapIcon' },
  { id: 'calculator', label: 'Calculator', icon: 'CalculatorIcon' },
  { id: 'research', label: 'Research & Framework', icon: 'BookOpenIcon' },
  { id: 'utility', label: 'Utility Data', icon: 'DatabaseIcon', badge: 'New' }
];

export default function MethodologyPage() {
  const [activeTab, setActiveTab] = useState('research'); // Default to current content

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'energy' && <EnergyViewTab />}
        {activeTab === 'calculator' && <CalculatorTab />}
        {activeTab === 'research' && <ResearchTab />}
        {activeTab === 'utility' && <UtilityDataTab />}
      </div>
    </div>
  );
}
```

**New Component: TabNavigation**

```tsx
// /components/ui/TabNavigation.tsx
interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: string;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <Icon name={tab.icon} className="mr-2 h-5 w-5" />
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

### Phase 2: Migrate Existing Content (1 week)

1. Extract current methodology sections into `ResearchTab.tsx`
2. Move calculator-related content to `CalculatorTab.tsx`
3. Consolidate visualization components into `EnergyViewTab.tsx`
4. Ensure backward compatibility with existing URLs

### Phase 3: Build Utility Data Tab (2 weeks)

1. Implement `TariffExplorer` container
2. Build `TariffTable` with sorting/filtering
3. Create `ProtectionMatrix` visualization
4. Develop `TariffCompare` tool
5. Add `ProposedTracker` and `ISORequirements`

### Phase 4: Polish & Integration (1 week)

1. Responsive design optimization
2. URL routing for deep links to specific tabs
3. Search functionality across tabs
4. Analytics integration for tab usage

---

## 5. URL Structure

### Proposed Routes

| URL | Content |
|-----|---------|
| `/methodology` | Default to Research & Framework tab |
| `/methodology?tab=energy` | Energy View |
| `/methodology?tab=calculator` | Calculator |
| `/methodology?tab=research` | Research & Framework |
| `/methodology?tab=utility` | Utility Data |
| `/methodology?tab=utility&view=tariffs` | Tariff Table |
| `/methodology?tab=utility&view=matrix` | Protection Matrix |
| `/methodology?tab=utility&view=compare&ids=x,y` | Compare specific utilities |

### Deep Linking Example

```tsx
// Handle URL parameters
const searchParams = useSearchParams();
const initialTab = searchParams.get('tab') || 'research';
const [activeTab, setActiveTab] = useState(initialTab);

// Update URL on tab change
const handleTabChange = (tabId: string) => {
  setActiveTab(tabId);
  router.push(`/methodology?tab=${tabId}`, { scroll: false });
};
```

---

## 6. Mobile Considerations

### Responsive Tab Design

**Desktop (1024px+):** Horizontal tab bar with icons and labels

**Tablet (768px-1023px):** Horizontal tab bar with icons only, labels on hover

**Mobile (<768px):** Dropdown selector or bottom tab bar

```tsx
// Mobile-responsive tab implementation
<div className="hidden md:flex border-b">
  {/* Desktop horizontal tabs */}
</div>
<div className="md:hidden">
  <select
    value={activeTab}
    onChange={(e) => setActiveTab(e.target.value)}
    className="w-full border rounded-lg p-3"
  >
    {tabs.map((tab) => (
      <option key={tab.id} value={tab.id}>
        {tab.label}
      </option>
    ))}
  </select>
</div>
```

---

## 7. Navigation Integration

### Header Updates

Add "Methodology" dropdown in main navigation:

```tsx
// /components/Navigation.tsx update
const methodologySubnav = [
  { label: 'Energy View', href: '/methodology?tab=energy' },
  { label: 'Calculator', href: '/methodology?tab=calculator' },
  { label: 'Research & Framework', href: '/methodology?tab=research' },
  { label: 'Utility Data', href: '/methodology?tab=utility', badge: 'New' }
];
```

### Footer Updates

Add quick links to key methodology sections in footer.

---

## 8. SEO Considerations

### Meta Tags per Tab

```tsx
// Dynamic meta tags based on active tab
const metaTags = {
  energy: {
    title: 'Energy View - Data Center Grid Impact Visualization',
    description: 'Explore how data center loads affect regional power grids...'
  },
  calculator: {
    title: 'Bill Impact Calculator - Estimate Residential Rate Effects',
    description: 'Calculate how data center development affects your electricity bill...'
  },
  research: {
    title: 'Methodology & Research Framework',
    description: 'Technical documentation for the Power Insight capacity pricing model...'
  },
  utility: {
    title: 'Utility Tariff Database - Large Load Rates & Protections',
    description: 'Comprehensive database of utility tariffs for large loads...'
  }
};
```

---

## 9. Analytics Events

Track user engagement with methodology sections:

```tsx
// Analytics tracking
const trackTabView = (tabId: string) => {
  analytics.track('methodology_tab_view', {
    tab: tabId,
    source: document.referrer,
    timestamp: new Date().toISOString()
  });
};

const trackTariffAction = (action: string, details: object) => {
  analytics.track('tariff_interaction', {
    action, // 'filter', 'compare', 'export', 'view_detail'
    ...details
  });
};
```

---

## 10. Migration Checklist

### Pre-Migration
- [ ] Backup current methodology page
- [ ] Document all existing section IDs for redirect mapping
- [ ] Identify any external links to specific sections

### During Migration
- [ ] Create tab wrapper components
- [ ] Move existing sections to appropriate tabs
- [ ] Set up URL parameter handling
- [ ] Implement responsive tab navigation
- [ ] Test all existing functionality

### Post-Migration
- [ ] Set up redirects from old section anchors
- [ ] Update internal links throughout site
- [ ] Update sitemap
- [ ] Monitor analytics for user flow changes
- [ ] Gather user feedback on new structure

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | <2 seconds | Lighthouse |
| Time to first interaction | <100ms | Web Vitals |
| Tab switch time | <200ms | Performance API |
| User engagement | +25% session duration | Analytics |
| Tariff data usage | 1000+ views/month | Analytics |
| Export downloads | 100+ per month | Analytics |

---

## 12. Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Tab Infrastructure | Week 1 | Tab navigation, routing |
| Phase 2: Content Migration | Week 2 | Existing content in new structure |
| Phase 3: Utility Data Tab | Weeks 3-4 | Full tariff explorer |
| Phase 4: Polish | Week 5 | Responsive design, testing |

**Total Estimated Time:** 5 weeks

---

## 13. Future Enhancements

1. **Search across tabs** - Global search with tab-specific results
2. **Personalization** - Remember user's preferred tab
3. **Comparison bookmarks** - Save tariff comparisons
4. **API access** - Public API for tariff data
5. **Embedded widgets** - Share tariff tables on external sites
6. **Print/PDF export** - Formatted reports from any tab

---

*Document Version: 1.0*
*Created: January 31, 2026*
*Author: Power Insight Development Team*
