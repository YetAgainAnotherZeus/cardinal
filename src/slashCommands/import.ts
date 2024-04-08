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

        // const guildTable: Record<string, string> = await interaction.client.db.getGuildOption(guild, "role") as Record<string, string>;

        const fetchedMembers = await guild.members.fetch();

        const members: GuildMember[] = [];

        for (const member of fetchedMembers.values()) {
            if (member.user.bot) {
                interaction.client.logger.info(`Skipping ${member.user.username} as they are a bot`);
                continue;
            }

            if (!member.nickname) {
                interaction.client.logger.info(`Skipping ${member.user.username} as they have no nickname`);
                continue;
            }

            const currentLink = await interaction.client.db.getCurrentLink(member);

            if (currentLink) {
                interaction.client.logger.info(`Skipping ${member.nickname} as they are already linked`);
                continue;
            }

            members.push(member);
        }

        const result: { success: string[], failure: string[] } = {
            success: [],
            failure: []
        };

        for (const [key, member] of members.entries()) {
            embed.setDescription(
                `Importing user ${key + 1}/${members.length}`
            );
            await interaction.editReply({
                embeds: [embed],
            });
            await interaction.client.db.ensureUser(member.user);

            if (!member.nickname) {
                continue;
            }

            const res = await interaction.client.anilist.searchCharactersByName(
                member.nickname
            );

            if ("status" in res) {
                embed
                    .setDescription(
                        `An error occurred while searching for ${member.nickname}. ${key + 1}/${members.length}\n\nLinked(${result.success.length}): ${result.success.join(", ") || "None"}\nFailed(${result.failure.length}): ${result.failure.join(", ") || "None"}\nTotal: ${members.length - result.failure.length - result.success.length} users`
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
                    character
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
            .setDescription(`Linked(${result.success.length}): ${result.success.join(", ") || "None"}\nFailed(${result.failure.length}): ${result.failure.join(", ") || "None"}\nTotal: ${members.length} users`);
        await interaction.editReply({
            embeds: [embed],
        });
    },
    cooldown: 1,
    devOnly: true,
};

export default command;