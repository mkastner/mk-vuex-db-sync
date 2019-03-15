import ChangeTypeConstants from '../lib/change-type-constants';

function changeTypeRecords({dbTable, changeTypeFieldName, result, changeType}) {
  return new Promise((resolve, reject) => {
    return dbTable.where('change_type')
      .equals(changeType)
      .toArray()
      .then((records) => {
        console.log(`records for ${changeTypeFieldName}`, records); 
        result[changeTypeFieldName] = records || [];
        console.log(`result  for ${changeTypeFieldName}`, result); 
        resolve(result);
      })
      .catch(reject); 
  });
}

export default function dbTableStatus(dbTable) {
  return dbTable.count()
    .then( total => { return { total }; })
    .then( result => changeTypeRecords({dbTable, result,
      changeTypeFieldName: 'created',
      changeType: ChangeTypeConstants.ChangeTypeCreated}))
    .then(result => changeTypeRecords({dbTable, result, 
      changeTypeFieldName: 'updated',
      changeType: ChangeTypeConstants.ChangeTypeUpdated}))
    .then(result => changeTypeRecords({dbTable, result, 
      changeTypeFieldName: 'deleted',
      changeType: ChangeTypeConstants.ChangeTypeDeleted}));
}
