module.exports = {
  apps : [{
    name: 'teebot',
    script: 'index.js',
    time: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],
};
