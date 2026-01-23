import type { RawLog, ParsedLog } from '../../types';
import { logError } from '../../utils/ErrorLogger';
import { logger } from '../../utils/logger';

export class LogParser {
  parse(raw: RawLog): ParsedLog {
    try {
      // Try to parse as JSON first (structured logs)
      const structured = this.tryParseJSON(raw.message);
      
      if (structured) {
        return {
          ...raw,
          level: structured.level || structured.severity,
          component: structured.component || structured.service,
          structured,
        };
      }

      // Parse common log formats
      const parsed = this.parseCommonFormats(raw.message);
      
      return {
        ...raw,
        ...parsed,
      };
    } catch (error) {
      logError('Failed to parse log:', error);
      return raw;
    }
  }

  private tryParseJSON(message: string): Record<string, unknown> | null {
    try {
      return JSON.parse(message);
    } catch {
      return null;
    }
  }

  private parseCommonFormats(message: string): Partial<ParsedLog> {
    // Apache/Nginx format: [timestamp] [level] message
    const apacheMatch = message.match(/^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)$/);
    if (apacheMatch) {
      return {
        level: apacheMatch[2],
        message: apacheMatch[3],
      };
    }

    // Syslog format: timestamp hostname service[pid]: message
    const syslogMatch = message.match(/^(\w+\s+\d+\s+[\d:]+)\s+(\S+)\s+(\S+)\[(\d+)\]:\s*(.+)$/);
    if (syslogMatch) {
      return {
        component: syslogMatch[3],
        message: syslogMatch[5],
      };
    }

    // Spring Boot format: timestamp LEVEL [component] - message
    const springMatch = message.match(/^([\d-]+\s+[\d:,]+)\s+(\w+)\s+\[([^\]]+)\]\s*-\s*(.+)$/);
    if (springMatch) {
      return {
        level: springMatch[2],
        component: springMatch[3],
        message: springMatch[4],
      };
    }

    return {};
  }
}