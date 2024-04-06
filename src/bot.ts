import { Client, Collection, GatewayIntentBits } from "discord.js";
import { env } from "./env";
import { readdirSync } from "fs";
import { join } from "path";
import { ComponentButtonInteraction, SlashCommand } from "./types";
import { Logger } from "./lib/logger";
import { i18nInstance } from "./lib/i18n";
import { Database } from "./lib/db";
import { Anilist } from "./lib/anilist";

(async () => {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
        ],
    });

    client.slashCommands = new Collection<string, SlashCommand>();
    client.buttons = new Collection<string, ComponentButtonInteraction>();
    client.cooldowns = new Collection<string, number>();

    client.logger = new Logger(client.shard?.ids);
    client.i18n = new i18nInstance();

    const dbclient = new Database();
    await dbclient.init();
    
    client.db = dbclient;
    client.anilist = new Anilist({ maxRequests: 1, perMilliseconds: 750 });

    const handlersDir = join(__dirname, "./handlers");
    readdirSync(handlersDir).forEach((handler) => {
        if (!handler.endsWith(".js") && !handler.endsWith(".ts")) return;
        // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic import
        require(`${handlersDir}/${handler}`)(client);
    });

    client.login(env.DISCORD_TOKEN);
})();
