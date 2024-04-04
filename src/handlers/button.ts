import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { ComponentButtonInteraction } from "../types";

module.exports = (client: Client) => {
    const buttonsDir = join(__dirname, "../buttonInteractions");
  
    readdirSync(buttonsDir).forEach((file) => {
      if (!file.endsWith(".js")) return;
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic import
      const button: ComponentButtonInteraction = require(`${buttonsDir}/${file}`).default;
      client.buttons.set(button.customId, button);
    });
    client.logger.log(`🔥 Successfully loaded ${client.buttons.size} button interaction(s)`);
  };
  