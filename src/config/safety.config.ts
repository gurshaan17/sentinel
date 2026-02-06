export const safetyConfig = {
    // Maximum containers to scale up to
    maxScaleUp: parseInt(process.env.MAX_SCALE_UP || '10'),
    
    // Minimum containers to keep running
    maxScaleDown: parseInt(process.env.MAX_SCALE_DOWN || '1'),
    
    // Maximum actions per hour
    maxActionsPerHour: parseInt(process.env.MAX_ACTIONS_PER_HOUR || '5'),
    
    // Cooldown between actions (ms)
    actionCooldownMs: parseInt(process.env.ACTION_COOLDOWN_MS || '300000'), // 5 min
    
    // Actions requiring human approval
    requireHumanApproval: (process.env.REQUIRE_APPROVAL || 'database_migrations,security_patches')
      .split(',')
      .map(s => s.trim()),
      
    // Safety mode: 'strict' | 'permissive' | 'disabled'
    mode: (process.env.SAFETY_MODE || 'strict') as 'strict' | 'permissive' | 'disabled',
  } as const;