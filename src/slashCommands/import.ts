import {
    Colors,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../types";
import { handleApiError, handleRenameGuildMember } from "../lib/utils";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("import")
        .setDescription("Link guild users")
        .addStringOption((option) =>
            option
                .setName("guild")
                .setDescription("The guild to link")
                .setAutocomplete(true)
        )
        .setDMPermission(false),
    autocomplete(interaction) {
        const name = interaction.options.getString("guild", true);

        const guilds = interaction.client.guilds.cache.filter((guild) =>
            guild.name.toLowerCase().includes(name.toLowerCase())
        );

        const response = guilds.map((guild) => {
            const owner = guild.members.cache.get(guild.ownerId);

            return {
                name: `${guild.name} - ${guild.id} (${owner?.user.displayName})`,
                value: guild.id,
            };
        });

        interaction.respond(response);
    },
    execute: async (interaction) => {
        let guildStr = interaction.options.getString("guild");

        if (!guildStr) {
            guildStr = interaction.guildId as string;
        }

        const guild = interaction.client.guilds.cache.get(guildStr);

        if (!guild) {
            return interaction.reply({
                content: "Guild not found",
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle(`Importing guild ${guild.name}`)
            .setDescription("Ensuring all users are in the database");

        await interaction.reply({
            embeds: [embed],
        });

        const guildTable: { add?: string, remove?: string } = await interaction.client.db.getGuildOption(interaction, "role") as { add?: string, remove?: string };

        const members = (await guild.members.fetch()).filter(
            (member) => {
                if (guildTable.add && guildTable.remove) {
                    return !member.user.bot && member.roles.cache.has(guildTable.add) && !member.roles.cache.has(guildTable.remove);
                } else if (guildTable.add) {
                    return !member.user.bot && member.roles.cache.has(guildTable.add);
                } else if (guildTable.remove) {
                    return !member.user.bot && !member.roles.cache.has(guildTable.remove);
                } else {
                    return !member.user.bot;
                }
            }
        );

        const memberArray = Array.from(members.keys());

        const result: { success: string[], failure: string[] } = {
            success: [],
            failure: [],
        };

        for (const [key, member] of members.entries()) {
            embed.setDescription(
                `Importing user ${memberArray.indexOf(key) + 1}/${members.size}`
            );
            await interaction.editReply({
                embeds: [embed],
            });
            await interaction.client.db.ensureUser(member.user);

            if (!member.nickname) return;

            const res = await interaction.client.anilist.searchCharactersByName(
                member.nickname
            );

            if ("status" in res) {
                embed
                    .setDescription(
                        "An error occurred while searching for the character"
                    )
                    .setColor(Colors.Red);
                await interaction.editReply({
                    embeds: [embed],
                });
                return handleApiError(interaction, res);
            }

            if (res.characters.length >= 1) {
                const character = res.characters[0];

                await interaction.client.db.ensureCharacter(
                    interaction,
                    character.id
                );

                await interaction.client.db.linkCharacter(
                    member,
                    character.id,
                    character.name.full
                );

                await handleRenameGuildMember(interaction, character.name.full, member);

                result.success.push(`<@${member.id}>`);
            } else {
                result.failure.push(`<@${member.id}>`);
            }
        }

        embed
            .setColor(Colors.Green)
            .setTitle("Import complete")
            .setDescription(`Linked: ${result.success.join(", ") ?? "None"}\nFailed: ${result.failure.join(", ") ?? "None"}`);
        await interaction.editReply({
            embeds: [embed],
        });
    },
    cooldown: 1,
    devOnly: true,
};

export default command;
