module.exports = {
  apps: [{
    name: 'vcard',
    script: 'server.js',
    cwd: '/var/www/vcard/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
