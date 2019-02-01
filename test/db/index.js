import Dexie from 'dexie';
import 'dexie-observable';

function createDb() {
  const db = new Dexie('mk-vue-dexie-test-db');
  db.version(1).stores({
    persons: 'id, created_at, updated_at, change_type, name'
  });

  return db;
}
  
export {createDb};
