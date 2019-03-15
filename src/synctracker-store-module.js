export default {

  state: () => ({
    list: []
  }),
  actions: {
    touch({commit}, model_name) {
      commit('TOUCH', model_name); 
    }, 
    fetch({commit}) {
      commit('FETCH'); 
    } 
  },
  mutations: {
    TOUCH(opts, model_name) {
      // touching 
    }, 
    FETCH() {
      // fetching 
    }

  } 

};
