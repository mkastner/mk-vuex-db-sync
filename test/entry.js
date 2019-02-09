import Vue from 'vue';
import {createStore} from './store';
import Main from './components/main/main.vue'; 
//import {startSync, receiveSync} from '../src/browser-db-sync';
//import ChangeTypeConstants from '../src/change-type-constants';
const store = createStore();


//startSync(socketWrapper, db.persons);
//receiveSync(socketWrapper, db.persons);

/*
db.on('changes', (changes) => {
 
  console.log('changes', changes);

  changes.forEach(( change)  => {
    switch (change.type) {
    case ChangeTypeConstants.ChangeTypeCreated:
      break;
    case ChangeTypeConstants.ChangeTypeUpdated:
      break;
    case ChangeTypeConstants.ChangeTypeDeleted:
      break;
    }
  }); 
});

*/

new Vue({
  render: h => h(Main), 
  store
}).$mount('#app');

