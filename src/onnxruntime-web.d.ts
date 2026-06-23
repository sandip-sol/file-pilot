declare module 'onnxruntime-web' {
  export const env: {
    wasm: {
      wasmPaths: string;
      numThreads: number;
    };
  };

  export class Tensor {
    constructor(type: string, data: Float32Array | Int32Array | Uint8Array, dims: number[]);
    readonly data: Float32Array | Int32Array | Uint8Array;
    readonly dims: readonly number[];
    readonly type: string;
  }

  export class InferenceSession {
    static create(
      modelData: ArrayBuffer | string,
      options?: {
        executionProviders?: string[];
        graphOptimizationLevel?: string;
      },
    ): Promise<InferenceSession>;

    run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
    readonly inputNames: readonly string[];
    readonly outputNames: readonly string[];
  }
}
