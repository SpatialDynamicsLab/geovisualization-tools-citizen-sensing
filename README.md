## Geospatial data visualizations tool for citizen sensing and citizen science initiatives

Development of a WebGIS tool to visualise citizen-generated data from low-cost sensors, DIY sensors, citizen science activities, etc. provided in the form of the OGC [SensorThings API standard](https://developers.sensorup.com/docs/) (STA). This app is more specifically made to visualise climate data related to coastal hazards from the SCORE project given by the API endpoint: https://score.sta.tero.gr/v1.0/

Libraries used:
* [TailwindCSS](https://tailwindcss.com) (as a Node.js dependency)
* [Leaflet.js](https://leafletjs.com/) (as a loaded script)
* [Plotly.js](https://plotly.com/javascript/) (as a loaded script)

Contributors:

* Claire Guerrini (@ClaireGuerrini)

## How to install and run

Clone the project in your local repository. Make sure you have Node.js installed with npm on your machine and run the command line `npm install` at the root of your project. If you want to edit the style of the app, run `npm run watch` while developing to update the TailwindCSS stylesheet file each time you save. To run the app with a local server, run the server at the root of the project and open the http://localhost/src url.

## How to use

The following is a tutorial for the user experience of the app.

Upon loading the page, the user can see an empty web map centered on Europe with on top a bar containing a form enabling the user to make a request for *Things* to the STA API. The user has the option to either filter by *Observed Property* and/or *CCLL*, or to let the default *All* value of the selects to request all the Things of the API. The *Query* button then has to be clicked to send the request.




