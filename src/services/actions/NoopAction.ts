export class NoopActions {
    async execute(): Promise<void> {
      return;
    }
  }