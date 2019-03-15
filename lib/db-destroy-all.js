/**
 * destroyAll
 *
 * @param {Object} Model - a bookshelf model
 * @param {function} func - provides access to query 
 * @returns {Promise<Array>} - a promise of deleted items} 
 */
module.exports = function destroyAll(Model, func) {
  return Model.query((qb) => {
    if (func) {
      func(qb); 
    } 
  })
    .fetchAll()
    .then((vendorEntries) => {
      return Promise.all(
        vendorEntries.map(vendorEntry => vendorEntry.destroy())
      ); 
    });
};
