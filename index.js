require("dotenv").config();
const Discord = require("discord.js");
const TeeworldsEcon = require("teeworlds-econ-api/build/TwEconClient");
const memoize = require("lodash/memoize");
const debounce = require("lodash/debounce");

/*
 * Initialize connections.
 */

const bot = new Discord.Client({ token: process.env.DISCORD_TOKEN });
bot.login();
bot.on("ready", () => console.log("Discord bot connected."));

const econ = new TeeworldsEcon.TwEconClient(
  process.env.TEEWORLDS_HOST,
  process.env.TEEWORLDS_PORT,
  process.env.TEEWORLDS_SECRET
);
econ.connect();

/*
 * Listen for Teeworlds events.
 */

econ.on("game.team_join", (e) => {
  debouncedChangeTeam(e.clientName, e.teamId);
});

/*
 * Actions.
 */

const CTF_TEAM_MAPPING = { 0: "RED", 1: "BLUE" };

function memoizeDebounce(func, wait = 0, options = {}) {
  const mem = memoize(() => debounce(func, wait, options), options.resolver);

  return function () {
    mem.apply(this, arguments).apply(this, arguments);
  };
}

function changeTeam(playerName, teamId) {
  bot.guilds.cache.forEach((guild) => {
    const members = guild.members.cache;
    const member = members.find(
      (m) =>
        m.nickname.toLowerCase() === playerName.toLowerCase() ||
        m.user.username.toLowerCase() === playerName.toLowerCase()
    );

    if (member) {
      const channels = guild.channels.cache;
      const channel = channels.find((channel) =>
        channel.name.includes(CTF_TEAM_MAPPING[teamId])
      );

      if (channel && channel.id) {
        try {
          member.voice.setChannel(channel.id);
        } catch (e) {
          console.error("Changing member channel failed.", e);
        }
      }
    }
  });
}

const debouncedChangeTeam = memoizeDebounce(changeTeam, 2000);
