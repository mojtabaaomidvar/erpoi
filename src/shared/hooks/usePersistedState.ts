// src/shared/hooks/usePersistedState.ts
import { useState, useEffect, useRef } from 'react';
import { eventBus } from '@infra/events';

const STORAGE_EVENT_MAP: Record<string, string> = {
  'ics_clients': 'storage.clients.changed',
  'ics_contracts': 'storage.contracts.changed',
  'ics_inspections': 'storage.inspections.changed',
  'ics_inspectors': 'storage.inspectors.changed',
  'ics_invoices': 'storage.invoices.changed',
  'ics_ncrs': 'storage.ncrs.changed',
  'ics_settings': 'storage.settings.changed',
  'ics_notifications': 'storage.notifications.changed',
  'ics_theme': 'system.theme.changed',
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error(`[Storage] Failed to load ${key}:`, error);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[Storage] Failed to save ${key}:`, error);
  }
}

/**
 *  Deep Diff - تشخیص دقیق تغییرات حتی در آرایه‌ها و object های تو در تو
 */
type DiffResult = {
  type: 'primitive' | 'array' | 'object';
  before: any;
  after: any;
  // برای آرایه‌ها
  added?: any[];
  removed?: any[];
  updated?: Array<{ id?: string; before: any; after: any; fieldChanges?: FieldChange[] }>;
  // برای object ها
  fieldChanges?: FieldChange[];
};

type FieldChange = {
  field: string;
  before: any;
  after: any;
  // اگر فیلد خودش آرایه یا object باشه
  diff?: DiffResult;
};

function deepDiff(before: any, after: any): DiffResult {
  // اگر هر دو primitive هستن
  if (before === after) {
    return { type: 'primitive', before, after };
  }

  // اگر یکی آرایه و دیگری نه
  if (Array.isArray(before) !== Array.isArray(after)) {
    return { type: 'primitive', before, after };
  }

  // اگر هر دو آرایه هستن
  if (Array.isArray(before) && Array.isArray(after)) {
    return diffArrays(before, after);
  }

  // اگر هر دو object هستن
  if (typeof before === 'object' && typeof after === 'object') {
    return diffObjects(before, after);
  }

  // primitive های متفاوت
  return { type: 'primitive', before, after };
}

function diffArrays(before: any[], after: any[]): DiffResult {
  // اگر آیتم‌ها id دارن (مثل contactPersons)
  const beforeIds = new Set(before.map((item: any) => item?.id).filter(Boolean));
  const afterIds = new Set(after.map((item: any) => item?.id).filter(Boolean));

  const added = after.filter((item: any) => item?.id && !beforeIds.has(item.id));
  const removed = before.filter((item: any) => item?.id && !afterIds.has(item.id));
  
  const updated = after
    .filter((item: any) => {
      if (!item?.id) return false;
      const prevItem = before.find((p: any) => p.id === item.id);
      return prevItem && JSON.stringify(prevItem) !== JSON.stringify(item);
    })
    .map((item: any) => {
      const prevItem = before.find((p: any) => p.id === item.id);
      const fieldChanges = getObjectFieldChanges(prevItem, item);
      return {
        id: item.id,
        before: prevItem,
        after: item,
        fieldChanges,
      };
    });

  // اگر هیچ id ای نداشتن، کل آرایه رو مقایسه کن
  if (beforeIds.size === 0 && afterIds.size === 0) {
    return {
      type: 'array',
      before,
      after,
      added: after.filter((item, idx) => JSON.stringify(item) !== JSON.stringify(before[idx])),
      removed: before.filter((item, idx) => JSON.stringify(item) !== JSON.stringify(after[idx])),
    };
  }

  return {
    type: 'array',
    before,
    after,
    added,
    removed,
    updated,
  };
}

function diffObjects(before: any, after: any): DiffResult {
  const fieldChanges = getObjectFieldChanges(before, after);
  return {
    type: 'object',
    before,
    after,
    fieldChanges,
  };
}

function getObjectFieldChanges(before: any, after: any): FieldChange[] {
  const changes: FieldChange[] = [];
  if (!before || !after) return changes;

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  allKeys.forEach(key => {
    const oldVal = before[key];
    const newVal = after[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      const fieldChange: FieldChange = {
        field: key,
        before: oldVal,
        after: newVal,
      };

      // اگر فیلد آرایه یا object هست، deep diff بزن
      if (
        (Array.isArray(oldVal) && Array.isArray(newVal)) ||
        (typeof oldVal === 'object' && typeof newVal === 'object')
      ) {
        fieldChange.diff = deepDiff(oldVal, newVal);
      }

      changes.push(fieldChange);
    }
  });

  return changes;
}

function detectChanges<T>(prev: T, current: T): any {
  // برای primitive values
  if (!Array.isArray(prev) || !Array.isArray(current)) {
    return {
      type: 'primitive_change',
      oldValue: prev,
      newValue: current,
    };
  }

  // برای آرایه‌ها
  const prevIds = new Set(prev.map((item: any) => item.id).filter(Boolean));
  const currentIds = new Set(current.map((item: any) => item.id).filter(Boolean));

  const added = current.filter((item: any) => item.id && !prevIds.has(item.id));
  const removed = prev.filter((item: any) => item.id && !currentIds.has(item.id));

  const updated = current
    .filter((item: any) => {
      if (!item.id) return false;
      const prevItem = prev.find((p: any) => p.id === item.id);
      return prevItem && JSON.stringify(prevItem) !== JSON.stringify(item);
    })
    .map((item: any) => {
      const prevItem = prev.find((p: any) => p.id === item.id);
      // ✅ استفاده از deepDiff برای تشخیص دقیق تغییرات
      const fieldChanges = getObjectFieldChanges(prevItem, item);
      return {
        id: item.id,
        before: prevItem,
        after: item,
        fieldChanges, // ✅ حالا شامل deep diff هم میشه
      };
    });

  if (added.length > 0 && removed.length === 0 && updated.length === 0) {
    return { type: 'created', added };
  }
  if (removed.length > 0 && added.length === 0 && updated.length === 0) {
    return { type: 'deleted', removed };
  }
  if (updated.length > 0 && added.length === 0 && removed.length === 0) {
    return { type: 'updated', updated };
  }

  return { type: 'bulk_change', added, updated, removed };
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => loadFromStorage(key, defaultValue));
  const prevStateRef = useRef<T>(state);
  const isFirstRender = useRef(true);

  useEffect(() => {
    saveToStorage(key, state);

    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevStateRef.current = state;
      return;
    }

    if (JSON.stringify(prevStateRef.current) !== JSON.stringify(state)) {
      const eventType = STORAGE_EVENT_MAP[key] || `storage.${key.replace('ics_', '')}.changed`;
      const changeInfo = detectChanges(prevStateRef.current, state);

      console.log(`🔍 [Storage] Change detected in ${key}:`, changeInfo);

      eventBus.publish({
        type: eventType as any,
        payload: {
          storageKey: key,
          changeType: changeInfo.type,
          added: changeInfo.added,
          updated: changeInfo.updated,
          removed: changeInfo.removed,
          oldValue: changeInfo.oldValue,
          newValue: changeInfo.newValue,
          count: Array.isArray(state) ? state.length : undefined,
        },
        timestamp: new Date(),
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'storage-layer',
      });

      prevStateRef.current = state;
    }
  }, [key, state]);

  return [state, setState];
}