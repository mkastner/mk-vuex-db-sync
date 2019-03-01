const ChangeTypeConstants = require('../src/change-type-constants');
const task = require('./abstract-task')();

task.saveItems = async function saveItems(data, priorMasterIds) {
  
  const deletedItems = data.modified.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeDeleted);
  const createdItems = data.modified.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeCreated);  
  const updatedItems = data.modified.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeUpdated);  
  const unmodifiedIds = data.unmodifiedIds;

  const Model = this.models[data.modelName];

  if (!Model) {
    throw new Error(`No Model available for data.modelName ${data.modelName}`); 
  }

  const ids = deletedItems.map(item => item.id );

  console.log('sync-task delete ids', ids);

  const rawDeletedServerItems = 
    await Model.query().whereIn('id', ids).del();

  const itemsAfterDelete = await Model.fetchAll();
  const deletedServerItems = deletedItems;

  console.log('sync-task deletedServerItems', deletedServerItems);

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
  
  //console.log('sync-task createdServerItems:', createdServerItems);
 
  let updatedServerItems = [];
  for (let i = 0, l = updatedItems.length; i < l; i++) {
    delete updatedItems[i].change_type;
    const updatedModel = new Model(updatedItems[i]);
    const updatedItem = await updatedModel.save();
    updatedServerItems.push(updatedItem);
  }

  //
  // send items to client which are not on the client 
  //
  const rawMissingItems = await Model.query((qb) => {
    qb.whereNotIn('id', unmodifiedIds); 
  }).fetchAll();

  let missingServerItems = rawMissingItems.toJSON();
  
  // console.log('sync-task a missingServerItems', missingServerItems);

  // filter against created items

  let createdIds = createdServerItems.map(createdItem => createdItem.item.id);

  // console.log('sync-task a createdIds        ', createdIds);

  missingServerItems = missingServerItems.filter((missingItem) => { 
 
    //console.log('sync-task filter =< missingItem                       ', missingItem); 

    //console.log('sync-task filter =< createdIds.indexOf(missingItem.id)', createdIds.indexOf(missingItem.id));

    return createdIds.indexOf(missingItem.id) === -1;
  
  }); 

  const serverDependants = [];

  if (data.dependants) {
  
    let mappedPriorMasterIds = {}; 
    
    //console.log('sync-task createdServerItems', createdServerItems);

    for (let i = 0, l = createdServerItems.length; i < l; i++) {
      mappedPriorMasterIds[createdServerItems[i].priorId] = createdServerItems[i].item.id;
    }
 
    //console.log('sync-task mappedPriorMasterIds', mappedPriorMasterIds); 

    for (let i = 0, l = data.dependants.length; i < l; i++) {
      const serverDependant = 
        await this.saveItems(data.dependants[i], mappedPriorMasterIds); 
      serverDependants.push(serverDependant);
    } 
  } 
  console.log(`${data.modelName} missingServerItems.length`, 
    missingServerItems.length);

  return {
    // name e.g. persons
    // name: name of the resource e.g. persons
    modelName: data.modelName, 
    name: data.name, 
    createdServerItems, 
    updatedServerItems, 
    deletedServerItems, 
    missingServerItems,
    serverDependants
  };

};

task.execute = async function(data) {

  try {

    const masterResult = await this.saveItems(data); 
    // task e.g. sync
    masterResult.task = data.task;
  
    // console.log('masterResult', masterResult);
    console.log('masterResult.missingServerItems', 
      masterResult.missingServerItems.length);

    //console.log('sending masterResult to browser', 
    //  JSON.stringify(masterResult, null, 2));

    this.send(masterResult);
  
  } catch (err) {
    console.error(err); 
  }
};

module.exports = task; 
