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
		// 'img/1.jpg',
		// 'img/2.jpg',
		// 'img/3.jpg',
		// 'img/4.jpg',
		// 'img/5.jpg',
		// 'img/6.jpg',
		// 'img/7.jpg',
		// 'img/8.jpg',
		// 'img/9.jpg',
		// 'img/10.jpg'
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
	// event.respondWith(
	// 	fetch(event.request).then((response) => {
	// 		if(response.status === 404){
	// 			return fetch('img/dr-evil.gif');
	// 		}
	// 		console.log(`reponse: ${response}`);
	// 		return response;
	// 	}).catch((err) => {
	// 		console.log(`error!! ${err}`);
	// 		return new response("something went wrong!")
	// 	})
	// );
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
	var storageUrl = request.url.replace(/_small.jpg$/, '');
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
	if(event.tag == 'taggg'){
		console.log('event.tag == taggg!!');
		event.waitUntil(doSomeStuff());
	}
})

doSomeStuff = () => {
	console.log('do some stuff gets called!');
	console.log(idb);
}
