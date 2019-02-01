const merge = require('webpack-merge');
const webpackBase = require('./webpack.base.config');
const path = require('path');

module.exports = merge(webpackBase, {
  entry: {
    index: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: 'index.js'
  }
});
