module.exports = {
  apps: [
    {
      name: 'expense-api',
      script: './index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'expense-worker',
      script: './workers/notificationWorker.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};