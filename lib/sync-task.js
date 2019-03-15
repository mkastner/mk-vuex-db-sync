const ChangeTypeConstants = require('./change-type-constants');
const task = require('./abstract-task')();
//const syncTaskItemsDeleted = require('./sync-task-items-deleted');
//const syncTaskItemsUpdated = require('./sync-task-items-updated');
//const syncTaskItemsCreated = require('./sync-task-items-created');

task.saveItems = async function saveItems(data, priorMasterIds) {


  // remove all records, which are already deleted
  // from data.modified
  const DeletedRecordModel = this.models.deletedRecord;

  const rawDeletedRecords = await DeletedRecordModel.query((qb) => {
    qb.where('model_name', data.modelName); 
  }).fetchAll();
  
  console.log('rawDeletedRecords', rawDeletedRecords);

  const deletedRecords = rawDeletedRecords.toJSON();

  console.log('deletedRecords', deletedRecords);

  const deletedRecordIds = deletedRecords.map(r => r.id);

  const existingClientItems = data.modified.filter(item => 
    deletedRecordIds.indexOf(item.id) !== -1);

  const deletedClientItems = existingClientItems.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeDeleted);
  const createdClientItems = existingClientItems.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeCreated);  
  const updatedClientItems = existingClientItems.filter(item => 
    item.change_type === ChangeTypeConstants.ChangeTypeUpdated);  
  const unmodifiedIds = data.unmodifiedIds;

  const Model = this.models[data.modelName];

  if (!Model) {
    throw new Error(`No Model available for data.modelName ${data.modelName}`); 
  }

  const deletedClientItemIds = deletedClientItems.map(item => 
    item.id );

  console.log('sync-task deletedClientItems ids', deletedClientItemIds);

  await Model.query().whereIn('id', deletedClientItemIds).del();
 
  const deletedRecordsPromises = deletedClientItems.map(item => 
    new DeletedRecordModel({
      user_id: item.user_id,
      model_name: data.model_name,
      record_id: item.id}).save());
 
  const deletedRecordsResult 
    = await Promise.all(deletedRecordsPromises);
  console.log('deletedRecordsResult', deletedRecordsResult);

  //const jsonDeletedItems = rawDeletedServerItems.toJSON();

  let joinedDeletedIds = deletedRecordIds.concat(deletedClientItemIds); 

  // remove duplicates
  let deletedServerItems = Array.from(new Set(joinedDeletedIds)); 

  //console.log('rawDeletedServerItems', rawDeletedServerItems);
  
  const itemsAfterDelete = await Model.fetchAll();
   
  
  //const deletedServerItems = deletedClientItems;

  //console.log('sync-task deletedServerItems', deletedServerItems);

  let createdServerItems = [];

  for (let i = 0, l = createdClientItems.length; i < l; i++) {
    
    // replace dependant id like person_id=q12341adfa-1324123412-1234
    // with master integer id

    console.log('sync-task    data.depKey', data.depKey);
    console.log('sync-task priorMasterIds', priorMasterIds);


    if (data.depKey && priorMasterIds) {
      let priorDepId = createdClientItems[i][data.depKey];
      let newDepId = priorMasterIds[priorDepId];
      if (newDepId) {
        createdClientItems[i][data.depKey] = newDepId;
      }
    }    
    let priorId = createdClientItems[i].id;

    delete createdClientItems[i].id;
    delete createdClientItems[i].change_type;

    const newModel = new Model(createdClientItems[i]);
    const rawCreatedItem = await newModel.save();
    const createdItem = rawCreatedItem.toJSON();
    const createdServerItem = { priorId, item: createdItem };
   

    createdServerItems.push(createdServerItem); 
  }
  
  console.log('sync-task createdServerItems:', createdServerItems);
 
  let updatedServerItems = [];
  for (let i = 0, l = updatedClientItems.length; i < l; i++) {
    delete updatedClientItems[i].change_type;
    const updatedModel = new Model(updatedClientItems[i]);
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

task.execute = async function execute(data) {

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
