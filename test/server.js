const path = require('path');
const webpack = require('webpack');
const port = 3001;
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const webpackConfig = require('../build/webpack.test.config');
const compiler = webpack(webpackConfig);
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const personModel = require('./db/person-model');
const syncAdapter = require('../adapters/sync-adapter');
app.use(bodyParser.json());

app.use(devMiddleware(compiler, {
  // options
  index: './test/index.html',
  publicPath: '/dist/'
}));
app.use(hotMiddleware(compiler));

app.post('/api/reconcile', syncAdapter(personModel));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(port, () => {
  console.log('server listening on port', port);
});

