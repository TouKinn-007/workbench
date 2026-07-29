const CACHE='workbench-v2';
const ASSETS=['./','./manifest.json','./icon-192.png','./icon-512.png'];
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
  // HTML 文档（index.html / 根路径）必须每次向网络取最新，绝不走缓存，
  // 否则 service worker 会把旧 index.html（含旧同步逻辑）一直困在手机端。
  var isHtml = e.request.mode==='navigate' || /\/(index\.html|daily-workbench\.html)?$/.test(url.pathname);
  if(isHtml){
    e.respondWith(
      fetch(e.request, {cache:'reload'}).then(function(resp){ return resp; })
        .catch(function(){ return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); }); })
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(resp){
      var cp=resp.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, cp); });
      return resp;
    }).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match('./daily-workbench.html'); });
    })
  );
});
