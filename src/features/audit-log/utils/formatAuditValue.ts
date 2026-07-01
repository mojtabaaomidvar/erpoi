// src/features/audit-log/utils/formatAuditValue.ts

/**
 * تبدیل مقادیر به شکل human-readable
 */
export function formatAuditValue(value: any, maxLength = 80): string {
  if (value === undefined || value === null) {
    return '—';
  }

  // Primitive types
  if (typeof value === 'string') {
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // Array
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    
    // اگر آرایه از object ها با id هست
    if (value[0] && typeof value[0] === 'object' && value[0].id) {
      const items = value.map((item: any) => {
        const name = item.name_en || item.name || item.contract_no || item.title || item.id;
        return name;
      });
      const result = items.join(', ');
      return result.length > maxLength ? result.substring(0, maxLength) + '...' : result;
    }
    
    // آرایه ساده
    const result = value.map(v => String(v)).join(', ');
    return result.length > maxLength ? result.substring(0, maxLength) + '...' : result;
  }

  // Object
  if (typeof value === 'object') {
    // اگر object با id هست (مثل contact person)
    if (value.id) {
      const parts: string[] = [];
      if (value.name_en) parts.push(value.name_en);
      if (value.name) parts.push(value.name);
      if (value.position) parts.push(value.position);
      if (value.email) parts.push(value.email);
      if (value.mobile) parts.push(value.mobile);
      
      return parts.length > 0 ? parts.join(' • ') : JSON.stringify(value);
    }
    
    // object عمومی - فقط فیلدهای مهم
    const importantKeys = ['name', 'name_en', 'name_fa', 'title', 'status', 'type', 'id'];
    const parts: string[] = [];
    
    for (const key of importantKeys) {
      if (value[key]) {
        parts.push(`${key}: ${value[key]}`);
      }
    }
    
    if (parts.length > 0) {
      const result = parts.join(', ');
      return result.length > maxLength ? result.substring(0, maxLength) + '...' : result;
    }
    
    // fallback به JSON
    const json = JSON.stringify(value);
    return json.length > maxLength ? json.substring(0, maxLength) + '...' : json;
  }

  return String(value);
}

/**
 * فرمت کردن نام فیلد به شکل readable
 * مثال: "name_en" -> "Name En", "contactPersons" -> "Contact Persons"
 */
export function formatFieldName(field: string): string {
  // تبدیل camelCase/snake_case به Title Case
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}