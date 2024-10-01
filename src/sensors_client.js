
/*-----------------------------------------------------------------------------------------*/
/*--------------------------------------- CLASSES -----------------------------------------*/ 
/*-----------------------------------------------------------------------------------------*/

class App {
    static instance = null;
    constructor() {
        
        this.apiEndpoint = "https://score.sta.tero.gr/v1.0";
        this.queryForm = new QueryForm(
            "query-form","property-select","ccll-select");
        this.mapManager = new MapManager(
            [[54.209196,13.671665],[38.543655,-8.509294]]);
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

        const api = SensorThingsAPI.getInstance(this.apiEndpoint);

        api.addCCLLOptions(this.queryForm.getCCLLFilter());
        api.addObservedPropertyOptions(this.queryForm.getPropertyFilter());

    }
}

class MapManager {

    constructor(defaultBounds) {

        this.map = null;
        this.defaultBounds = defaultBounds;
        this.markerGroup = null;
        this.dataPanel = new DataPanel("data-panel");
    }

    initMap() {

        this.map = L.map('map').fitBounds(this.defaultBounds);
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.map);

        this.markerGroup = L.featureGroup().addTo(this.map);

    }

    getDataPanel() {
        return this.dataPanel;
    }

    displayMarkers(dataValue) {

        this.markerGroup.clearLayers();

        dataValue.forEach((object) => {
            
            const marker = this.createThingMarker(object);
            this.markerGroup.addLayer(marker);

        });
        this.adjustBounds();
    }

    adjustBounds() {

        let bounds = null;

        if (this.markerGroup.getLayers().length == 0) {
            bounds = this.defaultBounds;
        } else {
            bounds = this.markerGroup.getBounds();
        }

        this.map.fitBounds(bounds);

    }

    createThingMarker(thing) {

        const [lng,lat] = thing.Locations[0].location.coordinates;

        let sensorsListString = "";
        thing.Datastreams.forEach( (datastream,index) => {
            if (index === 0) {
                sensorsListString += datastream.Sensor.name
            } else if (!sensorsListString.includes(datastream.Sensor.name)) {
                sensorsListString += `, ${datastream.Sensor.name}`;
            } 
        })

        const popupContent = document.createElement('div');
        popupContent.classList.add("flex","flex-col");

        let htmlContent = `<div>
                <h1 class="text-[16px] font-semibold"><span class="font-bold">
                Thing:</span> ${thing.name}</h1>
                <p><span class="font-semibold">
                Sensor(s):</span> ${sensorsListString}</p>
                <p><span class="font-semibold">
                CCLL:</span> ${thing.properties.CCLL}</p>
                <p><span class="font-semibold">
                Lng, Lat:</span> ${lng}, ${lat}</p>
            </div>
        `;

        popupContent.insertAdjacentHTML('afterbegin',htmlContent);

        const openDataPanelButton =
            document.createElement('button');
        openDataPanelButton.innerText = "View Datastreams";
        openDataPanelButton.classList.add(
            "py-2","px-4","bg-gray-200","text-gray-800","font-medium",
            "rounded","hover:bg-gray-300");

        openDataPanelButton.addEventListener(
            'click',e => {
            this.dataPanel.open();
        });
        
        popupContent.addEventListener('click',e => {
            this.dataPanel.open();
        });

        popupContent.appendChild(openDataPanelButton);

        const marker = L.marker([lat,lng])
            .bindPopup(popupContent,{keepInView: true});

        marker.on('click', e => { 
            this.map.setView([lat,lng]);
            this.dataPanel.initDatastreamSelectionPage(thing);
            this.dataPanel.goToDatastreamsSelectionPage();

        });

        return marker;
    }

}

class DataPanel {

    constructor(panelId) {

        this.panelDiv = document.getElementById(panelId);
        this.closeButton = document.getElementById(
            "data-panel-close-button");
        this.backButton = document.getElementById(
            "back-button");

        this.datastreamsSelectionPage = document.getElementById(
            "datastreams-selection-page");
        this.datastreamsSelectionPageSubtitle = document.getElementById(
            "datastreams-selection-page-subtitle");
        this.datastreamsButtonsDiv = document.getElementById(
            "datastreams-buttons");
        
        this.datastreamResultsPage = document.getElementById(
            "datastream-results-page");
        this.datastreamResultsPageTitle = document.getElementById(
            "results-page-title");
        this.datastreamInfoDiv = document.getElementById(
            "datastream-info");
        this.dataOptionsForm = new DataOptionsForm(
            "data-options-form",
            "number-observations-select",
            this.makePlot.bind(this));
        this.plotDiv = document.getElementById("data-panel-plot");

        this.expandButton = document.getElementById(
            "expand-button");
        this.expandedPlotPanel = new ExpandedPlotPanel(
            "expanded-plot-panel");
        
        this.selectedDatastream = {"@iot.id":null};
        this.loadedObservations = null;

        this.setEventListeners();
    }

    setEventListeners() {
        this.closeButton.addEventListener(
            'click', e => this.close());
        this.backButton.addEventListener(
            'click', e => this.goToDatastreamsSelectionPage());
        this.expandButton.addEventListener(
            'click', e => this.expandPlot());
    }

    initDatastreamSelectionPage(thing) {

        this.clearElementContent(this.datastreamsButtonsDiv);

        this.datastreamsSelectionPageSubtitle.innerText = `(${thing.name})`;

        thing.Datastreams.forEach( (datastream) => {

            const datastreamButton =
                document.createElement('button');
            datastreamButton.innerText = `${datastream.name} (${datastream.Sensor.name})`;
            datastreamButton.classList.add("m-4","py-2","px-4","bg-gray-200",
                "text-gray-800","font-medium","rounded","hover:bg-gray-300","w-full");
           
            datastreamButton.addEventListener(
                'click', async e => {

                this.goToDatastreamResultsPage();
                
                if (datastream["@iot.id"] != this.selectedDatastream["@iot.id"]) {  
                    this.selectedDatastream = datastream;
                    await this.initDatastreamResultsPage(this.selectedDatastream);
                }
  
            });

            this.datastreamsButtonsDiv.appendChild(datastreamButton);
        });

    }

    async initDatastreamResultsPage(datastream) {

        this.clearElementContent(this.datastreamInfoDiv);
        this.plotVoid(
            this.plotDiv,datastream.ObservedProperty.name,
            datastream.unitOfMeasurement.symbol);

        this.dataOptionsForm.setDatastream(datastream);

        this.datastreamResultsPageTitle.innerText = datastream.name;

        const htmlContent = `
            <p><span class="font-semibold">Sensor:</span> 
                    ${datastream.Sensor.name}</p>
            <p><span class="font-semibold">Observed property:</span> 
                    ${datastream.ObservedProperty.name}</p>
            <p><span class="font-semibold">Unit:</span> 
                     ${datastream.unitOfMeasurement.name}</p>
        `;

        this.datastreamInfoDiv.insertAdjacentHTML(
            'afterbegin',htmlContent);
        
        this.dataOptionsForm.getNumOfObsFilter().setSelectedIndex(0);
        await this.makePlot(
            datastream,this.dataOptionsForm.getNumOfObsFilter().getSelectedValue());


    }


    async makePlot(datastream,numberOfObs) {
        const api = SensorThingsAPI.getInstance(
            App.getInstance().apiEndpoint);
        this.loadedObservations = await api.getLastObservations(
            datastream["@iot.id"], numberOfObs);

        
        this.plotObservations(this.plotDiv,this.loadedObservations,
            datastream.ObservedProperty.name,datastream.unitOfMeasurement.symbol);
      
    }

    plotObservations(plotDiv,observations,parameter="",
                     unit="",fontSize=14,title="") {

        const [timeList, valueList] = observations.reduce(
            (lists, observation) => {
              lists[0].push(observation.phenomenonTime);
              lists[1].push(observation.result);
              return lists;
            },
            [[], []]
        );

        const data = [{
            x: timeList,
            y: valueList 
        }];
        

        const yaxisTitle = `${parameter} (${unit})`;    
        const adjustedYaxisTitleFontSize = this.adjustFontSize(
            yaxisTitle,18,plotDiv.offsetHeight,0.7);

        let layout = {

            font: {
                family: 'Courier New, monospace',
            },

            margin: { 
                t: 0, 
                b: 0 
            },

            xaxis: {
                tickfont: {
                  size: fontSize
                },
                automargin: true
              },

            yaxis: {
                tickfont: {
                    size: fontSize
                  },
                title: {
                    text: yaxisTitle,
                    font: {
                        size: adjustedYaxisTitleFontSize},

                }
                
            }
            

        };


        if (title!=="") {

            const adjustedTitleFontSize = this.adjustFontSize(
                title,20,plotDiv.offsetWidth,0.7);

            layout.title = {
                text: title,
                font: {
                    size: adjustedTitleFontSize
                },
                automargin: true
            };
        }

        Plotly.newPlot(plotDiv,data,layout);


    }

    plotVoid(plotDiv,parameter="",unit="") {
        const data = [{
            x: [],
            y: [] 
        }];
            
        const yaxisTitle = `${parameter} (${unit})`;    
        const adjustedYaxisTitleFontSize = this.adjustFontSize(
            yaxisTitle,18,plotDiv.offsetHeight,0.7);

        const layout = {
            font: {
                family: 'Courier New, monospace',
            },
            margin: {
                t: 0,
                b: 0
            },
            xaxis:{
                automargin: true
            },
            yaxis: {
                title: yaxisTitle,
                font: {
                    size: adjustedYaxisTitleFontSize
                },
            }

        }

        Plotly.newPlot(plotDiv,data,layout);
    }

    adjustFontSize(title, fontSize, divWidth, fontWidthHeightFactor) {

        const wDiv = divWidth;
        const nC = title.length; // Number of characters
        const fsDefault = fontSize;
        const k = fontWidthHeightFactor; // Factor associated to a font such as width=k*fontSize for a character
    
        const fsMax = Math.floor((1/k)*wDiv/nC);
        const newFontSize = Math.min(fsDefault,fsMax);
        
        return newFontSize;
    } 

    expandPlot() {

        const parameter = this.selectedDatastream.ObservedProperty.name;
        const unit = this.selectedDatastream.unitOfMeasurement.symbol;
        const title = `${this.selectedDatastream.name} 
        (${this.selectedDatastream.Sensor.name})`;

        this.expandedPlotPanel.open();

        this.plotObservations(this.expandedPlotPanel.getPlotDiv(),
            this.loadedObservations,parameter,unit,14,title);

    }


    // Opening/Closing/Clearing elements methods

    open() {
        this.goToDatastreamsSelectionPage();
        this.showElement(this.panelDiv);
    }

    close() {
        this.hideElement(this.panelDiv);
        this.hideElement(this.datastreamsSelectionPage);
        this.hideElement(this.datastreamResultsPage);
    }

    goToDatastreamsSelectionPage() {
        this.hideElement(this.datastreamResultsPage);
        this.showElement(this.datastreamsSelectionPage);
        this.hideElement(this.backButton);
    }

    goToDatastreamResultsPage() {
        this.hideElement(this.datastreamsSelectionPage);
        this.showElement(this.datastreamResultsPage);
        this.showElement(this.backButton);
    }

    showElement(element) {
        let classList = element.classList;

        if (classList.contains("hidden")) {
            classList.remove("hidden");
        }
    }

    hideElement(element) {
        let classList = element.classList;
       
        if (!classList.contains("hidden")) {
            classList.add("hidden");
        }
    }
    

    clearElementContent(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }  

}

class ExpandedPlotPanel {
    
    constructor(panelId) {

        this.panelDiv = document.getElementById(panelId);
        this.closeButton = document.getElementById(
            "expanded-plot-panel-close-button");
        this.plotDiv = document.getElementById(
            "expanded-plot-panel-plot");
        
        this.invisibleOverlay = document.createElement('div');
        this.invisibleOverlay.classList.add(
            "absolute","z-40","top-0","left-0","h-screen","w-screen");

        this.setEventListeners();
    }

    setEventListeners() {
        this.closeButton.addEventListener(
            'click', e => this.close());
    }

    getPlotDiv() {
        return this.plotDiv;
    }

    getSize() {
        return (this.panelDiv.offsetWidth,this.panelDiv.offsetHeight);
    }

    open() {
        document.body.appendChild(this.invisibleOverlay);

        if (this.panelDiv.classList.contains("hidden")) {
            this.panelDiv.classList.remove("hidden");
        }
    }
    
    close() {
        document.body.removeChild(this.invisibleOverlay);

        if (!this.panelDiv.classList.contains("hidden")) {
            this.panelDiv.classList.add("hidden");
        }
    }
}

class QueryForm {

    constructor(formId,propertySelectId,ccllSelectId) {
    
        this.form = document.getElementById(formId);
        
        this.propertyFilter = new Filter(propertySelectId);
        this.ccllFilter = new Filter(ccllSelectId);

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

        const api =  SensorThingsAPI.getInstance(App.getInstance().apiEndpoint);

        const dataValue = await api.getFilteredThings(selectedProperty,selectedCcll);

        App.getInstance().getMapManager().displayMarkers(dataValue);
        App.getInstance().getMapManager().getDataPanel().close();
        
    }

}

class DataOptionsForm {

    constructor(formId,numOfObsSelectId,makePlotCallback) {
    
        this.form = document.getElementById(formId);
        this.numOfObsFilter = new Filter(numOfObsSelectId);
        this.makePlotCallback = makePlotCallback;
        this.datastream = null;

        this.numOfObsFilter.addOption('50','50');
        this.numOfObsFilter.addOption('100','100');
        this.numOfObsFilter.addOption('1000','1000');

        this.setEventListeners();
        
    }

    setEventListeners() {
        this.numOfObsFilter.getSelect().addEventListener(
            'change',async e => await this.handleChange(e));
    }

    setDatastream(datastream) {
        this.datastream = datastream;
    }
    
    getNumOfObsFilter() {
        return this.numOfObsFilter;
    }

    async handleChange(event) {

        event.preventDefault();
        const selectedNumber = this.numOfObsFilter.getSelectedValue();
        await this.makePlotCallback(this.datastream,selectedNumber);
        
    }
}

class Filter {

    constructor(selectId) {
        this.select = document.getElementById(selectId);
    }

    getSelect() {
        return this.select;
    }

    getSelectedValue() {
        return this.select.value;
    }

    setSelectedIndex(index) {
        this.select.selectedIndex = index;
    }

    addOption(value,innerText) {
        let option = document.createElement('option');
        option.value = value;
        option.innerText = innerText;

        this.select.appendChild(option);

    }

}


class SensorThingsAPI {

    static instance= null;
    
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

        return data;

      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    }
  

    async getLastObservations(datastreamID,numberOfObs) {

        const queryURL = `${this.apiEndpoint}/Datastreams(${datastreamID})/Observations?$orderby=phenomenonTime desc&$select=phenomenonTime,result,id&$top=${numberOfObs}`;
        const data = await this.fetchData(queryURL);
        
        return data.value;
    }


    async addObservedPropertyOptions(filter) {

        const queryURL = `${this.apiEndpoint}/ObservedProperties?$orderby=id&$select=id,name`;
        const data = await this.fetchData(queryURL);

        data.value.forEach( (property) => {
        
            const optionValue = property['@iot.id'];
            const optionInnerText = property.name;

            filter.addOption(optionValue,optionInnerText);
        
        })
    }

    async addCCLLOptions(filter) {

        const queryURL = `${this.apiEndpoint}/Things?$select=properties/CCLL&$orderby=properties/CCLL`;
        const data = await this.fetchData(queryURL);


        let previousCCLLName = "";
        let currentCCLLName = "";

        data.value.forEach( (thing) => {

            currentCCLLName = thing.properties.CCLL;

            if (currentCCLLName != previousCCLLName) {
                const optionValue = currentCCLLName;
                const optionInnerText = currentCCLLName;

                filter.addOption(optionValue,optionInnerText);

                previousCCLLName = currentCCLLName;
            }
        })
    }


    async getFilteredThings(propID,ccllValue) {

        let queryURL = this.apiEndpoint;

        queryURL = `${queryURL}/Things?$expand=Locations,Datastreams/ObservedProperty,Datastreams/Sensor&$orderby=id`;


        if (propID != "-1") {
            queryURL = `${queryURL}&$filter=Datastreams/ObservedProperty/id eq ${propID}`;
            
            if (ccllValue != "-1") {
                queryURL = `${queryURL} and properties/CCLL eq '${ccllValue}'`;
            }

        } else {
            if (ccllValue != "-1") {
                queryURL = `${queryURL}&$filter=properties/CCLL eq '${ccllValue}'`;
            }
        }
        
        const data = await this.fetchData(queryURL);
        
        return data.value;
    }

    
}

/*-----------------------------------------------------------------------------------------*/
/*---------------------------------------- MAIN -------------------------------------------*/    
/*-----------------------------------------------------------------------------------------*/

const app = App.getInstance();
app.run();


