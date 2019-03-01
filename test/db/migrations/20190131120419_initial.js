// second arg: Promise
exports.up = function(knex) {

  const createPersons = () => knex.schema.createTable('persons', (t) => {
    t.bigIncrements('id').primary().unsigned();
    t.datetime('created_at');
    t.datetime('updated_at');
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

  return createPersons().then(createComments);  
  
};

// second arg: Promise
exports.down = (knex) => {
  return Promise.all([knex.schema.dropTable('persons'), knex.schema.dropTable('jobs')]); 
};
