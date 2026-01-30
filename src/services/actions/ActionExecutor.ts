import type { ActionProposal, ExecutedAction } from '../../types/action.types';
import { logger } from '../../utils/logger';
import { DockerActions } from './DockerActions';

export class ActionExecutor {
  private docker = new DockerActions();

  async execute(proposal: ActionProposal): Promise<ExecutedAction> {
    try {
      switch (proposal.action) {
        case 'restart_container':
          await this.docker.restart(proposal.target);
          break;

        case 'scale_container':
          const replicas = Number(proposal.params?.replicas ?? 1);
          if (!Number.isFinite(replicas) || replicas <= 0) {
            return {
              proposal,
              executed: false,
              skippedReason: 'Invalid replicas value',
              timestamp: new Date(),
            };
          }
          await this.docker.scale(proposal.target, replicas);
          break;

        default:
          return {
            proposal,
            executed: false,
            skippedReason: 'No-op action',
            timestamp: new Date(),
          };
      }

      logger.info({ proposal }, 'Action executed');

      return {
        proposal,
        executed: true,
        timestamp: new Date(),
      };
    } catch (err) {
      logger.error({ err, proposal }, 'Action execution failed');
      return {
        proposal,
        executed: false,
        skippedReason: 'Execution error',
        timestamp: new Date(),
      };
    }
  }
}