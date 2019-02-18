var staticCacheName = 'my-restaurant-v2';
var contentImgsCache = 'my-restaurant-imgs';
var allCaches = [
	staticCacheName,
	contentImgsCache
];
//'install' event get triggered when the new SW is in waiting status
self.addEventListener('install', function(event){
	var urlToCache = [
		'/',
		'css/styles.css',
		'config.js',
		'js/dbhelper.js',
		'js/main.js',
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
	
	// var requestUrl = new URL(event.request.url);
	// if(requestUrl.origin === location.origin){

		
	// }

	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});

self.addEventListener('message', function(event){
	console.log('got the message from page!');
	console.log(event);
	if (event.data.action === 'skipWaiting') {
		console.log('we got the action skipWaiting!');
		self.skipWaiting();
	}
});
