import { Message } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
  name: "messageUpdate",
  execute: async (oldMessage: Message, newMessage: Message) => {
    newMessage.client.logger.log(
      `Message updated: ${newMessage.content} (was: ${oldMessage.content})`
    );
  },
};

export default event;
