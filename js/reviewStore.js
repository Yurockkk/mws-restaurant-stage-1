var reviewStore = {
  db: null,

  init: function() {
    if (reviewStore.db) { return Promise.resolve(reviewStore.db); }
    return idb.openDb('my-restaurant', 1, function(upgradeDb) {
      upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      upgradeDb.createObjectStore('reviews', { keyPath : 'createdAt'});
    }).then(function(db) {
      return reviewStore.db = db;
    });
  },

  outbox: function(storeName, mode = null) {
    return reviewStore.init().then(function(db) {
      if(mode == null) return db.transaction(storeName).objectStore(storeName);
      return db.transaction(storeName, mode).objectStore(storeName);
    })
  }
}