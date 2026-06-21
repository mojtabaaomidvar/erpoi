# Graph Report - src  (2026-06-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 187 nodes · 332 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a27fe2c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 19 edges
2. `useTheme()` - 14 edges
3. `Badge()` - 9 edges
4. `Button()` - 9 edges
5. `Card()` - 9 edges
6. `formatCurrency()` - 9 edges
7. `StatusPill()` - 6 edges
8. `Avatar()` - 5 edges
9. `CardHeader()` - 5 edges
10. `Contracts()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `AppContent()` --calls--> `useTheme()`  [EXTRACTED]
  App.tsx → contexts/ThemeContext.tsx
- `Sidebar()` --calls--> `cn()`  [EXTRACTED]
  components/Sidebar.tsx → lib/cn.ts
- `ClientSelectorModal()` --calls--> `useTheme()`  [EXTRACTED]
  views/Contracts.tsx → contexts/ThemeContext.tsx
- `Contracts()` --calls--> `useTheme()`  [EXTRACTED]
  views/Contracts.tsx → contexts/ThemeContext.tsx
- `JalaaliDatePicker()` --calls--> `useTheme()`  [EXTRACTED]
  views/Contracts.tsx → contexts/ThemeContext.tsx

## Import Cycles
- None detected.

## Communities (14 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (19): AppContent(), meta, Header(), HeaderProps, navItems, Sidebar(), SidebarProps, ViewKey (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (20): ClientSelectorProps, Client, clients, ContactPerson, Contract, contracts, contractTariffs, Inspection (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (14): calculateDaysLeft(), Client, ClientSelectorModalProps, Contract, Contracts(), CURRENCIES, generateContractNo(), getContractFinancialStatus() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (16): Avatar(), AvatarProps, Button(), ButtonProps, ButtonVariant, Card(), CardProps, CardHeader() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (14): Badge(), BadgeProps, BadgeTone, StatusPill(), StatusPillProps, StatusType, inspectors, contractHealth() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (8): VirtualClientListProps, exportToExcel(), calculatePerformedWorkValue(), calculateTotalInvoicedFromTariffs(), calculateUninvoicedWork(), Client, ContactPerson, Contract

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (9): Theme, ThemeContext, ThemeContextType, useTheme(), colors, themeColors, borderRadius, spacing (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (4): CONTRACT_STATUSES, CONTRACT_TYPES, ContractStatusType, ContractType

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (3): TariffEditorProps, TariffLine, UNITS

## Knowledge Gaps
- **55 isolated node(s):** `meta`, `ClientSelectorProps`, `HeaderProps`, `JalaaliDatePickerProps`, `SidebarProps` (+50 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 3` to `Community 0`, `Community 4`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `Community 0` to `Community 2`, `Community 5`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Badge()` connect `Community 4` to `Community 1`, `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `meta`, `ClientSelectorProps`, `HeaderProps` to the rest of the system?**
  _55 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08262108262108261 - nodes in this community are weakly interconnected._