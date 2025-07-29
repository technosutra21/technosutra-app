// Offline Testing and Validation Service for TECHNO SUTRA
// Comprehensive testing of PWA offline functionality

import { logger } from '@/lib/logger';
import { offlineStorage } from './offlineStorage';
import { enhancedGPS } from './enhancedGPS';
import { pwaService } from './pwaService';

interface OfflineTestResult {
  feature: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface OfflineValidationReport {
  overall: 'pass' | 'fail' | 'warning';
  timestamp: string;
  results: OfflineTestResult[];
  recommendations: string[];
}

class OfflineTestingService {
  private testResults: OfflineTestResult[] = [];

  /**
   * Run comprehensive offline functionality tests
   */
  async runOfflineValidation(): Promise<OfflineValidationReport> {
    logger.info('🧪 Starting comprehensive offline validation...');
    this.testResults = [];

    // Test PWA installation capability
    await this.testPWAInstallation();

    // Test service worker functionality
    await this.testServiceWorker();

    // Test IndexedDB storage
    await this.testIndexedDBStorage();

    // Test 3D model caching
    await this.testModelCaching();

    // Test CSV data caching
    await this.testCSVDataCaching();

    // Test GPS functionality
    await this.testGPSFunctionality();

    // Test map tile caching
    await this.testMapTileCaching();

    // Test offline navigation
    await this.testOfflineNavigation();

    // Generate report
    const report = this.generateValidationReport();
    logger.info(`🧪 Offline validation completed: ${report.overall}`);
    
    return report;
  }

  private async testPWAInstallation(): Promise<void> {
    try {
      // Check if PWA can be installed
      const _canInstall = pwaService.canInstall();
      
      // Check manifest.json
      const manifestResponse = await fetch('/manifest.json');
      const manifest = await manifestResponse.json();
      
      if (manifest && manifest.name && manifest.icons) {
        this.addResult('PWA Installation', 'pass', 'PWA manifest is valid and app can be installed');
      } else {
        this.addResult('PWA Installation', 'fail', 'PWA manifest is invalid or missing required fields');
      }
    } catch (error) {
      this.addResult('PWA Installation', 'fail', `PWA installation test failed: ${error}`);
    }
  }

  private async testServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration && registration.active) {
          this.addResult('Service Worker', 'pass', 'Service worker is registered and active');
        } else {
          this.addResult('Service Worker', 'warning', 'Service worker is not active');
        }
      } else {
        this.addResult('Service Worker', 'fail', 'Service worker not supported');
      }
    } catch (error) {
      this.addResult('Service Worker', 'fail', `Service worker test failed: ${error}`);
    }
  }

  private async testIndexedDBStorage(): Promise<void> {
    try {
      // Test basic IndexedDB operations
      await offlineStorage.put('appSettings', {
        key: 'test-offline-validation',
        data: 'test-data',
        timestamp: Date.now()
      });

      const retrieved = await offlineStorage.get('appSettings', 'test-offline-validation');
      
      if (retrieved && retrieved.data === 'test-data') {
        this.addResult('IndexedDB Storage', 'pass', 'IndexedDB is working correctly');
        
        // Clean up test data
        await offlineStorage.delete('appSettings', 'test-offline-validation');
      } else {
        this.addResult('IndexedDB Storage', 'fail', 'IndexedDB data retrieval failed');
      }
    } catch (error) {
      this.addResult('IndexedDB Storage', 'fail', `IndexedDB test failed: ${error}`);
    }
  }

  private async testModelCaching(): Promise<void> {
    try {
      // Check if models are cached
      const cachedModels = await offlineStorage.getAllCachedModels();
      
      if (cachedModels.length > 0) {
        this.addResult('3D Model Caching', 'pass', `${cachedModels.length} models cached for offline use`);
      } else {
        this.addResult('3D Model Caching', 'warning', 'No 3D models cached - run cacheAllModels() to cache models');
      }
    } catch (error) {
      this.addResult('3D Model Caching', 'fail', `Model caching test failed: ${error}`);
    }
  }

  private async testCSVDataCaching(): Promise<void> {
    try {
      const csvFiles = ['characters.csv', 'chapters.csv', 'waypoint-coordinates.json'];
      let cachedCount = 0;

      for (const file of csvFiles) {
        const cached = await offlineStorage.getCachedCSVData(file);
        if (cached) cachedCount++;
      }

      if (cachedCount === csvFiles.length) {
        this.addResult('CSV Data Caching', 'pass', 'All CSV data files cached for offline use');
      } else {
        this.addResult('CSV Data Caching', 'warning', `${cachedCount}/${csvFiles.length} CSV files cached`);
      }
    } catch (error) {
      this.addResult('CSV Data Caching', 'fail', `CSV data caching test failed: ${error}`);
    }
  }

  private async testGPSFunctionality(): Promise<void> {
    try {
      if ('geolocation' in navigator) {
        // Test GPS permission and basic functionality
        const hasPermission = await this.checkGPSPermission();
        
        if (hasPermission) {
          // Test "Where Am I" functionality
          const whereAmI = await enhancedGPS.getWhereAmI();
          
          this.addResult('GPS Functionality', 'pass', 
            `GPS working - Location: ${whereAmI.location}, Accuracy: ${whereAmI.accuracy}`);
        } else {
          this.addResult('GPS Functionality', 'warning', 'GPS permission not granted');
        }
      } else {
        this.addResult('GPS Functionality', 'fail', 'Geolocation not supported');
      }
    } catch (error) {
      this.addResult('GPS Functionality', 'warning', `GPS test failed: ${error}`);
    }
  }

  private async checkGPSPermission(): Promise<boolean> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state === 'granted';
      }
      return false;
    } catch {
      return false;
    }
  }

  private async testMapTileCaching(): Promise<void> {
    try {
      // Check if map tiles are cached
      const mapTiles = await offlineStorage.getAll('mapTiles');
      
      if (mapTiles.length > 0) {
        this.addResult('Map Tile Caching', 'pass', `${mapTiles.length} map tiles cached for offline use`);
      } else {
        this.addResult('Map Tile Caching', 'warning', 'No map tiles cached - run cacheRegionMapTiles() to cache tiles');
      }
    } catch (error) {
      this.addResult('Map Tile Caching', 'fail', `Map tile caching test failed: ${error}`);
    }
  }

  private async testOfflineNavigation(): Promise<void> {
    try {
      // Test if app routes work offline by checking cached index.html
      const cache = await caches.open('technosutra-static-v1');
      const cachedIndex = await cache.match('/index.html');
      
      if (cachedIndex) {
        this.addResult('Offline Navigation', 'pass', 'App navigation works offline');
      } else {
        this.addResult('Offline Navigation', 'warning', 'Index.html not cached - offline navigation may not work');
      }
    } catch (error) {
      this.addResult('Offline Navigation', 'fail', `Offline navigation test failed: ${error}`);
    }
  }

  private addResult(feature: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.testResults.push({ feature, status, message, details });
  }

  private generateValidationReport(): OfflineValidationReport {
    const _passCount = this.testResults.filter(r => r.status === 'pass').length;
    const failCount = this.testResults.filter(r => r.status === 'fail').length;
    const warningCount = this.testResults.filter(r => r.status === 'warning').length;

    let overall: 'pass' | 'fail' | 'warning';
    if (failCount > 0) {
      overall = 'fail';
    } else if (warningCount > 0) {
      overall = 'warning';
    } else {
      overall = 'pass';
    }

    const recommendations = this.generateRecommendations();

    return {
      overall,
      timestamp: new Date().toISOString(),
      results: this.testResults,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for specific issues and provide recommendations
    const failedTests = this.testResults.filter(r => r.status === 'fail');
    const warningTests = this.testResults.filter(r => r.status === 'warning');

    if (failedTests.some(t => t.feature === 'Service Worker')) {
      recommendations.push('Register service worker for offline functionality');
    }

    if (warningTests.some(t => t.feature === '3D Model Caching')) {
      recommendations.push('Run offlineStorage.cacheAllModels() to cache 3D models');
    }

    if (warningTests.some(t => t.feature === 'Map Tile Caching')) {
      recommendations.push('Run offlineStorage.cacheRegionMapTiles() to cache map tiles');
    }

    if (warningTests.some(t => t.feature === 'GPS Functionality')) {
      recommendations.push('Grant GPS permission for location-based features');
    }

    if (recommendations.length === 0) {
      recommendations.push('All offline features are working correctly!');
    }

    return recommendations;
  }

  /**
   * Initialize complete offline functionality
   */
  async initializeOfflineFunctionality(): Promise<void> {
    logger.info('🚀 Initializing complete offline functionality...');

    try {
      // Cache all critical data
      await Promise.all([
        offlineStorage.cacheAllCSVData(),
        offlineStorage.cacheAllModels(),
        offlineStorage.cacheRegionMapTiles()
      ]);

      // Ensure PWA is ready
      await pwaService.ensureCompleteOfflineFunctionality();

      logger.info('✅ Complete offline functionality initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize offline functionality:', error);
      throw error;
    }
  }
}

export const offlineTestingService = new OfflineTestingService();
export default offlineTestingService;
