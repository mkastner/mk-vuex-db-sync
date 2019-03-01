import ReceiveWorker from './browser-db-sync-receive.worker.js';
import ChangeTypeConstants from './change-type-constants';

function resetChangeType(items) {
  for (let i = 0, l = items.length; i < l; i++) {
    items[i].change_type = ChangeTypeConstants.ChangeTypeNone;  
  } 
}

function saveItems(data, store, db) {

  const {
    // name e.g. persons
    name,
    deletedServerItems, 
    createdServerItems, 
    updatedServerItems, 
    missingServerItems,
    serverDependants } = data; 

  console.log('db  ', db);
  console.log('data name', name);

  const dbTable = db[name];

  let promise = dbTable
    .bulkDelete(deletedServerItems.map(item => item.id))
    .then(() => {
      console.log('incoming-syncer bulkPut');
      // let keys = updatedServerItems.map(item => item.id);
      resetChangeType(updatedServerItems);
      return dbTable.bulkPut(updatedServerItems);
    })
    .then(() => {
      // created: delete items with uuid 
      let keys = createdServerItems.map( item => item.priorId );
      
      console.log('incoming-syncer buldDelete priorIds:', keys);
     
      console.log('keys', keys);
      
      return dbTable.bulkDelete(keys);
    })
    .then(() => {

      const items = createdServerItems.map( itemWrapper => itemWrapper.item );
      //const itemIds = createdServerItems.map( itemWrapper => itemWrapper.priorId );
      resetChangeType(items);
      
      console.log('before bulkAdd createdServerItems name:', name);
      console.log('before bulkAdd createdServerItems     :', items.length);

      return dbTable.bulkAdd(createdServerItems);
    }) 
    .then(() => {

      resetChangeType(missingServerItems);

      console.log('before bulkAdd missingServerItems name:', name);
      console.log('before bulkAdd missingServerItems     :', 
        missingServerItems.map(item => item.id));

      return new Promise((resolve, reject) => {
        dbTable.bulkAdd(missingServerItems)
          .then(result => {
            console.log('bulkAdd result', result); 
            resolve(result);
          }).catch(err => reject(err));
      });
    }); 

  if (!serverDependants || !serverDependants.length) {
    return promise; 
  }

  return Promise.all( 
    serverDependants.map( dep => saveItems(dep, store, db) )
  ); 

}

export default function incomingSyncListener(db, store, socketWrapper) {
  
  let worker = new ReceiveWorker();

  //this.socketWrapper.socket.addEventListener('message', (message) => {
  //  console.log('**** socket message', message); 
  //});
  socketWrapper.receive('sync', (data) => {
    console.log('received data posting to worker', data);
    // check for proper resource done in
    // browser socket wrapper in event listener 'message'
    worker.postMessage(data);
  });
  worker.addEventListener('message', (ev) => {
    console.log('worker ev     ', ev);
    console.log('worker ev.data', ev.data);
    saveItems(ev.data, store, db)
      .then(() => {
        console.log('all items saved'); 
      })
      .catch((err) => {
        console.error(err); 
      });
  });

}

