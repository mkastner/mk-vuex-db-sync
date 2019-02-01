setInterval(() => {
  self.postMessage('message');
  console.log('worker running'); 
}, 5000);
