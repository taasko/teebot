require("dotenv").config();
const Discord = require("discord.js");
const TeeworldsEcon = require("teeworlds-econ-api/build/TwEconClient");
const memoize = require("lodash/memoize");
const debounce = require("lodash/debounce");

/*
 * Settings.
 */
let FRIDAY_MODE_ENABLED = false;
const CHANNEL_MAPPING = { 0: "RED", 1: "BLUE", 3: "general" };

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
econ
  .connect()
  .then(() => {
    console.log("Econ connected.");
  })
  .catch((e) => console.error("Connecting econ failed.", e));

/*
 * Listen for Teeworlds events.
 */

econ.on("game.team_join", (e) => {
  if (FRIDAY_MODE_ENABLED === false) {
    debouncedChangeTeam(e.clientName, e.teamId);
  }
});

econ.on("chat.chat", (e) => {
  if (e.text && typeof e.text === "string" && e.text.charAt(0) === "!") {
    if (e.text === "!tbot fridaymode on") {
      FRIDAY_MODE_ENABLED = true;
      moveAllMembers(3);
      econ.send("broadcast Teebot: Friday Mode activated!");
    } else if (e.text === "!tbot fridaymode off") {
      FRIDAY_MODE_ENABLED = false;
      econ.send("broadcast Teebot: Friday Mode disabled.");
    }
  }
});

/*
 * Actions.
 */

async function changeTeam(playerName, teamId) {
  const guild = await getGuild();

  if (guild) {
    const channelId = getVoiceChannelId(guild, teamId);

    if (channelId) {
      const member = getMemberByPlayerName(guild, playerName);

      if (member) {
        setMemberVoiceChannel(member, channelId);
      }
    }
  }
}

async function moveAllMembers(teamId) {
  const guild = await getGuild();

  if (guild) {
    const channelId = getVoiceChannelId(guild, teamId);

    if (channelId) {
      const members = getVoiceConnectedMembers(guild);

      members.forEach((m) => setMemberVoiceChannel(m, channelId));
    }
  }
}

/*
 * Helpers.
 */

function memoizeDebounce(func, wait = 0, options = {}) {
  const mem = memoize(() => debounce(func, wait, options), options.resolver);

  return function () {
    mem.apply(this, arguments).apply(this, arguments);
  };
}

const getGuild = () => {
  return bot.guilds.fetch(process.env.DISCORD_GUILD_ID);
};

const getMemberByPlayerName = (guild, playerName) => {
  const members = getVoiceConnectedMembers(guild);

  return members.find(
    (m) =>
      (m.nickname && m.nickname.toLowerCase() === playerName.toLowerCase()) ||
      m.user.username.toLowerCase() === playerName.toLowerCase()
  );
};

const getVoiceConnectedMembers = (guild) => {
  return guild.members.cache.filter((m) => memberIsConnectedToVoice(m));
};

const getVoiceChannelId = (guild, teamId) => {
  const channel = guild.channels.cache.find(
    (channel) =>
      channel.name.includes(CHANNEL_MAPPING[teamId]) && channel.type === "voice"
  );

  return channel && channel.id ? channel.id : null;
};

const setMemberVoiceChannel = (member, channelId) => {
  try {
    member.voice.setChannel(channelId);
  } catch (e) {
    console.error("Changing member channel failed.", e);
  }
};

const memberIsConnectedToVoice = (member) => member.voice.channelID;

const debouncedChangeTeam = memoizeDebounce(changeTeam, 2000);
