// src/features/audit-log/services/AuditLogService.ts
import { DomainEvent } from '@infra/events';
import {
  AuditLogEntry,
  AuditLogFilter,
  AuditLogLevel,
  AuditActorType,
  IAuditLogService,
} from '../types';

const STORAGE_KEY = 'ics_audit_log';
const ARCHIVE_KEY = 'ics_audit_log_archive';
const MAX_ENTRIES = 1000;

const USERS: Record<string, { name: string; department: string }> = {
  'user_001': { name: 'Ali Rezai', department: 'Contracts' },
  'user_002': { name: 'Sara Mohammadi', department: 'Inspections' },
  'user_003': { name: 'Reza Hosseini', department: 'Finance' },
  'admin': { name: 'System Administrator', department: 'IT' },
};

class AuditLogService implements IAuditLogService {
  private static instance: AuditLogService;
  private logs: AuditLogEntry[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  log(event: DomainEvent, metadata?: Record<string, unknown>): AuditLogEntry {
    const actorType: AuditActorType = !event.userId && (
      event.source === 'system' ||
      event.type.startsWith('system.') ||
      event.type.includes('expired') ||
      event.type.includes('overdue') ||
      event.type.includes('auto')
    ) ? 'system' : 'user';

    let userName = '';
    let userDepartment = '';
    
    if (event.userId && USERS[event.userId]) {
      userName = USERS[event.userId].name;
      userDepartment = USERS[event.userId].department;
    } else if (event.userId) {
      userName = `User ${event.userId}`;
      userDepartment = 'Unknown';
    } else if (actorType === 'system') {
      userName = 'System';
      userDepartment = 'Automated';
    } else {
      userName = 'Unknown User';
      userDepartment = 'Unknown';
    }

    const entry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: event.type,
      title: this.generateTitle(event.type),
      description: this.generateDescription(event),
      level: this.inferLevel(event.type),
      actorType,
      payload: event.payload,
      source: event.source,
      userId: event.userId,
      userName,
      userDepartment,
      ipAddress: this.getMockIP(), // ✅ اضافه شد
      correlationId: event.correlationId,
      timestamp: event.timestamp,
      metadata,
    };

    this.logs.unshift(entry);

    // ✅ Auto-archive when exceeding limit
    if (this.logs.length > MAX_ENTRIES) {
      this.archiveOldLogs();
    }

    this.saveToStorage();
    return entry;
  }

  getAll(): AuditLogEntry[] {
    return [...this.logs];
  }

  getFiltered(filter: AuditLogFilter): AuditLogEntry[] {
    return this.logs.filter((log) => {
      if (filter.eventType && log.eventType !== filter.eventType) return false;
      if (filter.level && log.level !== filter.level) return false;
      if (filter.actorType && log.actorType !== filter.actorType) return false;
      if (filter.fromDate && log.timestamp < filter.fromDate) return false;
      if (filter.toDate && log.timestamp > filter.toDate) return false;
      
      if (filter.search) {
        const search = filter.search.toLowerCase();
        const searchableText = [
          log.title,
          log.description,
          log.eventType,
          log.source,
          log.userName,
          log.userDepartment,
          JSON.stringify(log.payload),
        ]
          .join(' ')
          .toLowerCase();
        
        if (!searchableText.includes(search)) return false;
      }
      
      return true;
    });
  }

  getById(id: string): AuditLogEntry | undefined {
    return this.logs.find((log) => log.id === id);
  }

  clear(): void {
    this.logs = [];
    this.saveToStorage();
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * ✅ Archive old logs when exceeding limit
   */
  private archiveOldLogs(): void {
    const archivedLogs = this.logs.slice(MAX_ENTRIES);
    
    try {
      const existingArchive = localStorage.getItem(ARCHIVE_KEY);
      const archive = existingArchive ? JSON.parse(existingArchive) : [];
      archive.push(...archivedLogs);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
      
      this.logs = this.logs.slice(0, MAX_ENTRIES);
      console.log(`📦 Archived ${archivedLogs.length} old logs`);
    } catch (error) {
      console.error('[AuditLog] Failed to archive logs:', error);
    }
  }

  /**
   * ✅ Get all archived logs
   */
  getArchivedLogs(): AuditLogEntry[] {
    try {
      const stored = localStorage.getItem(ARCHIVE_KEY);
      if (stored) {
        return JSON.parse(stored).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }
    } catch (error) {
      console.error('[AuditLog] Failed to load archived logs:', error);
    }
    return [];
  }

  /**
   * ✅ Export all logs (current + archived)
   */
  exportAll(): string {
    const allLogs = [...this.logs, ...this.getArchivedLogs()];
    return JSON.stringify(allLogs, null, 2);
  }

  private getMockIP(): string {
    // Mock IP for demo purposes
    const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.25'];
    return ips[Math.floor(Math.random() * ips.length)];
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }
    } catch (error) {
      console.error('[AuditLog] Failed to load from storage:', error);
      this.logs = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('[AuditLog] Failed to save to storage:', error);
    }
  }

  private toTitleCase(str: string): string {
    return str
      .split(/[.\-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private generateTitle(eventType: string): string {
    const titleMap: Record<string, string> = {
      'client.created': 'Client Created',
      'client.updated': 'Client Updated',
      'client.deleted': 'Client Deleted',
      'storage.clients.changed': 'Clients Data Changed',
      'storage.contracts.changed': 'Contracts Data Changed',
      'storage.inspections.changed': 'Inspections Data Changed',
      'storage.inspectors.changed': 'Inspectors Data Changed',
      'storage.invoices.changed': 'Invoices Data Changed',
      'storage.ncrs.changed': 'NCR Data Changed',
      'storage.settings.changed': 'Settings Changed',
      'system.theme.changed': 'Theme Changed',
    };

    return titleMap[eventType] || this.toTitleCase(eventType);
  }

	private generateDescription(event: DomainEvent): string {
	  const payload = event.payload as any;
	  
	  // برای Storage Events
	  if (event.type.startsWith('storage.') || event.type.startsWith('system.')) {
		const entity = event.type.split('.')[1];
		const entityName = entity.charAt(0).toUpperCase() + entity.slice(1);
		
		// Primitive change (مثل تم)
		if (payload.changeType === 'primitive_change') {
		  return `${entityName} changed from "${payload.oldValue}" to "${payload.newValue}"`;
		}
		
		// Updated items - نمایش تعداد فیلدهای تغییر کرده
		if (payload.changeType === 'updated' && payload.updated) {
		  const totalFieldChanges = payload.updated.reduce(
			(sum: number, item: any) => sum + (item.fieldChanges?.length || 0), 
			0
		  );
		  return `${entityName} updated: ${payload.updated.length} item(s), ${totalFieldChanges} field(s) changed`;
		}
		
		// Array changes
		switch (payload.changeType) {
		  case 'created':
			return `New ${entityName} record(s) added: ${payload.added?.length || 0} item(s)`;
		  case 'deleted':
			return `${entityName} record(s) removed: ${payload.removed?.length || 0} item(s)`;
		  case 'bulk_change':
			return `Bulk change in ${entityName}: ${payload.added?.length || 0} added, ${payload.updated?.length || 0} updated, ${payload.removed?.length || 0} removed`;
		  default:
			return `${entityName} data modified`;
		}
	  }
	  
	  const parts: string[] = [];
	  if (payload.clientId) parts.push(`Client ID: ${payload.clientId}`);
	  if (payload.clientName) parts.push(`Name: ${payload.clientName}`);
	  if (payload.contractId) parts.push(`Contract ID: ${payload.contractId}`);
	  
	  return parts.join(' | ') || 'No additional details';
	}
	
	private inferLevel(eventType: string): AuditLogLevel {
		if (eventType.includes('expired') || eventType.includes('overdue') || eventType.includes('deleted')) {
		  return 'error';
		}
		if (eventType.includes('expiring') || eventType.includes('warning') || eventType.includes('duplicated')) {
		  return 'warning';
		}
		if (eventType.includes('completed') || eventType.includes('paid') || eventType.includes('resolved') || eventType.includes('created')) {
		  return 'success';
		}
		return 'info';
	}
}

export const auditLogService = AuditLogService.getInstance();