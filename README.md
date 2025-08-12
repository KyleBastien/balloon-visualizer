# balloon-visualizer

Balloon event visualization tool that I'm using for my own personal weather balloon projects.

Code is mostly written using AI, so this makes choices that I might not make personally.

I welcome contributions and feedback from others to improve the tool and make it more useful for others.

## Features

- Interactive map visualization of balloon tracking data
- Timeline with event timestamps
- Resizable map and timeline areas
- Bearing arrows showing direction of travel
- Real-time data display on hover

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This project is automatically deployed to GitHub Pages when changes are pushed to the main branch.

### Live Site
🌐 **[View Live Site](https://kylebastien.github.io/balloon-visualizer/)**

### Manual Deployment
```bash
# Deploy to GitHub Pages manually
npm run deploy
```

## Technology Stack

- **Frontend**: TypeScript, Vite
- **Mapping**: Leaflet.js
- **Geospatial**: Turf.js
- **Styling**: CSS3
- **Deployment**: GitHub Pages with GitHub Actions