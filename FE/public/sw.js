/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-e43f5367'], (function (workbox) { 'use strict';

  importScripts("fallback-development.js");
  self.skipWaiting();
  workbox.clientsClaim();
  
  // Service Worker 설치 시 favicon.ico 캐시
  self.addEventListener('install', async (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
      caches.open('favicon-cache').then(async (cache) => {
        try {
          const response = await fetch('/favicon.ico');
          if (response.ok) {
            await cache.put('/favicon.ico', response);
            console.log('favicon.ico cached successfully');
          }
        } catch (error) {
          console.log('Failed to cache favicon.ico:', error);
        }
      })
    );
  });
  
  // favicon.ico를 미리 캐시
  workbox.precacheAndRoute([
    { url: '/favicon.ico', revision: '1' }
  ]);

  workbox.registerRoute("/", new workbox.NetworkFirst({
    "cacheName": "start-url",
    plugins: [{
      cacheWillUpdate: async ({
        request,
        response,
        event,
        state
      }) => {
        if (response && response.type === 'opaqueredirect') {
          return new Response(response.body, {
            status: 200,
            statusText: 'OK',
            headers: response.headers
          });
        }
        return response;
      }
    }, {
      handlerDidError: async ({
        request
      }) => self.fallback(request)
    }]
  }), 'GET');
  // favicon.ico는 캐시에서 먼저 찾고, 없으면 네트워크로 요청
  workbox.registerRoute('/favicon.ico', new workbox.CacheFirst({
    "cacheName": "favicon-cache",
    plugins: [{
      handlerDidError: async ({
        request
      }) => self.fallback(request)
    }]
  }), 'GET');

  // 정적 자산들은 캐시 우선 전략 사용
  workbox.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/, new workbox.CacheFirst({
    "cacheName": "static-assets",
    plugins: [{
      handlerDidError: async ({
        request
      }) => self.fallback(request)
    }]
  }), 'GET');

  // 나머지 요청들은 네트워크 우선 전략 사용
  workbox.registerRoute(/.*/i, new workbox.NetworkFirst({
    "cacheName": "dev",
    plugins: [{
      handlerDidError: async ({
        request
      }) => self.fallback(request)
    }]
  }), 'GET');

}));
