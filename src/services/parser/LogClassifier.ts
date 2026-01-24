import type { ParsedLog, ClassifiedLog, LogSeverity } from '../../types';
import { LogSeverity as LogSeverityEnum } from '../../types';
import { 
  getMatchingErrors,
  getErrorSeverity,
  matchesCriticalError,
} from './patterns/error.patterns';
import { 
  getMatchingWarnings,
  matchesWarningPattern,
} from './patterns/warning.patterns';
import { matchesInfoPattern } from './patterns/info.patterns';

export class LogClassifier {
  classify(parsed: ParsedLog): ClassifiedLog {
    const severity = this.determineSeverity(parsed);
    const patterns = this.matchPatterns(parsed);
    const metadata = this.extractMetadata(parsed, severity, patterns);

    return {
      ...parsed,
      severity,
      patterns,
      metadata,
    };
  }

  private determineSeverity(log: ParsedLog): LogSeverity {
    const message = log.message.toLowerCase();
    const level = log.level?.toUpperCase();

    // Check explicit level first
    if (level === 'CRITICAL' || level === 'FATAL') return LogSeverityEnum.CRITICAL;
    if (level === 'ERROR') return LogSeverityEnum.ERROR;
    if (level === 'WARNING' || level === 'WARN') return LogSeverityEnum.WARNING;
    if (level === 'INFO') return LogSeverityEnum.INFO;
    if (level === 'DEBUG' || level === 'TRACE') return LogSeverityEnum.DEBUG;

    // Check stderr stream
    if (log.stream === 'stderr') {
      // Check if it's critical
      if (matchesCriticalError(message)) return LogSeverityEnum.CRITICAL;
      return LogSeverityEnum.ERROR;
    }

    // Use helper functions for pattern matching
    const errorSeverity = getErrorSeverity(message);
    if (errorSeverity === 'CRITICAL') return LogSeverityEnum.CRITICAL;
    if (errorSeverity === 'ERROR') return LogSeverityEnum.ERROR;

    if (matchesWarningPattern(message)) return LogSeverityEnum.WARNING;
    if (matchesInfoPattern(message)) return LogSeverityEnum.INFO;

    return LogSeverityEnum.INFO; // Default to INFO
  }

  private matchPatterns(log: ParsedLog): string[] {
    const message = log.message.toLowerCase();
    const matched: string[] = [];

    // Get error patterns with category info
    const errorMatches = getMatchingErrors(message);
    if (errorMatches.patterns.length > 0) {
      matched.push(...errorMatches.patterns.map(p => `error:${p}`));
      if (errorMatches.category) {
        matched.push(`category:${errorMatches.category}`);
      }
    }

    // Get warning patterns
    const warningMatches = getMatchingWarnings(message);
    matched.push(...warningMatches.map(p => `warning:${p}`));

    return matched;
  }

  private extractMetadata(log: ParsedLog, severity: LogSeverity, patterns: string[]) {
    const isError = severity === LogSeverityEnum.ERROR || severity === LogSeverityEnum.CRITICAL;
    const isCritical = severity === LogSeverityEnum.CRITICAL;
    
    // Determine if action is required
    const requiresAction = 
      isCritical || 
      patterns.some(p => 
        p.includes('timeout') || 
        p.includes('connection') ||
        p.includes('outOfMemory') ||
        p.includes('diskFull')
      );

    const tags: string[] = [];
    if (log.component) tags.push(`component:${log.component}`);
    if (log.containerName) tags.push(`container:${log.containerName}`);
    tags.push(`severity:${severity}`);
    
    // Add category tags
    const categoryTag = patterns.find(p => p.startsWith('category:'));
    if (categoryTag) tags.push(categoryTag);

    return {
      isError,
      isCritical,
      requiresAction,
      tags,
    };
  }
}