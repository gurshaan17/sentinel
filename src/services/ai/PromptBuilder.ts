import type { AIContext } from '../../types/ai.types';

export class PromptBuilder {
  build(context: AIContext): string {
    return `
You are an observability assistant.

You analyze container logs and explain what is happening.
You MUST NOT suggest actions like restarting containers or scaling.
You ONLY observe and explain.

Container: ${context.containerName}
Time window: ${context.windowStart} → ${context.windowEnd}

Logs:
${context.recentLogs
  .map(
    l => `[${l.severity}] ${l.message}`
  )
  .join('\n')}

Respond in JSON with:
{
  "summary": string,
  "severity": "low" | "medium" | "high",
  "confidence": number (0 to 1),
  "suspectedCause": string | null,
  "recommendation": string | null,
  "shouldIgnore": boolean
}
`;
  }
}