/*****************************************************
*
Main classes /data structures
*
*****************************************************/

function loot(origin, endpoint, address, description, hyperlink) {
    this.origin = origin;
    this.endpoint = endpoint;
    this.address = address;
    this.description = description;
    this.hyperlink = hyperlink;

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
        console.log(this.description); //todo - make the description actually readable on the map
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
            return false;
        }
        if (typeof this.endpoint === 'undefined') {
            console.log("endpoint undefined");
            return false;
        }
        if (typeof this.address === 'undefined') {
            console.log("address undefined");
            return false;
        }
        if (typeof this.description === 'undefined') {
            console.log("description undefined");
            return false;
        }
        if (typeof this.hyperlink === 'undefined') {
            console.log("hyperlink undefined");
            return false;
        }
        console.log("current loot successfully validated");
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
            console.log(data);
            }
        });
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
    this.addDistanceMatrixResults = function(response) {
        this.distanceResults[this.distanceResultsIndex] = response;
        //console.log(response);
        this.distanceResultsIndex++;
        console.log("In addDistanceMatrixResults");
    }


    // To be called to extract desired information from getDistanceMatrix reponse
    // via addDistanceMatrixResults
    this.parsePlaces = function() {
        console.log("In parsePlaces");
        this.origin = this.distanceResults[0].originAddresses[0];
        for (var i = 0; i<addPlacesCalls; i++) {
            if (typeof this.distanceResults[i] === 'undefined') {
                console.log("invalid index " + i);
                return;
            }
            var tempName = this.distanceResults[i].destinationAddresses; //tempName used to be destinations
            var results = this.distanceResults[i].rows[0].elements;
            console.log("results length is " + results.length);
            for (var j = 0; j < results.length; j++) {
                this.lootPile.push(new loot(this.origin, results[j], tempName[j], this.origDescriptions[i][j], this.origLinks[i][j]));
                var endpointAddressTuple = [];
                endpointAddressTuple[0] = results[j];
                endpointAddressTuple[1] = tempName[j];
                this.endpointAddressTupleArray[this.index] = endpointAddressTuple;
                this.index = this.index + 1;
            }
            console.log("End Destination loop");
        }
    }

    this.sortPlaces = function() {
        console.log("In sortPlaces");
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
            //loot.toString();
        }
    }

    this.printLoot = function() {
        console.log("In printLoot");
        for (loot of this.lootPile) {
            console.log(loot.toString());
        }
    }

    this.validateLoot = function() {
        result = true;
        console.log("In validateLoot");
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
        return result;
    }

    this.addLootToDatabase = function() {
        console.log("In addLoot");
        for (loot of this.lootPile) {
            loot.addToDatabase();
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


// Unimplemented
// When complete, this function will return a bool that says whether or not the given destination is within
// A desired range. The callback function will be used to pass different criteria functions
function checkWithinRange(callback) {
}

// Performs data manipulation once all data is returned by the Google API
function checkRequestCount(a,b) {
    console.log("addPlaces call count is " + addPlacesCalls + " vs needed " + numberOfCallbacksNeeded);

    // Ideally, remove this from this function to the main code
    // The reason that this appears to need to stay here at the moment is (I believe) the asynchronous nature
    // of the Google Maps API. If this were moved to the end of the main code, it would be executed before any
    // data is collected from Google.
    if (addPlacesCalls == numberOfCallbacksNeeded) {
            console.log("number of Callbacks Needed acquired");
            locList.parsePlaces();
            locList.printLoot();
            if (!locList.validateLoot()) {
                console.log("Terminating because of failed loot validation");
                return;
            }
            locList.sortPlaces();
            console.log("sorting done");
            locList.logDistances();
            locList.clearDatabase();
            locList.addLootToDatabase();
			executeBatchOnCompletion();
    }
}

function initialize() {
  geocoder = new google.maps.Geocoder();
  var opts = {
    center: unisys,
    zoom: 10
  };
  map = new google.maps.Map(document.getElementById('map-canvas'), opts);
    var outputDiv = document.getElementById('outputDiv');
    outputDiv.innerHTML = '';
    deleteOverlays(); //probably want to add this back

    locList.origCoordinates = destinations;
    locList.origDescriptions = descriptions;
    locList.origLinks = hyperlinks;

    for (arr of locList.origCoordinates) {
        calculateDistances(arr);
    }
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
		var origins = response.originAddresses;
		var destinations = response.destinationAddresses;
        console.log("In calcDistCallback");
        locList.addDistanceMatrixResults(response);
        addPlacesCalls++;
        checkRequestCount();

    for (var i = 0; i < origins.length; i++) {
      var results = response.rows[i].elements;
      addMarker(origins[i], false);
      for (var j = 0; j < results.length; j++) {
        addMarker(destinations[j], true);
		//sleep(100);
        //console.log(destinations[i][j]);
      }
    }

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
      bounds.extend(results[0].geometry.location);
      map.fitBounds(bounds);
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
		  console.log('Attempting to retry after 1 seconds');
		  sleep(1000);
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
