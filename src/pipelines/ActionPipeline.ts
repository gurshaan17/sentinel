import { ActionPlanner } from '../services/ai/ActionPlanner';
import { ActionPolicy } from '../policies/ActionPolicy';
import { ActionExecutor } from '../services/actions/ActionExecutor';
import type { Advice } from '../types';
import { logger } from '../utils/logger';

export class ActionPipeline {
  private planner = new ActionPlanner();
  private policy = new ActionPolicy();
  private executor = new ActionExecutor();

  async handle(advisory: Advice): Promise<void> {
    const proposal = this.planner.plan(advisory);
    const decision = this.policy.allow(proposal);

    if (!decision.allowed) {
      logger.info(
        { proposal, reason: decision.reason },
        'Action skipped by policy'
      );
      return;
    }

    await this.executor.execute(proposal);
  }
}