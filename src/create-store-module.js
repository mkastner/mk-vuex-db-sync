import Vue from 'vue';
import uuid from 'uuid';
import SyncTypeConstants from './sync-type-constants';
import ChangeTypeConstants from '../lib/change-type-constants';
import DateTimeConstants from '../lib/date-time-constants';
import SyncStatusConstants from './sync-status-constants';
import moment from 'moment';

export default function createStoreModule(dbTable, accessor) {
  
  const moduleObj = {
      
    namespaced: true,
    
    state: () => ({
      sync: {
        type: SyncTypeConstants.Types.None,
        delay: 0 
      },
      scope: {
      }, 
      orders: [],//{ by: '', reverse: false}, 
      index: -1,
      search: {}, // ege title: 'Bauen', subtitle: 'haus'
      list: [], // all tables – paginated
      pagination: {
        page: 1,
        pageSize: 10,
        pages: 1,
        total: 1
      }, // tables pagination 
      status: {
        sync: {
          status: SyncStatusConstants.Types.None,
          at: '' // timestamp of last status 
        },
        db: {
          total: 0, 
          updated: [],
          created: [],
          deleted: [] 
        }
      } 
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
      setSync({commit}, {delay, type}) {
        commit('SET_SYNC', {delay, type}); 
      },
      search({commit, dispatch}, search) {
        commit('SET_SEARCH', search);
        dispatch('setPage', 1);
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
               
        //console.log('state.orders     ', state.orders);
     
        coll.filter((item) => {
          if (!state.search) { return true; }
          if (!Object.keys(state.search).length) { return true; }
          for (let key in state.search) {
            if (item[key]) {
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
          // TODO: this should be in scope
          const undeletedItems = coll.filter(item =>  
            item.change_type != ChangeTypeConstants.ChangeTypeDeleted);
          
          //console.log('fetch coll', coll);

          //console.log('fetch page', state.pagination.page);

          let pages = Math.floor(undeletedItems.length / state.pagination.pageSize);
          if (coll % pages >= 1) {
            pages += 1; 
          } 
          // if there's only one page and there are
          // less items than page length then
          // pages is 0 but it must be 1
          if (pages === 0 && undeletedItems.length > 0) {
            pages = 1; 
          }

          commit('SET_PAGINATION', {pages});

          const offset = (state.pagination.page - 1) * state.pagination.pageSize;
          const limit = offset + state.pagination.pageSize;
          // console.log('fetch offset', offset);
          // console.log('fetch limit ', limit);
          const pageItems = undeletedItems.slice(offset, limit);

          // console.log('fetch pageItems', pageItems);

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
        if (change_type !== 0 && !change_type) { 
          throw new Error('delete requires change_type as named argument');}
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
      // refresh list with createdServerItems
      // without firing event for database
      refreshServerCreated({commit}, {priorId, fields}) {
        console.log('refreshServerCreated priorId', priorId);
        console.log('refreshServerCreated fields ', fields);
        if (fields.change_type !== 0 && !fields.change_type) {
          throw new Error('change_type was not passed in fields', fields); 
        }
        commit('REFRESH_SERVER_CREATED_SILENT', {priorId, fields});
      },
      patch({commit}, {id, fields}) {
        // only mark as updated if it is not a new record
        // new records must keep new-Type
        
        if (fields.change_type !== 0 && !fields.change_type) {
          throw new Error('change_type was not passed in fields', fields); 
        }

        if (fields.change_type !== ChangeTypeConstants.ChangeTypeCreated) {
          fields.change_type = ChangeTypeConstants.ChangeTypeUpdated;
        } 
        fields.updated_at = moment().format(DateTimeConstants.MySqlFormat);
        //console.log('fields            ', fields);
        //console.log('fields.change_type', fields.change_type);
        commit('PATCH', {id, fields});
      },
      setPage({commit}, page) {
        commit('SET_PAGINATION', {page});  
      },
      setPageSize({commit}, pageSize) {
        commit('SET_PAGINATION', {pageSize});  
      },
      setTotal({commit}, total) {
        commit('SET_PAGINATION', {total});  
      },
      setPages({commit}, pages) {
        commit('SET_PAGINATION', {pages});  
      },
      setIndex({commit, state}, index) {
        let checkedIndex = index;
        // if no index given check if to reset to
        // 0 or stay at the current value
        if (checkedIndex !== 0 && !checkedIndex) {
          let l = state.list.length; 
          if (l) {
            // set index to first item in list if
            // index is outside of valid range
            if (checkedIndex < 0 && checkedIndex >= l) {
              checkedIndex = 0; 
            } 
          }
        } 
        commit('SET_INDEX', checkedIndex);  
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
      getStatus({commit}) {
        // simply for firing info
        // at the vuex-dexie plugin 
        commit('GET_STATUS'); 
      },
      setDbStatus({commit}, dbStatus) {
        commit('SET_DB_STATUS', dbStatus);
      },
      clearStatus({commit}) {
        commit('CLEAR_STATUS'); 
      },
    }, 
    mutations: {
      SET_INDEX(state, index) {
        state.index = index; 
      },
      SET_PAGINATION(state, obj) {
        for (let key in obj) {
          state.pagination[key] = obj[key]; 
        }
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
      CREATE(state, newItem) {
        for (let key in newItem) {
          Vue.set(newItem, key, newItem[key]);
        }
        state.list.push(newItem);
        state.index = state.list.length -1; 
      },
      REMOVE_LOCAL_DATA(state) {
        state.list.splice(0); 
      },
      // SILENT postfix means: never listen to this event
      REFRESH_SERVER_CREATED_SILENT(state, {priorId, fields}) {
        console.log('REFRESH_SERVER_CREATED_SILENT priorId', priorId);
        const index = state.list.findIndex(item => item.id === priorId);
        console.log('REFRESH_SERVER_CREATED_SILENT index', index); 
        if (index >= 0) { 
          for (let key in fields) {
            state.list[index][key] = fields[key]; 
          }
        }
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
      SET_SYNC(state, {delay, type}) {
        state.sync.delay = delay;
        state.sync.type = type;
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
      },
      GET_STATUS() {
        // just fire info
      },
      CLEAR_STATUS(state) {
        state.status.db.total = 0;
        state.status.db.created.splice(0);
        state.status.db.updated.splice(0);
        state.status.db.deleted.splice(0);
      },
      SET_DB_STATUS(state, {total, created, updated, deleted}) {
        state.status.db.total = total;
        state.status.db.created.splice(0);
        for (let i = 0, l = created.length; i < l; i ++) {
          state.status.db.created.push(created[i]); 
        }
        state.status.db.updated.splice(0);
        for (let i = 0, l = updated.length; i < l; i ++) {
          state.status.db.updated.push(updated[i]); 
        }
        state.status.db.deleted.splice(0);
        for (let i = 0, l = deleted.length; i < l; i ++) {
          state.status.db.deleted.push(deleted[i]); 
        }
      }
    }
  };

  if (accessor) {
    accessor(moduleObj); 
  }

  return moduleObj;

}
