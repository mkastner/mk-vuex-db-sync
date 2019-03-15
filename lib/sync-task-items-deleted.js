const ChangeTypeConstants = require('./change-type-constants');

module.exports = async function syncTaskItemsDeleted({data, Model, syncContext}) {

  const deletedItems = data.modified.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeDeleted);
  
  const ids = deletedItems.map(item => item.id );

  const rawDeletedServerItems = 
    await Model.query().whereIn('id', ids).del();

  const jsonDeletedItems = rawDeletedServerItems.toJSON();

  console.log('rawDeletedServerItems', rawDeletedServerItems);
    
};
