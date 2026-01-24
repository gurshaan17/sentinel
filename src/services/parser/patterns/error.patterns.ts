
export const errorPatterns = {
    // General errors
    exception: /exception|error|fatal|panic|crash|abort/i,
    stackTrace: /stack trace|traceback|at .+:\d+:\d+/i,
    
    // Application errors
    nullPointer: /null pointer|nullptr|undefined is not|cannot read property.*undefined/i,
    typeError: /type error|invalid type|unexpected type/i,
    syntaxError: /syntax error|parse error|invalid syntax/i,
    referenceError: /reference error|is not defined|undefined reference/i,
    assertionError: /assertion.*failed|assert.*error/i,
    
    // HTTP errors
    http400: /\b400\b|bad request/i,
    http401: /\b401\b|unauthorized/i,
    http403: /\b403\b|forbidden|access denied/i,
    http404: /\b404\b|not found/i,
    http500: /\b500\b|internal server error/i,
    http502: /\b502\b|bad gateway/i,
    http503: /\b503\b|service unavailable/i,
    http504: /\b504\b|gateway timeout/i,
    
    // Database errors
    databaseConnection: /database.*(?:error|failed|refused)|db.*connection.*(?:error|failed)|cannot connect.*database/i,
    databaseTimeout: /database.*timeout|db.*timeout|query.*timed out/i,
    databaseDeadlock: /deadlock|lock wait timeout|lock.*error/i,
    databaseConstraint: /constraint.*violation|foreign key.*constraint|unique.*constraint|integrity.*constraint/i,
    databaseQuery: /query.*error|sql.*error|invalid.*query|syntax error.*sql/i,
    
    // Network errors
    networkTimeout: /network.*timeout|connection.*timeout|timed out|ETIMEDOUT/i,
    networkRefused: /connection refused|ECONNREFUSED|target machine actively refused/i,
    networkReset: /connection reset|ECONNRESET|connection.*aborted/i,
    networkUnreachable: /network.*unreachable|host.*unreachable|no route to host|ENETUNREACH/i,
    dnsError: /dns.*error|dns.*failed|getaddrinfo.*failed|ENOTFOUND/i,
    
    // Memory errors
    outOfMemory: /out of memory|OOM|memory.*exhausted|cannot allocate memory|heap.*overflow/i,
    memoryLeak: /memory leak|leak detected/i,
    stackOverflow: /stack overflow|recursion.*limit|maximum call stack/i,
    
    // File system errors
    fileNotFound: /file not found|ENOENT|no such file|cannot find.*file/i,
    permissionDenied: /permission denied|EACCES|access.*denied|forbidden/i,
    diskFull: /disk full|no space left|ENOSPC|storage.*full/i,
    fileReadError: /failed to read|read.*error|cannot read.*file/i,
    fileWriteError: /failed to write|write.*error|cannot write.*file/i,
    
    // Authentication & Authorization errors
    authFailed: /authentication.*failed|auth.*error|login.*failed|invalid.*credentials/i,
    tokenInvalid: /invalid token|token.*expired|token.*revoked|jwt.*invalid/i,
    sessionExpired: /session.*expired|session.*invalid|session.*not found/i,
    unauthorized: /unauthorized|not authorized|insufficient.*permissions/i,
    
    // API errors
    apiError: /api.*error|api.*failed|api call.*failed/i,
    rateLimitExceeded: /rate limit.*exceeded|too many requests|quota.*exceeded/i,
    invalidRequest: /invalid request|malformed request|bad request/i,
    
    // Configuration errors
    configMissing: /config.*error|configuration.*missing|required.*config|missing.*environment/i,
    configInvalid: /invalid.*config|config.*invalid|malformed.*config/i,
    
    // SSL/TLS errors
    sslError: /ssl.*error|tls.*error|certificate.*error|handshake.*failed/i,
    certificateInvalid: /certificate.*invalid|certificate.*expired|untrusted.*certificate/i,
    
    // Container/Docker errors
    containerError: /container.*error|docker.*error|container.*failed/i,
    imageNotFound: /image not found|pull.*failed|manifest.*not found/i,
    
    // Message Queue errors
    queueError: /queue.*error|enqueue.*failed|dequeue.*failed/i,
    messageError: /message.*error|failed.*publish|failed.*consume/i,
    
    // Cache errors
    cacheError: /cache.*error|redis.*error|memcached.*error/i,
    cacheConnectionFailed: /cache.*connection.*failed|redis.*connection.*refused/i,
    
    // Validation errors
    validationError: /validation.*error|validation.*failed|invalid.*input/i,
    schemaError: /schema.*error|schema.*validation|invalid.*schema/i,
    
    // Parsing errors
    jsonError: /json.*error|invalid json|cannot parse json|unexpected token/i,
    xmlError: /xml.*error|invalid xml|cannot parse xml/i,
    yamlError: /yaml.*error|invalid yaml|cannot parse yaml/i,
    
    // Timeout errors
    timeout: /timeout|timed out|deadline exceeded|operation.*timeout/i,
    
    // Concurrency errors
    racecondition: /race condition|concurrent.*modification|lock.*error/i,
    
    // Third-party service errors
    stripeError: /stripe.*error|payment.*failed|charge.*failed/i,
    awsError: /aws.*error|s3.*error|ec2.*error|lambda.*error/i,
    gcpError: /gcp.*error|google.*cloud.*error/i,
    
    // Messaging errors
    kafkaError: /kafka.*error|producer.*error|consumer.*error|broker.*error/i,
    rabbitmqError: /rabbitmq.*error|amqp.*error/i,
    
    // Search errors
    elasticsearchError: /elasticsearch.*error|es.*error|index.*error/i,
    
    // Business logic errors
    transactionFailed: /transaction.*failed|rollback|transaction.*error/i,
    operationFailed: /operation.*failed|failed to.*process|processing.*error/i,
    
    // Security errors
    securityError: /security.*error|security.*violation|intrusion.*detected/i,
    injectionAttempt: /sql injection|xss.*attempt|injection.*detected/i,
    
    // Resource errors
    resourceExhausted: /resource.*exhausted|no.*resources|limit.*reached/i,
    portInUse: /port.*in use|address.*in use|EADDRINUSE/i,
    
    // Process errors
    processFailed: /process.*failed|process.*died|process.*crashed/i,
    workerError: /worker.*error|worker.*failed|worker.*crashed/i,
    
    // Data errors
    dataCorruption: /data.*corrupt|corrupt.*data|invalid.*data/i,
    serializationError: /serialization.*error|cannot.*serialize|marshal.*error/i,
    deserializationError: /deserialization.*error|cannot.*deserialize|unmarshal.*error/i,
    
    // Plugin/Module errors
    pluginError: /plugin.*error|plugin.*failed|module.*error/i,
    dependencyError: /dependency.*error|missing.*dependency|cannot.*resolve/i,
    
    // Backup/Restore errors
    backupFailed: /backup.*failed|backup.*error/i,
    restoreFailed: /restore.*failed|restore.*error/i,
    
    // Critical system errors
    kernelPanic: /kernel panic|system.*crash|critical.*system/i,
    segmentationFault: /segmentation fault|segfault|SIGSEGV/i,
} as const;
  
export const errorPatternsArray = Object.values(errorPatterns);
  

export const criticalErrorPatterns = {
    outOfMemory: errorPatterns.outOfMemory,
    databaseConnection: errorPatterns.databaseConnection,
    kernelPanic: errorPatterns.kernelPanic,
    segmentationFault: errorPatterns.segmentationFault,
    diskFull: errorPatterns.diskFull,
    dataCorruption: errorPatterns.dataCorruption,
    securityError: errorPatterns.securityError,
} as const;
  
export const errorCategories = {
    application: {
      exception: errorPatterns.exception,
      nullPointer: errorPatterns.nullPointer,
      typeError: errorPatterns.typeError,
      syntaxError: errorPatterns.syntaxError,
      referenceError: errorPatterns.referenceError,
      assertionError: errorPatterns.assertionError,
    },
    
    http: {
      http400: errorPatterns.http400,
      http401: errorPatterns.http401,
      http403: errorPatterns.http403,
      http404: errorPatterns.http404,
      http500: errorPatterns.http500,
      http502: errorPatterns.http502,
      http503: errorPatterns.http503,
      http504: errorPatterns.http504,
    },
    
    database: {
      databaseConnection: errorPatterns.databaseConnection,
      databaseTimeout: errorPatterns.databaseTimeout,
      databaseDeadlock: errorPatterns.databaseDeadlock,
      databaseConstraint: errorPatterns.databaseConstraint,
      databaseQuery: errorPatterns.databaseQuery,
    },
    
    network: {
      networkTimeout: errorPatterns.networkTimeout,
      networkRefused: errorPatterns.networkRefused,
      networkReset: errorPatterns.networkReset,
      networkUnreachable: errorPatterns.networkUnreachable,
      dnsError: errorPatterns.dnsError,
    },
    
    memory: {
      outOfMemory: errorPatterns.outOfMemory,
      memoryLeak: errorPatterns.memoryLeak,
      stackOverflow: errorPatterns.stackOverflow,
    },
    
    filesystem: {
      fileNotFound: errorPatterns.fileNotFound,
      permissionDenied: errorPatterns.permissionDenied,
      diskFull: errorPatterns.diskFull,
      fileReadError: errorPatterns.fileReadError,
      fileWriteError: errorPatterns.fileWriteError,
    },
    
    authentication: {
      authFailed: errorPatterns.authFailed,
      tokenInvalid: errorPatterns.tokenInvalid,
      sessionExpired: errorPatterns.sessionExpired,
      unauthorized: errorPatterns.unauthorized,
    },
    
    security: {
      securityError: errorPatterns.securityError,
      injectionAttempt: errorPatterns.injectionAttempt,
      certificateInvalid: errorPatterns.certificateInvalid,
      sslError: errorPatterns.sslError,
    },
    
    critical: criticalErrorPatterns,
} as const;
  
export function getErrorCategory(patternName: string): string | null {
    for (const [category, patterns] of Object.entries(errorCategories)) {
      if (patternName in patterns) {
        return category;
      }
    }
    return null;
  }
  
export function matchesErrorPattern(message: string): boolean {
    return errorPatternsArray.some(pattern => pattern.test(message));
}
  
export function matchesCriticalError(message: string): boolean {
    return Object.values(criticalErrorPatterns).some(pattern => pattern.test(message));
}
  
export function getMatchingErrors(message: string): {
    patterns: string[];
    isCritical: boolean;
    category: string | null;
  } {
    const matched: string[] = [];
    let isCritical = false;
    
    for (const [name, pattern] of Object.entries(errorPatterns)) {
      if (pattern.test(message)) {
        matched.push(name);
        
        // Check if it's a critical error
        if (name in criticalErrorPatterns) {
          isCritical = true;
        }
      }
    }
    
    // Get primary category (from first match)
    const category = matched.length > 0 ? getErrorCategory(matched[0]) : null;
    
    return {
      patterns: matched,
      isCritical,
      category,
    };
}
  
export function getErrorSeverity(message: string): 'CRITICAL' | 'ERROR' | null {
    if (matchesCriticalError(message)) {
      return 'CRITICAL';
    }
    if (matchesErrorPattern(message)) {
      return 'ERROR';
    }
    return null;
}