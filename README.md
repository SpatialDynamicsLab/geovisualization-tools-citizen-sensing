## Geospatial data visualizations tool for citizen sensing and citizen science initiatives

Development of a WebGIS tool to visualise citizen-generated data from low-cost sensors, DIY sensors, citizen science activities, etc. provided in the form of the OGC [SensorThings API standard](https://developers.sensorup.com/docs/). This app is more specifically made to visualise climate data related to coastal hazards from the SCORE project given by the API endpoint: https://score.sta.tero.gr/v1.0/

Libraries used:
* [TailwindCSS](https://tailwindcss.com) (as a Node.js dependency)
* [Leaflet.js](https://leafletjs.com/) (as a loaded script)
* [Plotly.js](https://plotly.com/javascript/) (as a loaded script)

Contributors:

* Claire Guerrini (@ClaireGuerrini)

## How to install and run

Clone the project in your local repository. Make sure you have Node.js installed with npm on your machine and run the command line `npm install` at the root of your project. If you want to edit the style of the app, run `npm run watch` while developing to update the TailwindCSS stylesheet file each time you save. To run the app with a local server, run the server at the root of the project and open the http://localhost/src url.

## How to use

