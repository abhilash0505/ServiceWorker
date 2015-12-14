(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Set the CACHE_NAME first
self.CACHE_NAME = 'cache';

// and require the sw-cache-all
require('../../index.js');

},{"../../index.js":2}],2:[function(require,module,exports){
// caches polyfill because it is not added to native yet!
var caches = require('./lib/serviceworker-caches');

if(typeof self.CACHE_NAME !== 'string') {
	throw new Error('Cache Name cannot be empty');
}

  	// Respond with content from fetch or cache
  self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
              debugger;
              // Cache hit - return response
              if (response) {
                console.log("from Cache");
                return response;
              }

              // IMPORTANT: Clone the request. A request is a stream and
              // can only be consumed once. Since we are consuming this
              // once by cache and once by the browser for fetch, we need
              // to clone the response
              var fetchRequest = event.request.clone();

              return fetch(fetchRequest).then(
                  function(response) {
                    // Check if we received a valid response
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                      console.log("Not from Cache");
                      return response;
                    }

                    // IMPORTANT: Clone the response. A response is a stream
                    // and because we want the browser to consume the response
                    // as well as the cache consuming the response, we need
                    // to clone it so we have 2 stream.
                    var responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                          cache.put(event.request, responseToCache);
                        });
                    console.log("Not from Cache");
                    return response;
                  }
              );
            })
    );
  });

// Now we need to clean up resources in the previous versions
// of Service Worker scripts
self.addEventListener('activate', function(event) {

	// Destroy the cache
	event.waitUntil(caches.delete(self.CACHE_NAME));

});
},{"./lib/serviceworker-caches":3}],3:[function(require,module,exports){
if (!Cache.prototype.add) {
  Cache.prototype.add = function add(request) {
    var req = new Request(request.url, { mode: 'no-cors' });
    return this.addAll([req]);
  };
}

if (!Cache.prototype.addAll) {
  Cache.prototype.addAll = function addAll(requests) {
    var cache = this;

    // Since DOMExceptions are not constructable:
    function NetworkError(message) {
      this.name = 'NetworkError';
      this.code = 19;
      this.message = message;
    }
    NetworkError.prototype = Object.create(Error.prototype);

    return Promise.resolve().then(function() {
      if (arguments.length < 1) throw new TypeError();

      // Simulate sequence<(Request or USVString)> binding:
      var sequence = [];

      requests = requests.map(function(request) {
        if (request instanceof Request) {
          return request;
        }
        else {
          return String(request); // may throw TypeError
        }
      });

      return Promise.all(
        requests.map(function(request) {
          if (typeof request === 'string') {
            request = new Request(request);
          }

          var scheme = new URL(request.url).protocol;

          if (scheme !== 'http:' && scheme !== 'https:') {
            throw new NetworkError("Invalid scheme");
          }

          return fetch(request.clone());
        })
      );
    }).then(function(responses) {
      // TODO: check that requests don't overwrite one another
      // (don't think this is possible to polyfill due to opaque responses)
      return Promise.all(
        responses.map(function(response, i) {
          return cache.put(requests[i], response);
        })
      );
    }).then(function() {
      return undefined;
    });
  };
}

if (!CacheStorage.prototype.match) {
  // This is probably vulnerable to race conditions (removing caches etc)
  CacheStorage.prototype.match = function match(request, opts) {
    var caches = this;

    return this.keys().then(function(cacheNames) {
      var match;

      return cacheNames.reduce(function(chain, cacheName) {
        return chain.then(function() {
          return match || caches.open(cacheName).then(function(cache) {
            return cache.match(request, opts);
          }).then(function(response) {
            match = response;
            return match;
          });
        });
      }, Promise.resolve());
    });
  };
}

module.exports = self.caches;
},{}]},{},[1]);
