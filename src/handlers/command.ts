import { Client, Routes, SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { readdirSync } from "fs";
import { join } from "path";
import { SlashCommand } from "../types";
import { env } from "../env";

module.exports = async (client: Client) => {
    const slashCommands: SlashCommandBuilder[] = [];

    const slashCommandsDir = join(__dirname, "../slashCommands");

    readdirSync(slashCommandsDir).forEach((file) => {
        if (!file.endsWith(".js")) return;
        const command: SlashCommand =
            // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic import
            require(`${slashCommandsDir}/${file}`).default;
        slashCommands.push(command.command);
        client.slashCommands.set(command.command.name, command);
    });

    const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

    // await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID), { body: [] })
    //     .then(() => {
    //         client.logger.log("🔥 Successfully cleared all guild slash commands");
    //     })
    //     .catch((e) => {
    //         client.logger.error(e);
    //     });
    // await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: [] })
    //     .then(() => {
    //         client.logger.log("🔥 Successfully cleared all slash commands");
    //     })
    //     .catch((e) => {
    //         client.logger.error(e);
    //     });

    await rest
        .put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
            body: slashCommands.map((command) => command.toJSON()),
        })
        .then((data: any) => {
            // TODO: add type for data
            // console.log(JSON.stringify(data));
            client.logger.log(`🔥 Successfully loaded ${data.length} slash command(s)`);
        })
        .catch((e) => {
            client.logger.error(e);
        });
};
