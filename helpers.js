/*****************************************************
*
Main classes /data structures
*
*****************************************************/

function loot(origin, endpoint, address, description) {
    this.origin = origin;
    this.endpoint = endpoint;
    this.address = address;
    this.description = description;

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
        console.log(this.origin);
        console.log(this.endpoint);
        console.log("Status is " + this.endpoint.status);
        console.log(this.address);
        //console.log(this.description);
    }

}

function locations() {
    this.origCoordinates = []; // original unprocessed coordinates
    this.origDescriptions = []; // original unprocessed descriptions
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
                this.lootPile.push(new loot(this.origin, results[j], tempName[j], this.origDescriptions[i][j]));
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

}


/*****************************************************
*
Supporting Functions
*
*****************************************************/

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
            locList.sortPlaces();
            console.log("sorting done");
            locList.logDistances();
    }
}

function initialize() {
  geocoder = new google.maps.Geocoder();
  var opts = {
    center: home,
    zoom: 10
  };
  map = new google.maps.Map(document.getElementById('map-canvas'), opts);
    var outputDiv = document.getElementById('outputDiv');
    outputDiv.innerHTML = '';
    deleteOverlays(); //probably want to add this back

    locList.origCoordinates = destinations;
    locList.origDescriptions = descriptions;

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
        console.log("In calcDistCallback");
        locList.addDistanceMatrixResults(response);
        addPlacesCalls++;
        checkRequestCount();

//        console.log("origins length is " + origins.length);
//    for (var i = 0; i < origins.length; i++) {
//      var results = response.rows[i].elements;
//      //addMarker(origins[i], false);
//      for (var j = 0; j < results.length; j++) {
//        //addMarker(destinations[j], true);
//        outputDiv.innerHTML += origins[i] + ' to ' + destinations[j]
//            + ': ' + results[j].distance.text + ' in '
//            + results[j].duration.text + '<br>';
//      }
//    }

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
    } else {
      alert('Geocode was not successful for the following reason: '
        + status);
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
