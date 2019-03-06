import Vue from 'vue';
import uuid from 'uuid';
import SyncTypeConstants from './sync-type-constants';
import ChangeTypeConstants from './change-type-constants';
import DateTimeConstants from '../lib/date-time-constants';
import moment from 'moment';

export default function createStoreModule(dbTable, accessor) {
  
  const moduleObj = {
      
    namespaced: true,
    
    state: () => ({
      syncType: SyncTypeConstants.Types.None, 
      scope: {}, 
      orders: [],//{ by: '', reverse: false}, 
      index: -1,
      search: {}, // ege title: 'Bauen', subtitle: 'haus'
      list: [], // all tables – paginated
      pagination: {
        page: 1,
        pageSize: 10
      } // tables pagination 
    }),
    getters: {
      // (state, allGetters, rootState) => rootState.route.params
      current(state, getters) {
        return getters['undeleted'][state.index]; 
      },
      // returns all items which are not marked as deleted 
      undeleted(state) {
        return state.list.filter(item => 
          item.change_type !== ChangeTypeConstants.ChangeTypeDeleted);
      }
    },
    actions: {
      resetState({commit}) {
        commit('RESET_STATE');
      },
      removeLocalData({commit}) {
        commit('REMOVE_LOCAL_DATA'); 
      }, 
      setSyncType({commit}, syncType) {
        commit('SET_SYNC_TYPE', syncType); 
      },
      search({commit, dispatch}, search) {
        commit('SET_SEARCH', search); 
        dispatch('fetch');
      }, 
      fetch({commit, state}) {
        // fetch is always paginated 

        console.log('fetch with state.scope:', state.scope);
        console.log('fetch with state.scope.keys:', Object.keys(state.scope));

        let coll;
        if (state.scope && Object.keys(state.scope).length > 0) {
          coll = dbTable.where(state.scope); 
        } else {
          coll = dbTable;
        }
               
        console.log('state.orders     ', state.orders);
     
        coll.filter((item) => {
          console.log('this.search', state.search); 
          if (!state.search) { return true; }
          if (!Object.keys(state.search).length) { return true; }
          for (let key in state.search) {
            console.log('this.search key', key); 
            if (item[key]) {
              console.log('this.item[key]', item); 
              if (item[key].toLowerCase().indexOf(state.search[key].toLowerCase()) >= 0) {
                return true; 
              } 
            } 
          }
        }).toArray(arr => {
          // TODO: this sould be defined as a real function 
          arr.sort((itemA, itemB) => {

            for (let i = 0, l = state.orders.length; i < l; i++) {

              const orderBy = state.orders[i].by;
              

              // inverse result if reverse 
              let reverse = 1;
              if (state.orders[i].reverse) {
                reverse = -1;
              }
              // compare
              if (itemA[orderBy] < itemB[orderBy]) {
                return reverse * -1;
              }
              if (itemA[orderBy] > itemB[orderBy]) {
                return reverse * 1;
              }
            }
            return 0;   
          });

          return arr;

        }).then((coll) => {
          // don't show items marked as deleted 
          coll.filter(item =>  
            item.change_type != ChangeTypeConstants.ChangeTypeDeleted);
          
          console.log('fetch coll', coll);

          console.log('fetch page', state.pagination.page);

          const offset = (state.pagination.page - 1) * state.pagination.pageSize;
          const limit = offset + state.pagination.pageSize;
          console.log('fetch offset', offset);
          console.log('fetch limit ', limit);
          const pageItems = coll.slice(offset, limit);

          console.log('fetch pageItems', pageItems);

          commit('CLEAR'); 
          for (let i = 0, l = pageItems.length; i < l; i++) {
            commit('ADD', pageItems[i]); 
          }

        }).catch(err => console.error(err));

      },
      create({commit}, initialFields) {
        
        const  newItem = {
          id: uuid(),
          created_at: moment().format(DateTimeConstants.MySqlFormat), 
          updated_at: moment().format(DateTimeConstants.MySqlFormat), 
          change_type: ChangeTypeConstants.ChangeTypeCreated
        };

        if (initialFields) {
          for (let key in initialFields) {
            newItem[key] = initialFields[key]; 
          } 
        }
     
        commit('CREATE', newItem);  
      
      },
      deleteScoped({dispatch}, scope) {

        console.log('deleteScoped scope', scope);

        return dbTable.where(scope).toArray()
          .then((items) => {
            try { 
              let result = items.map(item =>
                dispatch('delete', { id: item.id, change_type: item.change_type})
              );
              return Promise.resolve(result);
            } catch (err) {
              return Promise.reject(err); 
            }
          });
      },
      delete({commit}, {id, change_type}) {
        if (change_type !== 0 && !change_type) { throw new Error('delete requires change_type as named argument');}
        // if the record is a new one
        // then it can get immediately deleted
        // because it's not stored on the server yet

        console.log('id               ', id); 
        console.log('changeType       ', change_type); 
        console.log('ChangeTypeCreated', ChangeTypeConstants.ChangeTypeCreated);
        if (change_type === ChangeTypeConstants.ChangeTypeCreated) {
          commit('DELETE', id);
        }
        // the record is not really deleted
        // just marked as deleted so the server
        // can be informed about deletion upon
        // syncing
        else {
          const fields = {
            change_type: ChangeTypeConstants.ChangeTypeDeleted,
            updated_at: moment().format(DateTimeConstants.MySqlFormat) 
          };
          commit('MARK_DELETED', {id, fields});
        }
      },
      patch({commit}, {id, fields}) {
        // only mark as updated if it is not a new record
        // new records must keep new-Type

        //console.log('patch id    ', id);
        //console.log('patch fields', fields);

        if (fields.change_type !== ChangeTypeConstants.ChangeTypeCreated) {
          fields.change_type = ChangeTypeConstants.ChangeTypeUpdated;
        } 
        fields.updated_at = moment().format(DateTimeConstants.MySqlFormat);
        //console.log('fields            ', fields);
        //console.log('fields.change_type', fields.change_type);
        commit('PATCH', {id, fields});
      },
      setPage({commit}, page) {
        commit('SET_PAGE', page);  
      },
      setPageSize({commit}, pageSize) {
        commit('SET_PAGE_SIZE', pageSize);  
      },
      setIndex({commit}, index) {
        commit('SET_INDEX', index);  
      },
      refresh({dispatch}) {
        dispatch('fetch');
      },
      setScope({commit}, scope) {
        commit('SET_SCOPE', scope); 
      },
      addOrder({commit}, {by, reverse}) {
        commit('ADD_ORDER', { by, reverse }); 
      },
      clearOrder({commit}) { 
        commit('CLEAR_ORDER'); 
      },
    }, 
    mutations: {
      SET_INDEX(state, index) {
        state.index = index; 
      },
      SET_PAGE(state, page) {
        state.pagination.page = page; 
      },
      SET_PAGE_SIZE(state, pageSize) {
        state.pagination.pageSize = pageSize; 
      },
      SET_SEARCH(state, search) {
        state.search = search; 
      },
      CLEAR(state) {
        state.list.splice(0); 
      }, 
      ADD(state, item) {
        state.list.push(item);
      },
      SET_PAGINATION_ITEM(state, {key, value}) {
        Vue.set(state.pagination, key, value); 
      },
      CREATE(state, newItem) {
        state.list.push(newItem);
        state.index = state.list.length -1; 
      },
      REMOVE_LOCAL_DATA(state) {
        state.list.splice(0); 
      },
      PATCH(state, {id, fields}) {
        console.log('PATCH id   ', id); 
        const index = state.list.findIndex(item => item.id === id);
        console.log('PATCH index', index); 
        for (let key in fields) {
          state.list[index][key] = fields[key]; 
        }
      },
      // it's the same as patch but
      // I need this to have a separate name
      // firing at the plugin
      MARK_DELETED(state, {id, fields}) {
        const index = state.list.findIndex(item => item.id === id);
        for (let key in fields) {
          state.list[index][key] = fields[key]; 
        } 
      },
      DELETE(state, id) {
        const index = state.list.findIndex(item => item.id === id);
        state.list.splice(index, 1);
      },
      SET_SYNC_TYPE(state, syncType) {
        state.syncType = syncType; 
      }, 
      SET_SYNC_TIME(state, syncTime) {
        state.syncTime = syncTime; 
      }, 
      SET_SCOPE(state, scope) {
        
        if (!scope) {
          state.scope = {}; 
        }
     
        for (let key in scope) {
          Vue.set(state.scope, key, scope[key]); 
        }

      },
      ADD_ORDER(state, {by, reverse}) {
        state.orders.push({by,reverse});
      },
      CLEAR_ORDER(state) {
        state.orders.splice(0); 
      },
      RESET_STATE(state) {
        // Do NOT reset scope!!!
        state.list.splice(0);
        state.index = -1;
        state.orders.splice(0); 
      }
    }
  };

  if (accessor) {
    accessor(moduleObj); 
  }

  return moduleObj;

}
