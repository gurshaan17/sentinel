import type { ParsedLog, ClassifiedLog, LogSeverity } from '../../types';
import { errorPatterns } from './patterns/error.patterns';
import { warningPatterns } from './patterns/warning.patterns';

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

    // Check explicit level
    if (level === 'CRITICAL' || level === 'FATAL') return "CRITICAL";
    if (level === 'ERROR') return 'ERROR';
    if (level === 'WARNING' || level === 'WARN') return 'WARNING';
    if (level === 'INFO') return 'INFO';
    if (level === 'DEBUG' || level === 'TRACE') return 'DEBUG';

    // Check stderr stream
    if (log.stream === 'stderr') return 'ERROR';

    // Pattern matching
    if (errorPatterns.some(p => p.test(message))) return 'ERROR';
    if (warningPatterns.some(p => p.test(message))) return 'WARNING';

    return 'INFO';
  }

  private matchPatterns(log: ParsedLog): string[] {
    const message = log.message.toLowerCase();
    const matched: string[] = [];

    // Check error patterns
    for (const [name, pattern] of Object.entries(errorPatterns)) {
      if (pattern.test(message)) {
        matched.push(`error:${name}`);
      }
    }

    // Check warning patterns
    for (const [name, pattern] of Object.entries(warningPatterns)) {
      if (pattern.test(message)) {
        matched.push(`warning:${name}`);
      }
    }

    return matched;
  }

  private extractMetadata(log: ParsedLog, severity: LogSeverity, patterns: string[]) {
    const isError = severity === 'ERROR' || severity === 'CRITICAL';
    const requiresAction = isError || patterns.some(p => p.includes('timeout') || p.includes('connection'));

    const tags: string[] = [];
    if (log.component) tags.push(`component:${log.component}`);
    if (log.containerName) tags.push(`container:${log.containerName}`);
    tags.push(`severity:${severity}`);

    return {
      isError,
      requiresAction,
      tags,
    };
  }
}