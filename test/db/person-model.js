const Bookshelf = require('./db-server');


//console.log('************ person-model Bookshelf.knex', Bookshelf.knex);

const Person = Bookshelf.Model.extend({
  tableName: 'persons',
  hasTimestamps: true,

});

Person.rawKnex = Bookshelf.knex('persons');

module.exports = Bookshelf.model('Person', Person);
