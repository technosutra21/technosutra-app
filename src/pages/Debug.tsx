import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDebugInfo, getStoredErrorLogs, clearStoredErrorLogs } from '@/utils/debugUtils';
import { pathResolver } from '@/utils/pathResolver';
import { Trash2, RefreshCw, Download } from 'lucide-react';

const Debug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [pathResolverInfo, setPathResolverInfo] = useState<any>(null);

  useEffect(() => {
    loadDebugData();
  }, []);

  const loadDebugData = () => {
    try {
      setDebugInfo(getDebugInfo());
      setErrorLogs(getStoredErrorLogs());
      setPathResolverInfo(pathResolver.getEnvironment());
    } catch (error) {
      console.error('Failed to load debug data:', error);
    }
  };

  const handleClearLogs = () => {
    clearStoredErrorLogs();
    setErrorLogs([]);
  };

  const exportDebugData = () => {
    const data = {
      debugInfo,
      errorLogs,
      pathResolverInfo,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `technosutra-debug-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-cyan-400">TECHNO SUTRA Debug</h1>
          <div className="flex gap-2">
            <Button onClick={loadDebugData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportDebugData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Environment Info */}
        <Card className="bg-slate-900 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Environment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {debugInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-green-400 font-semibold mb-2">Location</h3>
                  <pre className="text-xs text-slate-300 bg-slate-800 p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo.location, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-green-400 font-semibold mb-2">Browser</h3>
                  <pre className="text-xs text-slate-300 bg-slate-800 p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo.browser, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Path Resolver Info */}
        <Card className="bg-slate-900 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400">Path Resolver Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pathResolverInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Host:</span>
                  <Badge className="bg-blue-500/20 text-blue-400">{pathResolverInfo.host}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">GitHub Pages:</span>
                  <Badge className={pathResolverInfo.isGitHubPages ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {pathResolverInfo.isGitHubPages ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Custom Domain:</span>
                  <Badge className={pathResolverInfo.isCustomDomain ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {pathResolverInfo.isCustomDomain ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Base Path:</span>
                  <Badge className="bg-cyan-500/20 text-cyan-400">{pathResolverInfo.basePath}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Logs */}
        <Card className="bg-slate-900 border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-red-400">Error Logs ({errorLogs.length})</CardTitle>
            {errorLogs.length > 0 && (
              <Button onClick={handleClearLogs} variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {errorLogs.length === 0 ? (
              <p className="text-green-400">No errors recorded! 🎉</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-auto">
                {errorLogs.map((log, index) => (
                  <div key={index} className="bg-slate-800 p-3 rounded border border-red-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-red-500/20 text-red-400">{log.context}</Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-orange-400 font-semibold">{log.error.name}: {log.error.message}</h4>
                    <details className="mt-2">
                      <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                        Show Stack Trace
                      </summary>
                      <pre className="text-xs text-slate-300 mt-2 overflow-auto max-h-32">
                        {log.error.stack}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Path Resolution Tests */}
        <Card className="bg-slate-900 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-yellow-400">Path Resolution Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="text-green-400 font-semibold mb-2">Model Paths</h3>
                <div className="space-y-1 text-slate-300">
                  <div>Model 1: <code className="text-cyan-400">{pathResolver.resolveModel(1)}</code></div>
                  <div>Model 10: <code className="text-cyan-400">{pathResolver.resolveModel(10)}</code></div>
                </div>
              </div>
              <div>
                <h3 className="text-green-400 font-semibold mb-2">Data Paths</h3>
                <div className="space-y-1 text-slate-300">
                  <div>Characters: <code className="text-cyan-400">{pathResolver.resolveDataFile('characters.csv')}</code></div>
                  <div>Chapters: <code className="text-cyan-400">{pathResolver.resolveDataFile('chapters.csv')}</code></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Debug;
