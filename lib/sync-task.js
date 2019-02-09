const ChangeTypeConstants = require('../src/change-type-constants');
const task = require('./abstract-task')();

task.execute = async function({task, data}) {
  try { 

    let deletedItems = data.modified.filter(item => 
      item.change_type === ChangeTypeConstants.ChangeTypeDeleted);
    let createdItems = data.modified.filter(item => 
      item.change_type === ChangeTypeConstants.ChangeTypeCreated);  
    let updatedItems = data.modified.filter(item => 
      item.change_type === ChangeTypeConstants.ChangeTypeUpdated);  

    console.log('sync-task from browser deletedItems:', deletedItems);
    console.log('sync-task from browser createdItems:', createdItems);
    console.log('sync-task from browser updatedItems:', updatedItems);


    const ids = deletedItems.map(item =>  item.id );

    console.log('delete ids', ids);

    let rawDeletedServerItems = await this.Model.query().whereIn('id', ids).del();

    console.log('rawDeletedServerItems', rawDeletedServerItems);

    const itemsAfterDelete = await this.Model.fetchAll();
   
    console.log('itemsAfterDelete', itemsAfterDelete.toJSON());
    
    const deletedServerItems = deletedItems;

    console.log('sync-task deletedServerItems', deletedServerItems);

    let createdServerItems = [];

    for (let i = 0, l = createdItems.length; i < l; i++) {
      let priorId = createdItems[i].id;
      delete createdItems[i].id;
      delete createdItems[i].change_type;

      console.log(`createdItemd[${i}]`, createdItems[i]);

      let newModel = new this.Model(createdItems[i]);
      let rawCreatedItem = await newModel.save();
      
      const createdItem = rawCreatedItem.toJSON();
     
      console.log('createdItem', createdItem);
      const createdServerItem = { priorId, item: createdItem };
      
      console.log('createdServerItem', createdServerItem);
      createdServerItems.push(createdServerItem); 
    }
    
    //console.log('sync-task createdServerItems:', createdServerItems);
   
    let updatedServerItems = [];
    for (let i = 0, l = updatedItems.length; i < l; i++) {
      let updatedModel = new this.Model(updatedItems[i]);
      let updatedItem = await updatedModel.save();
      updatedServerItems.push(updatedItem);
    }
    
    console.log('sync-task updatedServerItems:', updatedServerItems);


    console.log('sync-task data.clientIds    :', data.clientIds);

    //
    // send items to client which are not on the client 
    //
    const rawMissingItems = await this.Model.query((qb) => {
      qb.whereNotIn('id', data.clientIds); 
    }).fetchAll();

    const missingItems = rawMissingItems.toJSON();

    // console.log('sync-task missingItems', missingItems);

    this.send({
      task, 
      data: { 
        createdServerItems, 
        updatedServerItems, 
        deletedServerItems, 
        missingItems 
      }
    });
  }
  catch (err) {
    console.error(err); 
  }
};

module.exports = task; 
