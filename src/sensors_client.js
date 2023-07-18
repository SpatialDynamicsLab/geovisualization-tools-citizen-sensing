
/*-----------------------------------------------------------------------------------------*/
/*--------------------------------------- CLASSES -----------------------------------------*/ 
/*-----------------------------------------------------------------------------------------*/

class App {

    static instance = null

    constructor() {
        
        this.queryForm = new QueryForm("query-form");
        this.apiEndpoint = "https://score.sta.tero.gr/v1.0";
        // this.apiEndpoint = "https://toronto-bike-snapshot.sensorup.com/v1.0"
        this.mapManager = new MapManager([[54.209196,13.671665],[38.543655,-8.509294]])
        

    }

    static getInstance() {
        if (!App.instance) {
            App.instance = new App();
          }
          return App.instance; 
    }


    getMapManager() {
        return this.mapManager;
    }


    run(){

        this.mapManager.initMap();

        const api = SensorThingsAPI.getInstance(this.apiEndpoint)
        

        api.addCCLLOptions(this.queryForm.getCCLLFilter())
        api.addObservedPropertyOptions(this.queryForm.getPropertyFilter())
        
        

        
    }
}

class MapManager {

    constructor(defaultBounds) {

        this.map = null;
        this.defaultBounds = defaultBounds
        this.markerGroup = null;
        this.dataPanel = new DataPanel("data-panel","close-button")
    }

    initMap() {

        this.map = L.map('map').fitBounds(this.defaultBounds);
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.map);

        this.markerGroup = L.featureGroup().addTo(this.map);

    }

    displayMarkers(dataValue) {

        this.markerGroup.clearLayers();

        dataValue.forEach( (object) => {
            
            // const marker = this.createDatastreamMarker(object)
            const marker = this.createThingMarker(object)
            this.markerGroup.addLayer(marker)



        })


        this.adjustBounds();
        
   
    }

    adjustBounds() {
        let bounds = null;

        if (this.markerGroup.getLayers().length == 0) {
            bounds = this.defaultBounds
        } else {
            bounds = this.markerGroup.getBounds()
        }

        this.map.fitBounds(bounds);

    }


    createThingMarker(thing) {

        const [lng,lat] = thing.Locations[0].location.coordinates;


        let popup = L.popup();
        
        let popupContent =  `<p class="font-semibold">${thing.name}</p><p>${thing.properties.CCLL}</p><p>Lng: ${lng}, Lat: ${lat}</p>`


        const marker = L.marker([lat,lng])
            .bindPopup(popupContent)

         
        
        marker.on('click', e => { 
            this.map.setView([lat,lng]);
            this.dataPanel.initDatastreamSelectionPage(thing);
            this.dataPanel.open();

        })


        return marker
    }

    getDataPanel() {
        return this.dataPanel
    }
    

}

class QueryForm {

    constructor(formId) {
    
        this.form = document.getElementById(formId);

        this.propertyFilter = new Filter("property-select");
        this.ccllFilter = new Filter("ccll-select");

        this.setEventListeners();
        
    }

    getPropertyFilter() {
        return this.propertyFilter;
    }

    getCCLLFilter() {
        return this.ccllFilter;
    }

    setEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(event) {

        event.preventDefault();

        const selectedProperty = this.propertyFilter.getSelectedValue();
        const selectedCcll = this.ccllFilter.getSelectedValue();



        const api =  SensorThingsAPI.getInstance(App.getInstance().apiEndpoint)



        // const dataValue = await api.getFilteredDatastreams(selectedProperty,selectedCcll);
        const dataValue = await api.getFilteredThings(selectedProperty,selectedCcll);

        console.log(dataValue)

        App.getInstance().getMapManager().displayMarkers(dataValue)
        App.getInstance().getMapManager().getDataPanel().close()
        
    }


}

class Filter {

    constructor(selectId) {
        this.select = document.getElementById(selectId);
        // console.log(this.getSelectedValue())
    }

    getSelect() {
        return this.select;
    }

    getSelectedValue() {
        return this.select.value;
    }

    addOption(value,innerText) {
        let option = document.createElement('option');
        option.value = value;
        option.innerText = innerText;

        this.select.appendChild(option);

    }

}

class DataPanel {

    constructor(panelId,closeButtonId) {
        this.panelDiv = document.getElementById(panelId);
        this.closeButton = document.getElementById(closeButtonId)
        this.datastreamsSelectionPage = document.getElementById("datastreams-selection-page")
        this.datastreamResultsPage = document.getElementById("datastream-results-page")

        this.setEventListeners()
    }


    initDatastreamSelectionPage(thing) {

        this.clearElementContent(this.datastreamsSelectionPage)

        const htmlContent = '<h2 class="py-4 text-center text-xl font-semibold">Datastreams</h2>'

        this.datastreamsSelectionPage.insertAdjacentHTML('afterbegin',htmlContent)

        thing.Datastreams.forEach( (datastream) => {

            const datastreamButton = document.createElement('button')
            datastreamButton.innerText = datastream.name
            datastreamButton.classList.add("m-4","py-2","px-4","border","bg-gray-200","text-gray-800","font-medium","border-gray-300","rounded","hover:bg-gray-300")
           
            datastreamButton.addEventListener('click', e => {
                this.hideElement(this.datastreamsSelectionPage);  
                this.initDatastreamResultsPage.bind(this)(datastream);
                this.showElement(this.datastreamResultsPage)
            });

            
            this.datastreamsSelectionPage.appendChild(datastreamButton)
        })


    }

    async initDatastreamResultsPage(datastream) {

        this.clearElementContent(this.datastreamResultsPage)

        const htmlContent = `
                            <h2 class="py-4 text-center text-xl font-semibold">${datastream.name}</h2>
                            <p>Sensor: ${datastream.Sensor.name}</p>
                            <p>Observed property: ${datastream.ObservedProperty.name}</p>
                            <p>Unit: ${datastream.unitOfMeasurement.symbol}</p>
                            `

        this.datastreamResultsPage.insertAdjacentHTML('afterbegin',htmlContent)
        

        const api =  SensorThingsAPI.getInstance(App.getInstance().apiEndpoint)
        

        //Observations display
        const observations = await api.getObservations(datastream["@iot.id"])
        console.log(observations)

        const plotDiv = document.createElement("div")
        plotDiv.classList.add("max-w-96","max-h-96")
        this.plotObservations(observations,plotDiv)
        this.datastreamResultsPage.appendChild(plotDiv)

               
    }


    setEventListeners() {
        this.closeButton.addEventListener('click', e => this.close.bind(this)());

    }

    plotObservations(observations,plotDiv) {

        const [timeList, valueList] = observations.reduce(
            (lists, observation) => {
              lists[0].push(observation.phenomenonTime);
              lists[1].push(observation.result);
              return lists;
            },
            [[], []]
        );

        Plotly.newPlot(plotDiv,[{
            x: timeList,
            y: valueList }], {
            margin: { t: 0 },
            width: 400,
            height: 300
        
        } );

        console.log(timeList,valueList)    

    }


    open() {

        this.showElement(this.panelDiv)
        this.showElement(this.datastreamsSelectionPage)
        this.hideElement(this.datastreamResultsPage)

        
    }

    close() {

        this.hideElement(this.panelDiv)
        this.hideElement(this.datastreamsSelectionPage)
        this.hideElement(this.datastreamResultsPage)
        
    }

   

    showElement(element) {
        let classList = element.classList
       
        if (classList.contains("hidden")) {
            classList.remove("hidden");
            classList.add("flex");
        }
    }

    hideElement(element) {
        let classList = element.classList
       
        if (classList.contains("flex")) {
            classList.remove("flex");
            classList.add("hidden");
        }
    }
    

    clearElementContent(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }  

}




class SensorThingsAPI {

    static instance = null
    
    constructor(apiEndpoint) {
         this.apiEndpoint = apiEndpoint;
    }

  

    static getInstance(apiEndpoint) {
        if (!SensorThingsAPI.instance) {
            SensorThingsAPI.instance = new SensorThingsAPI(apiEndpoint);
          }
          return SensorThingsAPI.instance; 
    }

    async fetchData(queryURL) {
      try {
        const response = await fetch(queryURL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // console.log(data)
        return data;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    }
  
    // async getDatastreams() {
    
    //     const queryURL = `${this.apiEndpoint}/Datastreams`;
    //     const data = await this.fetchData(queryURL);
    //     return data.value;
    // }
  
    async getObservations(datastreamID) {

        const queryURL = `${this.apiEndpoint}/Datastreams(${datastreamID})/Observations?$orderby=id desc&$select=phenomenonTime,result,id&$top=100`;
        const data = await this.fetchData(queryURL);
        console.log(queryURL)
        return data.value;
    }

    async logObservations(datastreamID) {

        const observations = await this.getObservations(datastreamID)
        
        console.log("observations",observations)
    }

    async addObservedPropertyOptions(filter) {

        const queryURL = `${this.apiEndpoint}/ObservedProperties?$orderby=id&$select=id,name`;
        console.log(queryURL)
        const data = await this.fetchData(queryURL);

        data.value.forEach( (property) => {
        
            const optionValue = property['@iot.id'];
            const optionInnerText = property.name;

            filter.addOption(optionValue,optionInnerText)
        
        })
    }

    async addCCLLOptions(filter) {

        const queryURL = `${this.apiEndpoint}/Things?$select=properties/CCLL&$orderby=properties/CCLL`;
        console.log(queryURL)
        const data = await this.fetchData(queryURL);


        let previousCCLLName = "";
        let currentCCLLName = "";

        data.value.forEach( (thing) => {

            currentCCLLName = thing.properties.CCLL

            if (currentCCLLName != previousCCLLName) {
                const optionValue = currentCCLLName;
                const optionInnerText = currentCCLLName;

                filter.addOption(optionValue,optionInnerText)

                previousCCLLName = currentCCLLName
            }
        })
    }

    async getFilteredDatastreams(propID,ccllValue) {

        
        let queryURL = this.apiEndpoint;

        queryURL = `${queryURL}/Datastreams?$expand=Sensor,ObservedProperty,Thing/Locations&$orderby=id`;


        if (propID != "-1") {
            queryURL = `${queryURL}&$filter=ObservedProperty/id eq ${propID}`
            
            if (ccllValue != "-1") {

                queryURL = `${queryURL} and Thing/properties/CCLL eq '${ccllValue}'`
            }

        } else {
            
            if (ccllValue != "-1") {

                queryURL = `${queryURL}&$filter=Thing/properties/CCLL eq '${ccllValue}'`
            }
        }
        



        console.log(queryURL)
       

        const data = await this.fetchData(queryURL);
        
        return data.value
    }

    async getFilteredThings(propID,ccllValue) {

        
        let queryURL = this.apiEndpoint;

        queryURL = `${queryURL}/Things?$expand=Locations,Datastreams/ObservedProperty,Datastreams/Sensor&$orderby=id`;


        if (propID != "-1") {
            queryURL = `${queryURL}&$filter=Datastreams/ObservedProperty/id eq ${propID}`
            

            if (ccllValue != "-1") {

                queryURL = `${queryURL} and properties/CCLL eq '${ccllValue}'`
            }

        } else {
            
            if (ccllValue != "-1") {

                queryURL = `${queryURL}&$filter=properties/CCLL eq '${ccllValue}'`
            }
        }
        



        console.log(queryURL)
       

        const data = await this.fetchData(queryURL);
        
        return data.value
    }

    
}

/*-----------------------------------------------------------------------------------------*/
/*---------------------------------------- MAIN -------------------------------------------*/    
/*-----------------------------------------------------------------------------------------*/

const app = App.getInstance();
app.run();


