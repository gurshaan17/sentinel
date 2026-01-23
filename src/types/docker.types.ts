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