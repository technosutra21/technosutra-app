import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface ProgressData {
  visitedWaypoints: Set<number>;
  lastVisited: number | null;
  totalProgress: number;
  streakCount: number;
  achievements: string[];
}

export const useProgress = () => {
  const [progressData, setProgressData] = useState<ProgressData>(() => {
    try {
      const saved = localStorage.getItem('technosutra-progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          visitedWaypoints: new Set(parsed.visitedWaypoints || []),
          lastVisited: parsed.lastVisited || null,
          totalProgress: parsed.totalProgress || 0,
          streakCount: parsed.streakCount || 0,
          achievements: parsed.achievements || []
        };
      }
    } catch (error) {
      logger.error('Error loading progress data:', error);
    }
    
    return {
      visitedWaypoints: new Set<number>(),
      lastVisited: null,
      totalProgress: 0,
      streakCount: 0,
      achievements: []
    };
  });

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    try {
      const dataToSave = {
        visitedWaypoints: Array.from(progressData.visitedWaypoints),
        lastVisited: progressData.lastVisited,
        totalProgress: progressData.totalProgress,
        streakCount: progressData.streakCount,
        achievements: progressData.achievements
      };
      localStorage.setItem('technosutra-progress', JSON.stringify(dataToSave));
    } catch (error) {
      logger.error('Error saving progress data:', error);
    }
  }, [progressData]);

  const markAsVisited = useCallback((chapterId: number) => {
    setProgressData(prev => {
      if (prev.visitedWaypoints.has(chapterId)) {
        return prev; // Already visited
      }

      const newVisited = new Set(prev.visitedWaypoints);
      newVisited.add(chapterId);
      
      const newProgress = (newVisited.size / 56) * 100;
      const newAchievements = [...prev.achievements];
      
      // Check for achievements
      if (newVisited.size === 1 && !prev.achievements.includes('first_step')) {
        newAchievements.push('first_step');
      }
      if (newVisited.size === 10 && !prev.achievements.includes('explorer')) {
        newAchievements.push('explorer');
      }
      if (newVisited.size === 28 && !prev.achievements.includes('halfway')) {
        newAchievements.push('halfway');
      }
      if (newVisited.size === 56 && !prev.achievements.includes('enlightened')) {
        newAchievements.push('enlightened');
      }

      logger.info(`📍 Waypoint ${chapterId} marked as visited. Progress: ${newProgress.toFixed(1)}%`);

      return {
        visitedWaypoints: newVisited,
        lastVisited: chapterId,
        totalProgress: newProgress,
        streakCount: prev.streakCount + 1,
        achievements: newAchievements
      };
    });
  }, []);

  const isVisited = useCallback((chapterId: number): boolean => {
    return progressData.visitedWaypoints.has(chapterId);
  }, [progressData.visitedWaypoints]);

  const resetProgress = useCallback(() => {
    setProgressData({
      visitedWaypoints: new Set<number>(),
      lastVisited: null,
      totalProgress: 0,
      streakCount: 0,
      achievements: []
    });
    logger.info('🔄 Progress reset');
  }, []);

  const getAchievementTitle = (achievement: string): string => {
    const titles = {
      'first_step': 'Primeiro Passo',
      'explorer': 'Explorador',
      'halfway': 'Meio Caminho',
      'enlightened': 'Iluminado'
    };
    return titles[achievement as keyof typeof titles] || achievement;
  };

  const getAchievementDescription = (achievement: string): string => {
    const descriptions = {
      'first_step': 'Visitou seu primeiro ponto sagrado',
      'explorer': 'Visitou 10 pontos da jornada',
      'halfway': 'Completou metade da jornada (28 pontos)',
      'enlightened': 'Completou toda a jornada sagrada (56 pontos)'
    };
    return descriptions[achievement as keyof typeof descriptions] || '';
  };

  return {
    // Core data
    visitedWaypoints: progressData.visitedWaypoints,
    totalProgress: progressData.totalProgress,
    visitedCount: progressData.visitedWaypoints.size,
    lastVisited: progressData.lastVisited,
    streakCount: progressData.streakCount,
    achievements: progressData.achievements,
    
    // Actions
    markAsVisited,
    isVisited,
    resetProgress,
    
    // Helpers
    getAchievementTitle,
    getAchievementDescription,
    
    // Computed values
    isComplete: progressData.visitedWaypoints.size === 56,
    nextMilestone: progressData.visitedWaypoints.size < 10 ? 10 : 
                   progressData.visitedWaypoints.size < 28 ? 28 : 
                   progressData.visitedWaypoints.size < 56 ? 56 : null
  };
};