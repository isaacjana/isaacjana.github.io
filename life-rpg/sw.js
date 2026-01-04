self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("life-rpg").then(cache =>
      cache.addAll(["/", "/index.html"])
    )
  );
});

