const Bookshelf = require('./db-server');
require('./comment-model');

const Person = Bookshelf.Model.extend({
  tableName: 'persons',
  hasTimestamps: true,
  comments() {
    return this.hasMany('Comment'); 
  }
});

// need raw knex for bulk update
Person.rawKnex = Bookshelf.knex('persons');

module.exports = Bookshelf.model('Person', Person);
