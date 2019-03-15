const ChangeTypeConstants = require('./change-type-constants');

module.exports = async function syncTaskItemsCreated({data, Model, syncContext, priorMasterIds}) {

  const createdItems = data.modified.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeCreated);
  
  let createdServerItems = [];

  for (let i = 0, l = createdItems.length; i < l; i++) {
    
    // replace dependant id like person_id=q12341adfa-1324123412-1234
    // with master integer id

    console.log('sync-task    data.depKey', data.depKey);
    console.log('sync-task priorMasterIds', priorMasterIds);


    if (data.depKey && priorMasterIds) {
      let priorDepId = createdItems[i][data.depKey];
      let newDepId = priorMasterIds[priorDepId];
      if (newDepId) {
        createdItems[i][data.depKey] = newDepId;
      }
    }    
    let priorId = createdItems[i].id;

    delete createdItems[i].id;
    delete createdItems[i].change_type;

    const newModel = new Model(createdItems[i]);
    const rawCreatedItem = await newModel.save();
    const createdItem = rawCreatedItem.toJSON();
    const createdServerItem = { priorId, item: createdItem };

    createdServerItems.push(createdServerItem); 
  }
    
};

