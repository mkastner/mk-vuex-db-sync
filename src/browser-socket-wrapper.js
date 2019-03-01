export default function BrowserSocketWrapper(url) {
  const webSocket = new WebSocket(url);
  console.log('webSocket', webSocket);  
  console.log('readyState    ', webSocket.readyState); 
  console.log('bufferedAmount', webSocket.bufferedAmount); 
   
  return {
    send(data) {
      console.log('data', data);

      //if (!task) throw new Error('task must be passed as argument');
      //if (!data) throw new Error('data must be passed as argument');
      webSocket.send(JSON.stringify(data)); 
    },
    receive(taskName, cb) {
      if (!taskName) {
        throw new Error('task name must be provided');
      }
      if (!cb) {
        throw new Error('callback must be provided');
      }
      webSocket.addEventListener('message', (message) => {
        console.log('socket wrapper message     ', message); 
        console.log('socket wrapper message.data', message.data); 
        const data = JSON.parse(message.data);
        console.log('socket wrapper jsonData', data); 
        if (data.task === taskName) {
          cb(data);
        } 
      }); 
    
    },
    socket: webSocket
  }; 
  
} 
