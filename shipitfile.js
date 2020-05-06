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
    // Econ package has deps listed in `devDependencies` so have to install dev dependencies too.
    return shipit.remote(
      `cd ${shipit.releasePath} && npm install --production && npm install --only=dev`
    );
  });

  shipit.blTask("restart-backend", () => {
    return shipit.remote(
      `cd ${shipit.config.deployTo} && pm2 startOrRestart current/ecosystem.config.js`
    );
  });
};
