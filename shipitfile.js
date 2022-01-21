require("dotenv").config();

module.exports = (shipit) => {
  require("shipit-deploy")(shipit);
  require("shipit-shared")(shipit);

  shipit.initConfig({
    default: {
      keepReleases: 2,
      deployTo: process.env.SHIPIT_FOLDER,
      repositoryUrl: process.env.REPOSITORY_URL,
      shared: {
        overwrite: true,
        files: [".env", "ecosystem.config.js"],
      },
    },
    production: {
      servers: process.env.SHIPIT_PROD_SERVER,
    },
  });

  shipit.on("published", () =>
    shipit.start(["install-backend", "restart-backend"])
  );

  shipit.blTask("install-backend", () => {
    return shipit.remote(
      `cd ${shipit.releasePath} && npm install --production`
    );
  });

  shipit.blTask("restart-backend", () => {
    return shipit.remote(
      `cd ${shipit.config.deployTo} && pm2 startOrRestart current/ecosystem.config.js`
    );
  });
};
