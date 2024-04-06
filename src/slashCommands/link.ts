import {
    Colors,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../types";
import { handleApiError, handleRenameGuildMember } from "../lib/utils";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("link")
        .setDMPermission(false)
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name of the character")
                .setRequired(true)
                .setAutocomplete(true)
                .setMinLength(2)
        )
        .setDescription("Link to a character"),
    autocomplete: async (interaction) => {
        const name = interaction.options.getFocused();

        const data = await interaction.client.anilist.searchCharactersByName(
            name
        );

        if ("status" in data) {
            return interaction.respond([]);
        }

        interaction.respond(
            data.characters.map((character) => {
                let responseName = `${character.name.full} (${character.media.nodes[0].title.english ?? character.media.nodes[0].title.userPreferred})`;
                responseName = responseName.length > 100 ? responseName.slice(0, 97) + "..." : responseName;
                return {
                    name: responseName,
                    value: character.id.toString(),
                };
            })
        );
    },
    execute: async (interaction) => {
        const stringId = interaction.options.getString("name", true);

        if (Number.isNaN(Number(stringId))) {
            return interaction.reply({
                content: "Invalid character id",
                ephemeral: true,
            });
        }
        const id = Number(stringId);

        const character = await interaction.client.db.ensureCharacter(
            interaction,
            id
        );

        if ("status" in character) {
            return handleApiError(interaction, character);
        }

        const currentLink = await interaction.client.db.getCurrentLink(
            interaction
        );

        if (
            currentLink &&
            typeof currentLink.character === "object" &&
            currentLink.character.characterId === id
        ) {
            return interaction.reply(
                "You are already linked to this character"
            );
        }

        const isGuildLinkUnique = await interaction.client.db.isGuildLinkUnique(
            interaction
        );

        const isCharacterAlreadyLinked = isGuildLinkUnique
            ? await interaction.client.db.isCharacterAlreadyLinked(
                  interaction,
                  id
              )
            : false;

        if (isCharacterAlreadyLinked) {
            return interaction.reply("Character is already linked");
        }

        if (currentLink) await interaction.client.db.unlinkCharacter(currentLink.id);
        await interaction.client.db.linkCharacter(interaction.member as GuildMember, id, character.name.full);

        await handleRenameGuildMember(interaction, character.name.full);

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setDescription(
                `<@${interaction.user.id}> successfully linked to \`${character.name.full}\``
            );

        interaction.reply({
            embeds: [embed],
        });
    },
    cooldown: 1,
};

export default command;
