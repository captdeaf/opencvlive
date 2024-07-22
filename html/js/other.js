// other.js
//
/////////////////////////////////////
//
// Miscellaneous calls that don't really fit elsewhere.
//
/////////////////////////////////////

// Update the cache size in the UI, this expects an integer
function updateCacheSize(count) {
  EL.cacheCount.innerText = count;
}

addTrigger('clearCache', () => {
  easyFetch('/cv/clearCache', {method: 'POST'}, {
    success: (js) => {
      updateCacheSize(js.cachesize);
    }
  });
});
