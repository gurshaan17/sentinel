import Docker from 'dockerode';
import type { RawLog, LogStreamOptions } from '../../types/log.types';
import { logger } from '../../utils/logger';

export class LogStreamer {
  constructor(private docker: Docker) {}

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
    const container = this.docker.getContainer(containerId);

    try {
      const stream = await container.logs(options);

      stream.on('data', async (chunk: Buffer) => {
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
      });

      stream.on('error', (error) => {
        logger.error(`Stream error for ${containerName}:`, error);
      });

      stream.on('end', () => {
        logger.debug(`Stream ended for ${containerName}`);
      });
    } catch (error) {
      logger.error(`Failed to stream logs for ${containerName}:`, error);
      throw error;
    }
  }

  private parseDockerLogChunk(chunk: Buffer): Array<{ stream: 'stdout' | 'stderr'; message: string }> {
    const lines: Array<{ stream: 'stdout' | 'stderr'; message: string }> = [];
    
    // Docker multiplexes stdout/stderr
    // First byte indicates stream type: 1=stdout, 2=stderr
    let offset = 0;
    
    while (offset < chunk.length) {
      const header = chunk.subarray(offset, offset + 8);
      if (header.length < 8) break;

      const streamType = header[0];
      const size = header.readUInt32BE(4);
      
      const message = chunk.subarray(offset + 8, offset + 8 + size).toString('utf8').trim();
      
      if (message) {
        lines.push({
          stream: streamType === 1 ? 'stdout' : 'stderr',
          message,
        });
      }

      offset += 8 + size;
    }

    return lines;
  }
}