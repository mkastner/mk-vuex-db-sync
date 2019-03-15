//const ChangeTypeConstants = require('../../lib/change-type-constants');
const PersonModel = require('../db/person-model');
const CommentModel = require('../db/comment-model');
const destroyAll = require('../../lib/db-destroy-all');

const tape = require('tape');

async function main() {
 
  console.log('Test task items');

  await tape('Task Items', async(t) => {

    try {
      
      await destroyAll(PersonModel); 
      await destroyAll(CommentModel); 

      


    } catch (err) {
      console.error(err); 
    } finally {
      t.end();
    }
  });
}

main();
