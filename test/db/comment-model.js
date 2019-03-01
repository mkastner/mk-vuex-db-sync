const Bookshelf = require('./db-server');
require('./person-model');

const Comment = Bookshelf.Model.extend({
  tableName: 'comments',
  hasTimestamps: true,
  person() {
    return this.belongsTo('Person'); 
  } 
});

Comment.rawKnex = Bookshelf.knex('comments');

module.exports = Bookshelf.model('Comment', Comment);
