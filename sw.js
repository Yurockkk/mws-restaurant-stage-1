importScripts('/js/idb.js');
importScripts('/js/reviewStore.js');

var staticCacheName = 'my-restaurant-v1';
var contentImgsCache = 'my-restaurant-imgs';
var allCaches = [
	staticCacheName,
	contentImgsCache
];
//'install' event get triggered when the new SW is in waiting status rredfd
self.addEventListener('install', function(event){
	var urlToCache = [
		'/',
		'css/styles.css',
		'config.js',
		'js/dbhelper.js',
		'js/main.js',
		'js/idb.js',
		'js/restaurant_info.js',
		'/sw.js',
		'/index.html',
		'/restaurant.html'
	];
	event.waitUntil(
		caches.open(staticCacheName).then((cache) => {
			return cache.addAll(urlToCache);
		}).then(() => {
			return self.skipWaiting();
		})
	);
});

//'activate' event get triggered when the new SW is activated status
self.addEventListener('activate', function(event){
	event.waitUntil(
		//TODO: since the new SW is activating, delete the old caches
		caches.keys().then((cacheNames) => {
			//wrap things in Promise.all() to make sure we wait untill the completion of ALL the following pormises
			return Promise.all(
				cacheNames.filter((cacheName) => {
					return cacheName.startsWith('my') && cacheName != staticCacheName;
				}).map((oldCacheName) => {
					console.log(`oldCacheName: ${oldCacheName}`);
					return caches.delete(oldCacheName);
				})
			);
		})
	);
});

self.addEventListener('onactivate', function(event){
	console.log('in onactivate');
});


self.addEventListener('fetch', function(event) {

	var requestUrl = new URL(event.request.url);
	//console.log(`In fetch!! requestUrl: ${requestUrl}, reqest.origin: ${requestUrl.origin}`);
	if(requestUrl.origin === location.origin){
		if(requestUrl.pathname.startsWith('/img/')){
			//console.log(`we got image request: ${requestUrl}`);
			event.respondWith(serveImage(event.request));
			return;
		}
		if(requestUrl.pathname.startsWith('/sw')){
			//console.log(`we got sw request: ${requestUrl}`);
			event.respondWith(
				caches.match(event.request).then((response) => {
					return response || fetch(event.request);
				})
			);
			return;
		}
		if(requestUrl.pathname.includes('restaurant.html')){
			//console.log(`we got detail page request: ${requestUrl}`);
			event.respondWith(serveDetailPage(event.request));
			return;
		}		
	}else if(requestUrl.origin === 'https://maps.googleapis.com'){
		//console.log(`we got google map request: ${requestUrl}`);
		event.respondWith(serveGoogleMap(event.request));
		return;
	}

	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});

serveImage = (request) => {
	//console.log(`in serveImage, request: ${request}`);
	var storageUrl = request.url.replace(/_small.webp$/, '');
	console.log(`storageUrl: ${storageUrl}`);

	return caches.open(contentImgsCache).then(function(cache) {
		return cache.match(storageUrl).then(function(response) {
		  if (response) return response;
		  //console.log(`we don't have cached image for ${storageUrl}`);
		  return fetch(request).then(function(networkResponse) {
		  	//console.log(`fetch the image and put it in the cache for ${storageUrl}`);
		    cache.put(storageUrl, networkResponse.clone());
		    return networkResponse;
		  });
		});
	});
}

serveDetailPage = (request) => {
	//console.log(`in serveDetailPage, request: ${request}`);
	var storageUrl = request.url;
	//console.log(`storageUrl: ${storageUrl}`);

	return caches.open(staticCacheName).then(function(cache) {
		return cache.match(storageUrl).then(function(response) {
		  if (response) return response;
		  //console.log(`we don't have cached detail page for ${storageUrl}`);
		  return fetch(request).then(function(networkResponse) {
		  	//console.log(`fetch the detail page and put it in the cache for ${storageUrl}`);
		    cache.put(storageUrl, networkResponse.clone());
		    return networkResponse;
		  });
		});
	});
}

serveGoogleMap = (request) => {
	//console.log(`in serveGoogleMap, request: ${request}`);
	var storageUrl = request.url;
	//console.log(`storageUrl: ${storageUrl}`);

	return caches.open(staticCacheName).then(function(cache) {
		return cache.match(storageUrl).then(function(response) {
		  if (response) return response;
		  //console.log(`we don't have cached GoogleMap for ${storageUrl}`);
		  return fetch(request).then(function(networkResponse) {
		  	//console.log(`fetch the GoogleMap and put it in the cache for ${storageUrl}`);
		    cache.put(storageUrl, networkResponse.clone());
		    return networkResponse;
		  });
		});
	});
}

self.addEventListener('message', function(event){
	console.log('got the message from page!');
	console.log(event);
	if (event.data.action === 'skipWaiting') {
		console.log('we got the action skipWaiting!');
		self.skipWaiting();
	}
});

self.addEventListener('sync', (event) => {
	console.log('in sync:');
	console.log(event.tag);
	if(event.tag == 'syncReview'){
		console.log('event.tag == syncReview');
		event.waitUntil(
		    reviewStore.outbox('reviews').then( outbox => {
		      return outbox.getAll();
		    }).then( cachedReviews => {
		      return Promise.all(cachedReviews.map(function(cachedReview) {
		        return fetch("http://localhost:1337/reviews/", {
		          method: 'POST',
		          body: JSON.stringify(cachedReview),
		          headers: {
		            'Content-Type': 'application/json'
		          }
		        }).then( response => {
		          return response.json();
		        }).then( data => {
		        	  //if id exist, that means the review was stored to the BE db
			          if (data.id) {
			          	console.log('id exists, delete it in idb');
			            return reviewStore.outbox('reviews','readwrite').then(function(outbox) {
			              return outbox.delete(data.createdAt);
			            });
			          }
		        })
		      }))
		    }).catch( err => {
		      console.log(err);
		    })
		);
	}
})

