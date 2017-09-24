
function http( url, callback ) {

	var http  = new XMLHttpRequest();


	http.onreadystatechange = function() {

	    if( this.readyState == 4 && this.status == 200 ) {

			callback( this.responseText );
		}
	};

	http.open( 'GET', url, true );

	http.send();
}




function init() {

	http( 'restaurants.json', function( data ) {

		var res = JSON.parse( data );

		var map = new google.maps.Map( document.getElementById('map'), {
			zoom: 15,
			center: new google.maps.LatLng( res[0]['lat'], res[0]['lng'] ),
			mapTypeId: google.maps.MapTypeId.terrain
		});

		load( map, res );
	});

}





function load( map, resto ) {


	var item, marker, items = '';


	var infobox = new google.maps.InfoWindow();
	var circle  = new google.maps.Circle({
		map: 			map,
		strokeWeight: 	1,
		fillOpacity: 	0.1,
		strokeOpacity: 	0.5,
		radius: 		1000,
		editable: 		true,
		draggable: 		true,
		fillColor: 		'#ff0000',
		strokeColor: 	'#ff0000',
		center: 		new google.maps.LatLng( resto[0]['lat'], resto[0]['lng'] ),
	});




	for( i = 0; i < resto.length; i++ ) {

		var position = [resto[i]['lat'], resto[i]['lng']];

		var markerPosition = new google.maps.LatLng( position[0], position[1] );


		marker = new google.maps.Marker({
			map: map,
			icon: new google.maps.MarkerImage( 'assets/images/icon.png', new google.maps.Size(32, 32) ),
			position: markerPosition
		});


		item = '<h3><i class="color"></i>' + resto[i]['name'] + '</h3>'
				+'<div class="meta">'
				+'<i class="rate star-'+ resto[i]['star'] +'"></i>'
				+'<p><b>Visits: </b> '+ resto[i]['visits'] +'/day</p>'
				+'<p><b>Patrons: </b> '+ resto[i]['patrons'] +'</p>'
				+'<p><b>Revenue: </b> PHP '+ resto[i]['revenue'].toLocaleString('en') +'/mo</p>'
				+'<p><b>Specialty: </b> '+ resto[i]['specialty'] +'</p>'
				+'</div>';

		items += '<div class="item type-'+ resto[i]['type'] +'">'+ item +'</div>';





		google.maps.event.addListener( marker, 'click', ( function( marker, infobox, item, position, items ) {


			return function() {

				var tip = '<div class="tip">'+ item + '<button id="getlocation">Get Direction</button></div>';


				infobox.setContent( tip );
				infobox.open( map, marker );

				getDirection( position, items );
			};


		})( marker, infobox, item, position, items ));
	}


	loadPanel( map, items );

	moveCircle( circle, markerPosition );
}








function loadPanel( map, items ) {


	http( 'panel.html', function( data ) {

		var parser = new DOMParser();
		var panel  = parser.parseFromString( data, 'text/html' ).body.firstChild;


		google.maps.event.addListenerOnce( map, 'idle', function() {

		    panel.children[1].innerHTML = items;

		    panel.style.display = 'block';

			map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push( panel );
		});



		for( input = 0; input < 6; input++ ) {


			panel.firstElementChild.lastElementChild[input].onchange = function() {


				var list = document.getElementsByClassName( 'type-' + this.id );


				for( i = 0; i < list.length; i++ ) {

					if( this.checked ) {

						list[i].style.display = 'block';

					} else {

						list[i].style.display = 'none';
					}
				}

			};
		}

	});
	

}





function moveCircle( circle, markerPosition ) {


	google.maps.event.addListener( circle, 'center_changed', (function() {


		return function() {

			var diff = google.maps.geometry.spherical.computeDistanceBetween( this.getCenter(), markerPosition );


			if( this.getBounds().contains( markerPosition ) && diff <= this.getRadius() ) {

			}
		};

	})); 
}





function getDirection( pos ) {


	document.getElementById('getlocation').onclick = function() {


	    if( navigator.geolocation ) {

	        navigator.geolocation.getCurrentPosition( function( position ) {

				var directionsDisplay = new google.maps.DirectionsRenderer;
				var directionsService = new google.maps.DirectionsService;


				var mapdirection = new google.maps.Map( document.getElementById('map'), { 
					zoom: 10, 
					center: {lat: position.coords.latitude, lng: position.coords.longitude },
					mapTypeId: google.maps.MapTypeId.terrain 
				});


				directionsDisplay.setMap( mapdirection );


	        	directionsService.route({

	        		destination: { lat: pos[0], lng: pos[1] },
	        		travelMode: google.maps.DirectionsTravelMode.DRIVING,
					origin: { lat: position.coords.latitude, lng: position.coords.longitude }

				}, function( response, status ) {

					if( status == 'OK') {


						http( 'restaurants.json', function( data ) {

							load( mapdirection, JSON.parse( data ) );
						});

						directionsDisplay.setDirections( response );

					} else {

						window.alert('Directions request failed due to ' + status );
					}

				});


	        });

	    } else { 

	        window.alert('Geolocation is not supported by this browser.');
	    }

	}
}