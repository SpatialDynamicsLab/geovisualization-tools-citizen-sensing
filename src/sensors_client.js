/*-----------------------------------------------------------------------------------------*/
/*--------------------------------------- CLASSES -----------------------------------------*/ 
/*-----------------------------------------------------------------------------------------*/

class App {
    static instance = null;
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.queryForm = new QueryForm("query-form", "property-select", "thing-select");
        this.mapManager = new MapManager([[54.209196, 13.671665], [38.543655, -8.509294]]);
    }

    static getInstance(apiEndpoint = null) {
        if (!App.instance && apiEndpoint) {
            App.instance = new App(apiEndpoint);
        }
        return App.instance;
    }


    getMapManager() {
        return this.mapManager;
    }

    run(){
        this.mapManager.initMap();

        const api = SensorThingsAPI.getInstance(this.apiEndpoint);

        api.addObservedPropertyOptions(this.queryForm.getPropertyFilter());
        // api.addThingNameOptions(this.queryForm.getThingFilter());

    }
}

function showLoader() {
    document.getElementById('loader-spinner')?.classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader-spinner')?.classList.add('hidden');
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
        
        // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //     maxZoom: 19,
        //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO © OpenStreetMap contributors',
            maxZoom: 18
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

    async makePlot(datastream, numberOfObs) {
        showLoader();
        try {
            const api = SensorThingsAPI.getInstance(App.getInstance().apiEndpoint);
            this.loadedObservations = await api.getLastObservations(
                datastream["@iot.id"], numberOfObs
            );

            this.plotObservations(
                this.plotDiv, this.loadedObservations,
                datastream.ObservedProperty.name,
                datastream.unitOfMeasurement.symbol
            );
        } catch (err) {
            console.error("Plot failed:", err);
            alert("Failed to load observations.");
        } finally {
            hideLoader();
        }
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

    constructor(formId,propertySelectId) {
        this.form = document.getElementById(formId);
        
        this.propertyFilter = new Filter(propertySelectId);
        this.thingFilter = new Filter("thing-input");

        this.setEventListeners();
        
    }

    getPropertyFilter() {
        return this.propertyFilter;
    }

    getThingFilter() {
        return this.thingFilter;
    }

    setEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(event) {
        event.preventDefault();
        showLoader();

        try {
            const selectedProperty = this.propertyFilter.getSelectedValue();
            const selectedThingName = this.thingFilter.getSelectedValue();

            console.log("Thing name selected:", selectedThingName);
            const api =  SensorThingsAPI.getInstance(App.getInstance().apiEndpoint);
            const dataValue = await api.getFilteredThings(selectedProperty, selectedThingName);

            if (!selectedProperty && (!selectedThingName || selectedThingName.length === 0)) {
                alert("Please select at least one device or property.");
                return;
            }

            App.getInstance().getMapManager().displayMarkers(dataValue);
            App.getInstance().getMapManager().getDataPanel().close();

        } catch (error) {
            console.error("Failed to fetch things:", error);
            alert("Something went wrong fetching data.");
        } finally {
            hideLoader();
        }
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

    getSelectedValue() {
        if (this.select && this.select.tomselect) {
            const value = this.select.tomselect.getValue();
            if (Array.isArray(value)) {
                return value[0] || '';  // return first selected item
            }
            return value;
        }

        return this.select?.value || '';
    }



    addOption(value, innerText) {
        // not needed for TomSelect w/ async loading, but kept for other filters
        const option = document.createElement('option');
        option.value = value;
        option.innerText = innerText;
        this.select.appendChild(option);
    }

    setSelectedIndex(index) {
        // not used with TomSelect input
    }

    getSelect() {
        return this.select;
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

    async getLastObservations(datastreamID, numberOfObs) {
        let top = parseInt(numberOfObs);

        const queryURL = `${this.apiEndpoint}/Datastreams(${datastreamID})/Observations?$orderby=phenomenonTime desc&$select=phenomenonTime,result,id&$top=${top}`;
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
        
        });
    }


    async getFilteredThings(propID, thingNamesRaw) {
        let queryURL = `${this.apiEndpoint}/Things?$expand=Locations,Datastreams/ObservedProperty,Datastreams/Sensor&$orderby=id`;
        const filters = [];

        // Clean propID
        const cleanPropID = (typeof propID === "string" ? propID.trim() : "");
        if (cleanPropID && cleanPropID !== "-1" && cleanPropID !== "undefined") {
            filters.push(`Datastreams/ObservedProperty/id eq ${cleanPropID}`);
        }

        // Handle thing names (and sanitize any '' entries)
        let thingNames = [];
        if (Array.isArray(thingNamesRaw)) {
            thingNames = thingNamesRaw.flatMap(name => name.split(',').map(n => n.trim()));
        } else if (typeof thingNamesRaw === 'string') {
            thingNames = thingNamesRaw.split(',').map(n => n.trim());
        }

        // Remove empty or invalid entries
        thingNames = thingNames.filter(n => n && n.length > 0);

        if (thingNames.length > 0) {
            const nameFilters = thingNames.map(name =>
                `name eq '${name.replace(/'/g, "''")}'`
            );
            filters.push(`(${nameFilters.join(' or ')})`);
        }

        // Only add filter if there’s something to filter
        if (filters.length > 0) {
            queryURL += `&$filter=${encodeURIComponent(filters.join(' and '))}`;
        }

        console.log("Final STA Query:", decodeURIComponent(queryURL));

        const data = await this.fetchData(queryURL);
        return data.value;
    }

}

/*-----------------------------------------------------------------------------------------*/
/*---------------------------------------- MAIN -------------------------------------------*/    
/*-----------------------------------------------------------------------------------------*/
window.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("sta-url-modal");
  const modalContent = document.getElementById("sta-url-modal-content");
  const input = document.getElementById("sta-url-input");
  const errorMsg = document.getElementById("sta-url-error");
  const submitBtn = document.getElementById("sta-url-submit");

  const STORAGE_KEY = "lastStaUrl";

  // Check localStorage and prefill if valid
  const storedUrl = localStorage.getItem(STORAGE_KEY);
  if (storedUrl && /^https?:\/\/.+\/v1\.(0|1)\/?$/.test(storedUrl)) {
    input.value = storedUrl;
  }

  // Animate modal appearance
  setTimeout(() => {
    modalContent.classList.remove("opacity-0", "scale-95");
    modalContent.classList.add("opacity-100", "scale-100");
  }, 50);

  submitBtn.addEventListener("click", () => {
    const url = input.value.trim();
    const isValid = /^https?:\/\/.+\/v1\.(0|1)\/?$/.test(url);

    if (!isValid) {
      errorMsg.classList.remove("hidden");
      return;
    }

    // Store cleaned URL
    const cleanUrl = url.replace(/\/+$/, "");
    localStorage.setItem(STORAGE_KEY, cleanUrl);

    // Hide modal + cleanup
    modal.classList.add("hidden");
    errorMsg.classList.add("hidden");

    const app = App.getInstance(cleanUrl);
    app.run();

    const deviceInput = document.getElementById("thing-input");
    if (deviceInput) {
      new TomSelect("#thing-input", {
        plugins: ['remove_button'],
        valueField: 'name',
        labelField: 'name',
        searchField: 'name',
        maxOptions: 100,
        maxItems: null,
        create: false,
        allowEmptyOption: true,
        load: function (query, callback) {
          if (!query.length) return callback();
          const safeQuery = query.replace(/'/g, "''");

          fetch(`${cleanUrl}/Things?$filter=startswith(name,'${safeQuery}')&$select=name&$top=100`)
            .then(response => response.json())
            .then(json => callback(json.value || []))
            .catch(() => callback());
        }
      });
    }
  });
});


