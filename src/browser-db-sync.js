import SendWorker from './browser-db-sync-send.worker.js';
import ReceiveWorker from './browser-db-sync-receive.worker.js';
import ChangeTypeConstants from './change-type-constants';
// import DateTimeConstants from './date-time-constants';

function receiveSync(dbTable, socketWrapper, moduleName, done) {
 
  console.log('starting receive sync with socket', socketWrapper.socket);

  let worker = new ReceiveWorker();
  worker.addEventListener('message', (ev) => {
    console.log('worker ev     ', ev);
    console.log('worker ev.data', ev.data);
    let payload = ev.data;
    const {
      deletedServerItems, 
      createdServerItems, 
      updatedServerItems, 
      missingItems } = payload.data; 

    dbTable
      .bulkDelete(deletedServerItems.map(item => item.id))
      .then(() => {
        // let keys = updatedServerItems.map(item => item.id);
        dbTable.bulkPut(updatedServerItems); 
      })
      .then(() => {
        // created: delete items with uuid 
        let keys  = createdServerItems.map( item => item.priorId );
        return dbTable.bulkDelete(keys);
      })
      .then(() => {

        let items = createdServerItems.map( item => item.createdItem );
        let itemIds = createdServerItems.map( item => item.createdItem.id );

        console.log('before  bulkAdd items  :', items);
        console.log('itemIds bulkAdd itemIds:', itemIds);

        return dbTable.bulkAdd(items);
      }) 
      .then(() => {

        let itemIds = missingItems.map( item => item.id );

        console.log('before  bulkAdd missingItems:', missingItems);
        console.log('itemIds bulkAdd itemIds     :', itemIds);

        return dbTable.bulkAdd(missingItems);
      
      })
      .then(Promise.resolve(done())) 
      .catch((err) => {
        console.error(err); 
      });

  });
  console.log('socket', socketWrapper);
  socketWrapper.socket.addEventListener('message', (socketPayload) => {
    
    //let data = JSON.parse(payload.data.data); 

    console.log('socket onmessage socketPayload', socketPayload); 
    console.log('socket onmessage ************ stringified data', socketPayload.data); 
    //console.log('socket onmessage ************ stringified payload', payload); 
    let payload  = JSON.parse(socketPayload.data);
    console.log('socket onmessage ************ parsed payload data', payload); 

    worker.postMessage(payload);
  });
}

function startSync(dbTable, socketWrapper, moduleName, done) {

  let worker = new SendWorker();

  console.log('startSync worker', worker);
  
  worker.addEventListener('message', (message) => {
    console.log('listener message', message);

    console.log('dbTable.count()', dbTable.count().then());

    dbTable.count()
      .then(total => {
        return {total};
      }).then(result => {
        return new Promise((resolve, reject) => {
          dbTable.filter(() => true)
            .keys(['id'])
            .then((ids) => {

              console.log('ids', ids);

              result.clientIds = ids;
              resolve(result); 
            }).catch((err) => {
              console.error(err);
              reject(err);
            });
        }); 
      }).then((result) => {
        return new Promise((resolve, reject) => {
          dbTable.where('change_type').anyOf(
            ChangeTypeConstants.ChangeTypeCreated,
            ChangeTypeConstants.ChangeTypeUpdated,
            ChangeTypeConstants.ChangeTypeDeleted)
            .toArray()
            .then((res) => {
              result.modified = res;
              resolve(result);
            })
            .catch((err) => {
              console.error(err);
              reject(err);
            });
        });
      }).then((result) => {
        result.name = dbTable.name;
        //let stringifiedResult = 
        //  JSON.stringify({task: 'persons/sync', data: result});
        //console.log('sending stringifiedResult', stringifiedResult);
        
        //const payload = {
        //  task: 'persons/sync',
        //  data: result 
        //}
        
        //console.log('sending payload', payload);
        
        socketWrapper.send('persons/sync', result);
      })
      .then(Promise.resolve(done())) 
      .catch(err => console.error(err)); 

  });

  return worker;

}
export {startSync, receiveSync};

