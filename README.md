## Geospatial data visualisation tool for citizen sensing and citizen science initiatives

Development of a WebGIS tool to visualise citizen-generated data from low-cost sensors, DIY sensors, citizen science activities, etc. provided in the form of the OGC [SensorThings API standard](https://developers.sensorup.com/docs/) (STA). More specifically, this app is made to visualise climate data related to coastal hazards from the [SCORE](https://score-eu-project.eu/) project given by the API endpoint: https://score.sta.tero.gr/v1.0/

This app is intended to be embeded in a SCORE website. 


Libraries used:
* [TailwindCSS](https://tailwindcss.com) (as a Node.js dependency)
* [Leaflet.js](https://leafletjs.com/) (as a loaded script)
* [Plotly.js](https://plotly.com/javascript/) (as a loaded script)

Contributors:

* Claire Guerrini (@ClaireGuerrini)

## How to install and run

Clone the project in your local repository. Make sure you have Node.js installed with npm on your machine and run the command line `npm install` at the root of your project. If you want to edit the style of the app, run `npm run watch` while developing to update the TailwindCSS stylesheet file each time you save. To run the app with a local server, run the server at the root of the project and open the http://localhost/src url.

## How to use

The following is a tutorial for the user experience of the app. Do not hesitate to check the [SensorThings API standard documentation](https://developers.sensorup.com/docs/) to better understand how the fetched data is organised. Basically, a *Thing* is an object composed of one or several sensors that is associated with one *Location*. Sensors can record one or several *Datastreams*, which are the entities associated to a specific *ObservedProperty* (a parameter) and a set of *Observations* in this *Thing*. 

Upon loading the page, the user can see an empty web map centered on Europe, on top of which is a bar containing a form enabling the user to make a request for *Things* to the STA API. The user has the option to either filter by *Observed Property* (only the *Things* that possess a *Datastream* of the chosen property will be shown) and/or *CCLL* (Coastal City Living Lab), or to let the default *All* value of the selects to request all the Things of the API. The "Query" button then has to be clicked to send the request.

<img src="/README_images/img4.png" alt= "screenshot of the app" width="720px" height="319px">

At this point, markers associated to the requested *Things* appear on the map. They can be clicked on, summoning a popup displaying some details about the *Thing*: its name, sensors, CCLL, and geographic coordinates, as well as a "View Datastreams" button. The popup always stays in view while opened and can be closed by clicking anywhere on the map.

By clicking on it (or on the whole popup), a panel is opened on the side of the page. A first page lists the *Datastreams* of the selected *Thing* as buttons. When one is clicked, a new page is opened on the panel, displaying the data of the *Datastream*: its *Sensor*, its *Observed Property* and its unit, and most imporantly, a graph of its last 50 *Observations*. There is an option to change the numbers of plotted *Observations* to 100 or 1000 (making a new request to the API). 

<img src="/README_images/img1.png" alt= "screenshot of the app" width="720px" height="319px">

<img src="/README_images/img2.png" alt= "screenshot of the app" width="720px" height="319px">

The "Expand plot" button enables the user to open a larger panel to show a bigger and titled version of the graph, more suited for downloading it as a PNG (one of the options provided by the Plotly.js library on the side of the plot).

<img src="/README_images/img3.png" alt= "screenshot of the app" width="720px" height="319px">

The panels can be closed by clicking on the "X" button. Clicking on another marker will change the content of the side panel to the new Things information.

