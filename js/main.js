let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  console.log(`DOMContentLoaded()`);
  // Add a service worker to the project
  registerServiceWorker();
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);

        if(!navigator.serviceWorker.controller){
          return;
        }
        if(registration.waiting){
          //there's an update ready!
          console.log("there's an update ready!");
          navigator.serviceWorker.controller.postMessage({action: 'skipWaiting'});
        }
        if(registration.installing){
          //there's an update in progress
          console.log("there's an update progress!");
          registration.addEventListener('statechange', function(){
            if(this.state == 'installed'){
              //there's an update ready!
              console.log("there's an update ready!");
              navigator.serviceWorker.controller.postMessage({action: 'skipWaiting'});
            }
          })
        }

        registration.addEventListener('updatefound', function() {
          console.log("In updatefound event");
          registration.installing.addEventListener('statechange', function(){
            if(this.state == 'installed'){
              //there's an update ready!
              console.log("there's an update ready!");
              navigator.serviceWorker.controller.postMessage({action: 'skipWaiting'});
              // window.location.reload();
            }
          })
        });

      }, function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
      var refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        console.log('in controllerchange!');
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    });
  }
}
/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  console.log(`initMap()`);
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  
  // google.maps.event.addListener(self.map, 'tilesloaded', () => {
  //   console.log('in tilesloaded');
  //   //var map = document.getElementById('map');
  //   //console.log(map);
  //   document.querySelector('iframe').setAttribute('tabindex','-1');
  //   console.log(map.querySelectorAll('div'));
  //   [].slice.apply(self.map.querySelectorAll('div')).forEach(function(item) {
  //         console.log(item);
  //         item.setAttribute('tabindex','-1');
  //     });
  //   [].slice.apply(self.map.querySelectorAll('button')).forEach(function(item) {
  //         console.log(item);
  //         item.setAttribute('tabindex','-1');
  //     });
  //   [].slice.apply(self.map.querySelectorAll('a')).forEach(function(item) {
  //         console.log(item);
  //         item.setAttribute('tabindex','-1');
  //     });
  //   [].slice.apply(self.map.querySelectorAll('div.gm-style')).forEach(function(item) {
  //         console.log(item);
  //         item.setAttribute('tabindex','-1');
  //     });
    
  // });
  updateRestaurants();

}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSourceSetForRestaureant(restaurant);
  image.alt = `picture of the restaurant ${restaurant.name}`;
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.title = `view details about ${restaurant.name}`;
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
