import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

import VuexDexiePlugin from '../../src/vuex-dexie-plugin';
import createStoreModule from '../../src/create-store-module.js';
import {createDb} from '../db'; 
import BrowserSocketWrapper from '../../src/browser-socket-wrapper'; 

const host = window.document.location.host.replace(/:.*/, '');
const port = window.document.location.port;

console.log('port', port);

export function createStore() {
  
  const db = createDb();
  const socketWrapper = BrowserSocketWrapper('ws://' + host + ':' + port);
  console.log('socketWrapper', socketWrapper);
  const personPlugin = VuexDexiePlugin(db.persons, 'person', socketWrapper);

  personPlugin.add('PATCH');
  personPlugin.add('CREATE');
  personPlugin.add('DELETE');

  const store = new Vuex.Store({
    strict: process.env.NODE_ENV !== 'production',
    actions: {
    },
    mutations: {
    },
    modules: {
      person: createStoreModule(db.persons),
    },
    plugins: [personPlugin.register]
  });

  return store;

}
