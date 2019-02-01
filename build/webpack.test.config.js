const merge = require('webpack-merge');
const webpackBase = require('./webpack.base.config');
const path = require('path');

module.exports = merge(webpackBase, {
  entry: {
    index: [
      './test/entry.js',
      'webpack-hot-middleware/client' 
    ] 
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: 'test-entry.js',
    globalObject: '(typeof self !== \'undefined\' ? self : this)'
  }
});
