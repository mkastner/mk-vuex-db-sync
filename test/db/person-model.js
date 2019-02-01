const Bookshelf = require('./db-server');

const Person = Bookshelf.Model.extend({
  tableName: 'persons',
  hasTimestamps: true
});

module.exports = Bookshelf.model('Person', Person);
