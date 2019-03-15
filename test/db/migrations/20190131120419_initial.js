// second arg: Promise
exports.up = function(knex) {
  
  const deletedRecords = () => knex.schema.createTable('deleted_records', (t) => {
    t.bigIncrements('id').primary().unsigned();
    t.integer('user_id');
    t.string('model_name');
    t.integer('record_id');
    t.timestamps();
  });

  const createPersons = () => knex.schema.createTable('persons', (t) => {
    t.bigIncrements('id').primary().unsigned();
    t.timestamps();
    t.string('name');
  });
    
  const createComments = () => knex.schema.createTable('comments', (t) => {
    t.bigIncrements('id').primary().unsigned();
    t.integer('person_id'); 
    t.datetime('created_at');
    t.datetime('updated_at');
    t.string('title');
    t.string('body');
  });

  return deletedRecords().then(createPersons).then(createComments);  
  
};

// second arg: Promise
exports.down = (knex) => {
  return Promise.all([
    knex.schema.dropTable('audits'),
    knex.schema.dropTable('persons'), 
    knex.schema.dropTable('comments')
  ]); 
};
