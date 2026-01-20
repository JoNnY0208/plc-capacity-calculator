# PLC Capacity Calculator

A Progressive Web App (PWA) for calculating PLC memory capacity requirements in industrial automation projects.

## Features

- **Real-time Calculations**: All values update instantly as you type
- **PWA Support**: Install as a desktop app on Windows, macOS, or mobile devices
- **Offline Functionality**: Works without internet after initial load
- **Export/Import**: Save and share calculations as JSON files
- **PDF Reports**: Generate professional reports for the electrical design team
- **Local Storage**: Automatically saves your work between sessions

## Installation

### As a Web App
1. Open `index.html` in a modern web browser (Chrome, Edge, Firefox, Safari)
2. The app will work immediately

### As an Installed App (PWA)
1. Open `index.html` in Chrome or Edge
2. Click the "Install App" button in the header, or
3. Click the install icon in the browser's address bar
4. The app will be added to your desktop/taskbar

## Usage

### Input Parameters
- **EM**: Number of Equipment Modules
- **UN**: Number of Units
- **Alarms per EM/UN**: Alarm count per module type
- **AOI**: Number of Add-On Instructions
- **Percentage Error**: Safety margin for calculation errors
- **Spare Capacity**: Additional capacity for future expansion

### Constants
Pre-defined memory values per unit that can be adjusted based on your specific PLC configuration:
- Framework base memory
- Memory per EM, UN, and AOI
- Memory per alarm

### Outputs
- **Total Capacity**: Displayed in Megabytes
- **Breakdown Table**: Shows memory usage by category
- **Treemap Chart**: Visual representation of capacity distribution

## File Operations

### Export Data
Click "Export Data" to save the current calculation as a JSON file. The file includes:
- Project information
- All input parameters
- Constant values
- Calculated results

### Import Data
Click "Import Data" to load a previously saved calculation or one shared by a colleague.

### Generate PDF
Click "Generate PDF Report" to create a professional report suitable for sharing with the electrical design team. Requires Project Name and Project Number.

## Keyboard Shortcuts

- `Ctrl+S` / `Cmd+S`: Export data
- `Ctrl+O` / `Cmd+O`: Import data
- `Ctrl+P` / `Cmd+P`: Generate PDF
- `Esc`: Close modal dialogs

## Technical Details

- **Technology**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js with Treemap plugin
- **PDF**: jsPDF library
- **Storage**: localStorage API

## Browser Support

- Chrome 80+
- Edge 80+
- Firefox 75+
- Safari 13+

## Version

0.01
