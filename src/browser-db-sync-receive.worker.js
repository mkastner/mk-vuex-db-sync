self.addEventListener('message', (ev) => {

  console.log('receive worker payload ev.data', ev.data);
  // the data object is there however console.log does not print it out 
  self.postMessage(ev.data);
});
