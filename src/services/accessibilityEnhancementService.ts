// Accessibility Enhancement Service for TECHNO SUTRA
// Infinite accessibility improvements for all users

import { logger } from '@/lib/logger';

interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableFocusManagement: boolean;
  enableAriaLabels: boolean;
  enableColorBlindSupport: boolean;
  enableTextScaling: boolean;
}

interface AccessibilityMetrics {
  keyboardNavigationScore: number;
  screenReaderScore: number;
  contrastScore: number;
  overallScore: number;
  issuesFound: string[];
  improvements: string[];
}

class AccessibilityEnhancementService {
  private config: AccessibilityConfig = {
    enableKeyboardNavigation: true,
    enableScreenReaderSupport: true,
    enableHighContrast: true,
    enableReducedMotion: true,
    enableFocusManagement: true,
    enableAriaLabels: true,
    enableColorBlindSupport: true,
    enableTextScaling: true
  };

  private metrics: AccessibilityMetrics = {
    keyboardNavigationScore: 0,
    screenReaderScore: 0,
    contrastScore: 0,
    overallScore: 0,
    issuesFound: [],
    improvements: []
  };

  private focusableElements: string[] = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    logger.info('♿ Accessibility Enhancement Service initialized');

    // Initialize all accessibility features
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupHighContrast();
    this.setupReducedMotion();
    this.setupFocusManagement();
    this.setupAriaLabels();
    this.setupColorBlindSupport();
    this.setupTextScaling();

    // Start accessibility monitoring
    this.startAccessibilityMonitoring();

    // Announce service initialization
    this.announceToScreenReader('Accessibility enhancements activated');
  }

  // ===== KEYBOARD NAVIGATION =====
  private setupKeyboardNavigation(): void {
    if (!this.config.enableKeyboardNavigation) return;

    // Enhanced keyboard navigation
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));

    // Skip links for screen readers
    this.addSkipLinks();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    logger.info('⌨️ Enhanced keyboard navigation enabled');
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    const { key, ctrlKey: _ctrlKey, altKey: _altKey, shiftKey: _shiftKey } = event;

    // Tab navigation enhancement
    if (key === 'Tab') {
      this.enhanceTabNavigation(event);
    }

    // Arrow key navigation for grids and lists
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      this.handleArrowNavigation(event);
    }

    // Escape key to close modals/dropdowns
    if (key === 'Escape') {
      this.handleEscapeKey(event);
    }

    // Enter/Space for activation
    if (key === 'Enter' || key === ' ') {
      this.handleActivationKeys(event);
    }
  }

  private enhanceTabNavigation(event: KeyboardEvent): void {
    const focusableElements = document.querySelectorAll(this.focusableElements.join(','));
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);

    // Wrap around navigation
    if (event.shiftKey && currentIndex === 0) {
      event.preventDefault();
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    } else if (!event.shiftKey && currentIndex === focusableElements.length - 1) {
      event.preventDefault();
      (focusableElements[0] as HTMLElement).focus();
    }
  }

  private handleArrowNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const parent = target.closest('[role="grid"], [role="listbox"], [role="menu"]');
    
    if (parent) {
      event.preventDefault();
      // Implement grid/list navigation logic
      this.navigateGrid(event, parent);
    }
  }

  private navigateGrid(event: KeyboardEvent, container: Element): void {
    const items = container.querySelectorAll('[role="gridcell"], [role="option"], [role="menuitem"]');
    const currentIndex = Array.from(items).indexOf(document.activeElement as Element);
    
    let newIndex = currentIndex;
    const columns = parseInt(container.getAttribute('data-columns') || '1');

    switch (event.key) {
      case 'ArrowUp':
        newIndex = Math.max(0, currentIndex - columns);
        break;
      case 'ArrowDown':
        newIndex = Math.min(items.length - 1, currentIndex + columns);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        newIndex = Math.min(items.length - 1, currentIndex + 1);
        break;
    }

    if (newIndex !== currentIndex) {
      (items[newIndex] as HTMLElement).focus();
    }
  }

  private handleEscapeKey(_event: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const modal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    const dropdown = document.querySelector('[aria-expanded="true"]');
    
    if (modal) {
      this.closeModal(modal);
    } else if (dropdown) {
      this.closeDropdown(dropdown);
    }
  }

  private handleActivationKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    if (target.role === 'button' || target.classList.contains('clickable')) {
      event.preventDefault();
      target.click();
    }
  }

  private addSkipLinks(): void {
    // Only add skip links if they don't already exist
    if (document.querySelector('.skip-link')) return;

    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    `;

    // Only show on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 9999;
        padding: 8px 16px;
        background: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
      `;
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      `;
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  private setupKeyboardShortcuts(): void {
    const shortcuts = {
      'Alt+1': () => this.focusElement('#main-navigation'),
      'Alt+2': () => this.focusElement('#main-content'),
      'Alt+3': () => this.focusElement('#search'),
      'Alt+H': () => window.location.href = '/',
      'Alt+M': () => window.location.href = '/map',
      'Alt+G': () => window.location.href = '/gallery'
    };

    document.addEventListener('keydown', (event) => {
      const key = `${event.altKey ? 'Alt+' : ''}${event.ctrlKey ? 'Ctrl+' : ''}${event.key}`;
      
      if (shortcuts[key as keyof typeof shortcuts]) {
        event.preventDefault();
        shortcuts[key as keyof typeof shortcuts]();
      }
    });
  }

  // ===== SCREEN READER SUPPORT =====
  private setupScreenReaderSupport(): void {
    if (!this.config.enableScreenReaderSupport) return;

    // Live regions for dynamic content
    this.setupLiveRegions();

    // Enhanced ARIA labels
    this.enhanceAriaLabels();

    // Screen reader announcements
    this.setupScreenReaderAnnouncements();

    logger.info('🔊 Enhanced screen reader support enabled');
  }

  private setupLiveRegions(): void {
    // Create live regions for announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);

    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'assertive-live-region';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    document.body.appendChild(assertiveRegion);
  }

  private enhanceAriaLabels(): void {
    // Auto-generate ARIA labels for unlabeled elements
    const unlabeledButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    unlabeledButtons.forEach((button, index) => {
      const text = button.textContent?.trim();
      if (!text) {
        button.setAttribute('aria-label', `Button ${index + 1}`);
      }
    });

    // Enhance form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach((input) => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && input.placeholder) {
        input.setAttribute('aria-label', input.placeholder);
      }
    });
  }

  private setupScreenReaderAnnouncements(): void {
    // Announce page changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const addedElements = Array.from(mutation.addedNodes).filter(node => 
            node.nodeType === Node.ELEMENT_NODE
          ) as Element[];

          addedElements.forEach((element) => {
            if (element.matches('[role="alert"], .notification, .toast')) {
              const text = element.textContent?.trim();
              if (text) {
                this.announceToScreenReader(text, 'assertive');
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ===== HIGH CONTRAST =====
  private setupHighContrast(): void {
    if (!this.config.enableHighContrast) return;

    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }

    // Toggle high contrast mode
    this.addHighContrastToggle();

    logger.info('🎨 High contrast support enabled');
  }

  private addHighContrastToggle(): void {
    const toggle = document.createElement('button');
    toggle.textContent = 'Toggle High Contrast';
    toggle.className = 'high-contrast-toggle fixed top-4 right-4 z-50 px-3 py-2 bg-black text-white border border-white rounded';
    toggle.setAttribute('aria-label', 'Toggle high contrast mode');
    
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('high-contrast');
      const isEnabled = document.documentElement.classList.contains('high-contrast');
      this.announceToScreenReader(`High contrast mode ${isEnabled ? 'enabled' : 'disabled'}`);
    });

    document.body.appendChild(toggle);
  }

  // ===== REDUCED MOTION =====
  private setupReducedMotion(): void {
    if (!this.config.enableReducedMotion) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
      
      // Disable animations
      const style = document.createElement('style');
      style.textContent = `
        .reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }

    logger.info('🎭 Reduced motion support enabled');
  }

  // ===== FOCUS MANAGEMENT =====
  private setupFocusManagement(): void {
    if (!this.config.enableFocusManagement) return;

    // Enhanced focus indicators
    this.enhanceFocusIndicators();

    // Focus trapping for modals
    this.setupFocusTrapping();

    // Focus restoration
    this.setupFocusRestoration();

    logger.info('🎯 Enhanced focus management enabled');
  }

  private enhanceFocusIndicators(): void {
    const style = document.createElement('style');
    style.textContent = `
      .focus-visible {
        outline: 2px solid #00ffff !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
      }
      
      .focus-visible:focus-visible {
        outline: 2px solid #00ffff !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(0, 255, 255, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  }

  private setupFocusTrapping(): void {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (modal) {
          this.trapFocus(event, modal);
        }
      }
    });
  }

  private trapFocus(event: KeyboardEvent, container: Element): void {
    const focusableElements = container.querySelectorAll(this.focusableElements.join(','));
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private setupFocusRestoration(): void {
    let lastFocusedElement: HTMLElement | null = null;

    // Store focus before opening modals
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('[data-opens-modal]')) {
        lastFocusedElement = target;
      }
    });

    // Restore focus when modals close
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const target = mutation.target as HTMLElement;
          if (target.matches('[role="dialog"]') && target.getAttribute('aria-hidden') === 'true') {
            if (lastFocusedElement) {
              lastFocusedElement.focus();
              lastFocusedElement = null;
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-hidden']
    });
  }

  // ===== UTILITY METHODS =====
  private announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const regionId = priority === 'assertive' ? 'assertive-live-region' : 'live-region';
    const region = document.getElementById(regionId);
    
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  private focusElement(selector: string): void {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      this.announceToScreenReader(`Focused on ${element.textContent || selector}`);
    }
  }

  private closeModal(modal: Element): void {
    modal.setAttribute('aria-hidden', 'true');
    this.announceToScreenReader('Modal closed');
  }

  private closeDropdown(dropdown: Element): void {
    dropdown.setAttribute('aria-expanded', 'false');
    this.announceToScreenReader('Dropdown closed');
  }

  // ===== COLOR BLIND SUPPORT =====
  private setupColorBlindSupport(): void {
    if (!this.config.enableColorBlindSupport) return;

    // Add patterns and textures to color-coded elements
    this.enhanceColorCoding();

    // Color blind friendly palette
    this.setupColorBlindPalette();

    logger.info('🌈 Color blind support enabled');
  }

  private enhanceColorCoding(): void {
    // Add patterns to status indicators
    const statusElements = document.querySelectorAll('.status-success, .status-warning, .status-error');
    statusElements.forEach((element) => {
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      
      if (element.classList.contains('status-success')) {
        icon.textContent = '✓';
      } else if (element.classList.contains('status-warning')) {
        icon.textContent = '⚠';
      } else if (element.classList.contains('status-error')) {
        icon.textContent = '✗';
      }
      
      element.prepend(icon);
    });
  }

  private setupColorBlindPalette(): void {
    // Implement color blind friendly alternatives
    const style = document.createElement('style');
    style.textContent = `
      .colorblind-friendly {
        --success-color: #0066cc;
        --warning-color: #ff9900;
        --error-color: #cc0000;
        --info-color: #6600cc;
      }
    `;
    document.head.appendChild(style);
  }

  // ===== TEXT SCALING =====
  private setupTextScaling(): void {
    if (!this.config.enableTextScaling) return;

    // Add text scaling controls
    this.addTextScalingControls();

    logger.info('📝 Text scaling support enabled');
  }

  private addTextScalingControls(): void {
    const controls = document.createElement('div');
    controls.className = 'text-scaling-controls fixed bottom-4 right-4 z-50 flex gap-2';
    controls.innerHTML = `
      <button class="text-scale-btn px-2 py-1 bg-black text-white border border-white rounded" data-scale="0.8">A-</button>
      <button class="text-scale-btn px-2 py-1 bg-black text-white border border-white rounded" data-scale="1">A</button>
      <button class="text-scale-btn px-2 py-1 bg-black text-white border border-white rounded" data-scale="1.2">A+</button>
    `;

    controls.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('text-scale-btn')) {
        const scale = parseFloat(target.dataset.scale || '1');
        document.documentElement.style.fontSize = `${scale}rem`;
        this.announceToScreenReader(`Text size set to ${Math.round(scale * 100)}%`);
      }
    });

    document.body.appendChild(controls);
  }

  // ===== ACCESSIBILITY MONITORING =====
  private startAccessibilityMonitoring(): void {
    setInterval(() => {
      this.auditAccessibility();
    }, 30000); // Audit every 30 seconds
  }

  private auditAccessibility(): void {
    this.metrics.issuesFound = [];
    this.metrics.improvements = [];

    // Check for missing alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      this.metrics.issuesFound.push(`${imagesWithoutAlt.length} images missing alt text`);
    }

    // Check for missing form labels
    const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    if (inputsWithoutLabels.length > 0) {
      this.metrics.issuesFound.push(`${inputsWithoutLabels.length} inputs missing labels`);
    }

    // Check for low contrast
    this.checkContrast();

    // Calculate scores
    this.calculateAccessibilityScores();
  }

  private checkContrast(): void {
    // Simplified contrast checking
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
    let lowContrastCount = 0;

    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simplified contrast check (would need proper color parsing in real implementation)
      if (color === backgroundColor) {
        lowContrastCount++;
      }
    });

    if (lowContrastCount > 0) {
      this.metrics.issuesFound.push(`${lowContrastCount} elements with potential contrast issues`);
    }
  }

  private calculateAccessibilityScores(): void {
    const totalIssues = this.metrics.issuesFound.length;
    
    this.metrics.keyboardNavigationScore = Math.max(0, 100 - (totalIssues * 10));
    this.metrics.screenReaderScore = Math.max(0, 100 - (totalIssues * 15));
    this.metrics.contrastScore = Math.max(0, 100 - (totalIssues * 20));
    
    this.metrics.overallScore = Math.round(
      (this.metrics.keyboardNavigationScore + 
       this.metrics.screenReaderScore + 
       this.metrics.contrastScore) / 3
    );
  }

  // ===== PUBLIC API =====
  getMetrics(): AccessibilityMetrics {
    return { ...this.metrics };
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('♿ Accessibility config updated', newConfig);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announceToScreenReader(message, priority);
  }

  focus(selector: string): void {
    this.focusElement(selector);
  }
}

export const accessibilityEnhancementService = new AccessibilityEnhancementService();
export default accessibilityEnhancementService;
