import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

import VuexDexiePlugin from '../../src/vuex-dexie-plugin';
import incomingSyncListener from '../../src/incoming-sync-listener';
import outgoingSyncer from '../../src/outgoing-syncer';
import createStoreModule from '../../src/create-store-module.js';
import { createDb } from '../db'; 
import BrowserSocketWrapper from '../../src/browser-socket-wrapper'; 

const host = window.document.location.host.replace(/:.*/, '');
const port = window.document.location.port;
const path = '/socket';

export function createStore() {

  const db = createDb();
  // or use wss for secure connection
  const socketWrapper = BrowserSocketWrapper('ws://' + host + ':' + port + path);
 
  const personPlugin = VuexDexiePlugin({
    db, resourceName: 'persons', 
    route: 'admin/persons', 
    modelName: 'person', socketWrapper});
  personPlugin.addDependant('comments', 'comment', 'person_id', 
    [{ title: 'test'  } ]); 
  personPlugin.addSyncer(outgoingSyncer);
 
  const commentPlugin = VuexDexiePlugin({
    db, resourceName: 'comments', modelName: 'comment', socketWrapper});
  // outgoing handled by person plugin because
  // comment is a dependant of person
  //commentPlugin.addSyncer(outgoingSyncer);
  
  const store = new Vuex.Store({
    strict: process.env.NODE_ENV !== 'production',
    actions: {
    },
    mutations: {
    },
    modules: {
      person: createStoreModule(db.persons),
      comment: createStoreModule(db.comments)
    },
    plugins: [
      personPlugin.register,
      commentPlugin.register 
    ]
  });

  incomingSyncListener(db, store, socketWrapper); 
  store.dispatch('person/addOrder', { by: 'name', reverse: false});
  store.dispatch('person/addOrder', { by: 'updated_at', reverse: false});
  store.dispatch('comment/addOrder', { by: 'title', reverse: false});

  return store;

}
