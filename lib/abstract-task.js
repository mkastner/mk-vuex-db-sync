module.exports = function AbstractTask() {

  return Object.create({
    init(wss, ws, models) {
      this.wss = wss;
      this.ws = ws;
      this.models = models;
      this.eventListeners = {};
      // create object like {persons: PersonMode, comments: CommentModel}
    },
    fireEvent(name, payload) {
      let listeners = this.eventListeners[name];
      if (!listeners) throw new Error(`eventListener ${name} does not exist`);
      for (let i = 0, l = listeners.length; i < l; i++) {
        listeners[i](payload); 
      } 
    },
    addEventListener(name, func) {
      let listeners = this.eventListeners[name];
      if (!listeners)  {
        listeners = {}; 
      }
      listeners.push(func);
      this.eventListeners[name] = listeners; 
    },
    execute(task, data) { 
      throw new Error(`execute must be implemented for task ${task}`); 
    },
    send(data) {
      const stringifiedJSON = JSON.stringify(data);
      this.ws.send(stringifiedJSON); 
    },
    broadcast({task, data}) {
      const stringifiedJSON = JSON.stringify({task, data});
      this.wss.clients.forEach((client) => {
        if (client !== this.ws && client.readyState === WebSocket.OPEN) {
          client.send(stringifiedJSON);
        }
      });
    }
  });

}; 
