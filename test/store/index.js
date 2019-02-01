import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

import VuexDexiePlugin from '../../src/vuex-dexie-plugin';
import createStoreModule from '../../src/create-store-module.js';


export function createStore(db) {

  let personPlugin = VuexDexiePlugin(db.persons, 'person');

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
