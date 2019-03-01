import Vue from 'vue';
import {createStore} from './store';
import Main from './components/main/main.vue'; 
const store = createStore();

new Vue({
  render: h => h(Main), 
  store
}).$mount('#app');

