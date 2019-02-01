import Worker from './db-sync.worker.js';
import axios from 'axios';
import ChangeTypeConstants from './change-type-constants';
import DateTimeConstants from './date-time-constants';

/**
 * startSync
 *
 * @param dbTable dexie table
 * @param {reconcile} urls
 * @returns {undefined}
 */
function startSync(dbTable, {reconcile}) {
 
  let reconcileUrl = reconcile; 

  let worker = new Worker();

  console.log('startSync worker', worker);
  
  worker.addEventListener('message', (message) => {
    console.log('listener message', message);

    console.log('dbTable.count()', dbTable.count().then());

    dbTable.count()
      .then(total => {
        return {total};
      })
      .then((result) => {
        return new Promise((resolve, reject) => {
          dbTable.where('change_type').between(
            ChangeTypeConstants.ChangeTypeDeleted,
            ChangeTypeConstants.ChangeTypeUpdated,
            true, true)
            .toArray()
            .then((res) => {
              result.modified = res;
              resolve(result);
            })
            .catch((err) => {
              console.error(err);
              reject(err);
            });
        });
      }).then((result) => {
        result.name = dbTable.name;
        console.log('result', result);
        return axios.post(reconcileUrl, result);
      }).then((res) => {
        console.log(res.data); 
      }).catch(err => console.error(err)); 

    /*
    axios.post(reconcileUrl, data, (res) => {
      console.log('reconcile response', res); 
    }).then((res) => {
      console.log(res); 
    }).catch(err => console.error(err)); 
    */ 
  });



  return worker;

}
export {startSync};

