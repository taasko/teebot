require("dotenv").config();
const Discord = require("discord.js");
const TeeworldsEcon = require("@w3groupfinland/teeworlds-econ");

const bot = new Discord.Client({ token: process.env.DISCORD_TOKEN });
const econ = new TeeworldsEcon(
  process.env.TEEWORLDS_HOST,
  process.env.TEEWORLDS_PORT,
  process.env.TEEWORLDS_SECRET
);

/*
 * Initialize connections.
 */

bot.login();
bot.on("ready", () => console.log("Discord bot connected."));

econ.connect();
econ.on("online", () => console.log("Teeworlds econ connected."));

/*
 * Listen for Teeworlds events.
 */

econ.on("enter", (e) => {
  changeTeam(e.player, e.team);
});

econ.on("team_join", (e) => {
  changeTeam(e.player, e.team);
});

/*
 * Actions.
 */

const CTF_TEAM_MAPPING = { 0: "RED", 1: "BLUE" };

function changeTeam(playerName, teamId) {
  bot.guilds.cache.forEach((guild) => {
    const members = guild.members.cache;
    const member = members.find((member) => member.nickname === playerName);

    if (member) {
      const channels = guild.channels.cache;
      const teamChannelId = channels.find((channel) =>
        channel.name.includes(CTF_TEAM_MAPPING[teamId])
      ).id;

      if (teamChannelId) {
        member.voice.setChannel(teamChannelId);
      }
    }
  });
}
