const Bookshelf = require('../db/db-server');
const ChangeTypeConstants = require('../../lib/change-type-constants');
const createAuditModel = require('../../lib/create-db-audit-model');
const AuditModel = createAuditModel(Bookshelf);
const destroyAll = require('../../lib/db-destroy-all');
const ObjEvents = require('../../lib/object-events');
const dbAudit = require('../../lib/db-audit');
const tape = require('tape');
const SyncTaskMock = Object.create(ObjEvents);

async function main() {

  await tape('Db Audit', async(t) => {

    try {
      
      await destroyAll(AuditModel); 

      dbAudit(SyncTaskMock, AuditModel);
     
      const resultsCreate = await SyncTaskMock.fireAsyncEvent('create', { 
        recordId: 1, modelName: 'fakeModelName', userId: 5 });  
      const resultsUpdate = await SyncTaskMock.fireAsyncEvent('update', { 
        recordId: 2, modelName: 'fakeModelName', userId: 6 });  
      const resultsDelete = await SyncTaskMock.fireAsyncEvent('delete', { 
        recordId: 3, modelName: 'fakeModelName', userId: 7 });  
 
      t.equals(1, resultsCreate.length, 'audit entry on create'); 
      t.equals(1, resultsUpdate.length, 'audit entry on update'); 
      t.equals(1, resultsDelete.length, 'audit entry on delete'); 

      t.equals(ChangeTypeConstants.ChangeTypeCreated,
        resultsCreate[0].toJSON().change_type, 
        'change type create'); 
      t.equals(ChangeTypeConstants.ChangeTypeUpdated,
        resultsUpdate[0].toJSON().change_type, 
        'change type update'); 
      t.equals(ChangeTypeConstants.ChangeTypeDeleted, 
        resultsDelete[0].toJSON().change_type, 
        'change type delete'); 

    } catch (err) {
      console.error(err); 
    } finally {
      t.end();
    }
  });
}

main();
