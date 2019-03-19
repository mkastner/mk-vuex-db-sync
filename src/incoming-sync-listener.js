import ChangeTypeConstants from '../lib/change-type-constants';

function resetChangeType(items) {
  for (let i = 0, l = items.length; i < l; i++) {
    items[i].change_type = ChangeTypeConstants.ChangeTypeNone;  
  } 
}

function saveItems(data, store, db) {
 
  console.log('data', data);

  const {
    // name e.g. persons
    name,
    modelName,
    deletedServerItems, // list of ids 
    createdServerItems, 
    updatedServerItems, 
    missingServerItems,
    serverDependants } = data; 


  const dbTable = db[name];

  const deleteIds = deletedServerItems;

  let promise = dbTable
    .bulkDelete(deleteIds)
    .then(() => {
      // let keys = updatedServerItems.map(item => item.id);
      resetChangeType(updatedServerItems);
      return dbTable.bulkPut(updatedServerItems);
    })
    .then(() => {
      // created: delete items with uuid 
      let keys = createdServerItems.map( item => item.priorId );
      
      console.log('incoming-syncer bulkDelete priorIds:', keys);
     
      console.log('keys', keys);
      
      return dbTable.bulkDelete(keys);
    })
    .then(() => {
      const items = createdServerItems.map( itemWrapper => itemWrapper.item );
      resetChangeType(items);

      console.log('items', items);

      return new Promise((resolve, reject) => {
        dbTable.bulkAdd(items).then((result) => {
          for (let i = 0, l = store.state[modelName].list.length; i < l; i++) {
            const listItem = store.state[modelName].list[i];
            const matchedItemWrapper = createdServerItems.find( itemWrapper => 
              itemWrapper.priorId === listItem.id);
            if (matchedItemWrapper) {
              store.dispatch(`${modelName}/refreshServerCreated`, {
                priorId: matchedItemWrapper.priorId,
                fields: matchedItemWrapper.item
              });
            }
          } 
          resolve(result); 
        }).catch((err) => {
          console.error(err);
          reject(err); 
        });
      });
    
    }) 
    .then(() => {

      resetChangeType(missingServerItems);

      console.log('before bulkAdd missingServerItems name:', name);
      console.log('before bulkAdd missingServerItems     :', 
        missingServerItems.map(item => item.id));
      return dbTable.bulkAdd(missingServerItems)

      /*
       * return new Promise((resolve, reject) => {
        dbTable.bulkAdd(missingServerItems)
          .then(result => {
            console.log('bulkAdd result', result); 
            resolve(result);
          }).catch(err => reject(err));
      });
      */
    }); 

  if (!serverDependants || !serverDependants.length) {
    return promise; 
  }

  return Promise.all( 
    serverDependants.map( dep => saveItems(dep, store, db) )
  ); 

}

export default function incomingSyncListener(db, store, socketWrapper) {
  
  socketWrapper.receive('sync', (data) => {
    saveItems(data, store, db)
      .then(() => {
        console.log('all items saved'); 
      })
      .catch((err) => {
        console.error(err); 
      });
  });
}

