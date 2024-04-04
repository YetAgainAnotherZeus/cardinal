import { Message } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
  name: "messageCreate",
  execute: async (message: Message) => {
    // message.client.logger.log(`Message received: ${message.content}`);
  },
};

export default event;
