// other.js
//
/////////////////////////////////////
//
// Miscellaneous calls that don't really fit elsewhere.
//
/////////////////////////////////////

addTrigger('clearCache', () => {
  easyFetch('/cv/clearCache', {method: 'POST'}, {
    success: (js) => {
      get('#cachesize').innerText = js.cachesize;
    }
  });
});
