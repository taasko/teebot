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

  shipit.on("published", () => shipit.start(["install", "restart"]));

  shipit.blTask("install", () => {
    return shipit.remote(`npm install --production`, {
      cwd: shipit.releasePath,
    });
  });

  shipit.blTask("restart", () => {
    return shipit.remote(`pm2 startOrRestart current/ecosystem.config.js`, {
      cwd: shipit.config.deployTo,
    });
  });
};
