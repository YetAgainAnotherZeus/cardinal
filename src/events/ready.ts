import { Client, Events } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
    name: Events.ClientReady,
    once: true,
    execute: async (client: Client) => {
        client.logger.log("🤖 Ensuring all guilds are in the database");
        for (const guild of client.guilds.cache.values()) {
            await client.db.ensureGuild(guild);
        }

        // TODO: Make a logger command and use it here. It should show the shard ids managed by the client.
        // maybe attach the logger to the client object
        client.logger.log(`🤖 Logged in as ${client.user?.tag}`);
    },
};

export default event;
