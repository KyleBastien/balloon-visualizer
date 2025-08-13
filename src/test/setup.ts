import '@testing-library/jest-dom';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      invalidateSize: vi.fn(),
      getZoom: vi.fn(() => 13),
      panTo: vi.fn().mockReturnThis(),
      on: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      openPopup: vi.fn(),
    })),
    polyline: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    divIcon: vi.fn(() => ({})),
  },
}));

// Mock @turf/bearing
vi.mock('@turf/bearing', () => ({
  default: vi.fn(() => 45), // Return a mock bearing value
}));
