const VueLoaderPlugin = require('vue-loader/lib/plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development', 
  module: {
    rules: [
      // ... other rules
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          hotReload: true,
          preserveWhitespace: false,
          postcss: [
            require('autoprefixer')({
              browsers: ['last 3 versions']
            })
          ]
        }
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              '@babel/plugin-syntax-dynamic-import'
            ] 
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader', 'resolve-url-loader']
      }, {
        test   : /\.scss$/,
        loaders: ['style-loader', 'css-loader', 
          'resolve-url-loader', 'sass-loader?sourceMap']
      },
      {
        test   : /\.worker\.js$/,
        use: 'worker-loader' 
      }
    ]
  },
  plugins: [
    // make sure to include the plugin!
    new VueLoaderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    //new webpack.NoEmitErrorsPlugin()
  ]
};
