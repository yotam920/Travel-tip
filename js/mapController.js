import { mapService } from './services/mapService.js';
import { locationService } from './services/locationService.js'

var gMap;
var gMarkers = [];

window.onload = () => {
    initMap()
        .then(() => {
            addMarker({ lat: 32.0749831, lng: 34.9120554 });
        })
        .catch(console.log('INIT MAP ERROR'));

    getPosition()
        .then(pos => {
            console.log('User position is:', pos.coords);
        })
        .catch(err => {
            console.log('err!!!', err);
        })
}

//return user back to
document.querySelector('.my-location').addEventListener('click', (ev) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                panTo(pos);
                addMarker(pos);
            });
    }
    getWheather();
});


document.querySelector('.location-copy').addEventListener('click', () => {
    let pos = {
        lat: gMarkers[0].getPosition().lat(),
        lng: gMarkers[0].getPosition().lng()
    }
    mapService.getLocationName(pos)
        .then((name) => {
            pos.name = name;
            locationService.saveLocation(pos)
                .then(locations => renderLocations(locations))
        })
})

//go to location by name
document.querySelector('.go-to').addEventListener('click', () => {
    let searchTerm = document.querySelector('.location-input').value;
    mapService.getLocationCoord(searchTerm, )
        .then(result => {
            const latLng = {
                lat: result[0].geometry.location.lat(),
                lng: result[0].geometry.location.lng()
            }
            addMarker(latLng)
            panTo(latLng);
            mapService.getLocationName(latLng)
                .then((name) => {
                    latLng.name = name;
                    locationService.saveLocation(latLng)
                        .then(locations => renderLocations(locations))
                })
        })
        .catch(error => console.error(error))
})


function renderLocations(locations) {
    document.querySelector('.location-table').innerHTML = '';
    let strHTMLs = locations.map(loc =>
        `<span>${loc.name}</span>
         <button class="go-btn" data-id="${loc.id}">Go</button>
         <button class="delete-btn" data-id="${loc.id}">Delete</button>`
    );
    document.querySelector('.location-table').innerHTML = strHTMLs.join('');
    document.querySelectorAll('.go-btn').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            locationService.findLocByID(ev.target.dataset.id)
                .then((location) => panTo(location))
        })
    })
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            locationService.deleteLocation(ev.target.dataset.id)
                .then(locations => renderLocations(locations))
        })
    })
}

function initMap(lat = 32.0749831, lng = 34.9120554) {
    return _connectGoogleApi()
        .then(() => {
            gMap = new google.maps.Map(
                document.querySelector('#map'), {
                    center: { lat, lng },
                    zoom: 15
                })
            gMap.addListener('click', (mapsMouseEvent) => {
                var newPos = mapsMouseEvent.latLng.toJSON();
                deleteMarkers();
                addMarker(newPos);
            })
        })
}
// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (let i = 0; i < gMarkers.length; i++) {
        gMarkers[i].setMap(map);
    }
}
// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}
// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(map);
}
// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    gMarkers = [];
}

function addMarker(loc) {
    const newMarker = new google.maps.Marker({
        position: loc,
        map: gMap,
        title: 'Hello World!'
    });
    gMarkers.push(newMarker);
    getWheather();
    // console.log('addMarker:', google.maps.MapType);
    return newMarker
}

function panTo(loc) {
    var laLatLng = new google.maps.LatLng(loc.lat, loc.lng);
    gMap.panTo(laLatLng);
}

function getPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })
}


function _connectGoogleApi() {
    if (window.google) return Promise.resolve()
    const API_KEY = 'AIzaSyC1IyV2W9PZTl0fv2-1SUzT6Kz6X9LC1do'; //you can enter your API Key
    var elGoogleApi = document.createElement('script');
    elGoogleApi.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    elGoogleApi.async = true;
    document.body.append(elGoogleApi);

    return new Promise((resolve, reject) => {
        elGoogleApi.onload = resolve;
        elGoogleApi.onerror = () => reject('Google script failed to load')
    })
}

function _connectWheatherApi(lat = 32.0749831, lon = 34.9120554) {
    const API_key = 'd5b56bcdb355950cf8bbe7c58955ddf8';
    return axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_key}`)
        .then(res => res);
}


/**return nname_country, weahter and humidity for lat&long**/
function getWheather() {
    let lat = gMarkers[0].getPosition().lat();
    let lng = gMarkers[0].getPosition().lng();
    _connectWheatherApi(lat, lng)
        .then(ans => {
            let weahter = ans.data.weather[0].description;
            let humidity = ans.data.main.humidity;
            let country = ans.data.sys.country;
            renderWheather(weahter, humidity, country);
        })
        .catch(err => {
            console.log('Error:', err)
        })
}

function renderWheather(weahter, humidity, country) {
    document.querySelector('.weather').innerHTML = `<h2>Weather today: ${country} </h2> <h3>${weahter}</h3> <h3>humidity:${humidity}%</h3>`;
}