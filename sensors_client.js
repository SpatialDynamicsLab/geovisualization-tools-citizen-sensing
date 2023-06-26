
/*-----------------------------------------------------------------------------------------*/
/*--------------------------------------- CLASSES -----------------------------------------*/ 
/*-----------------------------------------------------------------------------------------*/

class App {

    static instance = null

    constructor() {
        
        this.queryForm = new QueryForm("query-form");
        this.apiURL = "https://score.sta.tero.gr/v1.0";
        // this.apiURL = "https://toronto-bike-snapshot.sensorup.com/v1.0"
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

        const api = SensorThingsAPI.getInstance(this.apiURL)
        
        this.queryForm.getCCLLFilter().addOption("Massa","Massa")
        this.queryForm.getCCLLFilter().addOption("Oarsoaldea","Oarsoaldea")
        this.queryForm.getCCLLFilter().addOption("Benidorm","Benidorm")
        this.queryForm.getCCLLFilter().addOption("Piran","Piran")
        this.queryForm.getCCLLFilter().addOption("Sligo","Sligo")

        api.addObservedPropertyOptions(this.queryForm.getPropertyFilter())
        
        

        
    }
}

class MapManager {

    constructor(defaultBounds) {

        this.map = null;
        this.defaultBounds = defaultBounds
        this.markerGroup = null;
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

        dataValue.forEach( (datastream) => {
            
            const marker = this.createDatastreamMarker(datastream)
            this.markerGroup.addLayer(marker)



        })


        this.adjustView();
        
   
    }

    adjustView() {
        let bounds = null;

        if (this.markerGroup.getLayers().length == 0) {
            bounds = this.defaultBounds
        } else {
            bounds = this.markerGroup.getBounds()
        }

        this.map.fitBounds(bounds);

    }


    createDatastreamMarker(datastream) {

        // console.log(datastream)
        const [lng,lat] = datastream.Thing.Locations[0].location.coordinates;


        const marker = L.marker([lat,lng])
            .bindPopup(`
                <h2>${datastream.Sensor.name}</h2>
                <p>${datastream.ObservedProperty.name}</p>
                <p>${datastream.Thing.name}</p>
                <p>${datastream.Thing.properties.CCLL}</p>
                <p>${datastream.unitOfMeasurement.symbol}</p>
                <p>${[lng,lat]}</p>
                `)

        marker.on('click',event => {
            const api =  SensorThingsAPI.getInstance(App.getInstance().apiURL)
            api.logObservations(datastream["@iot.id"])
        })

        

        return marker
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



        const api =  SensorThingsAPI.getInstance(App.getInstance().apiURL)



        const dataValue = await api.getFilteredDatastreams(selectedProperty,selectedCcll);
        console.log(dataValue)

        App.getInstance().getMapManager().displayMarkers(dataValue)
        
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




class SensorThingsAPI {

    static instance = null
    
    constructor(apiURL) {
         this.apiURL = apiURL;
    }

  

    static getInstance(apiURL) {
        if (!SensorThingsAPI.instance) {
            SensorThingsAPI.instance = new SensorThingsAPI(apiURL);
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
        console.log(data)
        return data;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    }
  
    // async getDatastreams() {
    
    //     const queryURL = `${this.apiURL}/Datastreams`;
    //     const data = await this.fetchData(queryURL);
    //     return data.value;
    // }
  
    //(only the 100 first observations for now)
    async getObservations(datastreamID) {

        const queryURL = `${this.apiURL}/Datastreams(${datastreamID})/Observations`;
        const data = await this.fetchData(queryURL);
        console.log(queryURL)
        return data.value;
    }

    async logObservations(datastreamID) {

        const observations = await this.getObservations(datastreamID)
        
        console.log(observations)
        console.log(observations[0].phenomenonTime)
    }

    async addObservedPropertyOptions(filter) {

        const queryURL = `${this.apiURL}/ObservedProperties?$orderby=id`;
        const data = await this.fetchData(queryURL);

        data.value.forEach( (property) => {
        
            const optionValue = property['@iot.id'];
            const optionInnerText = property.name;

            filter.addOption(optionValue,optionInnerText)
        
        })
    }

    async getFilteredDatastreams(propID,ccllValue) {

        
        let queryURL = this.apiURL;

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

    
}

/*-----------------------------------------------------------------------------------------*/
/*---------------------------------------- MAIN -------------------------------------------*/    
/*-----------------------------------------------------------------------------------------*/

const app = App.getInstance();
app.run();


