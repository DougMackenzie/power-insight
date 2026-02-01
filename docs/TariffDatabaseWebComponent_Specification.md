# Large Load Tariff Database Web Component Specification

## Overview

This specification defines a comprehensive web component for displaying, filtering, and analyzing large load utility tariffs within the Power Insight Next.js application. The component integrates with the existing methodology section and provides interactive access to the tariff database.

---

## 1. Component Architecture

### 1.1 Primary Component: `TariffExplorer`

**Location:** `/components/tariffs/TariffExplorer.tsx`

**Purpose:** Main container component providing tabbed navigation across tariff database views.

```tsx
interface TariffExplorerProps {
  defaultTab?: 'current' | 'proposed' | 'protections' | 'iso' | 'compare';
  embedded?: boolean; // For methodology page integration
}
```

### 1.2 Sub-Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `TariffTable` | Sortable/filterable data table | Column sorting, search, pagination |
| `ProtectionMatrix` | Protection mechanism heatmap | Category grouping, color-coded presence |
| `TariffCompare` | Side-by-side comparison | Up to 4 utilities, difference highlighting |
| `ISORequirements` | ISO/RTO interconnection view | Expandable details, timeline display |
| `ProposedTracker` | Regulatory docket tracker | Status badges, timeline, links |
| `TariffFilters` | Global filter panel | Region, market, protection type filters |

---

## 2. Data Model

### 2.1 Core Types

```typescript
// /lib/tariffDatabase.ts

export interface LargeLoadTariff {
  id: string;
  utility: string;
  state: string;
  region: 'Northeast' | 'Southeast' | 'Midwest' | 'Southwest' | 'West' | 'Texas' | 'Mountain West';
  iso_rto: 'PJM' | 'ERCOT' | 'MISO' | 'CAISO' | 'SPP' | 'NYISO' | 'ISO-NE' | 'None';
  tariff_name: string;
  rate_schedule: string;
  effective_date: string;

  // Demand Charges
  peak_demand_charge: number; // $/kW-month
  off_peak_demand_charge?: number;
  transmission_charge?: number;

  // Energy Rates
  energy_rate_peak: number; // $/kWh
  energy_rate_off_peak?: number;

  // Load Requirements
  min_load_mw: number;
  max_load_mw?: number;
  load_factor_requirement?: number;

  // Protections (boolean flags)
  protections: TariffProtections;

  // Metadata
  source_url?: string;
  last_updated: string;
  notes?: string;
}

export interface TariffProtections {
  // Cost Recovery
  minimum_demand_charge: boolean;
  demand_ratchet: boolean;
  ciac_required: boolean;
  network_upgrade_allocation: boolean;

  // Financial Security
  credit_requirements: boolean;
  deposit_required: boolean;
  letter_of_credit: boolean;
  parent_guarantee: boolean;

  // Load Assurance
  contract_minimum_term: number; // months
  take_or_pay: boolean;
  load_factor_penalty: boolean;
  ramp_schedule: boolean;

  // Risk Allocation
  fuel_adjustment_clause: boolean;
  capacity_pass_through: boolean;
  curtailment_provisions: boolean;
  force_majeure: boolean;

  // Queue Management
  deposit_for_queue: boolean;
  milestone_requirements: boolean;
  study_cost_allocation: boolean;
  commercial_readiness: boolean;

  // Flexibility Incentives
  interruptible_discount: boolean;
  tou_differential: boolean;
  demand_response_credit: boolean;
  behind_meter_credit: boolean;
}

export interface ProposedTariff extends LargeLoadTariff {
  docket_number: string;
  filing_date: string;
  expected_decision: string;
  status: 'Filed' | 'Under Review' | 'Comment Period' | 'Hearing Scheduled' | 'Decision Pending' | 'Approved' | 'Rejected';
  regulatory_body: string;
  key_changes: string[];
}

export interface ISORequirement {
  iso: string;
  requirement_type: 'Interconnection' | 'Capacity' | 'Transmission' | 'Market Participation';
  name: string;
  description: string;
  threshold_mw?: number;
  timeline_months?: number;
  cost_estimate?: string;
  recent_changes?: string;
  effective_date: string;
  source_url?: string;
}

export interface ProtectionMechanism {
  id: string;
  name: string;
  category: 'Cost Recovery' | 'Financial Security' | 'Load Assurance' | 'Risk Allocation' | 'Queue Management' | 'Flexibility Incentives';
  description: string;
  ratepayer_benefit: string;
  typical_range?: string;
  e3_reference?: string;
}
```

---

## 3. Component Specifications

### 3.1 TariffTable Component

**Features:**
- Sortable columns (click header to sort)
- Multi-column filtering via dropdown/search
- Column visibility toggle
- Export to CSV/Excel
- Responsive design with horizontal scroll on mobile
- Row expansion for full details

**Columns (Default View):**

| Column | Width | Sortable | Filterable |
|--------|-------|----------|------------|
| Utility | 180px | Yes | Search |
| State | 80px | Yes | Multi-select |
| ISO/RTO | 80px | Yes | Multi-select |
| Tariff | 150px | Yes | Search |
| Min Load (MW) | 100px | Yes | Range |
| Peak Demand ($/kW) | 120px | Yes | Range |
| Energy Rate ($/kWh) | 120px | Yes | Range |
| Contract Term | 100px | Yes | Multi-select |
| Protections | 150px | No | Multi-select |

**Expanded Row View:**
- Full tariff details
- All protection mechanisms
- Source links
- Last updated date
- Notes/special conditions

### 3.2 ProtectionMatrix Component

**Layout:** Grid heatmap with utilities as rows, protections as columns

**Color Coding:**
- Dark Green: Strong protection (exceeds typical)
- Light Green: Standard protection present
- Yellow: Partial/conditional protection
- Light Gray: Not applicable to this utility type
- White: No protection

**Interactivity:**
- Hover for tooltip with protection details
- Click to filter table by protection type
- Toggle category grouping (expand/collapse)
- Show/hide protection categories

**Categories (6 groups, 20+ mechanisms):**

1. **Cost Recovery** (4 items)
   - Minimum Demand Charges
   - Demand Ratchet Provisions
   - CIAC Requirements
   - Network Upgrade Cost Allocation

2. **Financial Security** (4 items)
   - Credit/Creditworthiness Requirements
   - Security Deposit
   - Letter of Credit
   - Parent Company Guarantee

3. **Load Assurance** (4 items)
   - Minimum Contract Term
   - Take-or-Pay Obligations
   - Load Factor Requirements
   - Ramp-Up Schedule

4. **Risk Allocation** (4 items)
   - Fuel Adjustment Clauses
   - Capacity Cost Pass-Through
   - Curtailment Provisions
   - Force Majeure

5. **Queue Management** (4 items)
   - Interconnection Deposit
   - Milestone Requirements
   - Study Cost Allocation
   - Commercial Readiness Demonstration

6. **Flexibility Incentives** (4 items)
   - Interruptible Rate Discounts
   - TOU Rate Differentials
   - Demand Response Credits
   - Behind-the-Meter Generation Credit

### 3.3 TariffCompare Component

**Layout:** Side-by-side cards (2-4 utilities)

**Selection:** Dropdown with search, recently viewed

**Comparison Categories:**
- Basic Information
- Demand Charges
- Energy Rates
- Load Requirements
- Contract Terms
- Protection Mechanisms (with difference highlighting)

**Visual Indicators:**
- Green/red arrows for better/worse values
- Highlight cells where utilities differ
- Summary score based on ratepayer protection level

### 3.4 ProposedTracker Component

**Layout:** Timeline/card hybrid view

**Status Badges:**
- Filed: Blue
- Under Review: Yellow
- Comment Period: Orange
- Hearing Scheduled: Purple
- Decision Pending: Gray
- Approved: Green
- Rejected: Red

**Card Content:**
- Utility name and state
- Docket number (linked)
- Filing and expected decision dates
- Key proposed changes
- Regulatory body
- Current status with progress indicator

**Filtering:**
- By status
- By state/region
- By utility
- By filing date range

### 3.5 ISORequirements Component

**Layout:** Accordion by ISO/RTO

**Content per ISO:**
- Overview card with key statistics
- Interconnection process timeline
- Cost estimates by load size
- Recent rule changes (highlighted)
- FERC Order 2023 compliance status

---

## 4. State Management

### 4.1 Filter State

```typescript
interface TariffFilterState {
  search: string;
  regions: string[];
  isos: string[];
  states: string[];
  protectionCategories: string[];
  minLoadRange: [number, number];
  demandChargeRange: [number, number];
  contractTermRange: [number, number];
  showProposed: boolean;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}
```

### 4.2 Context Provider

```tsx
// /contexts/TariffContext.tsx
export const TariffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<TariffFilterState>(defaultFilters);
  const [selectedTariffs, setSelectedTariffs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'matrix' | 'compare'>('table');

  // Memoized filtered data
  const filteredTariffs = useMemo(() =>
    applyFilters(TARIFF_DATA, filters),
    [filters]
  );

  return (
    <TariffContext.Provider value={{
      filters, setFilters,
      selectedTariffs, setSelectedTariffs,
      viewMode, setViewMode,
      filteredTariffs,
      allTariffs: TARIFF_DATA
    }}>
      {children}
    </TariffContext.Provider>
  );
};
```

---

## 5. Integration with Methodology Page

### 5.1 New Section Structure

The methodology page will be restructured with a tabbed navigation:

```tsx
// methodology/page.tsx updates
const METHODOLOGY_TABS = [
  { id: 'energy-view', label: 'Energy View', icon: 'Chart' },
  { id: 'calculator', label: 'Calculator', icon: 'Calculator' },
  { id: 'framework', label: 'Research & Framework', icon: 'Book' },
  { id: 'utility-data', label: 'Utility Data', icon: 'Database', badge: 'New' }
];
```

### 5.2 Utility Data Tab Content

```tsx
<TabContent id="utility-data">
  <Section title="Large Load Tariff Database">
    <TariffExplorer embedded={true} />
  </Section>

  <Section title="Protection Mechanisms Matrix">
    <ProtectionMatrix />
  </Section>

  <Section title="Proposed Tariffs & Regulatory Tracker">
    <ProposedTracker />
  </Section>

  <Section title="ISO/RTO Interconnection Requirements">
    <ISORequirements />
  </Section>
</TabContent>
```

---

## 6. Styling Guidelines

### 6.1 Design Tokens

```css
:root {
  /* Tariff-specific colors */
  --tariff-protection-strong: #15803d;
  --tariff-protection-standard: #86efac;
  --tariff-protection-partial: #fef08a;
  --tariff-protection-none: #f3f4f6;

  /* Status colors */
  --status-filed: #3b82f6;
  --status-review: #eab308;
  --status-comment: #f97316;
  --status-hearing: #a855f7;
  --status-pending: #6b7280;
  --status-approved: #22c55e;
  --status-rejected: #ef4444;

  /* Table styling */
  --table-header-bg: #f8fafc;
  --table-row-hover: #f1f5f9;
  --table-border: #e2e8f0;
}
```

### 6.2 Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Desktop (1280px+) | Full table, side-by-side compare (4 utilities) |
| Tablet (768px-1279px) | Condensed table, compare (2 utilities), horizontal scroll |
| Mobile (<768px) | Card view, single utility compare, accordion sections |

---

## 7. Data Loading Strategy

### 7.1 Static Data (Initial Load)

Core tariff data is bundled with the application:
- `/lib/tariffDatabase.ts` - Static tariff records
- `/lib/protectionMechanisms.ts` - Protection definitions
- `/lib/isoRequirements.ts` - ISO/RTO data

### 7.2 Dynamic Updates (Future)

```typescript
// API route for proposed tariff updates
// /api/tariffs/proposed/route.ts
export async function GET() {
  // Fetch from regulatory API or database
  const proposedTariffs = await fetchProposedTariffs();
  return Response.json(proposedTariffs);
}
```

---

## 8. Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader labels for data tables
- Color-blind safe palette (use patterns in addition to color)
- Focus indicators on all interactive elements
- ARIA labels for complex components

---

## 9. Performance Considerations

- Virtual scrolling for large datasets (100+ rows)
- Debounced search/filter inputs (300ms)
- Memoized filter calculations
- Lazy load comparison utility data
- Code splitting for each major component

---

## 10. File Structure

```
/nextjs-app
├── /app
│   └── /methodology
│       └── page.tsx (updated with tabs)
├── /components
│   └── /tariffs
│       ├── TariffExplorer.tsx
│       ├── TariffTable.tsx
│       ├── TariffFilters.tsx
│       ├── ProtectionMatrix.tsx
│       ├── TariffCompare.tsx
│       ├── ProposedTracker.tsx
│       ├── ISORequirements.tsx
│       └── index.ts
├── /contexts
│   └── TariffContext.tsx
├── /lib
│   ├── tariffDatabase.ts
│   ├── protectionMechanisms.ts
│   ├── isoRequirements.ts
│   └── tariffHelpers.ts
└── /styles
    └── tariffs.css
```

---

## 11. Implementation Phases

### Phase 1: Core Data Layer (Week 1)
- Create TypeScript types
- Populate tariffDatabase.ts from Excel
- Create protectionMechanisms.ts
- Create isoRequirements.ts

### Phase 2: Basic Components (Week 2)
- TariffTable with sorting
- TariffFilters panel
- Basic ProtectionMatrix

### Phase 3: Advanced Features (Week 3)
- TariffCompare functionality
- ProposedTracker with status
- ISORequirements accordion
- Context and state management

### Phase 4: Integration (Week 4)
- Methodology page restructuring
- Navigation updates
- Responsive design polish
- Accessibility audit

---

## 12. Testing Strategy

### Unit Tests
- Filter logic functions
- Data transformation helpers
- Protection mechanism calculations

### Integration Tests
- Component rendering with data
- Filter state propagation
- Tab navigation

### E2E Tests
- Full user workflow: browse → filter → compare
- Export functionality
- Mobile responsiveness

---

## 13. Future Enhancements

1. **Real-time Regulatory Updates**: Connect to PUC/FERC docket APIs
2. **User Annotations**: Allow logged-in users to save notes on tariffs
3. **Cost Calculator Integration**: Link tariff data to main calculator
4. **PDF Export**: Generate formatted tariff comparison reports
5. **Email Alerts**: Notify users of proposed tariff changes in their region
6. **API Access**: Provide API endpoints for external tools

---

*Document Version: 1.0*
*Last Updated: January 31, 2026*
*Author: Power Insight Development Team*
