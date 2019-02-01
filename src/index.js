import { 
  ChangeTypeDeleted, 
  ChangeTypeCreated,  
  ChangeTypeUpdated 
} from './change-type-constants.js';

export default {
  install(Vue, {db, adapters}) {
    db.on('changes', function (changes) {
      changes.forEach(function (change) {
        switch (change.type) {
        case ChangeTypeCreated:
          console.log('An object was created: ' + JSON.stringify(change.obj));
          break;
        case ChangeTypeUpdated:
          console.log('An object with key ' + change.key + ' was updated with modifications: ' + JSON.stringify(change.mods));
          break;
        case ChangeTypeDeleted:
          console.log('An object was deleted: ' + JSON.stringify(change.oldObj));
          break;
        }
      });
    });
    db.open().then(() => {
      for (let i = 0, l =  adapters.length; i < l; i++) {
        adapters[i].onOpen(db, 'flexTables', '/api/admin/tables/reconcile'); 
        adapters[i].onOpen(db, 'flexTableRows', '/api/admin/table-rows/reconcile'); 
        adapters[i].onOpen(db, 'flexTableCells', '/api/admin/table-cells/reconcile'); 
      }
    }).catch((err) => {
      console.error(err); 
    });
  }
};
