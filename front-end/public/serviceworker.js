const CACHE = "content-v1"
const OFFLINE = "/offline.html"

const AUTO_CACHE = [OFFLINE, "/"] // add the assets here to cache first

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(AUTO_CACHE))
			.then(self.skipWaiting())
	)
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return cacheNames.filter((cacheName) => CACHE !== cacheName)
			})
			.then((unusedCaches) => {
				console.log("DESTROYING CACHE", unusedCaches.join(","))
				return Promise.all(
					unusedCaches.map((unusedCache) => {
						return caches.delete(unusedCache)
					})
				)
			})
			.then(() => self.clients.claim())
	)
})

self.addEventListener("fetch", (event) => {
	if (
		!event.request.url.startsWith(self.location.origin) ||
		event.request.method !== "GET"
	) {
		return void event.respondWith(fetch(event.request))
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse
			}

			if (navigator.onLine) {
				return fetch(event.request).then((response) => {
                    caches.open(CACHE).then((cache) => {
                        cache.put(event.request, response)
                    })
					return response.clone()
				})
			}
			return caches.open(CACHE).then((cache) => {
				const offlineRequest = new Request(OFFLINE)
				return cache.match(offlineRequest)
			})
		})
	)
})