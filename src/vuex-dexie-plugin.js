export default function VuexDexiePlugin({db, resourceName, modelName, routeName, socketWrapper}) {

  const props = {
    dependants: {
      value: []
    },
    syncers: {
      value: [] 
    }, 
    mutationListeners: {
      value: {} 
    },
    routeName: {
      value: '',
      writable: true
    },
    modelName: {
      type: String,
      writable: true
    },
    resourceName: {
      type: String,
      writable: true
    },
    db: {
      set(db) { this._db = db; },
      get() {
        if (!this._db) throw new Error('db is not set');
        return this._db; 
      }
    },
    store: {
      set(store) { this._store = store; },
      get() {
        if (!this._store) throw new Error('store is not set');
        return this._store; 
      }
    },
    socketWrapper: {
      set(socketWrapper) { this._socketWrapper = socketWrapper; },
      get() { 
        if (!this._socketWrapper) throw new Error('socketWrapper is not set');
        return this._socketWrapper; 
      }
    }
  };

  const proto = {

    addSyncer(Syncer) {
      const syncer = Syncer.bind(this);
      this.syncers.push(syncer().bind(this));
    },

    addDependant(resourceName, modelName, depKey, initialFields) {
      this.dependants.push({resourceName, depKey, modelName, initialFields}); 
    },
   
    addMutationListener(mutationName, handler) {
      let mutationPath = `${modelName}/${mutationName}`;
      if (!this.mutationListeners[mutationPath]) {
        this.mutationListeners[mutationPath] = []; 
      }
      this.mutationListeners[mutationPath].push(handler); 
    }

  };

  const newPlugin = Object.create(proto, props);
  
  newPlugin.db = db;
  newPlugin.resourceName = resourceName; 
  newPlugin.modelName = modelName;
  newPlugin.socketWrapper = socketWrapper;
  newPlugin.routeName = routeName;

  newPlugin.register = (store) => {

    newPlugin.store = store;

    /*
    for (let key in newPlugin.handlers) {
      newPlugin.handlers[key];
    }
    */
    const dbTable = db[resourceName];

    store.subscribe((mutation) => {
      newPlugin.syncers.forEach((syncer) => {
        //console.log('syncer loop', syncer);
        //syncer.bind(newPlugin); 
        syncer(mutation, store); 
      }); 
      
      const mutationTypeListeners = newPlugin.mutationListeners[mutation.type];
      
      if (mutationTypeListeners && mutationTypeListeners.length) {
        for (let i = 0, l = mutationTypeListeners.length; i < l; i++) {
          const typeListener = mutationTypeListeners[i];
          typeListener({mutation, dbTable, 
            store, dependants: newPlugin.dependants});
        }
      }
    }); 
  };


  newPlugin.addMutationListener('PATCH', ({mutation, dbTable}) => {
    dbTable  
      .where('id').equals(mutation.payload.id)
      .modify(mutation.payload.fields);
  });
  newPlugin.addMutationListener('CREATE', ({mutation, dbTable, store, dependants}) => {
    dbTable.add(mutation.payload)
      .then((createdId) => {
        try {
          if (dependants && dependants.length) {
            for (let i = 0, l = dependants.length; i < l; i++) {
              const dependant = dependants[i];
              if (dependant.initialFields) {
                for (let j = 0, jl = dependant.initialFields.length; j < jl; j++) {
                  const initialFields = dependant.initialFields[j];
                  initialFields[dependant.depKey] = createdId;
                  
                  console.log('dependants initialFields', initialFields); 
                  
                  store.dispatch(`${dependant.modelName}/create`, initialFields);
                } 
              }
            } 
          }
        } catch (err) {
          console.error(err); 
        }
      })
      .catch((err) => {
        console.error(err); 
      });
  }); 
  newPlugin.addMutationListener('DELETE', ({mutation, dbTable, dependants}) => {
    const tableId = mutation.payload;
    console.log('vuex plugin DELETE scope mutation type', mutation.type);

    dbTable
      .delete(tableId)
      .catch((err) => console.error(err));

    /** need to go through store, because dependants
     *  need to fire events */
    let deletePromises = dependants.map(dep => {
      let scope = {};
      scope[`${dep.depKey}`] = tableId;
      console.log('vuex plugin DELETE scope', scope);
      return newPlugin.store.dispatch(`${dep.modelName}/deleteScoped`, scope);
    }); 

    Promise.all(deletePromises)
      .then((res) => {
        console.log('dependants deleted', res); 
      })
      .catch((err) => {
        console.error(err); 
      }).catch( err => { console.error(err); });
  }); 
  newPlugin.addMutationListener('MARK_DELETED', ({mutation}) => {
    newPlugin.db[newPlugin.resourceName]
      .where('id')
      .equals(mutation.payload.id)
      .modify(mutation.payload.fields); 
  });

  return newPlugin;

}
