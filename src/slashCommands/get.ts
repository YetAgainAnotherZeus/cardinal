import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { characterCard } from "../lib/embeds";
import { handleApiError } from "../lib/utils";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("get")
        .addIntegerOption((option) =>
            option
                .setName("id")
                .setDescription("The id of the character")
                .setRequired(true)
                .setAutocomplete(true)
                .setMinValue(1)
        )
        .setDescription("Get a character by id"),
    autocomplete: async (interaction) => {
        const id = interaction.options.getFocused();

        if (!id) {
            return interaction.respond([]);
        }

        const data = await interaction.client.anilist.getCharacterById(
            Number(id)
        );

        if ("status" in data) {
            return interaction.respond([]);
        }

        let nameAndTitle = `${data.name.full} (${data.media.nodes[0].title.english ?? data.media.nodes[0].title.userPreferred})`;

        if (nameAndTitle.length > 100) {
            nameAndTitle = nameAndTitle.slice(0, 97) + "...";
        }

        interaction.respond([
            {
                name: nameAndTitle,
                value: data.id,
            },
        ]);
    },
    execute: async (interaction) => {
        const id = interaction.options.getInteger("id", true);
        const character = await interaction.client.anilist.getCharacterById(id);

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
