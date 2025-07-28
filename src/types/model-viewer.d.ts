interface ModelViewerElement extends HTMLElement {
  // Camera controls
  resetTurntableRotation(): void;
  jumpCameraToGoal(): void;
  getCameraOrbit(): { theta: number; phi: number; radius: number };
  setCameraOrbit(theta: number, phi: number, radius: number): void;
  getCameraTarget(): { x: number; y: number; z: number };
  setCameraTarget(x: number, y: number, z: number): void;
  getFieldOfView(): number;
  setFieldOfView(fov: number): void;
  
  // Animation controls
  play(): void;
  pause(): void;
  seek(time: number): void;
  
  // Model properties
  readonly loaded: boolean;
  readonly modelIsVisible: boolean;
  
  // AR properties
  readonly canActivateAR: boolean;
  activateAR(): Promise<void>;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<ModelViewerElement>, ModelViewerElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        ar?: boolean;
        'ar-modes'?: string;
        'rotation-per-second'?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'manual';
        'environment-image'?: string;
        'shadow-intensity'?: string;
        scale?: string;
        'min-camera-orbit'?: string;
        'max-camera-orbit'?: string;
        'camera-orbit'?: string;
        'field-of-view'?: string;
        'poster-color'?: string;
        style?: React.CSSProperties;
        ref?: React.Ref<ModelViewerElement>;
      };
    }
  }
}

export {};