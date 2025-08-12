import bearing from '@turf/bearing';
import L from 'leaflet';
import { events } from './events';

// Define the event data type
interface EventData {
  event: string;
  file: string;
  best_location_when: number;
  "Best location ISO8601": string;
  "Best location PST": string;
  best_lat: number;
  best_lon: number;
  best_location: string;
  best_country: string;
  best_timezone: string;
  "body.temperature": number;
  "Body temperature (F)": number;
  "body.bearing": number | null;
  "body.distance": number | null;
  "body.dop": number | null;
  "body.velocity": number | null;
}

// Replace with your data
const data: EventData[] = events;

// Order data by best_location_when
data.sort((a, b) => a.best_location_when - b.best_location_when);

// Initialize map
const map: L.Map = L.map('map').setView([data[0].best_lat, data[0].best_lon], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let prevLatLng: [number, number] | null = null;
const markers: L.Marker[] = [];

function addMarker(eventData: EventData): void {
  const marker = L.marker([eventData.best_lat, eventData.best_lon]).addTo(map);
  const popupContent = `
      <b>Location:</b> ${eventData.best_location}<br>
      <b>Time:</b> ${eventData["Best location PST"]}<br>
      <b>Temperature:</b> ${eventData["Body temperature (F)"]}°F<br>
      <b>Distance from previous:</b> ${eventData["body.distance"]} meters<br>
      <b>Velocity:</b> ${eventData["body.velocity"]} m/s<br>
      <b>Bearing:</b> ${eventData["body.bearing"]}°<br>
  `;
  marker.bindPopup(popupContent);
  markers.push(marker);

  // Draw bearing arrow
  if (prevLatLng) {
      const bearingAngle = bearing([prevLatLng[1], prevLatLng[0]], [eventData.best_lon, eventData.best_lat]);
      const angle = bearingAngle * (Math.PI / 180);  // Convert to radians for CSS

      // Add arrow representing bearing
      const arrowIcon = L.divIcon({
          className: 'arrow-icon',
          html: `<div style="transform: rotate(${angle}rad); width: 15px; height: 15px; border: 3px solid black; border-top: 0px; border-left: 0px; border-bottom: 0px; border-right: 15px solid transparent;"></div>`
      });
      L.marker([eventData.best_lat, eventData.best_lon], {icon: arrowIcon}).addTo(map);
  }

  // Draw dotted line
  if (prevLatLng) {
      L.polyline([prevLatLng, [eventData.best_lat, eventData.best_lon]], {color: 'blue', dashArray: '5, 10'}).addTo(map);
  }

  prevLatLng = [eventData.best_lat, eventData.best_lon];
}

// Add markers for all events
data.forEach((event, index) => {
  addMarker(event);

  // Create timeline item with dot and label
  const timelineItem = document.createElement('div');
  timelineItem.className = 'timeline-item';
  timelineItem.dataset.index = index.toString();
  
  // Create the dot
  const timelineDot = document.createElement('div');
  timelineDot.className = 'timeline-dot';
  
  // Create the time label
  const timelineLabel = document.createElement('div');
  timelineLabel.className = 'timeline-label';
  
  // Format the time from the PST string (remove seconds for brevity)
  const timeString = event["Best location PST"];
  timelineLabel.textContent = timeString;

  // Assemble the timeline item
  timelineItem.appendChild(timelineDot);
  timelineItem.appendChild(timelineLabel);
  
  const timelineElement = document.getElementById('timeline');
  if (timelineElement) {
    timelineElement.appendChild(timelineItem);
  }

  // Hover over timeline item to highlight on map
  timelineItem.addEventListener('mouseenter', () => {
      map.setView([data[index].best_lat, data[index].best_lon], 13);
      if (markers[index]) {
        markers[index].openPopup();
      }
  });
});

// Add resizable functionality
function initializeResize(): void {
  const resizeHandle = document.querySelector('.resize-handle') as HTMLElement;
  const mapElement = document.getElementById('map') as HTMLElement;
  const timelineElement = document.querySelector('.timeline') as HTMLElement;
  const container = document.querySelector('.container') as HTMLElement;
  
  if (!resizeHandle || !mapElement || !timelineElement || !container) return;
  
  let isResizing = false;
  let startY = 0;
  let startMapHeight = 0;
  
  resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
    isResizing = true;
    startY = e.clientY;
    startMapHeight = mapElement.offsetHeight;
    
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - startY;
    const containerHeight = container.offsetHeight;
    const resizeHandleHeight = resizeHandle.offsetHeight;
    
    const newMapHeight = Math.max(200, Math.min(
      containerHeight - 100 - resizeHandleHeight, 
      startMapHeight + deltaY
    ));
    
    const newTimelineHeight = Math.max(40, 
      containerHeight - newMapHeight - resizeHandleHeight
    );
    
    mapElement.style.height = `${newMapHeight}px`;
    mapElement.style.flex = 'none';
    timelineElement.style.height = `${newTimelineHeight}px`;
    
    // Trigger map resize
    map.invalidateSize();
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// Initialize resize functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeResize);
