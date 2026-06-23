# Graph Report - src  (2026-06-23)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 232 nodes · 558 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2c8c09d`
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
1. `useTheme()` - 25 edges
2. `cn()` - 19 edges
3. `formatCurrency()` - 16 edges
4. `Button()` - 14 edges
5. `Badge()` - 13 edges
6. `calculateDaysLeft()` - 10 edges
7. `getDaysUntilStart()` - 10 edges
8. `Contract` - 10 edges
9. `Card()` - 9 edges
10. `ContractDetails()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `ClientSelectorModal()` --calls--> `useTheme()`  [EXTRACTED]
  components/ClientSelectorModal.tsx → contexts/ThemeContext.tsx
- `TariffEditor()` --calls--> `useTheme()`  [EXTRACTED]
  components/TariffEditor.tsx → contexts/ThemeContext.tsx
- `ContractDetails()` --calls--> `useTheme()`  [EXTRACTED]
  views/contracts/components/ContractDetails.tsx → contexts/ThemeContext.tsx
- `ContractForm()` --calls--> `useTheme()`  [EXTRACTED]
  views/contracts/components/ContractForm.tsx → contexts/ThemeContext.tsx
- `ContractList()` --calls--> `useTheme()`  [EXTRACTED]
  views/contracts/components/ContractList.tsx → contexts/ThemeContext.tsx

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (26): Avatar(), AvatarProps, BadgeProps, BadgeTone, ButtonProps, ButtonVariant, CardProps, CardHeaderProps (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (30): ClientSelectorProps, ClientSelectorModal(), ClientSelectorModalProps, clients, contracts, inspectorPerformance, ncrs, getNextJalaaliYearStart() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (25): ContractDetails(), ContractDetailsProps, ContractFormProps, ContractListProps, contractTariffs, calculateDaysLeft(), calculateDaysProgress(), calculateInvoiceProgress() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (22): AppContent(), meta, Header(), HeaderProps, JalaaliDatePicker(), JalaaliDatePickerProps, navItems, Sidebar() (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (12): VirtualClientListProps, exportToExcel(), formatDate(), validateMobile(), validateNationalCode(), validateNationalId(), calculatePerformedWorkValue(), calculateTotalInvoicedFromTariffs() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (18): ATTACHMENT_CATEGORIES, ContractAttachment, ContractAttachmentsEditor(), ContractAttachmentsEditorProps, ContractForm(), ContractList(), CURRENCIES, TariffEditor() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (15): Badge(), Button(), Card(), CardHeader(), StatusPill(), inspections, inspectionsByDiscipline, inspectionsByMonth (+7 more)

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

- **Why does `useTheme()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 0` to `Community 2`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Badge()` connect `Community 6` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `meta`, `ClientSelectorProps`, `ClientSelectorModalProps` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07665505226480836 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1497326203208556 - nodes in this community are weakly interconnected._