module.exports = function AbstractTask() {

  return Object.create({
    init(wss, ws, Model) {
      this.wss = wss;
      this.ws = ws;
      this.Model = Model;
      console.log('abstract-task this.Model', this.Model);
    },
    execute(task, data) { 
      throw new Error(`execute must be implemented for task ${task}`); 
    },
    send({task, data}) {
      const stringifiedJSON = JSON.stringify({task, data});
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
