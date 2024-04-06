import {
    Colors,
    EmbedBuilder,
    GuildMember,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../types";
import {
    autocompleteCharacterSearch,
    handleApiError,
    handleRenameGuildMember,
} from "../lib/utils";
import { TableGuild } from "../lib/typings/database";
import { Character } from "../lib/typings/anilist";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("force-link")
        .setDescription("Force link a user")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to link")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name of the character to link")
                .setAutocomplete(true)
        )
        .setDMPermission(false),
    autocomplete: autocompleteCharacterSearch,
    execute: async (interaction) => {
        const user = interaction.options.getUser("user", true);
        const member = await interaction.guild?.members.fetch(user.id) as GuildMember;
        const name = interaction.options.getString("name");

        const response = await interaction.deferReply();

        if (name) {
            // force link specific character
            if (Number.isNaN(Number(name))) {
                return response.edit({
                    content: "Invalid character id",
                });
            }
            const id = Number(name);

            const character = await interaction.client.db.ensureCharacter(
                interaction,
                id
            );

            if ("status" in character) {
                return handleApiError(interaction, character);
            }

            const currentLink = await interaction.client.db.getCurrentLink(
                member
            );

            if (
                currentLink &&
                typeof currentLink.character === "object" &&
                currentLink.character.characterId === id
            ) {
                return response.edit(
                    "You are already linked to this character"
                );
            }

            const isGuildLinkUnique =
                await interaction.client.db.isGuildLinkUnique(interaction);

            const isCharacterAlreadyLinked = isGuildLinkUnique
                ? await interaction.client.db.isCharacterAlreadyLinked(
                      interaction,
                      id
                  )
                : false;

            if (isCharacterAlreadyLinked) {
                return response.edit("Character is already linked");
            }

            if (currentLink)
                await interaction.client.db.unlinkCharacter(currentLink.id);
            await interaction.client.db.linkCharacter(
                member as GuildMember,
                id,
                character.name.full
            );

            await handleRenameGuildMember(
                interaction,
                character.name.full,
                member
            );

            const embed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setDescription(
                    `<@${member.user.id}> successfully linked to \`${character.name.full}\``
                );

            response.edit({
                embeds: [embed],
            });
        } else {
            // force link random character
            const lastCharacterId =
                await interaction.client.anilist.getLatestCharacterId();

            if (typeof lastCharacterId === "object") {
                return handleApiError(interaction, lastCharacterId);
            }

            const res: TableGuild[] = await interaction.client.db.client.query(
                "SELECT * FROM guild WHERE guildId = $guildId",
                {
                    guildId: interaction.guildId,
                }
            );
            const tableGuild = res[0];

            let character: Character | undefined;
            do {
                const characterId = Math.floor(Math.random() * lastCharacterId);

                if (tableGuild.options.isLinkUnique) {
                    const isCharacterAlreadyLinked =
                        await interaction.client.db.isCharacterAlreadyLinked(
                            interaction,
                            characterId
                        );

                    if (isCharacterAlreadyLinked) {
                        continue;
                    }
                }
                const res = await interaction.client.anilist.getCharacterById(
                    characterId
                );

                if ("status" in res) {
                    if (res.status === 404) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                        );
                        continue;
                    } else {
                        return handleApiError(interaction, res);
                    }
                }

                character = res;
            } while (!character);

            await interaction.client.db.ensureCharacter(
                interaction,
                character.id
            );

            await handleRenameGuildMember(interaction, character.name.full, member);

            const currentLink = await interaction.client.db.getCurrentLink(
                member as GuildMember
            );
            if (currentLink)
                await interaction.client.db.unlinkCharacter(currentLink.id);
            await interaction.client.db.linkCharacter(
                member,
                character.id,
                character.name.full
            );

            if (
                tableGuild.options.role?.remove &&
                interaction.guild
            ) {
                const role = interaction.guild.roles.cache.get(
                    tableGuild.options.role.remove
                );
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await member.roles.remove(role);
            }

            if (
                tableGuild.options.role?.add &&
                interaction.guild
            ) {
                const role = interaction.guild.roles.cache.get(
                    tableGuild.options.role.add
                );
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await member.roles.add(role);
            }

            const embed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setDescription(
                    `<@${member.user.id}>, You are now linked to \`${character.name.full}\``
                );

            response.edit({
                embeds: [embed],
            });
        }
    },
    cooldown: 1,
};

export default command;
