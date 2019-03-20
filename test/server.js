const log = require('mk-log');
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
const Bookshelf = require('../test/db/db-server');
const PersonModel = require('./db/person-model');
const CommentModel = require('./db/comment-model');
const createDbDeletedRecordModel = require('../lib/create-db-deleted-record-model');
const SyncTask = require('../lib/sync-task');
const server = require('http').createServer();

const wss = new WebSocket.Server({
  server: server, 
  path: '/socket'}, (result, code, name, headers) => {

  log.info('server.js wss callback  result', result);
  log.info('server.js wss callback    code', code);
  log.info('server.js wss callback    name', name);
  log.info('server.js wss callback headers', headers);

});

//log.info('wss', wss);
log.info('PersonModel************', new PersonModel().tableName);

const DeletedRecordModel = createDbDeletedRecordModel(Bookshelf);

wss.on('connection', function connection(ws) {
  //log.info('on connection', ws);
  //
  //
  
  const models = { 
    person: PersonModel, 
    comment: CommentModel,
    deletedRecord: DeletedRecordModel 
  };
  
  SyncTask.init(wss, ws, models); 

  // A task handler could also handle communication 
  const taskHandlers = {
    'persons/sync': SyncTask
  };
  ws.on('message', function incoming(stringifiedJSON) {

    //log.info('stringifiedJSON', stringifiedJSON);

    let data = JSON.parse(stringifiedJSON); 
    log.debug('data', data);

    // TODO get key data here

    let taskKey = `${data.name}/${data.task}`; 


    // log.info('data', data); 
    // Broadcast to everyone else.
    // log.info('server.js ws.on message task        :', task);
    //log.info('server.js ws.on message taskHandlers:', taskHandlers);
    const taskHandler = taskHandlers[taskKey];
    if (!taskHandler) {
      throw new Error(`taskKey "${taskKey}" does not match any
      registered task keys: ${Object.keys(taskHandlers)}`); 
    }
    //log.info('server.js ws.on message taskHandler :', taskHandler);
    taskHandler.execute(data);

    //syncTask(ws, wss, {task, data}, personModel).execute();

  });
  ws.on('open', function open() {
    log.info('connected');
    ws.send(Date.now());
  });

  ws.on('close', function close() {
    log.info('disconnected');
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
  log.info('server listening on port', port);
});

