// FreeSewing v3 パッケージの型定義

declare module "@freesewing/simon" {
  export interface SimonOptions {
    measurements: Record<string, number>;
    options?: Record<string, any>;
    settings?: Record<string, any>;
  }

  export class Simon {
    constructor(config: SimonOptions);
    draft(): {
      render(): string;
    };
  }
}
