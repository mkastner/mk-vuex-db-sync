export default function VuexDexiePlugin(dbTable, moduleName) {

  const Plugin = {
    handlers: {}, 
    add(mutationName) {
      let mutationPath = `${moduleName}/${mutationName}`;
      switch (mutationPath) {
      case `${moduleName}/PATCH`:
        this.handlers[mutationPath] = (mutation) => {
          dbTable.where('id').equals(mutation.payload.id)
            .modify(mutation.payload.fields); 
        };
        break; 
      case `${moduleName}/CREATE`:
        this.handlers[mutationPath] = (mutation) => {
          console.log('plugin CREATE', mutation);
          dbTable.put(mutation.payload)
            .then((res) => {
              console.log('item added', res); 
            })
            .catch((err) => {
              console.error(err); 
            });
        };
        break; 
      case `${moduleName}/DELETE`:
        this.handlers[mutationPath] = (mutation) => {
          console.log('plugin DELETE', mutation);
          dbTable.delete(mutation.payload)
            .then((res) => {
              console.log('item deleted', res); 
            })
            .catch((err) => {
              console.error(err); 
            });
        };
        break; 
      }
      return this;
    },
  };


  const newPlugin = Object.create(Plugin);
  
  newPlugin.register = (store) => {
    store.subscribe((mutation) => {
      if (newPlugin.handlers[mutation.type]) {
        newPlugin.handlers[mutation.type](mutation);
      }
    }); 
  };

  return newPlugin;
}
