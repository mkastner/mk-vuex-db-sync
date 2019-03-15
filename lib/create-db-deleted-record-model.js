module.exports = function createDbDeletedRecordModel(Bookshelf) {
  const DeletedRecord = Bookshelf.Model.extend({
    tableName: 'deleted_records',
    hasTimestamps: true
  });
  return Bookshelf.model('DeletedRecord', DeletedRecord);
};
