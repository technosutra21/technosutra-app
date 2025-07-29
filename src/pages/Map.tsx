import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";
import { mapTileCache } from '@/services/mapTileCache';

const BASE_COORDINATES = {
  lat: -21.9427,
  lng: -46.7167
};

const ZOOM_LEVELS = {
  default: 14
};

const Map = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [currentStyle, setCurrentStyle] = useState('cyberpunk');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [BASE_COORDINATES.lng, BASE_COORDINATES.lat],
      zoom: ZOOM_LEVELS.default,
    });

    map.current.on('load', async () => {
      setIsLoading(false);
      try {
        await mapTileCache.cacheMapStyle(currentStyle);
      } catch (cacheError) {
        setError('Failed to cache map tiles.');
      }
    });

    return () => map.current?.remove();
  }, [currentStyle]);

  useEffect(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'ENABLE_TILE_CACHING' });
    }

    return () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'DISABLE_TILE_CACHING' });
      }
    };
  }, []);

  const changeStyle = useCallback((style: string) => {
    if (map.current) {
      map.current.setStyle(style);
      setCurrentStyle(style);
    }
  }, []);

  return (
    <div className="map-container" style={{ height: '100vh' }}>
      {isLoading ? <div>Loading map...</div> : null}
      {error ? <div>Error: {error}</div> : null}
      <div ref={mapContainer} className="map" />
      <button onClick={() => changeStyle('https://demotiles.maplibre.org/style1.json')}>Style 1</button>
      <button onClick={() => changeStyle('https://demotiles.maplibre.org/style2.json')}>Style 2</button>
    </div>
  );
};

export default Map;
