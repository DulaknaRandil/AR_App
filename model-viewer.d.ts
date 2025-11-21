/// <reference types="react" />

declare module '@google/model-viewer' {
  const ModelViewer: any;
  export default ModelViewer;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export {};
