/**
 * Common database helper functions.
 */
class DBHelper {

  static get dbPromise() {
    return this.constructor.dbPromise;
  }

  static set dbPromise(newValue) {
    this.constructor.dbPromise = newValue;
  }

  static get isOpen() {
    return this.constructor.isOpen;
  }

  static set isOpen(newValue) {
    this.constructor.isOpen = newValue;
  }
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    console.log(DBHelper.dbPromise);
    // if(!DBHelper.isOpen){
    //   DBHelper.dbPromise = DBHelper.openDatabase();
    //   DBHelper.isOpen = true;
    // }
    reviewStore.outbox('restaurants').then(outbox => {
        return outbox.getAll();
    }).then(allCachedRestaurants => {
      console.log(`------allCachedRestaurants`);
      console.log(allCachedRestaurants);
      if(allCachedRestaurants.length > 0){
        callback(null,allCachedRestaurants);
      }else{
        fetch(DBHelper.DATABASE_URL).then((response) => {
          if(response.ok) return response.json();
        }).then((restaurants) => {
          //TODO: caches restaurants data and save them into idb before retuning the result
          console.log(`------restaurants`);
          console.log(restaurants);
          restaurants.forEach((restaurant) => {
            reviewStore.outbox('restaurants','readwrite').then(restaurantStore => {
              restaurantStore.put(restaurant);
            })
          });
          callback(null, restaurants);
        });
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return restaurant.photograph ? (`/img/${restaurant.photograph}.jpg`) : (`http://localhost:8000/img/dr-evil.gif`);
  }

  /**
  * Setup proper image srcset
  */
  static imageSourceSetForRestaureant(restaurant) {
    var imgName = restaurant.photograph;
    //console.log(`imgName: ${imgName}`);
    var imgSrcSet = imgName ? `/img/${imgName}_small.jpg 2x, /img/${imgName}.jpg 3x` : `http://localhost:8000/img/dr-evil.gif`;
    //console.log(`imgSrcSet: ${imgSrcSet}`);
    return imgSrcSet;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static async openDatabase() {
    
    return await idb.openDb('my-restaurant', 1, (upgradeDb) => {
      let restaurantStore = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });

      //add review store
      let reviewStore = upgradeDb.createObjectStore('reviews',{autoIncrement: true });
    });
  }

  static fetchReviewsByRestaurantId(id, callback) {
    const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
    fetch(url).then((response) => {
      if(response.ok) return response.json();
    }).then((reviews) => {
      console.log(reviews);
      callback(null, reviews);
    }).catch((error) => {
      console.log(error);
    })
  };

  static saveReviewToIdb(review){
    console.log('in saveReviewToIdb');

    reviewStore.outbox('reviews','readwrite').then(store => {
      return store.put(review);
    }).then(() => {
      if('serviceWorker' in navigator){
        //try to trigger sync event
        navigator.serviceWorker.ready.then(function(swRegistration) {
          console.log('[ServiceWorker] is ready - sync is registered');
          return swRegistration.sync.register('syncReview');
        });
      }
    }).catch((error) => {
      console.log('error occurs in saveReviewToIdb:');
      console.log(error);
    });
  }
}

