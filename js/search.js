//Leaflet functions reference - http://leafletjs.com/examples/quick-start.html
//Images for markers reference links-
//School - http://www.livechennai.com/images/resource.png
//Supermarket - http://a2.mzstatic.com/us/r30/Purple6/v4/6e/14/f9/6e14f92f-fe50-d652-f0a0-56b1ff4c0037/icon180x180.jpeg
//GP - http://www.inovaxo.fr/design/images/avantage.png
//Train station - http://img4.wikia.nocookie.net/__cb20080418115338/uktransport/images/0/0e/National_Rail_Logo.png

//Initialise variables.
//Setting up the map.
var map = L.map('map').setView([51.505, -0.09], 13);
var userPostCode;
var marker = null;
var gp_marker = [];
var trainSt_marker = [];
var supermarket_marker = [];
var school_marker = [];

// Leaflet custom markers reference - http://leafletjs.com/examples/custom-icons.html
//Custom icon for GP.
var gpIcon = L.icon({
    iconUrl: '../img/gp.png',
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [30, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [-15, -27] // point from which the popup should open relative to the iconAnchor
});

//Custom icon for train station.
var trainStIcon = L.icon({
    iconUrl: '../img/trainSt.jpg',
    iconSize:     [30, 20], // size of the icon
    iconAnchor:   [30, 20], // point of the icon which will correspond to marker's location
    popupAnchor:  [-15, -18] // point from which the popup should open relative to the iconAnchor
});

//Custom icon for supermarket.
var supermarketIcon = L.icon({
    iconUrl: '../img/supermarket.png',
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [30, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [-15, -30] // point from which the popup should open relative to the iconAnchor
});

//Custom icon for school.
var schoolIcon = L.icon({
    iconUrl: '../img/school.png',
    iconSize:     [30, 28], // size of the icon
    iconAnchor:   [30, 28], // point of the icon which will correspond to marker's location
    popupAnchor:  [-15, -28] // point from which the popup should open relative to the iconAnchor
});

//Adding tile layer to the Map.
L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	maxZoom: 18,
	id: 'comp3207-map',
	accessToken: 'pk.eyJ1IjoiY29tcDMyMDctbWFwIiwiYSI6ImNrZzJhcmlzYzAzNmoycG0yc284cml6ZnQifQ.tg1iE1xnqQJbPAE1Lg17xg'
}).addTo(map);

//Event handler to hide the postcode popover.
$(document).ready(function(){
	$('#postcode').on('click', function() {
		$(this).popover('hide');
	});
});

//Submit button event handler.
$('#submitButton').on("click",function(event){

	userPostCode = $('#postcode').val();
	//If marker already exists, remove the map layer and other markers.
	if (marker !== null) {
		$( ".disclaimer" ).show("hide");
        map.removeLayer(marker);
		hideGP(gp_marker);
		hideTrainStation(trainSt_marker);
		hideSupermarket(supermarket_marker);
		hideSchool(school_marker);
		gp_marker = [];
		trainSt_marker = [];
		supermarket_marker = [];
		school_marker = [];
		
		//Uncheck & disable the check boxes.
		$('.checkboxGP').prop({
			checked : false, 
			disabled : true
		});
		$('.checkboxTrainSt').prop({
			checked : false, 
			disabled : true
		});
		$('.checkboxSupermarket').prop({
			checked : false, 
			disabled : true
		});
		$('.checkboxSchool').prop({
			checked : false, 
			disabled : true
		});
    }
	
	// ajax call to process the entered postcode validate and return results.
	$.ajax({
		type: 'POST',
		url: '/processPostCode',
		dataType: 'json',
		ContentType: 'application/json',
		data: {'postcode': userPostCode},
		success: function(response){
			var resParsed;
			if(response.found === true) {
				
				//Postcode is found so create postcode marker, set map view and call functions to look up for local amenities.
				marker = L.marker([response.latitude, response.longitude]).addTo(map).bindPopup('<p>You are here ' + response.postcode + '</p>');
				map.setView(new L.LatLng(response.latitude, response.longitude), 15);
				lookUpGP(response.postcode, response.latitude, response.longitude);
				lookUpTrainStation(response.postcode, response.latitude, response.longitude);
				lookUpSupermarket(response.postcode, response.latitude, response.longitude);
				lookUpSchool(response.postcode, response.latitude, response.longitude);
				
				//Enable and check the check boxes to allow selective display.
				$('.checkboxGP').prop({
					checked : true, 
					disabled : false
				});
				$('.checkboxTrainSt').prop({
					checked : true, 
					disabled : false
				});
				$('.checkboxSupermarket').prop({
					checked : true, 
					disabled : false
				});
				$('.checkboxSchool').prop({
					checked : true, 
					disabled : false
				});
			}
			else {
				//Post is not found so display the popover message.
				$('#postcode').popover('show');
			}
		},
		error: function(e) {
			console.log(e.message);
		}
	});
	event.preventDefault();
});

//Function to retrieve the GP records.
function lookUpGP(postcode, latitude, longitude){
	$.ajax({
		type: 'POST',
		url: '/lookUpGP',
		dataType: 'json',
		ContentType: 'application/json',
		data: {'postcode': postcode, 'latitude': latitude, 'longitude': longitude},
		success: function(response){
			if(response) {
				//Call to display the GP records.
				displayGP(response);
			}
		},
		error: function(e) {
			console.log(e.message);
		}
	});
}

//Function to retrieve the train station records.
function lookUpTrainStation(postcode, latitude, longitude){
	$.ajax({
		type: 'POST',
		url: '/lookUpTrainStation',
		dataType: 'json',
		ContentType: 'application/json',
		data: {'postcode': postcode, 'latitude': latitude, 'longitude': longitude},
		success: function(response){
			if(response) {
				//Call to display the train station records.
				displayTrainStation(response);
			}
		},
		error: function(e) {
			console.log(e.message);
		}
	});
}

//Function to retrieve the supermarket records.
function lookUpSupermarket(postcode, latitude, longitude){
	$.ajax({
		type: 'POST',
		url: '/lookUpSupermarket',
		dataType: 'json',
		ContentType: 'application/json',
		data: {'postcode': postcode, 'latitude': latitude, 'longitude': longitude},
		success: function(response){
			if(response) {
				//Call to display the supermarket records.
				displaySupermarket(response);
			}
		},
		error: function(e) {
			console.log(e.message);
		}
	});
}

//Function to retrieve the school records.
function lookUpSchool(postcode, latitude, longitude){
	$.ajax({
		type: 'POST',
		url: '/lookUpSchool',
		dataType: 'json',
		ContentType: 'application/json',
		data: {'postcode': postcode, 'latitude': latitude, 'longitude': longitude},
		success: function(response){
			if(response) {
				//Call to display the school records.
				displaySchool(response);
			}
		},
		error: function(e) {
			console.log(e.message);
		}
	});
}

//Function to display GP records on the map.
function displayGP(gpObject) {
	$.each(gpObject, function(index, gpObject) {
		gp_marker.push(L.marker([gpObject.latitude, gpObject.longitude], {icon: gpIcon}).addTo(map).bindPopup(gpObject.name + '<br/>' + gpObject.address + '<br/>' +
		gpObject.postcode + ' ' + '['+ gpObject.distance + ' mi]'));
	});
}

//Function to display train station records on the map.
function displayTrainStation(tObject) {
	$.each(tObject, function(index, tObject) {
		trainSt_marker.push(L.marker([tObject.latitude, tObject.longitude], {icon: trainStIcon}).addTo(map).bindPopup(tObject.name + ' ' + '['+ tObject.distance + ' mi]'));
	});
}

//Function to display supermarket records on the map.
function displaySupermarket(spObject) {
	$.each(spObject, function(index, spObject) {
		supermarket_marker.push(L.marker([spObject.latitude, spObject.longitude], {icon: supermarketIcon}).addTo(map).bindPopup(spObject.name + '<br/>' + spObject.address + '<br/>' +
		spObject.postcode + ' ' + '['+ spObject.distance + ' mi]'));
	});
}

//Function to display school records on the map.
function displaySchool(slObject) {
	$.each(slObject, function(index, slObject) {
		school_marker.push(L.marker([slObject.latitude, slObject.longitude], {icon: schoolIcon}).addTo(map).bindPopup(slObject.name + '<br/>' + slObject.address + '<br/>' +
		slObject.postcode + ' ' + '['+ slObject.distance + ' mi]'));
	});
}

//Function to show GP records on the map in reponse to the check box event.
function showGP(gp_marker) {
	for (i = 0; i < gp_marker.length; i++) {
		map.addLayer(gp_marker[i]);
	}	
}

//Function to hide GP records on the map in reponse to the check box event.
function hideGP(gp_marker) {
	for (i = 0; i < gp_marker.length; i++) { 
			map.removeLayer(gp_marker[i]);
	}
}

//Function to show train station records on the map in reponse to the check box event.
function showTrainStation(trainSt_marker) {
	for (i = 0; i < trainSt_marker.length; i++) {
		map.addLayer(trainSt_marker[i]);
	}	
}

//Function to hide train station records on the map in reponse to the check box event.
function hideTrainStation(trainSt_marker) {
	for (i = 0; i < trainSt_marker.length; i++) { 
			map.removeLayer(trainSt_marker[i]);
	}
}

//Function to show supermarket records on the map in reponse to the check box event.
function showSupermarket(supermarket_marker) {
	for (i = 0; i < supermarket_marker.length; i++) {
		map.addLayer(supermarket_marker[i]);
	}	
}

//Function to hide supermarket records on the map in reponse to the check box event.
function hideSupermarket(supermarket_marker) {
	for (i = 0; i < supermarket_marker.length; i++) { 
			map.removeLayer(supermarket_marker[i]);
	}
}

//Function to show school records on the map in reponse to the check box event.
function showSchool(school_marker) {
	for (i = 0; i < school_marker.length; i++) {
		map.addLayer(school_marker[i]);
	}	
}

//Function to hide school records on the map in reponse to the check box event.
function hideSchool(school_marker) {
	for (i = 0; i < school_marker.length; i++) { 
			map.removeLayer(school_marker[i]);
	}
}

//GP check box event handler.
$('.checkboxGP').on("click", function(event) {
	if($('.checkboxGP').is(':checked')){
		showGP(gp_marker);
		$('.checkboxGP').prop(checked, true);
	}
    else if($('.checkboxGP').is(":not(:checked)")){	
		hideGP(gp_marker);
		$('.checkboxGP').prop(checked, false);
    }
	event.preventDefault();
});

//Train station check box event handler.
$('.checkboxTrainSt').on("click", function(event) {
	if($('.checkboxTrainSt').is(':checked')){
		showTrainStation(trainSt_marker);
		$('.checkboxTrainSt').prop(checked, true);
	}
    else if($('.checkboxTrainSt').is(":not(:checked)")){
		hideTrainStation(trainSt_marker);
		$('.checkboxTrainSt').prop(checked, false);
    }
	event.preventDefault();
});

//Supermarket check box event handler.
$('.checkboxSupermarket').on("click", function(event) {
	if($('.checkboxSupermarket').is(':checked')){
		showSupermarket(supermarket_marker);
		$('.checkboxSupermarket').prop(checked, true);
	}
    else if($('.checkboxSupermarket').is(":not(:checked)")){
		hideSupermarket(supermarket_marker);
		$('.checkboxSupermarket').prop(checked, false);
    }
	event.preventDefault();
});

//School check box event handler.
$('.checkboxSchool').on("click", function(event) {
	if($('.checkboxSchool').is(':checked')){
		showSchool(school_marker);
		$('.checkboxSchool').prop(checked, true);
	}
    else if($('.checkboxSchool').is(":not(:checked)")){
		hideSchool(school_marker);
		$('.checkboxSchool').prop(checked, false);
    }
	event.preventDefault();
});

