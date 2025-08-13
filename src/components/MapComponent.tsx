import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import bearing from '@turf/bearing';
import { MapComponentProps } from './MapComponent.types';

export const MapComponent: React.FC<MapComponentProps> = ({ data, selectedEvent, onEventSelect, height }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([data[0].best_lat, data[0].best_lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current);

      // Add markers and connections
      let prevLatLng: [number, number] | null = null;

      data.forEach((eventData) => {
        const marker = L.marker([eventData.best_lat, eventData.best_lon]).addTo(mapInstanceRef.current!);
        
        // Create bearing arrow for popup (if bearing data exists)
        let bearingInfo = '';
        
        if (eventData["body.bearing"] !== null && prevLatLng) {
          const bearingValue = eventData["body.bearing"];
          const bearingArrowStyle = `transform: rotate(${bearingValue}deg);`;
          bearingInfo = `${bearingValue.toFixed(1)}° <span class="bearing-arrow" style="${bearingArrowStyle}"></span>`;
          
          // Create map arrow using the calculated bearing from Turf
          const calculatedBearing = bearing([prevLatLng[1], prevLatLng[0]], [eventData.best_lon, eventData.best_lat]);
          
          // Add arrow representing bearing
          const arrowIcon = L.divIcon({
            className: 'arrow-icon',
            html: `<div style="transform: rotate(${calculatedBearing}deg);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          L.marker([eventData.best_lat, eventData.best_lon], {icon: arrowIcon}).addTo(mapInstanceRef.current!);
        } else if (eventData["body.bearing"] !== null) {
          const bearingValue = eventData["body.bearing"];
          const bearingArrowStyle = `transform: rotate(${bearingValue}deg);`;
          bearingInfo = `${bearingValue.toFixed(1)}° <span class="bearing-arrow" style="${bearingArrowStyle}"></span>`;
        } else {
          bearingInfo = 'N/A';
        }

        const popupContent = `
          <b>Location:</b> ${eventData.best_location}<br>
          <b>Time:</b> ${eventData["Best location PST"]}<br>
          <b>Temperature:</b> ${eventData["Body temperature (F)"]}°F<br>
          <b>Distance from previous:</b> ${eventData["body.distance"]} meters<br>
          <b>Velocity:</b> ${eventData["body.velocity"]} m/s<br>
          <b>Bearing:</b> ${bearingInfo}<br>
        `;
        marker.bindPopup(popupContent);

        // Add click handler
        marker.on('click', () => {
          onEventSelect(eventData);
        });

        markersRef.current.push(marker);

        // Draw dotted line
        if (prevLatLng) {
          L.polyline([prevLatLng, [eventData.best_lat, eventData.best_lon]], {color: 'blue', dashArray: '5, 10'}).addTo(mapInstanceRef.current!);
        }

        prevLatLng = [eventData.best_lat, eventData.best_lon];
      });

      // Add mouseover handler for info display
      mapInstanceRef.current.on('mouseover', (e: L.LeafletMouseEvent) => {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        const closest = data.reduce((prev, curr) => {
          const distPrev = Math.sqrt(Math.pow(prev.best_lat - lat, 2) + Math.pow(prev.best_lon - lon, 2));
          const distCurr = Math.sqrt(Math.pow(curr.best_lat - lat, 2) + Math.pow(curr.best_lon - lon, 2));
          return distPrev < distCurr ? prev : curr;
        });
        onEventSelect(closest);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [data, onEventSelect]);

  // Handle height changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, [height]);

  // Handle selected event
  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current) {
      const targetCoords = [selectedEvent.best_lat, selectedEvent.best_lon] as [number, number];
      
      // Force center the map on the selected event with animation
      mapInstanceRef.current.setView(
        targetCoords, 
        Math.max(13, mapInstanceRef.current.getZoom()), // Use current zoom if higher than 13
        {
          animate: true,
          duration: 0.2, // Smooth animation
          easeLinearity: 0.1
        }
      );
      
      // Additional panTo call to ensure perfect centering
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(targetCoords, {
            animate: true,
            duration: 0.2
          });
        }
      }, 10);
      
      // Open popup after centering is complete
      setTimeout(() => {
        const markerIndex = data.findIndex(d => d.event === selectedEvent.event);
        if (markersRef.current[markerIndex]) {
          markersRef.current[markerIndex].openPopup();
        }
      }, 100);
    }
  }, [selectedEvent, data]);

  return <div ref={mapRef} style={{ height: `${height}px`, minHeight: '200px' }} />;
};
