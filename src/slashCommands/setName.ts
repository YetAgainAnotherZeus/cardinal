import { Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { handleRenameGuildMember } from "../lib/utils";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("set-name")
        .addBooleanOption((option) =>
            option
                .setName("show-spoiler-names")
                .setDescription("Whether to show alternative names")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name to change to")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDescription("Search for a character"),
    autocomplete: async (interaction) => {
        // get names from character
        const showSpoilerNames = interaction.options.getBoolean(
            "show-spoiler-names"
        );
        const currentLink = await interaction.client.db.getCurrentLink(
            interaction
        );

        if (!currentLink) {
            return interaction.respond([]);
        }
        if (typeof currentLink.character === "string") {
            return interaction.respond([]);
        }

        const characterNames = currentLink.character.name;
        const names: string[] = [];

        Object.entries(characterNames)
            .filter((entry) => entry[0] !== "alternativeSpoiler")
            .forEach((entry: [string, string | string[]]) => {
                if (typeof entry[1] === "string") {
                    names.push(entry[1]);
                } else {
                    names.push(...entry[1]);
                }
            });
        if (showSpoilerNames) {
            names.push(...characterNames.alternativeSpoiler);
        }

        interaction.respond(
            names.map((name) => {
                return {
                    name,
                    value: name,
                };
            })
        );
    },
    execute: async (interaction) => {
        // set the chosen name
        const name = interaction.options.getString("name", true);

        const currentLink = await interaction.client.db.getCurrentLink(
            interaction
        );

        if (!currentLink) {
            return interaction.reply({
                content: "No link start found",
                ephemeral: true,
            });
        }

        if (typeof currentLink.character === "string") {
            return interaction.reply({
                content: "No character found",
                ephemeral: true,
            });
        }

        await handleRenameGuildMember(interaction, name);

        await interaction.client.db.setLinkName(currentLink.id, name);

        const embed = new EmbedBuilder().setColor(Colors.Blue).setDescription(`Name set to ${name}`);

        interaction.reply({
            embeds: [embed],
        });
    },
    cooldown: 1,
};

export default command;
