import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { BotEvent } from "../types";

module.exports = (client: Client) => {
  const eventsDir = join(__dirname, "../events");

  readdirSync(eventsDir).forEach((file) => {
    if (!file.endsWith(".js")) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic import
    const event: BotEvent = require(`${eventsDir}/${file}`).default;
    event.once
      ? client.once(event.name.toString(), (...args) => event.execute(...args))
      : client.on(event.name.toString(), (...args) => event.execute(...args));
    client.logger.log(`🌠 Successfully loaded event ${event.name}`);
  });
};
