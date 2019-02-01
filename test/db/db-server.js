const knexConfig = require('./knexfile');
console.log('db-server.js knexConfig', knexConfig);
const knex = require('knex')(knexConfig);
const bookshelf = require('bookshelf')(knex);


bookshelf.plugin('registry');
bookshelf.plugin('virtuals');
bookshelf.plugin('visibility');
bookshelf.plugin('bookshelf-scopes');
bookshelf.plugin('pagination');


module.exports = bookshelf;

