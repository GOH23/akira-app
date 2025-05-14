import { ProvidePlugin, type Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'postcss-loader' }],
});

export const rendererConfig: Configuration = {
  module: {
    rules: [
      ...rules,
      {
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: 'native_modules/[name][ext]'
        }
      },
      {
        test: /\.js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  plugins: [new ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
    process: 'process/browser'
  }),...plugins],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json', '.wasm'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify')
    }
  },
  experiments: {
    asyncWebAssembly: true,
    topLevelAwait: true
  }
};
