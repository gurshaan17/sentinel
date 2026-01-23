export const errorPatterns = {
    exception: /exception|error|fatal|panic/i,
    database: /database.*error|sql.*error|connection.*failed|deadlock/i,
    timeout: /timeout|timed out/i,
    memory: /out of memory|oom|memory.*exhausted/i,
    network: /network.*error|connection refused|econnrefused/i,
    http: /http.*500|internal server error|502|503|504/i,
    auth: /authentication.*failed|unauthorized|forbidden/i,
    permission: /permission denied|access denied/i,
} as const;
  
export const errorPatternsArray = Object.values(errorPatterns);