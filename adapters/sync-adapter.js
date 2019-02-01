const ChangeTypeConstants = require('../src/change-type-constants');

module.exports = function syncAdapter(Model) { 
  return async (req, res) => {
    try {
      console.log('req body', req.body); 
     
      let deletedItems = req.body.modified.filter(item => item.change_type === ChangeTypeConstants.ChangeTypeDeleted);
      let createdItems = req.body.modified.filter(item => item.change_type === ChangeTypeConstants.ChangeTypeCreated);  
      let updatedItems = req.body.modified.filter(item => item.change_type === ChangeTypeConstants.ChangeTypeUpdated);  
     

      const deletedServerItems = await Model.query((qb) => {
        qb.whereIn('id', deletedItems.map((item) => item.id)); 
      });

      let createdServerItems = {};

      for (let i = 0, l = createdItems; i < l; i++) {
        let oldId = createdItems[i].id;
        delete createdItems[i].id;
        delete createdItems[i].change_type;
        let newModel = new Model(createdItems[i]);
        let savedItem = await newModel.save();
        createdServerItems[oldId] = savedItem.id; 
      }
     
      let updatedServerItems = [];
      for (let i = 0, l = updatedItems; i < l; i++) {
        let updatedModel = new Model(updatedItems[i]);
        let updatedItem = await updatedModel.save();
        updatedServerItems.push(updatedItem);
      }

      //
      // TODO send item to client which were added since last update
      //


      res.status(200).json({createdServerItems, updatedServerItems, deletedServerItems});
    }
    catch (err) {
      console.error(err); 
    }
  }
};
