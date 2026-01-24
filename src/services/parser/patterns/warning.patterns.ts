
export const warningPatterns = {
    // Performance warnings
    slowQuery: /slow query|query.*took.*\d+ms|execution time exceeded/i,
    highLatency: /high latency|latency.*exceeded|response.*slow/i,
    slowResponse: /slow response|timeout warning|taking longer than expected/i,
    
    // Resource warnings
    highMemory: /memory usage.*high|approaching memory limit|memory.*\d+%/i,
    highCpu: /cpu usage.*high|high cpu load|cpu.*\d+%/i,
    diskSpace: /disk space.*low|running out of disk|disk.*\d+%.*full/i,
    highLoad: /high load average|load.*exceeded|system load/i,
    
    // Connection warnings
    connectionPoolLow: /connection pool.*low|few connections available|pool.*exhausted/i,
    connectionRetry: /retrying connection|connection attempt|reconnecting/i,
    connectionSlow: /slow connection|connection.*slow|network.*degraded/i,
    
    // Database warnings
    deadlockWarning: /deadlock detected|deadlock warning|lock timeout/i,
    replicationLag: /replication lag|replica.*behind|sync.*delayed/i,
    queryTimeout: /query timeout|statement timeout|execution.*cancelled/i,
    
    // Cache warnings
    cacheMiss: /cache miss|cache.*not found|cache.*expired/i,
    cacheEviction: /cache eviction|cache.*full|evicting.*entries/i,
    
    // API warnings
    rateLimitApproaching: /approaching rate limit|rate limit.*warning|\d+% of rate limit/i,
    deprecation: /deprecated|deprecation warning|will be removed/i,
    apiVersionOld: /old api version|api.*outdated|upgrade.*api/i,
    
    // Authentication warnings
    authRetry: /authentication retry|auth.*attempt|login attempt/i,
    tokenExpiring: /token expiring|token.*expire soon|refresh.*token/i,
    sessionExpiring: /session expiring|session.*timeout|logout.*soon/i,
    
    // Configuration warnings
    configMissing: /config.*missing|configuration.*not found|default.*config/i,
    configDeprecated: /config.*deprecated|setting.*obsolete|parameter.*old/i,
    
    // File system warnings
    fileNotFound: /file not found|missing file|cannot find file/i,
    permissionIssue: /permission warning|access.*limited|insufficient.*permissions/i,
    
    // Network warnings
    dnsWarning: /dns.*warning|dns.*slow|name resolution.*slow/i,
    tlsWarning: /tls.*warning|ssl.*warning|certificate.*expiring/i,
    
    // Queue warnings
    queueSize: /queue size.*large|queue.*growing|backlog.*increasing/i,
    messageDelay: /message.*delayed|processing.*slow|consumer.*lagging/i,
    
    // Service warnings
    serviceUnavailable: /service temporarily unavailable|service.*degraded|partial outage/i,
    healthCheckWarning: /health check warning|unhealthy.*endpoint|service.*slow/i,
    
    // Data warnings
    dataInconsistency: /data inconsistency|data mismatch|validation warning/i,
    dataLoss: /potential data loss|data.*not saved|incomplete.*data/i,
    
    // Retry warnings
    retryAttempt: /retry attempt|retrying|attempt \d+ of \d+/i,
    backoff: /backing off|exponential backoff|retry.*delayed/i,
    
    // Third-party service warnings
    externalServiceSlow: /external service.*slow|third.*party.*delayed|api.*unresponsive/i,
    webhookWarning: /webhook.*warning|callback.*delayed|notification.*failed/i,
    
    // Resource limits
    threadPoolWarning: /thread pool.*warning|threads.*exhausted|worker.*unavailable/i,
    fileDescriptors: /file descriptor.*warning|too many.*open files|fd limit/i,
    
    // Garbage collection
    gcWarning: /gc.*warning|garbage collection.*long|gc pause/i,
    
    // Security warnings
    suspiciousActivity: /suspicious activity|unusual behavior|anomaly detected/i,
    bruteForce: /brute.*force.*attempt|multiple.*failed.*login|repeated.*auth.*failure/i,
    
    // Deployment warnings
    rollbackWarning: /rollback.*initiated|reverting.*deployment|version.*downgrade/i,
    migrationWarning: /migration.*warning|schema.*change|data.*migration/i,
    
    // General warnings
    genericWarning: /\bwarning\b|\bwarn\b/i,
} as const;
  

export const warningPatternsArray = Object.values(warningPatterns);
  
export const warningCategories = {
    performance: {
      slowQuery: warningPatterns.slowQuery,
      highLatency: warningPatterns.highLatency,
      slowResponse: warningPatterns.slowResponse,
    },
    
    resources: {
      highMemory: warningPatterns.highMemory,
      highCpu: warningPatterns.highCpu,
      diskSpace: warningPatterns.diskSpace,
      highLoad: warningPatterns.highLoad,
    },
    
    connections: {
      connectionPoolLow: warningPatterns.connectionPoolLow,
      connectionRetry: warningPatterns.connectionRetry,
      connectionSlow: warningPatterns.connectionSlow,
    },
    
    database: {
      deadlockWarning: warningPatterns.deadlockWarning,
      replicationLag: warningPatterns.replicationLag,
      queryTimeout: warningPatterns.queryTimeout,
    },
    
    cache: {
      cacheMiss: warningPatterns.cacheMiss,
      cacheEviction: warningPatterns.cacheEviction,
    },
    
    api: {
      rateLimitApproaching: warningPatterns.rateLimitApproaching,
      deprecation: warningPatterns.deprecation,
      apiVersionOld: warningPatterns.apiVersionOld,
    },
    
    security: {
      suspiciousActivity: warningPatterns.suspiciousActivity,
      bruteForce: warningPatterns.bruteForce,
    },
} as const;

export function getWarningCategory(patternName: string): string | null {
    for (const [category, patterns] of Object.entries(warningCategories)) {
      if (patternName in patterns) {
        return category;
      }
    }
    return null;
}
  
export function matchesWarningPattern(message: string): boolean {
    return warningPatternsArray.some(pattern => pattern.test(message));
}
  
export function getMatchingWarnings(message: string): string[] {
    const matched: string[] = [];
    
    for (const [name, pattern] of Object.entries(warningPatterns)) {
      if (pattern.test(message)) {
        matched.push(name);
      }
    }

    return matched;
}