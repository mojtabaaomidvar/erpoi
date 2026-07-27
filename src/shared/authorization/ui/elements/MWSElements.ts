// src/shared/authorization/ui/elements/MWSElements.ts
// ═══════════════════════════════════════
// 🚢 MWS Permission Elements
// ═══════════════════════════════════════

import type { UIModuleElements } from "../types";

/**
 * Stub file - MWS elements will be defined in Phase 2
 * بر اساس جریان کار MWS:
 * Agreement → Project → MWS Request → Engineering Review → Risk Assessment →
 * Inspector Assignment → Offshore Attendance → Fleet Survey → Certificate →
 * Daily Reports → Observation/NCR → Final Closeout
 */
export const MWSElements: UIModuleElements = {
  MWSList: {
    list_item_view: {
      id: "mws_list_item_view",
      label: "View MWS Requests List",
      type: "page",
      requires: [],
    },
  },
};
