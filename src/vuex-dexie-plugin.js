// browser-db-sync should be renamed to a better name 
import {startSync, receiveSync} from '../src/browser-db-sync';
import SendWorker from './browser-db-sync-send.worker.js';
import ReceiveWorker from './browser-db-sync-receive.worker.js';
import ChangeTypeConstants from './change-type-constants';

export default function VuexDexiePlugin(dbTable, moduleName, socketWrapper) {

  console.log('VuexDexiePlugin socketWrapper', socketWrapper);


  const Plugin = {
    syncers: [
      function incoming(store) {
        let worker = new ReceiveWorker();
        //socketWrapper.socket.addEventListener('message', (message) => {
        //  console.log('**** socket message', message); 
        //});
        socketWrapper.receive(`${dbTable.name}/sync`, (data) => {
          console.log('received data posting to worker', data);
          worker.postMessage(data);
        });
        worker.addEventListener('message', (ev) => {
          console.log('worker ev     ', ev);
          console.log('worker ev.data', ev.data);
          const {
            deletedServerItems, 
            createdServerItems, 
            updatedServerItems, 
            missingItems } = ev.data; 

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
            .then(() => {
              console.log('store', store);
              store.dispatch(`${moduleName}/fetch`); 
            })
            .catch((err) => {
              console.error(err); 
            });
        });
      },
      function outgoing() {
        let worker = new SendWorker();

        console.log('startSync worker', worker);
        
        console.log('socketWrapper 1 ', socketWrapper); 
        
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
              console.log('result       ', result); 
              console.log('socketWrapper', socketWrapper); 
              socketWrapper.send(`${dbTable.name}/sync`, result);
            })
            .catch(err => console.error(err)); 
        });
      }
    ], 
    handlers: {},

    // TODO receiving handlers 
    
    add(mutationName) {
      let mutationPath = `${moduleName}/${mutationName}`;
      switch (mutationPath) {
      case `${moduleName}/PATCH`:
        this.handlers[mutationPath] = (mutation) => {
          console.log('plugin PATCH payload', mutation.payload);
          dbTable.where('id').equals(mutation.payload.id)
            .modify(mutation.payload.fields); 
        };
        break; 
      case `${moduleName}/CREATE`:
        this.handlers[mutationPath] = (mutation) => {
          console.log('plugin CREATE mutation.payload   ', mutation.payload);
          console.log('plugin CREATE mutation.payload.id', mutation.payload.id);
           
          dbTable.add(mutation.payload)
            .then((res) => {
              console.log('item added', res); 
            })
            .catch((err) => {
              console.error(err); 
            });
           
        };
        break; 
      case `${moduleName}/DELETE`:
        this.handlers[mutationPath] = (mutation) => {
          console.log('plugin DELETE', mutation);
          dbTable.delete(mutation.payload)
            .then((res) => {
              console.log('item deleted', res); 
            })
            .catch((err) => {
              console.error(err); 
            });
        };
        break; 
      }
      return this;
    },
  };


  const newPlugin = Object.create(Plugin);

  newPlugin.register = (store) => {
    console.log('register', store);
   
    newPlugin.syncers.forEach((syncer) => {
      syncer(store); 
    });    

    store.subscribe((mutation) => {
      if (newPlugin.handlers[mutation.type]) {
        newPlugin.handlers[mutation.type](mutation, store);
      }
    }); 
  };

  return newPlugin;
}
