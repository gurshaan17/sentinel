import Docker from 'dockerode';
import type { RawLog, LogStreamOptions } from '../../types';
import { logger } from '../../utils/logger';
import { logError } from '../../utils/ErrorLogger';
import type { Readable } from 'stream';

export class LogStreamer {
  constructor(private readonly docker: Docker) {}

  async streamLogs(
    containerId: string,
    containerName: string,
    onLog: (log: RawLog) => void | Promise<void>,
    options: LogStreamOptions = {
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true,
    }
  ): Promise<void> {
    if (containerName === 'sentinel') {
      logger.debug(`Skipping log stream for self container: ${containerName}`);
      return;
    }

    const container = this.docker.getContainer(containerId);

    try {
      const stream = (await container.logs({
        ...options,
        follow: true,
      } as const)) as Readable;

      stream.on('data', async (chunk: Buffer) => {
        try {
          const lines = this.parseDockerLogChunk(chunk);

          for (const line of lines) {
            const rawLog: RawLog = {
              containerId,
              containerName,
              timestamp: new Date(),
              stream: line.stream,
              message: line.message,
            };

            await onLog(rawLog);
          }
        } catch (err) {
          logError('Failed to process Docker log chunk', {
            containerId,
            containerName,
            error: err,
          });
        }
      });

      stream.on('error', (error) => {
        logError(`Docker log stream error (${containerName})`, error);
      });

      stream.on('end', () => {
        logger.debug(`Docker log stream ended for ${containerName}`);
      });
    } catch (error) {
      logError(`Failed to start log stream for ${containerName}`, error);
      throw error;
    }
  }

  /**
   * Docker log streams are binary-multiplexed:
   * - 8-byte header
   * - byte 0: stream type (1=stdout, 2=stderr)
   * - bytes 4–7: message length (uint32 BE)
   *
   * This function safely parses the stream.
   */
  private parseDockerLogChunk(
    chunk: Buffer
  ): Array<{ stream: 'stdout' | 'stderr'; message: string }> {
    const lines: Array<{ stream: 'stdout' | 'stderr'; message: string }> = [];

    let offset = 0;

    while (offset + 8 <= chunk.length) {
      const streamType = chunk[offset];
      const messageLength = chunk.readUInt32BE(offset + 4);

      const messageStart = offset + 8;
      const messageEnd = messageStart + messageLength;

      if (messageEnd > chunk.length) {
        break; // incomplete frame
      }

      const message = chunk
        .subarray(messageStart, messageEnd)
        .toString('utf8')
        .trim();

      if (message) {
        lines.push({
          stream: streamType === 1 ? 'stdout' : 'stderr',
          message,
        });
      }

      offset = messageEnd;
    }

    return lines;
  }
}