import {
    SlashCommandBuilder,
    Collection,
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    ModalSubmitInteraction,
    ButtonInteraction,
    type Events
} from "discord.js";
import { Logger } from "./lib/logger";
import { i18nInstance } from "./lib/i18n";
import type { Anilist } from "./lib/anilist";
import { Database } from "./lib/db";

export interface SlashCommand {
    command: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => void;
    autocomplete?: (interaction: AutocompleteInteraction) => void;
    modal?: (interaction: ModalSubmitInteraction<CacheType>) => void;
    cooldown?: number; // in seconds
}

export interface ComponentButtonInteraction {
    customId: string;
    execute: (interaction: ButtonInteraction) => void;
}

interface GuildOptions {
    prefix: string;
}

export type GuildOption = keyof GuildOptions;
export interface BotEvent {
    name: Events;
    once?: boolean | false;
    execute: (...args) => void;
}

declare module "discord.js" {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>;
        buttons: Collection<string, ComponentButtonInteraction>;
        commands: Collection<string, Command>;
        cooldowns: Collection<string, number>;
        logger: Logger;
        i18n: i18nInstance;
        db: Database;
        anilist: Anilist;
    }
}
