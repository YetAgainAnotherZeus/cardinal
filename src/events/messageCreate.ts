import { Events, Message } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
  name: Events.MessageCreate,
  execute: async (message: Message) => {
    // message.client.logger.log(`Message received: ${message.content}`);
  },
};

export default event;
