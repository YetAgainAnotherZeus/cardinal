import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { characterCard } from "../lib/embeds";
import { autocompleteCharacterSearch, handleApiError } from "../lib/utils";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("search")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name of the character")
                .setRequired(true)
                .setAutocomplete(true)
                .setMinLength(2)
        )
        .setDescription("Search for a character"),
    autocomplete: autocompleteCharacterSearch,
    execute: async (interaction) => {
        const string_id = interaction.options.getString("name", true);
        const character = await interaction.client.anilist.getCharacterById(
            Number(string_id)
        );

        if ("status" in character) {
            return handleApiError(interaction, character);
        }

        const embed = characterCard(character);

        interaction.reply({
            embeds: [embed],
        });
    },
    cooldown: 1,
};

export default command;
