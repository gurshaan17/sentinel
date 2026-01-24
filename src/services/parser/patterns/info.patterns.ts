
export const infoPatterns = {
    // Application lifecycle
    startup: /starting|started|initializing|initialized|ready|listening on/i,
    shutdown: /stopping|stopped|shutting down|graceful shutdown|cleanup/i,
    
    // HTTP requests
    httpRequest: /GET|POST|PUT|PATCH|DELETE|http request|incoming request/i,
    httpSuccess: /\b2\d{2}\b|status.*200|success|ok\b/i,
    
    // Database operations
    dbConnect: /database connected|db.*connected|connection established/i,
    dbQuery: /executing query|query executed|sql:/i,
    dbMigration: /migration.*complete|schema.*updated|migrated/i,
    
    // Cache operations
    cacheHit: /cache hit|cached|from cache/i,
    cacheSet: /cache set|cached|storing in cache/i,
    
    // User actions
    userLogin: /user.*logged in|login successful|authenticated/i,
    userLogout: /user.*logged out|logout|session.*ended/i,
    
    // File operations
    fileRead: /reading file|file loaded|opened file/i,
    fileWrite: /writing file|file saved|created file/i,
    
    // Configuration
    configLoaded: /config.*loaded|configuration.*loaded|settings.*loaded/i,
    
    // Health checks
    healthCheck: /health check|health.*ok|ping.*success/i,
    
    // General info
    genericInfo: /\binfo\b|\binformation\b/i,
} as const;
  
export const infoPatternsArray = Object.values(infoPatterns);
  
export function matchesInfoPattern(message: string): boolean {
    return infoPatternsArray.some(pattern => pattern.test(message));
}