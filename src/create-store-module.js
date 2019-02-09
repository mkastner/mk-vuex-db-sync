import Vue from 'vue';
import uuid from 'uuid';
import ChangeTypeConstants from './change-type-constants';
import DateTimeConstants from './date-time-constants';
import moment from 'moment';

export default function StoreModule(dbTable) {
  
  return {
      
    namespaced: true,
    
    state: () => ({
      index: -1,
      search: '',
      list: [], // all tables – paginated
      pagination: {
        page: 1,
        pageSize: 10
      } // tables pagination 
    }),
    getters: {
      // (state, allGetters, rootState) => rootState.route.params
      current(state) {
        return state.list[state.index]; 
      },
      // returns all items which are not marked as deleted 
      undeleted(state) {
        return state.list.filter(item => 
          item.change_type !== ChangeTypeConstants.ChangeTypeDeleted);
      }
    },
    actions: {
      fetchOne({state, commit}, index) {
        
        if (state.list.length === 0) {
          return Promise.resolve(null);
        }
        // index is optional
        // in case index was passed 
        commit('SET_INDEX', 0 || index); 
        
        if (state.index === -1 || state.index >= state.list.length) {
          commit('SET_INDEX', 0);
        }

        let listItem = state.list[state.index]; 

        console.log('listItem', listItem);

        return Promise.resolve(listItem); 
      },
      search({commit, dispatch}, search) {
        commit('SET_SEARCH', search); 
        dispatch('fetch');
      }, 
      fetchPage({dispatch}) {
        // convenience method to fetch paginated
        let withPagination = true;
        dispatch('fetch', withPagination); 
      },
      fetch({commit, state}, withPagination) {
        // TODO implement search with state.search 
       
       
        console.log('ChangeTypeConstants.ChangeTypeDeleted', ChangeTypeConstants.ChangeTypeDeleted);

        const query = dbTable.filter(item => 
          item.change_type != ChangeTypeConstants.ChangeTypeDeleted);
        if (withPagination) {  
          query.offset((state.pagination.page - 1) * state.pagination.pageSize)
            .limit(state.pagination.pageSize);
        } 
        query.toArray().then((records) => {
          console.log('%%%%%%%% fetch %%%%%%%');
          console.log('fetched records', records);
          commit('CLEAR'); 
          for (let i = 0, l = records.length; i < l; i++) {
            commit('ADD', records[i]); 
          }
        }).catch((err) => {
          console.error(err); 
        });
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
      delete({commit}, {id, change_type}) {
        // if the record is a new one
        // then it can get immediately deleted
        // because it's not stored on the server yet
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
          commit('PATCH', {id, fields});
        }
      },
      patch({commit}, {id, fields}) {
        // only mark as updated if it is not a new record
        // new records must keep new-Type
        console.log('fields            ', fields);
        console.log('fields.change_type', fields.change_type);
        console.log('ChangeTypeConstants.ChangeTypeCreated', ChangeTypeConstants.ChangeTypeCreated);

        if (fields.change_type !== ChangeTypeConstants.ChangeTypeCreated) {
          fields.change_type = ChangeTypeConstants.ChangeTypeUpdated;
        } 
        fields.updated_at = moment().format(DateTimeConstants.MySqlFormat);
        commit('PATCH', {id, fields});
      },
      setPage({commit}, page) {
        commit('SET_PAGE', page);  
      },
      setIndex({commit}, index) {
        commit('SET_INDEX', index);  
      },
      refresh({dispatch}) {
        dispatch('fetch');
      }
    },
    mutations: {
      SET_INDEX(state, index) {
        state.index = index; 
      },
      SET_PAGE(state, page) {
        state.pagination.page = page; 
      },
      SET_SEARCH(state, search) {
        state.search = search; 
      },
      CLEAR(state) {
        state.list.splice(0); 
      }, 
      ADD(state, table) {
        state.list.push(table);
      },
      SET_PAGINATION_ITEM(state, {key, value}) {
        Vue.set(state.pagination, key, value); 
      },
      CREATE(state, newItem) {
        state.list.push(newItem);
      },
      PATCH(state, {id, fields}) {
        console.log('id', id); 
        const index = state.list.findIndex(item => item.id === id);
        console.log('index', index); 
        for (let key in fields) {
          state.list[index][key] = fields[key]; 
        } 
      },
      DELETE(state, id) {
        const index = state.list.findIndex(item => item.id === id);
       
        console.log('DELETE index', index);
        
        state.list.splice(index, 1);
      }
    }
  };
}
