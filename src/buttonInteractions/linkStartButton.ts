import { Colors, EmbedBuilder } from "discord.js";
import { Character } from "../lib/typings/anilist";
import { TableGuild } from "../lib/typings/database";
import { handleApiError, handleRenameGuildMember } from "../lib/utils";
import { ComponentButtonInteraction } from "../types";

const button: ComponentButtonInteraction = {
    customId: "linkStartButton",
    execute: async (interaction) => {
        const lastCharacterId = await interaction.client.anilist.getLatestCharacterId();

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
                const isCharacterAlreadyLinked = await interaction.client.db.isCharacterAlreadyLinked(interaction, characterId);

                if (isCharacterAlreadyLinked) {
                    continue;
                }
            }

            const res = await interaction.client.anilist.getCharacterById(
                characterId
            );

            if ("status" in res) {
                if (res.status === 404) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    continue;
                } else {
                    return handleApiError(interaction, res);
                }
            }

            character = res;
        } while (!character);

        await interaction.client.db.ensureCharacter(interaction, character.id);

        await handleRenameGuildMember(interaction, character.name.userPreferred);

        if (tableGuild.options.role?.remove && interaction.member && interaction.guild) {
            const role = interaction.guild.roles.cache.get(tableGuild.options.role.remove);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await interaction.member.roles.remove(role);
        }

        if (tableGuild.options.role?.add && interaction.member && interaction.guild) {
            const role = interaction.guild.roles.cache.get(tableGuild.options.role.add);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await interaction.member.roles.add(role);
        }

        const embed = new EmbedBuilder()
            .setDescription(
                `<@${interaction.user.id}>, You are now linked to \`${character.name.userPreferred}\``
            );

        const message = await interaction.channel?.send({
            embeds: [embed],
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await message?.delete();
    },
};

export default button;