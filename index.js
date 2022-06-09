require("dotenv").config();
const debug = require("debug")("teebot");
const Discord = require("discord.js");
const DiscordTypes = require("discord-api-types/v9");
const TeeworldsEcon = require("teeworlds-econ/build/TwEconClient");
const memoize = require("lodash.memoize");
const debounce = require("lodash.debounce");

/*
 * Settings.
 */

let FRIDAY_MODE_ENABLED = false;
const CHANNEL_MAPPING = { 0: "RED", 1: "BLUE", 3: "general" };

/*
 * Initialize connections.
 */

const bot = new Discord.Client({
  token: process.env.DISCORD_TOKEN,
  intents: [Discord.Intents.FLAGS.GUILDS],
});
bot.login().catch(console.error);
bot.on("ready", () => console.log("Discord bot connected."));

const econ = new TeeworldsEcon.TwEconClient(
  process.env.TEEWORLDS_HOST,
  process.env.TEEWORLDS_PORT,
  process.env.TEEWORLDS_SECRET
);
econ
  .connect()
  .then(() => console.log("Econ connected."))
  .catch((e) => console.error("Connecting econ failed.", e));

/*
 * Listen for Teeworlds events.
 */

econ.on("game.team_join", (e) => {
  if (FRIDAY_MODE_ENABLED === false)
    debouncedChangeTeam(e.clientName, e.teamId);
});

econ.on("chat.chat", (e) => {
  const command =
    e.text && typeof e.text === "string" && e.text.charAt(0) === "!"
      ? e.text.substring(1)
      : null;

  if (!command) return;

  switch (command) {
    case "fridaymode":
      toggleFridayMode().catch(console.error);
  }
});

/*
 * Actions.
 */

async function changeTeam(playerName, teamId) {
  const guild = await getGuild();
  if (!guild) return;

  const channelId = getVoiceChannelId(guild, teamId);
  if (!channelId) return;

  const member = getMemberByPlayerName(guild, playerName);
  if (member) return setMemberVoiceChannel(member, channelId);
}

async function moveAllMembers(teamId) {
  const guild = await getGuild();
  if (!guild) return;

  const channelId = getVoiceChannelId(guild, teamId);
  if (!channelId) return;

  const members = guild.members.cache;
  members.forEach((m) => setMemberVoiceChannel(m, channelId));
}

async function toggleFridayMode() {
  if (FRIDAY_MODE_ENABLED === false) {
    FRIDAY_MODE_ENABLED = true;
    await moveAllMembers(3);
    econ.send("broadcast Teebot: Friday Mode is now activated!");
  } else {
    FRIDAY_MODE_ENABLED = false;
    econ.send("broadcast Teebot: Friday Mode is now disabled.");
  }

  debug("friday mode set: %b", FRIDAY_MODE_ENABLED);
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

/**
 * @return {Promise<Discord.Guild>}
 */
const getGuild = () => {
  return bot.guilds.fetch(process.env.DISCORD_GUILD_ID);
};

/**
 * @param {Discord.Guild} guild
 * @param {string} playerName
 *
 * @return {Discord.GuildMember|undefined}
 */
const getMemberByPlayerName = (guild, playerName) => {
  const members = guild.members.cache;

  return members.find(
    (m) =>
      (m.nickname && m.nickname.toLowerCase() === playerName.toLowerCase()) ||
      m.user.username.toLowerCase() === playerName.toLowerCase()
  );
};

/**
 * @param {Discord.Guild} guild
 * @param {number} teamId
 *
 * @return {Discord.Snowflake|null}
 */
const getVoiceChannelId = (guild, teamId) => {
  const channel = guild.channels.cache.find(
    (channel) =>
      channel.name.includes(CHANNEL_MAPPING[teamId]) &&
      channel.type === "GUILD_VOICE" // DiscordTypes.ChannelTypes.GUILD_VOICE
  );

  return channel && channel.id ? channel.id : null;
};

/**
 * @param {Discord.GuildMember} member
 * @param {Discord.Snowflake} channelId
 *
 * @return Promise<void>
 */
const setMemberVoiceChannel = async (member, channelId) => {
  try {
    await member.voice.setChannel(channelId);
  } catch (e) {
    console.error("Changing member channel failed.", e);
  }
};

const debouncedChangeTeam = memoizeDebounce(changeTeam, 2000);
