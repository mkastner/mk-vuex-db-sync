const log = require('mk-log');
const ChangeTypeConstants = require('./change-type-constants');
const task = require('./abstract-task')();

task.saveItems = async function saveItems(data, priorMasterIds) {

  // remove all records, which are already deleted
  // from data.modified
  const DeletedRecordModel = this.models.deletedRecord;

  const rawDeletedRecords = await DeletedRecordModel.query((qb) => {
    qb.where('model_name', data.modelName); 
  }).fetchAll();

  const deletedRecords = rawDeletedRecords.toJSON();
  const deletedRecordIds = deletedRecords.map(r => r.record_id);
  const existingClientItems = data.modified.filter(item =>
    // filter all items which are not deleted
    // in the server database a this moment
    deletedRecordIds.indexOf(item.id) === -1);


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

  await Model.query().whereIn('id', deletedClientItemIds).del();
 
  const deletedRecordsPromises = deletedClientItems.map((item) => {
    
    if (!data.modelName) {
      throw new Error('data.modelName required for deleted record'); 
    }

    return new DeletedRecordModel({
      user_id: item.user_id,
      model_name: data.modelName,
      record_id: item.id}).save();
  });
 
  const deletedRecordsResult 
    = await Promise.all(deletedRecordsPromises);
  log.debug('deletedRecordsResult', deletedRecordsResult);

  let joinedDeletedIds = deletedRecordIds.concat(deletedClientItemIds); 

  // remove duplicates
  let deletedServerItems = Array.from(new Set(joinedDeletedIds)); 
  
  const itemsAfterDelete = await Model.fetchAll();
  log.debug('itemsAfterDelete', itemsAfterDelete);  

  let createdServerItems = [];

  for (let i = 0, l = createdClientItems.length; i < l; i++) {
    
    // replace dependant id like person_id=q12341adfa-1324123412-1234
    // with master integer id

    log.debug('sync-task    data.depKey', data.depKey);
    log.debug('sync-task priorMasterIds', priorMasterIds);


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
  
  log.debug('sync-task createdServerItems:', createdServerItems);

  const updatedServerItems = [];
  for (let i = 0, l = updatedClientItems.length; i < l; i++) {
    delete updatedClientItems[i].change_type;
    const updatedModel = new Model(updatedClientItems[i]);
    const updatedItem = await updatedModel.save();
    updatedServerItems.push(updatedItem);
  }

  // send items to client which are not on the client 

  const rawMissingItems = await Model.query((qb) => {
    const updatedServerItemIds = updatedServerItems.map(item => item.id); 
    qb.whereNotIn('id', unmodifiedIds.concat(updatedServerItemIds)); 
  }).fetchAll();

  let missingServerItems = rawMissingItems.toJSON();

  // filter against created items

  let createdIds = createdServerItems.map(createdItem => createdItem.item.id);

  missingServerItems = missingServerItems.filter((missingItem) => { 
    return createdIds.indexOf(missingItem.id) === -1;
  }); 

  const serverDependants = [];

  if (data.dependants) {
  
    let mappedPriorMasterIds = {}; 

    for (let i = 0, l = createdServerItems.length; i < l; i++) {
      mappedPriorMasterIds[createdServerItems[i].priorId] = createdServerItems[i].item.id;
    }

    for (let i = 0, l = data.dependants.length; i < l; i++) {
      const serverDependant = 
        await this.saveItems(data.dependants[i], mappedPriorMasterIds); 
      serverDependants.push(serverDependant);
    } 
  } 
  log.debug(`${data.modelName} missingServerItems.length`, 
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
  
    log.debug('masterResult.missingServerItems', 
      masterResult.missingServerItems.length);

    // send is not asynchronous
    return this.send(masterResult);
  
  } catch (err) {
    log.error(err); 
  }
};

module.exports = task; 
