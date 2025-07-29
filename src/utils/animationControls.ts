// Animation Controls Utility
// Allows users to manually control animation speeds and performance

export interface AnimationPreferences {
  speed: 'slow' | 'normal' | 'fast' | 'off';
  enableBackgroundAnimations: boolean;
  enableParticles: boolean;
  enableTransitions: boolean;
}

const DEFAULT_PREFERENCES: AnimationPreferences = {
  speed: 'normal',
  enableBackgroundAnimations: true,
  enableParticles: true,
  enableTransitions: true
};

class AnimationController {
  private preferences: AnimationPreferences;
  private styleElement: HTMLStyleElement | null = null;

  constructor() {
    this.preferences = this.loadPreferences();
    this.applyPreferences();
  }

  private loadPreferences(): AnimationPreferences {
    try {
      const saved = localStorage.getItem('technosutra-animation-preferences');
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('technosutra-animation-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save animation preferences:', error);
    }
  }

  public setAnimationSpeed(speed: AnimationPreferences['speed']): void {
    this.preferences.speed = speed;
    this.savePreferences();
    this.applyPreferences();
  }

  public toggleBackgroundAnimations(enabled: boolean): void {
    this.preferences.enableBackgroundAnimations = enabled;
    this.savePreferences();
    this.applyPreferences();
  }

  public toggleParticles(enabled: boolean): void {
    this.preferences.enableParticles = enabled;
    this.savePreferences();
    this.applyPreferences();
  }

  public toggleTransitions(enabled: boolean): void {
    this.preferences.enableTransitions = enabled;
    this.savePreferences();
    this.applyPreferences();
  }

  public getPreferences(): AnimationPreferences {
    return { ...this.preferences };
  }

  private applyPreferences(): void {
    if (typeof window === 'undefined') return;

    // Remove existing style if present
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // Create new style element
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'technosutra-animation-controls';
    
    let css = '';

    // Apply speed settings
    switch (this.preferences.speed) {
      case 'off':
        css += `
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        `;
        break;
      case 'fast':
        css += `
          * {
            animation-duration: 0.3s !important;
            transition-duration: 0.2s !important;
          }
          .loading-spinner,
          .progress-bar {
            animation-duration: 0.5s !important;
          }
        `;
        break;
      case 'slow':
        css += `
          * {
            animation-duration: 1.5s !important;
            transition-duration: 0.8s !important;
          }
          .loading-spinner,
          .progress-bar {
            animation-duration: 2s !important;
          }
        `;
        break;
      case 'normal':
      default:
        // Use default CSS values
        break;
    }

    // Apply background animation settings
    if (!this.preferences.enableBackgroundAnimations) {
      css += `
        .floating-particles,
        .morphing-shape,
        .wave-animation,
        .sacred-pattern,
        .cyber-grid,
        .mandala-rotate,
        .sacred-pulse,
        .infinity-glow,
        .lotus-float,
        .energy-flow {
          animation: none !important;
          display: none !important;
        }
      `;
    }

    // Apply particle settings
    if (!this.preferences.enableParticles) {
      css += `
        .floating-particles,
        .particle-system {
          display: none !important;
        }
      `;
    }

    // Apply transition settings
    if (!this.preferences.enableTransitions) {
      css += `
        * {
          transition: none !important;
        }
      `;
    }

    this.styleElement.textContent = css;
    document.head.appendChild(this.styleElement);

    // Add CSS class to body for easier targeting
    document.body.className = document.body.className.replace(/animation-speed-\w+/g, '');
    document.body.classList.add(`animation-speed-${this.preferences.speed}`);
    
    if (!this.preferences.enableBackgroundAnimations) {
      document.body.classList.add('no-background-animations');
    } else {
      document.body.classList.remove('no-background-animations');
    }
    
    if (!this.preferences.enableParticles) {
      document.body.classList.add('no-particles');
    } else {
      document.body.classList.remove('no-particles');
    }
  }

  public reset(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.applyPreferences();
  }

  public destroy(): void {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }
}

// Create singleton instance
export const animationController = new AnimationController();

// Convenience functions
export const setAnimationSpeed = (speed: AnimationPreferences['speed']) => 
  animationController.setAnimationSpeed(speed);

export const toggleBackgroundAnimations = (enabled: boolean) => 
  animationController.toggleBackgroundAnimations(enabled);

export const toggleParticles = (enabled: boolean) => 
  animationController.toggleParticles(enabled);

export const toggleTransitions = (enabled: boolean) => 
  animationController.toggleTransitions(enabled);

export const getAnimationPreferences = () => 
  animationController.getPreferences();

export const resetAnimationPreferences = () => 
  animationController.reset();
