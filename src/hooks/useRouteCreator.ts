import { useState, useRef, useCallback, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useSutraData } from '@/hooks/useSutraData';
import { logger } from '@/lib/logger';
import { Trail, TrailPoint, TrailType, TRAIL_TYPES } from '@/types/route-creator';
import { lineString as turfLineString, point as turfPoint, featureCollection } from '@turf/helpers';
// import turfDistance from '@turf/distance'; // TODO: Remove if not needed

export const useRouteCreator = () => {
    const [currentStep, setCurrentStep] = useState<'type' | 'build'>('type');
    const [selectedTrailType, setSelectedTrailType] = useState<TrailType | null>(null);
    const [trail, setTrail] = useState<Trail>({
        name: '',
        description: '',
        type: 'meditation',
        points: [],
        characters: [],
        difficulty: 'easy',
        estimatedTime: 60
    });
    const [isCreating, setIsCreating] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isTrackingLocation, setIsTrackingLocation] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const { getCombinedData } = useSutraData();

    const BASE_COORDINATES = { lat: -21.9427, lng: -46.7167 };

    const addTrailPoint = useCallback((coordinates: [number, number]) => {
        setTrail(prev => {
            const newPoint: TrailPoint = {
                id: `point-${Date.now()}`,
                name: `${t('routeCreator.point')} ${prev.points.length + 1}`,
                type: 'waypoint',
                coordinates,
            };
            return { ...prev, points: [...prev.points, newPoint] };
        });
    }, [t]);

    const mapClickHandler = useRef(addTrailPoint);
    useEffect(() => {
        mapClickHandler.current = addTrailPoint;
    }, [addTrailPoint]);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        const mapInstance = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://demotiles.maplibre.org/style.json',
            center: userLocation || [BASE_COORDINATES.lng, BASE_COORDINATES.lat],
            zoom: 15,
            hash: true,
        });
        map.current = mapInstance;

        const handleMapClick = (e: maplibregl.MapMouseEvent) => {
            if (currentStep === 'build') {
                mapClickHandler.current(e.lngLat.toArray() as [number, number]);
            }
        };

        mapInstance.on('load', () => {
            logger.info('Map loaded');
            if (!map.current) return;
            map.current.addSource('trail-line', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } });
            map.current.addSource('trail-points', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            map.current.addLayer({
                id: 'trail-line-layer',
                type: 'line',
                source: 'trail-line',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#888', 'line-width': 8, 'line-opacity': 0.8 }
            });
            map.current.on('click', handleMapClick);
        });

        return () => {
            mapInstance.off('click', handleMapClick);
            mapInstance.remove();
            map.current = null;
        };
    }, [currentStep, userLocation, BASE_COORDINATES.lng, BASE_COORDINATES.lat]);

    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded() || !trail.points.length) return;

        const lineData = turfLineString(trail.points.map(p => p.coordinates));
        const pointsData = featureCollection(trail.points.map(p => turfPoint(p.coordinates, { id: p.id, name: p.name })));

        const lineSource = map.current.getSource('trail-line') as maplibregl.GeoJSONSource | undefined;
        lineSource?.setData(lineData);

        const pointsSource = map.current.getSource('trail-points') as maplibregl.GeoJSONSource | undefined;
        pointsSource?.setData(pointsData);

    }, [trail.points]);

    const selectTrailType = useCallback((type: TrailType) => {
        setSelectedTrailType(type);
        setTrail(prev => ({ ...prev, type }));
        setCurrentStep('build');
        if (map.current) {
            map.current.setStyle('https://demotiles.maplibre.org/style.json');
        }
    }, []);
    
    const removeTrailPoint = useCallback((index: number) => {
        setTrail(prev => ({ ...prev, points: prev.points.filter((_, i) => i !== index) }));
        toast({ title: t('routeCreator.pointRemoved') });
    }, [t, toast]);

    const updateTrailDetails = useCallback((details: Partial<Trail>) => {
        setTrail(prev => ({ ...prev, ...details }));
    }, []);

    const saveTrail = useCallback(async () => {
        setIsCreating(true);
        try {
            logger.info('Saving trail:', trail);
            // Simulate API call
            await new Promise(res => setTimeout(res, 1500));
            toast({
                title: t('routeCreator.trailSavedSuccessTitle'),
                description: t('routeCreator.trailSavedSuccessDescription', { name: trail.name }),
            });
            // Reset state
            setCurrentStep('type');
            setSelectedTrailType(null);
            setTrail({ name: '', description: '', type: 'meditation', points: [], characters: [], difficulty: 'easy', estimatedTime: 60 });
        } catch (error) {
            logger.error('Failed to save trail', error);
            toast({
                title: t('routeCreator.trailSavedErrorTitle'),
                description: t('routeCreator.trailSavedErrorDescription'),
                variant: 'destructive',
            });
        } finally {
            setIsCreating(false);
        }
    }, [trail, t, toast]);

    return {
        currentStep,
        selectedTrailType,
        trail,
        isCreating,
        userLocation,
        isTrackingLocation,
        selectedCharacter,
        mapContainer,
        selectTrailType,
        removeTrailPoint,
        updateTrailDetails,
        saveTrail,
        setTrail,
        setCurrentStep,
        setSelectedCharacter,
        setUserLocation,
        setIsTrackingLocation,
        getCombinedData,
        language
    };
}; 