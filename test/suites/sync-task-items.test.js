const log = require('mk-log');
const ChangeTypeConstants = require('../../lib/change-type-constants');
const DateTimeConstants = require('../../lib/date-time-constants');
const moment = require('moment');
const uuid = require('uuid');
const Bookshelf = require('../db/db-server');
const PersonModel = require('../db/person-model');
const CommentModel = require('../db/comment-model');
const createDbDeletedRecordModel = require('../../lib/create-db-deleted-record-model');
const DeletedRecordModel = createDbDeletedRecordModel(Bookshelf);
const destroyAll = require('../../lib/db-destroy-all');
const SyncTask = require('../../lib/sync-task');

const wss = {};

function SocketMock(cb) {
  if (!cb) {
    throw new Error('SocketMock requires callback'); 
  }  
  return {
    send(masterResult) {
      const masterResultObj = JSON.parse(masterResult); 
      cb(masterResultObj); 
    }
  };
}



const models = { 
  person: PersonModel, 
  comment: CommentModel,
  deletedRecord: DeletedRecordModel 
};

async function tearDown() {
  return Promise.all([
    destroyAll(DeletedRecordModel),
    destroyAll(PersonModel),
    destroyAll(CommentModel)
  ]);
}

async function getFirstRecord(Model) {
  const item = await Model.query(qb => qb.limit(1) ).fetch();
  return item.toJSON(); 
}

const tape = require('tape');

async function main() {
 
  log.debug('Test task items');

  await tape('Task Items create', async(t) => {
    
    try {

      await tearDown();

      const ws = SocketMock((masterResult) => {
        log.debug('masterResult', masterResult); 
        t.equal(masterResult.createdServerItems.length, 1, 'created server item length');
        t.equal(masterResult.updatedServerItems.length, 0, 'updated server item length');
        t.equal(masterResult.deletedServerItems.length, 0, 'deleted server item length');
        t.ok(masterResult.createdServerItems[0].priorId, 'must provide priorId');
        t.ok(masterResult.createdServerItems[0].item, 'must provide item');
      });

      SyncTask.init(wss, ws, models); 
      
      const data = {
        modelName: 'person',  
        name: 'person',
        task: 'sync',
        unmodifiedIds: [],
        modified: [{
          id: uuid(),
          change_type: ChangeTypeConstants.ChangeTypeCreated,
          created_at: moment().subtract(2, 'hours')
            .format(DateTimeConstants.MySqlFormat),
          updated_at: moment().subtract(2, 'hours')
            .format(DateTimeConstants.MySqlFormat),
          name: 'Testname'
        }] 
      
      };

      await SyncTask.execute(data);

    } catch (err) {
      log.error(err); 
    } finally {
      t.end();
    }
  });

  await tape('Task Items update', async(t) => {
    try {
      const person = await getFirstRecord(PersonModel); 
       
      log.debug('person', person);
      const data = {
        modelName: 'person',  
        name: 'person',
        task: 'sync',
        unmodifiedIds: [],
        modified: [{
          id: person.id,
          change_type: ChangeTypeConstants.ChangeTypeUpdated,
          updated_at: moment().subtract(2, 'hours')
            .format(DateTimeConstants.MySqlFormat),
          name: 'new Testname'
        }] 
      };
      
      const ws = SocketMock((masterResult) => {
        log.info('masterResult', masterResult); 
        t.equal(masterResult.updatedServerItems.length, 1, 'updated server item length');
        t.ok(masterResult.updatedServerItems[0], 'must provide item');
      });
      
      SyncTask.init(wss, ws, models); 
      await SyncTask.execute(data);

    } catch (err) {
      log.error(err); 
    } finally {
      t.end();
    }
  });
  
  await tape('Task Items reconcile', async(t) => {
    try {
      const person = await getFirstRecord(PersonModel); 
       
      log.info('person', person);
      const data = {
        modelName: 'person',  
        name: 'person',
        task: 'sync',
        unmodifiedIds: [],
        modified: [] 
      };
      
      const ws = SocketMock((masterResult) => {
        t.equal(masterResult.missingServerItems.length, 1, 'updated server item length');
        t.ok(masterResult.missingServerItems[0], 'must provide item');
      });
      
      SyncTask.init(wss, ws, models); 
      await SyncTask.execute(data);

    } catch (err) {
      log.error(err); 
    } finally {
      t.end();
    }
  });
  
  await tape('Task Items delete', async(t) => {
    try {
      const person = await getFirstRecord(PersonModel); 
       
      log.info('person', person);
      const data = {
        modelName: 'person',  
        name: 'person',
        task: 'sync',
        unmodifiedIds: [],
        modified: [{
          id: person.id,
          change_type: ChangeTypeConstants.ChangeTypeDeleted,
          updated_at: moment().subtract(2, 'hours')
            .format(DateTimeConstants.MySqlFormat),
          name: person.name 
        }] 
      };
      
      const ws = SocketMock(async(masterResult) => {
        
        const deletedRecord = await getFirstRecord(DeletedRecordModel); 
        
        log.debug('deletedRecord', deletedRecord);

        t.equal(deletedRecord.record_id, data.modified[0].id, 'should be deleted');

        t.equal(masterResult.deletedServerItems.length, 
          1, 'deleted server item length');
        t.ok(masterResult.deletedServerItems[0], 
          'must provide item');
      });
      
      SyncTask.init(wss, ws, models); 
      await SyncTask.execute(data);

    } catch (err) {
      log.error(err); 
    } finally {
      t.end();
    }
  });

}

main();
