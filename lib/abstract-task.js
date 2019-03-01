module.exports = function AbstractTask() {

  return Object.create({
    init(wss, ws, models) {
      this.wss = wss;
      this.ws = ws;
      this.models = models;
      // create object like {persons: PersonMode, comments: CommentModel}
      /* 
      for (let i = 0, l = models.length; i < l; i ++) {
        this.models[new models[i]().tableName] = models[i]; 
      }
      console.log('abstract-task this.Model', this.Model);
      */
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
