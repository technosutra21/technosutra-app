// Accessibility Service for TECHNO SUTRA
// Comprehensive accessibility features and utilities

import { logger } from '@/lib/logger';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  voiceAnnouncements: boolean;
  focusIndicators: boolean;
  colorBlindFriendly: boolean;
}

interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  role?: string;
  label?: string;
}

interface AnnouncementOptions {
  priority: 'polite' | 'assertive';
  delay?: number;
  interrupt?: boolean;
}

class AccessibilityService {
  private settings: AccessibilitySettings;
  private announcer: HTMLElement | null = null;
  private focusHistory: HTMLElement[] = [];
  private keyboardListeners: Map<string, (event: KeyboardEvent) => void> = new Map();
  private isInitialized = false;

  constructor() {
    this.settings = this.loadSettings();
    this.initialize();
  }

  /**
   * Initialize accessibility service
   */
  private initialize(): void {
    if (this.isInitialized) return;

    this.createAnnouncer();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.applySettings();
    this.detectUserPreferences();
    
    this.isInitialized = true;
    logger.info('🔊 Accessibility service initialized');
  }

  /**
   * Load accessibility settings from localStorage
   */
  private loadSettings(): AccessibilitySettings {
    try {
      const stored = localStorage.getItem('technosutra-accessibility');
      if (stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      }
    } catch (error) {
      logger.warn('Failed to load accessibility settings:', error);
    }
    
    return this.getDefaultSettings();
  }

  /**
   * Get default accessibility settings
   */
  private getDefaultSettings(): AccessibilitySettings {
    return {
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      voiceAnnouncements: true,
      focusIndicators: true,
      colorBlindFriendly: false,
    };
  }

  /**
   * Save accessibility settings
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('technosutra-accessibility', JSON.stringify(this.settings));
    } catch (error) {
      logger.warn('Failed to save accessibility settings:', error);
    }
  }

  /**
   * Create screen reader announcer
   */
  private createAnnouncer(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('aria-relevant', 'text');
    this.announcer.style.position = 'absolute';
    this.announcer.style.left = '-10000px';
    this.announcer.style.width = '1px';
    this.announcer.style.height = '1px';
    this.announcer.style.overflow = 'hidden';
    document.body.appendChild(this.announcer);
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    // Global keyboard shortcuts
    this.addKeyboardShortcut('Alt+1', () => this.focusMainContent());
    this.addKeyboardShortcut('Alt+2', () => this.focusNavigation());
    this.addKeyboardShortcut('Alt+3', () => this.focusSearch());
    this.addKeyboardShortcut('Escape', () => this.handleEscape());
    this.addKeyboardShortcut('Tab', (e) => this.handleTab(e));
    this.addKeyboardShortcut('Shift+Tab', (e) => this.handleShiftTab(e));

    // Skip links
  }

  /**
   * Setup focus management
   */
  private setupFocusManagement(): void {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== document.body) {
        this.focusHistory.push(target);
        // Keep only last 10 focus states
        if (this.focusHistory.length > 10) {
          this.focusHistory = this.focusHistory.slice(-10);
        }
      }
    });

    // Enhance focus indicators
    if (this.settings.focusIndicators) {
      this.enhanceFocusIndicators();
    }
  }

  /**
   * Detect user preferences from system
   */
  private detectUserPreferences(): void {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.updateSetting('reducedMotion', true);
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.updateSetting('highContrast', true);
    }

    // Detect color scheme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Already using dark theme
    }

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.updateSetting('reducedMotion', e.matches);
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.updateSetting('highContrast', e.matches);
    });
  }

  /**
   * Apply accessibility settings to the page
   */
  private applySettings(): void {
    const root = document.documentElement;

    // High contrast mode
    root.classList.toggle('high-contrast', this.settings.highContrast);

    // Reduced motion
    root.classList.toggle('reduced-motion', this.settings.reducedMotion);

    // Large text
    root.classList.toggle('large-text', this.settings.largeText);

    // Screen reader mode
    root.classList.toggle('screen-reader-mode', this.settings.screenReaderMode);

    // Color blind friendly
    root.classList.toggle('color-blind-friendly', this.settings.colorBlindFriendly);

    // Focus indicators
    root.classList.toggle('enhanced-focus', this.settings.focusIndicators);
  }

  /**
   * Add keyboard shortcut
   */
  private addKeyboardShortcut(combination: string, handler: (event: KeyboardEvent) => void): void {
    this.keyboardListeners.set(combination, handler);
    
    document.addEventListener('keydown', (event) => {
      const combo = this.getKeyboardCombination(event);
      const handler = this.keyboardListeners.get(combo);
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    });
  }

  /**
   * Get keyboard combination string
   */
  private getKeyboardCombination(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    
    parts.push(event.key);
    
    return parts.join('+');
  }


  /**
   * Enhance focus indicators
   */
  private enhanceFocusIndicators(): void {
    const style = document.createElement('style');
    style.textContent = `
      .enhanced-focus *:focus {
        outline: 3px solid #06b6d4 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 5px rgba(6, 182, 212, 0.3) !important;
      }
      
      .enhanced-focus button:focus,
      .enhanced-focus [role="button"]:focus {
        outline-color: #f59e0b !important;
        box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, options: AnnouncementOptions = { priority: 'polite' }): void {
    if (!this.settings.voiceAnnouncements || !this.announcer) return;

    // Set priority
    this.announcer.setAttribute('aria-live', options.priority);

    // Clear previous message if interrupting
    if (options.interrupt) {
      this.announcer.textContent = '';
    }

    // Announce with delay if specified
    const announce = () => {
      if (this.announcer) {
        this.announcer.textContent = message;
        logger.info(`📢 Announced: ${message}`);
      }
    };

    if (options.delay) {
      setTimeout(announce, options.delay);
    } else {
      announce();
    }
  }

  /**
   * Focus management methods
   */
  focusMainContent(): void {
    const main = document.querySelector('main, [role="main"], #main-content');
    if (main instanceof HTMLElement) {
      main.focus();
      this.announce('Conteúdo principal focado');
    }
  }

  focusNavigation(): void {
    const nav = document.querySelector('nav, [role="navigation"], #navigation');
    if (nav instanceof HTMLElement) {
      nav.focus();
      this.announce('Navegação focada');
    }
  }

  focusSearch(): void {
    const search = document.querySelector('input[type="search"], [role="search"], #search');
    if (search instanceof HTMLElement) {
      search.focus();
      this.announce('Campo de busca focado');
    }
  }

  /**
   * Handle keyboard events
   */
  private handleEscape(): void {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    if (activeModal) {
      const closeButton = activeModal.querySelector('[aria-label*="fechar"], [aria-label*="close"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    }
  }

  private handleTab(_event: KeyboardEvent): void {
    // Custom tab handling if needed
    this.ensureFocusVisible();
  }

  private handleShiftTab(_event: KeyboardEvent): void {
    // Custom shift+tab handling if needed
    this.ensureFocusVisible();
  }

  /**
   * Ensure focus is visible
   */
  private ensureFocusVisible(): void {
    const focused = document.activeElement as HTMLElement;
    if (focused && focused !== document.body) {
      focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Get all focusable elements
   */
  getFocusableElements(container: HTMLElement = document.body): FocusableElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    
    return elements
      .filter(el => el.offsetParent !== null) // Visible elements only
      .map(el => ({
        element: el,
        tabIndex: parseInt(el.getAttribute('tabindex') || '0'),
        role: el.getAttribute('role') || undefined,
        label: el.getAttribute('aria-label') || el.textContent?.trim() || undefined,
      }))
      .sort((a, b) => a.tabIndex - b.tabIndex);
  }

  /**
   * Update accessibility setting
   */
  updateSetting<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ): void {
    this.settings[key] = value;
    this.saveSettings();
    this.applySettings();
    
    this.announce(`${key} ${value ? 'ativado' : 'desativado'}`, { priority: 'polite' });
    logger.info(`Accessibility setting updated: ${key} = ${value}`);
  }

  /**
   * Get current settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Reset to default settings
   */
  resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    this.applySettings();
    this.announce('Configurações de acessibilidade redefinidas');
  }

  /**
   * Check if screen reader is likely active
   */
  isScreenReaderActive(): boolean {
    // Heuristic detection - not 100% accurate
    return this.settings.screenReaderMode || 
           window.navigator.userAgent.includes('NVDA') ||
           window.navigator.userAgent.includes('JAWS') ||
           window.speechSynthesis?.speaking === true;
  }

  /**
   * Announce character discovery
   */
  announceCharacterDiscovery(characterName: string, distance: number): void {
    const message = `Personagem budista descoberto: ${characterName}. Distância: ${Math.round(distance)} metros.`;
    this.announce(message, { priority: 'assertive' });
  }

  /**
   * Announce GPS status
   */
  announceGPSStatus(status: 'active' | 'inactive' | 'error', accuracy?: number): void {
    let message = '';
    switch (status) {
      case 'active':
        message = `GPS ativo${accuracy ? ` com precisão de ${Math.round(accuracy)} metros` : ''}`;
        break;
      case 'inactive':
        message = 'GPS inativo';
        break;
      case 'error':
        message = 'Erro no GPS';
        break;
    }
    this.announce(message, { priority: 'polite' });
  }

  /**
   * Announce route progress
   */
  announceRouteProgress(completed: number, total: number): void {
    const percentage = Math.round((completed / total) * 100);
    const message = `Progresso da trilha: ${completed} de ${total} personagens visitados. ${percentage}% completo.`;
    this.announce(message, { priority: 'polite' });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.announcer) {
      document.body.removeChild(this.announcer);
      this.announcer = null;
    }
    
    this.keyboardListeners.clear();
    this.focusHistory = [];
    this.isInitialized = false;
  }
}

export const accessibilityService = new AccessibilityService();
export default accessibilityService;
