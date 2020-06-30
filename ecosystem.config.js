module.exports = {
  apps : [{
    name: 'Linux Dash',
    script: './app/server/index.js',
    watch: false,
    env: {
      "LINUX_DASH_SERVER_PORT": 2800
    },
  }],
};
