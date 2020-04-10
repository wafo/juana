const Discord = require("discord.js");
const logger = require("../logger");

const tokenDiscord = process.env["DISCORD_TOKEN"];

const client = new Discord.Client();

client.on("ready", () => {
  logger.juana("I am ready, mijo!");
});

client.on("message", (message) => {
  if (message.content.startsWith("ping")) {
    message.channel.send("pong");
  }
});

client.on("error", (error) => {
  console.error(error);
});

if (tokenDiscord) {
  logger.server("Initializing Juana");
  client.login(tokenDiscord);
} else {
  logger.error("DISCORD_TOKEN not available");
  process.exit();
}
