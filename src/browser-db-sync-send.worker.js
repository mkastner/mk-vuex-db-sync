self.postMessage('message');
console.log('worker started'); 

setInterval(() => {
  self.postMessage('message');
  console.log('worker running'); 
}, 30000);
