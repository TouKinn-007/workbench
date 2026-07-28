const CACHE='workbench-v1';
const ASSETS=['./','./index.html','./daily-workbench.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET') return;
  var url=new URL(e.request.url);
  if(url.origin!==location.origin) return; // 非同源（如 GitHub API）不拦截，走正常网络
  e.respondWith(
    fetch(e.request).then(function(resp){
      var cp=resp.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, cp); });
      return resp;
    }).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match('./index.html') || caches.match('./daily-workbench.html'); });
    })
  );
});
