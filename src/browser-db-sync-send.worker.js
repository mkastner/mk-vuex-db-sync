import SyncTypeConstants from './sync-type-constants';

let interval;

self.addEventListener('message', (ev) => {

  // command start/stop
  let syncType = ev.data.type;
  let syncDelay = ev.data.delay * 1000;

  console.log('outgoing worker syncType ', syncType);
  console.log('outgoing worker syncDelay', syncDelay);
  
  function fireMessage() {
    console.log('worker running'); 
    self.postMessage('message');
  }
  
  if (syncType === SyncTypeConstants.Types.Start) {
    // imediately fire first message
    // and start running interval
    console.log('outgoing worker initial message'); 
    self.postMessage('message');
    // fire every five minutes
    interval = setInterval(fireMessage, syncDelay);
    console.log('outgoing worker created interval', interval);
  } else if (syncType === SyncTypeConstants.Types.Once) {
    self.postMessage('message');
    console.log('outgoign worker send once', interval);
  } else if (syncType === SyncTypeConstants.Types.None || 
    syncType === SyncTypeConstants.Types.Stop) {
    console.log('outgoing worker stop sending message for interval', interval); 
    clearInterval(interval);
  }

});
