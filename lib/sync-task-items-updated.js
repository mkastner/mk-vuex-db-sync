const ChangeTypeConstants = require('./change-type-constants');

module.exports = async function syncTaskItemsUpdated({data, Model, syncContext}) {
  
  const updatedItems = data.modified.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeUpdated);

  let updatedServerItems = [];
  for (let i = 0, l = updatedItems.length; i < l; i++) {
    delete updatedItems[i].change_type;
    const updatedModel = new Model(updatedItems[i]);
    const updatedItem = await updatedModel.save();
    updatedServerItems.push(updatedItem);
  }
    
};

