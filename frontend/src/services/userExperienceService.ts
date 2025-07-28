// User Experience Service for TECHNO SUTRA
// Comprehensive UX optimization and user journey management

import { logger } from '@/lib/logger';

interface UserProfile {
  id: string;
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  completedOnboarding: boolean;
  preferredLanguage: 'pt' | 'en';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
  usage: {
    totalTimeSpent: number;
    charactersDiscovered: number;
    routesCreated: number;
    arViewsUsed: number;
    mapInteractions: number;
  };
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  completed: boolean;
  optional: boolean;
  order: number;
}

interface UserFeedback {
  id: string;
  timestamp: number;
  type: 'bug' | 'feature' | 'improvement' | 'praise' | 'complaint';
  rating: number; // 1-5
  message: string;
  context: {
    page: string;
    userAgent: string;
    sessionDuration: number;
  };
  resolved: boolean;
}

interface ContextualHelp {
  id: string;
  trigger: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  showCount: number;
  maxShows: number;
}

interface UserJourney {
  sessionId: string;
  startTime: number;
  endTime?: number;
  pages: Array<{
    path: string;
    timestamp: number;
    timeSpent: number;
    interactions: number;
  }>;
  goals: Array<{
    type: string;
    achieved: boolean;
    timestamp?: number;
  }>;
}

class UserExperienceService {
  private userProfile: UserProfile | null = null;
  private currentJourney: UserJourney | null = null;
  private onboardingSteps: OnboardingStep[] = [];
  private contextualHelp: ContextualHelp[] = [];
  private feedbackQueue: UserFeedback[] = [];
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize UX service
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadUserProfile();
    this.initializeOnboarding();
    this.initializeContextualHelp();
    this.startUserJourney();
    this.setupEventListeners();

    this.isInitialized = true;
    logger.info('🎯 User Experience service initialized');
  }

  /**
   * Load or create user profile
   */
  private async loadUserProfile(): Promise<void> {
    try {
      const stored = localStorage.getItem('technosutra-user-profile');

      if (stored) {
        this.userProfile = JSON.parse(stored);
        if (this.userProfile) {
          this.userProfile.lastVisit = Date.now();
          this.userProfile.visitCount++;
        }
      } else {
        // Create new user profile
        this.userProfile = this.createNewUserProfile();
      }

      this.saveUserProfile();
    } catch (error) {
      logger.error('Failed to load user profile:', error);
      this.userProfile = this.createNewUserProfile();
    }
  }

  /**
   * Create new user profile
   */
  private createNewUserProfile(): UserProfile {
    return {
      id: this.generateUserId(),
      firstVisit: Date.now(),
      lastVisit: Date.now(),
      visitCount: 1,
      completedOnboarding: false,
      preferredLanguage: 'pt',
      experienceLevel: 'beginner',
      interests: [],
      accessibility: {
        reducedMotion: false,
        highContrast: false,
        screenReader: false,
      },
      usage: {
        totalTimeSpent: 0,
        charactersDiscovered: 0,
        routesCreated: 0,
        arViewsUsed: 0,
        mapInteractions: 0,
      },
    };
  }

  /**
   * Initialize onboarding flow
   */
  private initializeOnboarding(): void {
    this.onboardingSteps = [
      {
        id: 'welcome',
        title: 'Bem-vindo ao TECHNO SUTRA',
        description: 'Descubra uma jornada espiritual budista através da tecnologia',
        component: 'WelcomeStep',
        completed: false,
        optional: false,
        order: 1,
      },
      {
        id: 'permissions',
        title: 'Permissões Necessárias',
        description: 'Precisamos acessar sua localização para a experiência completa',
        component: 'PermissionsStep',
        completed: false,
        optional: false,
        order: 2,
      },
      {
        id: 'map-tutorial',
        title: 'Navegando o Mapa',
        description: 'Aprenda a usar o mapa interativo e descobrir personagens',
        component: 'MapTutorialStep',
        completed: false,
        optional: false,
        order: 3,
      },
      {
        id: 'character-interaction',
        title: 'Interagindo com Personagens',
        description: 'Como visualizar modelos 3D e experiências AR',
        component: 'CharacterTutorialStep',
        completed: false,
        optional: false,
        order: 4,
      },
      {
        id: 'route-creation',
        title: 'Criando Trilhas',
        description: 'Crie suas próprias trilhas budistas personalizadas',
        component: 'RouteTutorialStep',
        completed: false,
        optional: true,
        order: 5,
      },
    ];

    // Load completed steps
    const completed = JSON.parse(localStorage.getItem('technosutra-onboarding') || '[]');
    this.onboardingSteps.forEach(step => {
      step.completed = completed.includes(step.id);
    });
  }

  /**
   * Initialize contextual help system
   */
  private initializeContextualHelp(): void {
    this.contextualHelp = [
      {
        id: 'first-character-discovery',
        trigger: 'character-in-range',
        title: 'Personagem Próximo!',
        content: 'Você está próximo de um personagem budista. Toque no marcador para interagir.',
        position: 'top',
        showCount: 0,
        maxShows: 3,
      },
      {
        id: 'ar-mode-available',
        trigger: 'ar-button-visible',
        title: 'Modo AR Disponível',
        content: 'Toque no botão AR para ver o personagem em realidade aumentada.',
        position: 'bottom',
        showCount: 0,
        maxShows: 2,
      },
      {
        id: 'offline-mode-active',
        trigger: 'offline-detected',
        title: 'Modo Offline Ativo',
        content: 'Você está offline, mas todas as funcionalidades continuam disponíveis.',
        position: 'top',
        showCount: 0,
        maxShows: 1,
      },
    ];

    // Load help show counts
    const helpData = JSON.parse(localStorage.getItem('technosutra-help') || '{}');
    this.contextualHelp.forEach(help => {
      help.showCount = helpData[help.id] || 0;
    });
  }

  /**
   * Start user journey tracking
   */
  private startUserJourney(): void {
    this.currentJourney = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      pages: [],
      goals: [
        { type: 'discover-character', achieved: false },
        { type: 'view-3d-model', achieved: false },
        { type: 'use-ar-mode', achieved: false },
        { type: 'create-route', achieved: false },
      ],
    };

    this.trackPageVisit(window.location.pathname);
  }

  /**
   * Setup event listeners for UX tracking
   */
  private setupEventListeners(): void {
    // Track page changes
    window.addEventListener('popstate', () => {
      this.trackPageVisit(window.location.pathname);
    });

    // Track user interactions
    document.addEventListener('click', (event) => {
      this.trackInteraction('click', event.target as HTMLElement);
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endUserJourney();
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseJourney();
      } else {
        this.resumeJourney();
      }
    });
  }

  /**
   * Check if user needs onboarding
   */
  needsOnboarding(): boolean {
    return !this.userProfile?.completedOnboarding;
  }

  /**
   * Get next onboarding step
   */
  getNextOnboardingStep(): OnboardingStep | null {
    return this.onboardingSteps
      .filter(step => !step.completed)
      .sort((a, b) => a.order - b.order)[0] || null;
  }

  /**
   * Complete onboarding step
   */
  completeOnboardingStep(stepId: string): void {
    const step = this.onboardingSteps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;

      // Save progress
      const completed = this.onboardingSteps
        .filter(s => s.completed)
        .map(s => s.id);
      localStorage.setItem('technosutra-onboarding', JSON.stringify(completed));

      // Check if onboarding is complete
      const requiredSteps = this.onboardingSteps.filter(s => !s.optional);
      const completedRequired = requiredSteps.filter(s => s.completed);

      if (completedRequired.length === requiredSteps.length && this.userProfile) {
        this.userProfile.completedOnboarding = true;
        this.saveUserProfile();
        this.trackGoalAchievement('complete-onboarding');
      }

      logger.info(`Onboarding step completed: ${stepId}`);
    }
  }

  /**
   * Show contextual help
   */
  showContextualHelp(trigger: string): ContextualHelp | null {
    const help = this.contextualHelp.find(h =>
      h.trigger === trigger && h.showCount < h.maxShows
    );

    if (help) {
      help.showCount++;

      // Save updated counts
      const helpData = this.contextualHelp.reduce((acc, h) => {
        acc[h.id] = h.showCount;
        return acc;
      }, {} as Record<string, number>);
      localStorage.setItem('technosutra-help', JSON.stringify(helpData));

      logger.info(`Contextual help shown: ${help.id}`);
      return help;
    }

    return null;
  }

  /**
   * Track page visit
   */
  private trackPageVisit(path: string): void {
    if (!this.currentJourney) return;

    const now = Date.now();
    const currentPage = this.currentJourney.pages[this.currentJourney.pages.length - 1];

    // Update time spent on previous page
    if (currentPage) {
      currentPage.timeSpent = now - currentPage.timestamp;
    }

    // Add new page
    this.currentJourney.pages.push({
      path,
      timestamp: now,
      timeSpent: 0,
      interactions: 0,
    });
  }

  /**
   * Track user interaction
   */
  private trackInteraction(type: string, element: HTMLElement): void {
    if (!this.currentJourney) return;

    const currentPage = this.currentJourney.pages[this.currentJourney.pages.length - 1];
    if (currentPage) {
      currentPage.interactions++;
    }

    // Track specific interactions
    const elementClass = element.className;

    if (elementClass.includes('character-marker')) {
      this.trackGoalAchievement('discover-character');
    } else if (elementClass.includes('ar-button')) {
      this.trackGoalAchievement('use-ar-mode');
    } else if (elementClass.includes('model-viewer')) {
      this.trackGoalAchievement('view-3d-model');
    }
  }

  /**
   * Track goal achievement
   */
  private trackGoalAchievement(goalType: string): void {
    if (!this.currentJourney) return;

    const goal = this.currentJourney.goals.find(g => g.type === goalType);
    if (goal && !goal.achieved) {
      goal.achieved = true;
      goal.timestamp = Date.now();

      logger.info(`Goal achieved: ${goalType}`);

      // Update user profile usage stats
      if (this.userProfile) {
        switch (goalType) {
          case 'discover-character':
            this.userProfile.usage.charactersDiscovered++;
            break;
          case 'use-ar-mode':
            this.userProfile.usage.arViewsUsed++;
            break;
          case 'create-route':
            this.userProfile.usage.routesCreated++;
            break;
        }
        this.saveUserProfile();
      }
    }
  }

  /**
   * Submit user feedback
   */
  submitFeedback(
    type: UserFeedback['type'],
    rating: number,
    message: string
  ): string {
    const feedback: UserFeedback = {
      id: this.generateFeedbackId(),
      timestamp: Date.now(),
      type,
      rating,
      message,
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        sessionDuration: this.getSessionDuration(),
      },
      resolved: false,
    };

    this.feedbackQueue.push(feedback);

    // Store feedback locally
    const storedFeedback = JSON.parse(localStorage.getItem('technosutra-feedback') || '[]');
    storedFeedback.push(feedback);
    localStorage.setItem('technosutra-feedback', JSON.stringify(storedFeedback.slice(-50)));

    logger.info(`Feedback submitted: ${type} - ${rating}/5`);
    return feedback.id;
  }

  /**
   * Get user experience insights
   */
  getUXInsights(): {
    profile: UserProfile | null;
    onboardingProgress: number;
    currentJourney: UserJourney | null;
    feedbackSummary: {
      total: number;
      averageRating: number;
      byType: Record<string, number>;
    };
  } {
    const feedbackSummary = {
      total: this.feedbackQueue.length,
      averageRating: this.feedbackQueue.length > 0
        ? this.feedbackQueue.reduce((sum, f) => sum + f.rating, 0) / this.feedbackQueue.length
        : 0,
      byType: this.feedbackQueue.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const completedSteps = this.onboardingSteps.filter(s => s.completed).length;
    const totalSteps = this.onboardingSteps.length;
    const onboardingProgress = totalSteps > 0 ? completedSteps / totalSteps : 0;

    return {
      profile: this.userProfile,
      onboardingProgress,
      currentJourney: this.currentJourney,
      feedbackSummary,
    };
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(preferences: Partial<UserProfile>): void {
    if (this.userProfile) {
      Object.assign(this.userProfile, preferences);
      this.saveUserProfile();
      logger.info('User preferences updated');
    }
  }

  /**
   * Get personalized recommendations
   */
  getPersonalizedRecommendations(): Array<{
    type: string;
    title: string;
    description: string;
    action: string;
  }> {
    if (!this.userProfile) return [];

    const recommendations = [];

    // Beginner recommendations
    if (this.userProfile.experienceLevel === 'beginner') {
      if (this.userProfile.usage.charactersDiscovered < 5) {
        recommendations.push({
          type: 'discovery',
          title: 'Explore Mais Personagens',
          description: 'Você descobriu poucos personagens. Explore o mapa para encontrar mais!',
          action: 'open-map',
        });
      }

      if (this.userProfile.usage.arViewsUsed === 0) {
        recommendations.push({
          type: 'feature',
          title: 'Experimente o Modo AR',
          description: 'Veja os personagens budistas em realidade aumentada!',
          action: 'try-ar',
        });
      }
    }

    // Route creation recommendation
    if (this.userProfile.usage.routesCreated === 0 && this.userProfile.usage.charactersDiscovered > 3) {
      recommendations.push({
        type: 'creation',
        title: 'Crie Sua Primeira Trilha',
        description: 'Com base nos personagens que você descobriu, crie uma trilha personalizada!',
        action: 'create-route',
      });
    }

    return recommendations;
  }

  /**
   * End user journey
   */
  private endUserJourney(): void {
    if (!this.currentJourney) return;

    this.currentJourney.endTime = Date.now();

    // Update total time spent
    if (this.userProfile) {
      const sessionDuration = this.getSessionDuration();
      this.userProfile.usage.totalTimeSpent += sessionDuration;
      this.saveUserProfile();
    }

    // Store journey data
    const journeys = JSON.parse(localStorage.getItem('technosutra-journeys') || '[]');
    journeys.push(this.currentJourney);
    localStorage.setItem('technosutra-journeys', JSON.stringify(journeys.slice(-10)));

    logger.info(`User journey ended: ${this.getSessionDuration()}ms`);
  }

  /**
   * Pause journey tracking
   */
  private pauseJourney(): void {
    // Implementation for pausing journey tracking
  }

  /**
   * Resume journey tracking
   */
  private resumeJourney(): void {
    // Implementation for resuming journey tracking
  }

  /**
   * Get session duration
   */
  private getSessionDuration(): number {
    return this.currentJourney
      ? Date.now() - this.currentJourney.startTime
      : 0;
  }

  /**
   * Save user profile
   */
  private saveUserProfile(): void {
    if (this.userProfile) {
      localStorage.setItem('technosutra-user-profile', JSON.stringify(this.userProfile));
    }
  }

  /**
   * Utility methods
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const userExperienceService = new UserExperienceService();
export default userExperienceService;
