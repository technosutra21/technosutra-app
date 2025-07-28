import React from 'react';

interface RouteCreatorMapProps {
  mapContainer: React.RefObject<HTMLDivElement>;
}

export const RouteCreatorMap: React.FC<RouteCreatorMapProps> = ({ mapContainer }) => {
  return (
    <div className="h-full w-full relative">
      <div ref={mapContainer} className="absolute inset-0 bg-slate-900" />
      <div className="absolute top-4 left-4 bg-slate-800/50 p-2 rounded-lg text-white text-sm">
        Click on the map to add points
      </div>
    </div>
  );
}; 