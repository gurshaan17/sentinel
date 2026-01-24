export interface ContainerInfo {
    id: string;
    name: string;
    image: string;
    state: string;
    status: string;
    created: Date;
    labels: Record<string, string>;
}
  
export interface LogStreamOptions {
    follow: boolean;
    stdout: boolean;
    stderr: boolean;
    timestamps: boolean;
    tail?: number;
}

export interface DockerEvent {
    status?: string;
    id?: string;
    from?: string;
    Type?: 'container' | 'image' | 'network' | 'volume' | 'daemon';
    Action?: string;
    Actor?: {
      ID?: string;
      Attributes?: Record<string, string>;
    };
    time?: number;
    timeNano?: number;
}