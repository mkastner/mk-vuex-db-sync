import Vue from 'vue';
import {createStore} from './store';
import {createDb} from './db'; 
import VuexDbPlugin from '../src/vuex-dexie-plugin'; 
import Main from './components/main/main.vue'; 
import {startSync} from '../src/db-sync.js';
const db = createDb();
const store = createStore(db);
startSync(db.persons, {reconcile: '/api/reconcile'});

let personsPlugin = VuexDbPlugin(db.persons); 
personsPlugin.add('CREATE');
personsPlugin.add('PATCH');
personsPlugin.add('DELETE');

Vue.use(personsPlugin);

new Vue({
  render: h => h(Main), 
  store
}).$mount('#app');

