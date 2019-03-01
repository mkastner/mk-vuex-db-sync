const path = require('path');
const webpack = require('webpack');
const port = 3001;
const WebSocket = require('ws');
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const webpackConfig = require('../build/webpack.test.config');
const compiler = webpack(webpackConfig);
const express = require('express');
const app = express();
const PersonModel = require('./db/person-model');
const CommentModel = require('./db/comment-model');
const SyncTask = require('../lib/sync-task');
const server = require('http').createServer();

const wss = new WebSocket.Server({server: server}, (result, code, name, headers) => {

  console.log('server.js wss callback  result', result);
  console.log('server.js wss callback    code', code);
  console.log('server.js wss callback    name', name);
  console.log('server.js wss callback headers', headers);

});

//console.log('wss', wss);
console.log('PersonModel************', new PersonModel().tableName);



wss.on('connection', function connection(ws) {
  //console.log('on connection', ws);
  //
  //
  
  const models = { 
    person: PersonModel, 
    comment: CommentModel 
  };
  
  SyncTask.init(wss, ws, models); 
  
  // A task handler could also handle communication 
  const taskHandlers = {
    'persons/sync': SyncTask
  };
  ws.on('message', function incoming(stringifiedJSON) {

    //console.log('stringifiedJSON', stringifiedJSON);

    let data = JSON.parse(stringifiedJSON); 
    console.log('data', data);

    // TODO get key data here

    let taskKey = `${data.name}/${data.task}`; 


    // console.log('data', data); 
    // Broadcast to everyone else.
    // console.log('server.js ws.on message task        :', task);
    //console.log('server.js ws.on message taskHandlers:', taskHandlers);
    const taskHandler = taskHandlers[taskKey];
    if (!taskHandler) {
      throw new Error(`taskKey "${taskKey}" does not match any
      registered task keys: ${Object.keys(taskHandlers)}`); 
    }
    //console.log('server.js ws.on message taskHandler :', taskHandler);
    taskHandler.execute(data);

    //syncTask(ws, wss, {task, data}, personModel).execute();

  });
  ws.on('open', function open() {
    console.log('connected');
    ws.send(Date.now());
  });

  ws.on('close', function close() {
    console.log('disconnected');
  });
});


server.on('request', app);

app.use(devMiddleware(compiler, {
  // options
  index: './test/index.html',
  publicPath: '/dist/'
}));
app.use(hotMiddleware(compiler));



//app.post('/api/reconcile', syncAdapter(personModel));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

server.listen(port, () => {
  console.log('server listening on port', port);
});

