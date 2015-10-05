
/*****************************************************
*
Main classes /data structures
*
*****************************************************/
function mapMarkers() {
    this.origin = 0;
    this.destinations = []
    this.destinationLength = 0;
    this.currentMarker = 0; // used to index which markers have been drawn
    this.previousCurrentMarker = 0; //used to continue if page has lost a map idle event
    this.timeOutWait = 0;

    this.pushOrigin = function(address) {
        this.origin = address;
    }

    this.drawOrigin = function() {
        if (this.origin != 0) {
            addMarker(this.origin, false);
        }
        else {
            console.log("Failed to draw Origin. No origin coordinates were probably ever given");
        }
    }

    this.addToDestinations = function(address) {
        this.destinations.push(address);
        this.destinationLength = this.destinationLength +1;
        //console.log("destination length is now " + this.destinationLength);
    }

    this.mapNextMarker = function() {
        if (this.currentMarker < this.destinationLength) {
            addMarker(this.destinations[this.currentMarker], true);
            //console.log("destination is "+ this.destinations[this.currentMarker]);
            this.currentMarker = this.currentMarker +1;
        }
        else {
            console.log("Attempted to draw next marker, but all markers have been drawn");
        }
    }

    // Make sure page is not stuck with leftover markers to be drawn
    this.checkStatus = function() {
        if (this.currentMarker < this.destinationLength) {
            // This means that a second has gone by, and no new markers have been drawn even though there
            // are still markers left to draw. Force the page to add another one.
            if (this.currentMarker == this.previousCurrentMarker) {
                if (this.timeOutWait >= 0) {
                    this.mapNextMarker();
                    this.timeOutWait =0;
                }
                this.timeOutWait++;
            }
        }
        this.previousCurrentMarker = this.currentMarker;
    }
}

function loot(origin, endpoint, address, description, hyperlink) {
    this.origin = origin;
    this.endpoint = endpoint;
    this.address = address;
    this.description = description;
    this.hyperlink = hyperlink;
    this.valid = 1;

    // Adds to the output list:
    //  1) Address
    //  2) Distance in miles
    //  3) Time in minutes
    this.logDistance = function(){
        outputDiv.innerHTML += this.origin + ' to ' + this.address
                + ': ' + this.endpoint.distance.text + ' in '
                + this.endpoint.duration.text + '<br>';
//        outputDiv.innerHTML += this.description
//                + '<br>';
        //console.log(this.description); //todo - make the description actually readable on the map
    }

    this.toString = function(){
        console.log("origin is " + this.origin);
        console.log("endpoint is " + this.endpoint);
        console.log("Status is " + this.endpoint.status);
        console.log("address is " + this.address);
        console.log("hyperlink is " + this.hyperlink);
        //console.log(this.description);
    }

    //make sure that the current loot has all expected properties
    this.validate = function(){
        if (typeof this.origin === 'undefined') {
            console.log("origin undefined");
            invalidLoot++;
            this.valid = 0;
            return false;
        }
        if (typeof this.endpoint === 'undefined') {
            console.log("endpoint undefined");
            invalidLoot++;
            this.valid = 0;
            return false;
        }
        if (typeof this.endpoint.distance === 'undefined') {
            console.log("endpoint distance is undefined");
            invalidLoot++;
            this.valid = 0;
        }
        if (typeof this.address === 'undefined') {
            console.log("address undefined");
            invalidLoot++;
            this.valid = 0;
            return false;
        }
        if (typeof this.description === 'undefined') {
            console.log("description undefined");
            invalidLoot++;
            this.valid = 0;
            return false;
        }
        if (typeof this.hyperlink === 'undefined') {
            console.log("hyperlink undefined");
            invalidLoot++;
            this.valid = 0;
            return false;
        }
        //console.log("current loot successfully validated");
        return true
    }

    // loot table
    //     id
    //     origin (200)
    //     address (200)
    //     distance (100)
    //     description (1000)
    //     hyperlink (200)
    //
    // adds the current loot item to a sql database
    this.addToDatabase = function(){
        $.ajax({
            type: "POST",
            url: "http://localhost/addLoot.php",
            async: true,
            timeout: 50000,
            data: {origin: this.origin, address: this.address, distance: this.endpoint.distance.text, description: this.description, hyperlink: this.hyperlink},
            success: function(data){
            //console.log(data);
            }
        });
    }

    // This function is being deprecated. Should now use addToMarkersList to handle drawing later
    this.addToMap = function(){
        addMarker(this.address, true);
    }

    // Pushes destination to markersInfo class. This is an intermediate step before drawing the markers so that
    // the page will be able to load one marker at a time rather than waiting for all the markers, then pushing
    // them to the screen
    this.addToMarkersList = function(){
        markersInfo.addToDestinations(this.address);
    }
}

function locations() {
    this.origCoordinates = []; // original unprocessed coordinates
    this.origDescriptions = []; // original unprocessed descriptions
    this.origLinks = []; // original unprocessed hyperlinks
    this.lootPile = [];
    this.endpointAddressTupleArray = [];
    this.distanceResults = []; //distance matrix results
    this.distanceResultsIndex = 0;
    this.index = 0;
    this.origin = 0;

    // first store responses that can then be parsed later after all data is acquired
    // This uses a really hacky fix in the if-else statment in order to properly order
    // responses pushed asynchronously via callback. A better solution needs to be 
    // found in order to handle more than 47 loot items
    this.addDistanceMatrixResults = function(response) {
        //this.distanceResults[this.distanceResultsIndex] = response;
    //    if (response.rows[0].elements.length == 24) {
    //        this.distanceResults.unshift(response);
    //    }
    //    else {
            this.distanceResults.push(response);
        //}
        //console.log("response length is " + response.rows[0].elements.length);
        //console.log(response);
        this.distanceResultsIndex++; //probably an unnecessary variable
        //console.log("In addDistanceMatrixResults");
    }


    // To be called to extract desired information from getDistanceMatrix reponse
    // via addDistanceMatrixResults
    this.parsePlaces = function() {
        //console.log("In parsePlaces");
        //console.log("orig desciptions: " + this.origDescriptions);
        this.origin = this.distanceResults[0].originAddresses[0];
        for (var i = 0; i<numberOfCallbacksDelivered; i++) {
        //for (var i = numberOfCallbacksDelivered-1; i>=0; i++) {
            if (typeof this.distanceResults[i] === 'undefined') {
                console.log("invalid index " + i);
                return;
            }
            // Turns out results array gets pushed the the locations class in the reverse order of what is desired. Do some funky
            // logic to go through the results arrays backwards to match the results with origCoordinates/origDescriptions
//            var tempName = this.distanceResults[numberOfCallbacksDelivered -(i+1)].destinationAddresses; //tempName used to be destinations
//            var results = this.distanceResults[numberOfCallbacksDelivered -(i+1)].rows[0].elements;
            var tempName = this.distanceResults[i].destinationAddresses; //tempName used to be destinations
            var results = this.distanceResults[i].rows[0].elements;


            //console.log("results length is " + results.length + "orig descriptions len is " + this.origDescriptions.length
           //           + " orig links length is " + this.origLinks.length);
            //for (var n =0; n<this.origDescriptions.length; n++) {
            //  console.log("subset descriptions len is " + this.origDescriptions[n].length);
            //  console.log("subset links len is " + this.origLinks[n].length);
            //}
            for (var j = 0; j < results.length; j++) {
                this.lootPile.push(new loot(this.origin, results[j], tempName[j], this.origDescriptions[i][j], this.origLinks[i][j]));
                //console.log("desc i,j=" + i +"," + j+ " " + this.origDescriptions[i][j]);
                var endpointAddressTuple = [];
                endpointAddressTuple[0] = results[j];
                endpointAddressTuple[1] = tempName[j];
                this.endpointAddressTupleArray[this.index] = endpointAddressTuple;
                this.index = this.index + 1;
            }
            //console.log("End Destination loop");
        }
    }

    this.sortPlaces = function() {
        //console.log("In sortPlaces");
        if (this.index > 0){
            this.lootPile.sort(compareLootByDistance);
        }
        else{
            console.log("Error. Object had no endpoints");
        }
    }

    // From an already sorting group of data: Adds to the output list:
    //  1) Address
    //  2) Distance in miles
    //  3) Time in minutes
    this.logDistances = function() {
        for (loot of this.lootPile) {
            loot.logDistance();
        }
    }

    this.printLoot = function() {
        //console.log("In printLoot");
        for (loot of this.lootPile) {
            console.log(loot.toString());
        }
    }

    this.validateLoot = function() {
        result = true;
        //console.log("In validateLoot");
        for (loot of this.lootPile) {
            if (typeof loot === 'undefined') {
                console.log("Loot undefined!!");
                result = false;
            }
            if (loot.validate() == false) {
                console.log("Loot validation failure!!");
                result = false;
            }
        }
        // now get rid of any invalid loot from the loot pile so the program doesn't break
        var newLootArr = [];
        for (loot of this.lootPile) {
            if (loot.valid){
                newLootArr.push(loot);
            }
        }
        this.lootPile = newLootArr;
        return result;
    }

    // currently only adds loot to database if it is less that 15 miles away
    this.addLootToDatabase = function() {
        //console.log("In addLoot");
        for (loot of this.lootPile) {
            var lootDistanceText = loot.endpoint.distance.text.split(" ");
            // multiply by 1 to guarantee that the variable is recognized as an Int
            var lootdistance = lootDistanceText[0] *1;
            if (lootdistance < drawRadius){
                //console.log("Adding loot to database " + lootdistance );
                loot.addToDatabase();
                //loot.addToMap();
            }
        }
    }

    this.clearDatabase = function(){
        $.ajax({
            type: "POST",
            url: "http://localhost/clearLoot.php",
            async: true,
            timeout: 50000,
            data: {},
            success: function(data){
            console.log(data);
            }
        });
    }
}


/*****************************************************
*
Supporting Functions
*
*****************************************************/

// really hacky(and just bad) way to complete the program which calls my script to send the email
function executeBatchOnCompletion() {
    $.ajax({
        type: "POST",
        url: "http://localhost/runBash.php",
        async: true,
        timeout: 50000,
        data: {},
        success: function(data){
        console.log(data);
        }
    });
}

// Sort loot based on time (in minutes) from origin
function compareLootByTime(a,b) {
    var atext = a.endpoint.duration.text.split(" ");
    var btext = b.endpoint.duration.text.split(" ");
    var aDur = atext[0] *1; // multiply by 1 to guarantee that the variable is recognized as a number
    var bDur = btext[0] *1;

    if (aDur < bDur){
        //console.log("aDur " + aDur + " is less than " + bDur);
        return -1;
    }
    if (aDur > bDur){
        //console.log("aDur " + aDur + " is greater than " + bDur);
        return 1;
    }
    return 0;
}

// Sort loot based on distance (in minutes) from origin
function compareLootByDistance(a,b) {
    var atext = a.endpoint.distance.text.split(" ");
    var btext = b.endpoint.distance.text.split(" ");
    var aDis = atext[0] *1; // multiply by 1 to guarantee that the variable is recognized as a number
    var bDis = btext[0] *1;

    if (aDis < bDis){
        //console.log("aDis " + aDis + " is less than " + bDis);
        return -1;
    }
    if (aDis > bDis){
        //console.log("aDis " + aDis + " is greater than " + bDis);
        return 1;
    }
    return 0;
}

// Performs data manipulation once all data is returned by the Google API
function checkRequestCount() {
    console.log("addPlaces call count is " + numberOfCallbacksDelivered + " vs needed " + numberOfCallbacksNeeded);

            locList.parsePlaces();
            if (!locList.validateLoot()) {
                console.log("Terminating because of failed loot validation");
                return;
            }
            locList.sortPlaces();
            //console.log("sorting done");
            initiateMarkersDraw();
            locList.logDistances();
            console.log("Number of removed invalidLoot is " + invalidLoot);
            if (!blockBatchExecution) {
                console.log("Running batch script! Email should be sent out!")
                locList.clearDatabase();
                locList.addLootToDatabase();
                executeBatchOnCompletion();
            }
}

function initialize() {
    geocoder = new google.maps.Geocoder();
    var opts = {
        zoom: 10,
        center: tempCenter
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), opts);
    //map.addListener('center_changed', mapCenterChangeEvent());

    var outputDiv = document.getElementById('outputDiv');
    outputDiv.innerHTML = '';
    outputDiv.addEventListener("click", function() {
        console.log("You clicked OutputDiv");}
    );
    // Just deletes makers array. Not really any point of having this if there's no markers yet
    deleteOverlays();

    locList.origCoordinates = destinations;
    locList.origDescriptions = descriptions;
    console.log(descriptions);
    locList.origLinks = hyperlinks;

    processNextDistanceMatrix();
}

//This function gets called to check whether there is another array that should be processed by Google's Distance Matrix
function processNextDistanceMatrix(){
    if (numberOfCallbacksDelivered < numberOfCallbacksNeeded) {
        console.log("logging destinations array " + numberOfCallbacksDelivered);
        calculateDistances(locList.origCoordinates[numberOfCallbacksDelivered]);
        numberOfCallbacksDelivered++;
    }
    else {
        checkRequestCount();
    }
}

// Draws markers one by one waiting for page to load before attempting to draw the next
function initiateMarkersDraw() {
    console.log("Entered initiateMarkersDraw");
    console.log("loot pile count is " + locList.lootPile.length);

    for (loot of locList.lootPile) {
        var lootDistanceText = loot.endpoint.distance.text.split(" ");
        // multiply by 1 to guarantee that the variable is recognized as an Int
        var lootdistance = lootDistanceText[0] *1;
        //console.log("loot distance is " + lootdistance);
        if (lootdistance < drawRadius){
            loot.addToMarkersList();
        }
    }

    google.maps.event.addListener(map, 'idle', function(){
       markersInfo.mapNextMarker();
    });
    //This draws the origin and sets of the drawing of the destinations
    markersInfo.drawOrigin();

    // Force page to continue drawing markers if 'idle' map event is not sufficient
    setInterval(function() {
        markersInfo.checkStatus()
    }, 140);
}

// callback to do stuff when the GMap center changes
function mapCenterChangeEvent() {
    console.log("Center of map has changed");
    //alert("Hi");
}

// callback for when map goes idle
function waitForMapLoad() {

}

// Maximum of 25 origins or 25 destinations per request; and
// At most 100 elements (origins times destinations) per request.
function calculateDistances(input) {
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
    {
        origins: origins,
        destinations: input,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
    }, calcDistCallback);
}

function calcDistCallback(response, status) {
    if (status != google.maps.DistanceMatrixStatus.OK) {
        alert('Error was: ' + status);
        console.log("Error in calcDistCallback!");
    }
    else {
        locList.addDistanceMatrixResults(response);
        processNextDistanceMatrix();

        // todo: fix this. this shouldn't be called multiple times
        markersInfo.pushOrigin(response.originAddresses[0]);
    }
}

function addMarker(location, isDestination) {
    var icon;
    if (isDestination) {
        icon = destinationIcon;
    } else {
        icon = originIcon;
    }
    geocoder.geocode({'address': location}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            //bounds.extend(results[0].geometry.location);
            //map.fitBounds(bounds);
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                icon: icon
            });
            markersArray.push(marker);
        }
        else {
            console.log('Geocode was not successful for the following reason: '
            + status);
            if (status == "OVER_QUERY_LIMIT") {
                var waitTime = 2000;
                console.log("Markers drawn=" + markersArray.length + " Attempting to retry after " + waitTime + " milliseconds");
                sleep(waitTime);
                addMarker(location, isDestination);
            }
        }
    });
}

function deleteOverlays() {
    for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
    }
    markersArray = [];
}

function loadXMLDoc(filename)
{
    if (window.XMLHttpRequest)
    {
        xhttp=new XMLHttpRequest();
    }
    else // code for IE5 and IE6
    {
        xhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET",filename,false);
    xhttp.send();
    return xhttp.responseXML;
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}
