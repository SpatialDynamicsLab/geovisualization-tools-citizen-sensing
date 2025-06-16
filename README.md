# 🌍 A simple OGC SensorThingsAPI Data Visualisation Web App for Citizen Observatories

This repository is part of the tools for local communities working in data management of environmental sensing devices created by the CitiObs project and contributed by the community.

The tool is a simple, lightweight, responsive, and interactive web application to **query**, **visualize**, and **explore environmental data** provided by any [OGC SensorThings API (STA)](https://www.ogc.org/standards/sensorthings) endpoint.

The app allows users to:

- 🔍 Search for sensing devices by name  
- 📊 Filter by observed properties  
- 🗺️ View device locations on an interactive Leaflet map  
- 📈 Plot and inspect observations from selected datastreams using Plotly  
- 🔗 Connect to **any valid STA v1.0 or v1.1 endpoint** via a clean, animated modal 

## 🚀 Getting Started

### 🧠 Technical Stack
* [TailwindCSS](https://tailwindcss.com) (as a Node.js dependency)
* [Leaflet.js](https://leafletjs.com/) (as a loaded script)
* [Plotly.js](https://plotly.com/javascript/) (as a loaded script)

### Clone the repository

```bash
git clone https://github.com/yourusername/SensorThingsAPI-webmap-observations-visualizer.git
cd SensorThingsAPI-webmap-observations-visualizer
```

### How to install and run
Clone the project in your local repository. Make sure you have Node.js installed with npm on your machine and run the command line `npm install` at the root of your project. If you want to edit the style of the app, run `npm run watch` while developing to update the TailwindCSS stylesheet file each time you save. To run the app with a local server, run the server at the root of the project and open the http://localhost/src url.

## 🔧 Features

### ✅ SensorThings API URL input
- Modal prompt on load.
- Stores last-used URL in `localStorage`.
- Accepts both `v1.0` and `v1.1` compliant URLs.

### ✅ Device Search & Filtering
- Autocomplete device name search (via Tom Select).
- Multiple device selection support.
- Optional filtering by Observed Property.

### ✅ Interactive Map View
- Leaflet-based map with markers for each device.
- Auto-adjusts bounds to selected results.
- Clickable markers with quick access to datastreams.

### ✅ Time Series Plotting
- Displays last N observations from selected datastream.
- Choose how many observations to retrieve (50, 100, 1000).
- Interactive Plotly plots with dynamic layout and font scaling.
- Expandable plot view for deeper inspection.

### ✅ Responsive Design
- Tailwind CSS layout.
- Optimized for mobile, tablet, and desktop.
- Modal animations and transitions enhance user experience.

---

## 📁 File Structure

```
├── /src/index.html              # Main HTML file
├── /src/sensors_client.js       # App logic (modular JavaScript classes)
├── /src/input.css               # Main CSS file
├── /dist/style.css               # Compiled Tailwind CSS file
```

---

## 🌐 Example STA Endpoints

Try any of these working STA URLs:

- `https://score.ccll.tero.gr/v1.1`
- `https://citiobs.demo.secure-dimensions.de/staplus/v1.1`

> ✅ Make sure the STA service is public and CORS-enabled.

---

## 💬 Feedback or Contributions

You’re welcome to fork the project, suggest improvements, or contribute features and bugfixes. Just open an issue or a pull request in the GitHub repository!

---

## 📝 License

MIT License – Free to use, modify, and share.

---

## Funding

<div style="display: inline-block"><img src="https://citiobs.eu/wp-content/uploads/sites/24/2023/02/EN_Co-funded_by_the_EU_POS-removebg-preview.png" style="width: 300px">
<p>Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the European Research Executive Agency (REA). Neither the European Union nor the granting authority can be held responsible for them.
</p>
</div>