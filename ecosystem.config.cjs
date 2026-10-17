// PM2 process definition for the DigitalOcean droplet.
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "aus-prep",
      // `npm start` runs `next start` (see package.json)
      script: "npm",
      args: "start",
      cwd: __dirname,
      instances: 1, // in-memory rate-limit + live-exam sweep assume a single instance
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },

    // Fallback cron: flips live-exam states + publishes results every minute.
    // The app also sweeps opportunistically on traffic, so this only matters
    // during idle periods. Requires CRON_SECRET in the environment.
    {
      name: "aus-prep-cron",
      script: "node",
      args: "scripts/cron-tick.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      cron_restart: "* * * * *", // restart (and thus run once) every minute
      autorestart: false,
      env: { NODE_ENV: "production" },
    },
  ],
};
