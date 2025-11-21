declare module '@google/model-viewer' {
  export {};
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX;
    }
  }

  interface ModelViewerJSX extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
    src?: string;
    alt?: string;
    ar?: boolean;
    'ar-modes'?: string;
    'ar-scale'?: string;
    'camera-controls'?: boolean;
    'auto-rotate'?: boolean;
    'auto-rotate-delay'?: number;
    'rotation-per-second'?: string;
    'shadow-intensity'?: string;
    'shadow-softness'?: string;
    'exposure'?: string;
    'environment-image'?: string;
    'skybox-image'?: string;
    'poster'?: string;
    loading?: 'auto' | 'lazy' | 'eager';
    reveal?: 'auto' | 'manual';
    'interaction-prompt'?: 'auto' | 'when-focused' | 'none';
    'interaction-prompt-threshold'?: number;
    'camera-orbit'?: string;
    'camera-target'?: string;
    'field-of-view'?: string;
    'min-camera-orbit'?: string;
    'max-camera-orbit'?: string;
    'min-field-of-view'?: string;
    'max-field-of-view'?: string;
  }
}

export {};
