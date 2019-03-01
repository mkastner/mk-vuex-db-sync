import ChangeTypeConstants from './change-type-constants';

export default function collectOutgoingSyncData(dbTable, modelName, depKey) {

  console.log('dbTable', dbTable);
  console.log('depKey ', depKey);

  return dbTable.count()
    .then(total => {
      return {total};
    }).then(result => {
      return new Promise((resolve, reject) => {
        dbTable.where('change_type').noneOf([
          ChangeTypeConstants.ChangeTypeCreated,
          ChangeTypeConstants.ChangeTypeUpdated,
          ChangeTypeConstants.ChangeTypeDeleted])
          .toArray()
          .then((items) => {
            const ids = items.map( item => item.id );
            console.log('outgoing sync data unmodifiedIds', ids);
            result.unmodifiedIds = ids;
            resolve(result); 
          }).catch((err) => {
            console.error(err);
            reject(err);
          });
      }); 
    }).then((result) => {
      return new Promise((resolve, reject) => {
        dbTable.where('change_type').anyOf([
          ChangeTypeConstants.ChangeTypeCreated,
          ChangeTypeConstants.ChangeTypeUpdated,
          ChangeTypeConstants.ChangeTypeDeleted])
          .toArray()
          .then((res) => {
            result.modified = res;
            resolve(result);
          }).catch((err) => {
            console.error(err);
            reject(err);
          });
      });
    }).then((result) => {
      result.name = dbTable.name;
      result.modelName = modelName;
      // has depKey if table is dependant
      if (depKey) {
        result.depKey = depKey; 
      } 
      return Promise.resolve(result); 
    });
}
