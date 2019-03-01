import SyncTypeConstants from './sync-type-constants';

let interval;

self.addEventListener('message', (ev) => {

  // command start/stop
  let syncType = ev.data;

  console.log('outgoing worker syncType', syncType);
  
  function fireMessage() {
    console.log('worker running'); 
    self.postMessage('message');
  }
  
  if (syncType === SyncTypeConstants.Types.Start) {
    // imediately fire first message
    // and start running interval
    console.log('worker initial message'); 
    self.postMessage('message');
    // fire every five minutes
    interval = setInterval(fireMessage, 60000 * 5);
    console.log('created interval', interval);
  } else if (syncType === SyncTypeConstants.Types.Once) {
    self.postMessage('message');
    console.log('worker send once', interval);
  } else if (syncType === SyncTypeConstants.Types.None || 
    syncType === SyncTypeConstants.Types.Stop) {
    console.log('worker stop sending message for interval', interval); 
    clearInterval(interval);
  }

});
