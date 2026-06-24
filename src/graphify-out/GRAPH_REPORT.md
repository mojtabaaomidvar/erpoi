# Graph Report - src  (2026-06-24)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 240 nodes · 657 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87264a70`
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
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 36 edges
2. `Button()` - 19 edges
3. `cn()` - 19 edges
4. `formatCurrency()` - 19 edges
5. `Contract` - 18 edges
6. `Badge()` - 17 edges
7. `Client` - 13 edges
8. `calculateDaysLeft()` - 11 edges
9. `Card()` - 10 edges
10. `Modal()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `AppContent()` --calls--> `useTheme()`  [EXTRACTED]
  App.tsx → contexts/ThemeContext.tsx
- `AppContent()` --calls--> `usePersistedState()`  [EXTRACTED]
  App.tsx → hooks/usePersistedState.ts
- `Sidebar()` --calls--> `useTheme()`  [EXTRACTED]
  components/Sidebar.tsx → contexts/ThemeContext.tsx
- `ClientDetails()` --calls--> `useTheme()`  [EXTRACTED]
  views/clients/components/ClientDetails.tsx → contexts/ThemeContext.tsx
- `ClientEditModal()` --calls--> `useTheme()`  [EXTRACTED]
  views/clients/components/ClientEditModal.tsx → contexts/ThemeContext.tsx

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (25): Avatar(), AvatarProps, Button(), ButtonProps, ButtonVariant, CardHeader(), CardHeaderProps, DuplicateWarningModal() (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (27): ClientDetails(), ContractDetails(), ContractDetailsModal(), contractTariffs, useClickOutside(), calculateDaysLeft(), calculateDaysProgress(), calculateInvoiceProgress() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (28): ClientSelectorProps, ATTACHMENT_CATEGORIES, ContractAttachment, ContractAttachmentsEditor(), ContractAttachmentsEditorProps, ncrs, getNextJalaaliYearStart(), Adjustment (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (24): AppContent(), meta, Badge(), BadgeProps, BadgeTone, Card(), CardProps, StatusPill() (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (26): ClientSelectorModal(), ClientSelectorModalProps, ContractForm(), ContractList(), Header(), HeaderProps, JalaaliDatePicker(), JalaaliDatePickerProps (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (21): ClientDetailsProps, ClientEditModal(), ClientEditModalProps, ClientForm(), ClientFormProps, ClientList(), ClientListProps, ContractDetailsProps (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (6): navItems, Sidebar(), SidebarProps, ViewKey, VIEW_META, ViewMeta

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (4): CONTRACT_STATUSES, CONTRACT_TYPES, ContractStatusType, ContractType

### Community 8 - "Community 8"
Cohesion: 0.32
Nodes (4): loadFromStorage(), saveToStorage(), storage, STORAGE_KEYS

## Knowledge Gaps
- **58 isolated node(s):** `meta`, `ClientSelectorProps`, `ClientSelectorModalProps`, `ContractAttachment`, `ATTACHMENT_CATEGORIES` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Badge()` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `meta`, `ClientSelectorProps`, `ClientSelectorModalProps` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08367071524966262 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07357357357357357 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09747899159663866 - nodes in this community are weakly interconnected._