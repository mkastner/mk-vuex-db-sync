import SendWorker from './browser-db-sync-send.worker.js';
import SyncTypeConstants from './sync-type-constants';
import collectOutgoingSyncData from './collect-outgoing-sync-data.js';

export default function OutgoingSyncer() { 

  const worker = new SendWorker();
  
  console.log('outgoing syncer this', this);
  console.log('outgoing syncer worker adding event listener');
  
  worker.addEventListener('message', () => {
    

    // const dbTable = this.db[this.resourceName]; 

    console.log('this.db          ', this.db);
    console.log('this.resourceName', this.resourceName);
    console.log('this.modelName', this.modelName);

    collectOutgoingSyncData(this.db[this.resourceName], this.modelName)
      .then((masterResult) => {
      
        return new Promise((resolve, reject) => {

          const collectedDepandants = this.dependants.map( 
            dep => {

              console.log('dep.resourceName', dep.resourceName);   
              console.log('this.db         ', this.db);   

              return collectOutgoingSyncData(
                this.db[dep.resourceName], 
                dep.modelName, dep.depKey);
            });
       


          Promise.all(collectedDepandants).then((dependants) => {
            masterResult.dependants = dependants; 
            masterResult.task = 'sync'; 
            console.log('masterResult', masterResult); 
            this.socketWrapper.send(masterResult);
            resolve(masterResult); 
          }).catch((err) => {
            console.error(err);
            reject(err);
          });
        
        }); 
      }).catch((err) => {
        console.error(err); 
      }); 

  });

  return function listen(mutation) {
    // args mutation, store
    // const depKey = `${modelName}_id`;
    // const worker = new SendWorker();

    // console.log('outgoingSyncer mutation', mutation);
    
    //console.log('Syncer listen this', this);
    //console.log('Syncer listen mutation.type', mutation.type);

    if (mutation.type === 'route/ROUTE_CHANGED') {
  
      console.log('mutation.type           :', mutation.type);
      console.log('mutation.payload        :', mutation.payload);
      console.log('mutation.payload.to     :', mutation.payload.to);
      console.log('mutation.payload.to.name:', mutation.payload.to.name);
      
      console.log('this.routeName          :', this.routeName);
      
      // sync on enter and on leaving 
      if (mutation.payload.to.name === this.routeName) {
        // first stop all syncing processes
        console.log('syncing once on entering route', mutation.payload.to.name);
        //worker.postMessage(SyncTypeConstants.Types.None); 
        worker.postMessage({
          type: SyncTypeConstants.Types.Once,
          delay: 0
        }); 
      } 
      if (mutation.payload.from.name === this.routeName) {
        // first stop all syncing processes
        console.log('syncing once on leaving route', mutation.payload.from.name);
        worker.postMessage({
          type: SyncTypeConstants.Types.Once,
          delay: 0
        }); 
      } 
    }


    const mutationType = `${this.modelName}/SET_SYNC`;
    

    if (mutation.type === mutationType) {
    
      console.log('Syncer listen mutation SET_SYNC', mutation);
    
      const sync = mutation.payload;

      if (sync.type !== 0 && !sync.type) {
        throw new Error('No syncType passed to send worker message');
      }
      if (sync.delay !== 0 && !sync.delay) {
        throw new Error('No syncDelay passed to send worker message');
      }

      if (sync.type && sync.type !== SyncTypeConstants.Types.None) { // i.e. if truthy
        
        worker.postMessage(sync); 
      }
    }


  };
}
