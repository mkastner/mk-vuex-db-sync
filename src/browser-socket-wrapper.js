export default function BrowserSocketWrapper(url) {
  const webSocket = new WebSocket(url);
  console.log('webSocket', webSocket);  
  console.log('readyState    ', webSocket.readyState); 
  console.log('bufferedAmount', webSocket.bufferedAmount); 
   
  return {
    send(task, data) {
      console.log('task', task);
      console.log('data', data);

      //if (!task) throw new Error('task must be passed as argument');
      //if (!data) throw new Error('data must be passed as argument');
      webSocket.send(JSON.stringify({task, data})); 
    },
    receive(task, cb) {
      if (!task) {
        throw new Error('task must be provided');
      }
      if (!cb) {
        throw new Error('callback must be provided');
      }
      webSocket.addEventListener('message', (rawMessage) => {
        console.log('socket wrapper rawMessage', rawMessage); 
        const jsonMessage = JSON.parse(rawMessage.data);
        console.log('socket wrapper jsonMessage', jsonMessage); 
        if (jsonMessage.task === task) {
          cb(jsonMessage.data);
        } 
      }); 
    
    },
    socket: webSocket
  }; 
  
} 
