import { Client, Events } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute: (client: Client) => {
    client.logger.log("🤖 Ensuring all guilds are in the database");
    // client.guilds.cache.forEach(async (guild) => {
    //     await client.db.guild.upsert({
    //         where: {
    //             guildId: Number(guild.id),
    //         },
    //         update: {
    //             name: guild.name,
    //         },
    //         create: {
    //             guildId: Number(guild.id),
    //             name: guild.name,
    //         },
    //     }).catch((e) => {
    //         client.logger.error(e);
    //     });
    // });


    // TODO: Make a logger command and use it here. It should show the shard ids managed by the client.
    // maybe attach the logger to the client object
    client.logger.log(`🤖 Logged in as ${client.user?.tag}`);
  },
};

export default event;
