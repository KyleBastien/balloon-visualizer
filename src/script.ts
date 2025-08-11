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

// Initialize map
const map: L.Map = L.map('map').setView([data[data.length -1].best_lat, data[data.length -1].best_lon], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let prevLatLng: [number, number] | null = null;
const markers: L.Marker[] = [];

function addMarker(eventData: EventData): void {
  const marker = L.marker([eventData.best_lat, eventData.best_lon]).addTo(map);
  const popupContent = `
      <b>Location:</b> ${eventData.best_location}<br>
      <b>Time:</b> ${eventData.best_location_when}<br>
      <b>Temperature:</b> ${eventData["body.temperature"]}°F<br>
      <b>Distance:</b> ${eventData["body.distance"]} meters<br>
      <b>Velocity:</b> ${eventData["body.velocity"]} m/s<br>
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

  // Create timeline dots
  const timelineDot = document.createElement('div');
  timelineDot.dataset.index = index.toString();
  const timelineElement = document.getElementById('timeline');
  if (timelineElement) {
    timelineElement.appendChild(timelineDot);
  }

  // Hover over timeline dot to highlight on map
  timelineDot.addEventListener('mouseenter', () => {
      map.setView([data[index].best_lat, data[index].best_lon], 13);
      if (markers[index]) {
        markers[index].openPopup();
      }
  });
});

// Display data on hover
map.on('mouseover', (e: L.LeafletMouseEvent) => {
  const lat = e.latlng.lat;
  const lon = e.latlng.lng;
  const closest = data.reduce((prev, curr) => {
      const distPrev = Math.sqrt(Math.pow(prev.best_lat - lat, 2) + Math.pow(prev.best_lon - lon, 2));
      const distCurr = Math.sqrt(Math.pow(curr.best_lat - lat, 2) + Math.pow(curr.best_lon - lon, 2));
      return distPrev < distCurr ? prev : curr;
  });
  
  const infoElement = document.getElementById('info');
  if (infoElement) {
    infoElement.innerHTML = `
        <b>Location:</b> ${closest.best_location}<br>
        <b>Time:</b> ${closest.best_location_when}<br>
        <b>Temperature:</b> ${closest["body.temperature"]}°F<br>
        <b>Distance:</b> ${closest["body.distance"]} meters<br>
        <b>Velocity:</b> ${closest["body.velocity"]} m/s<br>
    `;
  }
});
