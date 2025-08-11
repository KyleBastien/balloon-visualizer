// Replace with your data
const data = [
  {
      event: "2341653a-fc07-86ed-8e9f-cd13e692dbed",
      best_location_when: "2025-08-09T2:37:10 PM PST",
      best_lat: 46.3847275,
      best_lon: -123.1622773,
      best_location: "Vader WA",
      body_temperature: 38.0,
      body_bearing: 334.03732,
      body_distance: 7.0083313,
      body_velocity: 0.14911343
  },
  {
      event: "486c5ecc-0cfa-8674-bd97-d0b49852d0b1",
      best_location_when: "2025-08-09T2:36:23 PM PST",
      best_lat: 46.3846725,
      best_lon: -123.1622383,
      best_location: "Vader WA",
      body_temperature: 38.0,
      body_bearing: 242.64433,
      body_distance: 40.73381,
      body_velocity: 8.146762
  }
  // Add more events here
];

// Initialize map
const map = L.map('map').setView([46.3847275, -123.1622773], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let prevLatLng = null;
let markers = [];

function addMarker(data) {
  const marker = L.marker([data.best_lat, data.best_lon]).addTo(map);
  const popupContent = `
      <b>Location:</b> ${data.best_location}<br>
      <b>Time:</b> ${data.best_location_when}<br>
      <b>Temperature:</b> ${data.body_temperature}°F<br>
      <b>Distance:</b> ${data.body_distance} meters<br>
      <b>Velocity:</b> ${data.body_velocity} m/s<br>
  `;
  marker.bindPopup(popupContent);

  // Draw bearing arrow
  if (prevLatLng) {
      const line = turf.lineString([prevLatLng, [data.best_lat, data.best_lon]]);
      const bearing = turf.bearing(line);
      const angle = bearing * (Math.PI / 180);  // Convert to radians for CSS

      // Add arrow representing bearing
      const arrowIcon = L.divIcon({
          className: 'arrow-icon',
          html: `<div style="transform: rotate(${angle}rad); width: 15px; height: 15px; border: 3px solid black; border-top: 0px; border-left: 0px; border-bottom: 0px; border-right: 15px solid transparent;"></div>`
      });
      L.marker([data.best_lat, data.best_lon], {icon: arrowIcon}).addTo(map);
  }

  // Draw dotted line
  if (prevLatLng) {
      L.polyline([prevLatLng, [data.best_lat, data.best_lon]], {color: 'blue', dashArray: '5, 10'}).addTo(map);
  }

  prevLatLng = [data.best_lat, data.best_lon];
}

// Add markers for all events
data.forEach((event, index) => {
  addMarker(event);

  // Create timeline dots
  const timelineDot = document.createElement('div');
  timelineDot.dataset.index = index;
  document.getElementById('timeline').appendChild(timelineDot);

  // Hover over timeline dot to highlight on map
  timelineDot.addEventListener('mouseenter', () => {
      map.setView([data[index].best_lat, data[index].best_lon], 13);
      markers[index].openPopup();
  });
});

// Display data on hover
map.on('mouseover', (e) => {
  const lat = e.latlng.lat;
  const lon = e.latlng.lng;
  const closest = data.reduce((prev, curr) => {
      const distPrev = Math.sqrt(Math.pow(prev.best_lat - lat, 2) + Math.pow(prev.best_lon - lon, 2));
      const distCurr = Math.sqrt(Math.pow(curr.best_lat - lat, 2) + Math.pow(curr.best_lon - lon, 2));
      return distPrev < distCurr ? prev : curr;
  });
  document.getElementById('info').innerHTML = `
      <b>Location:</b> ${closest.best_location}<br>
      <b>Time:</b> ${closest.best_location_when}<br>
      <b>Temperature:</b> ${closest.body_temperature}°F<br>
      <b>Distance:</b> ${closest.body_distance} meters<br>
      <b>Velocity:</b> ${closest.body_velocity} m/s<br>
  `;
});
