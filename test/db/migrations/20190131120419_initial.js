exports.up = function(knex, Promise) {

  function createPersons() {
    return knex.schema.createTable('persons', (t) => {
      t.bigIncrements('id').primary().unsigned();
      t.datetime('created_at');
      t.datetime('updated_at');
      t.string('name');
    });
  }

  return createPersons();  
  
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('persons'); 
};
