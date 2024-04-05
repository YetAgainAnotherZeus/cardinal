import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CacheType,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../types";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("config")
        .setDMPermission(false)
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("guild-link-unique")
                .setDescription("Toggle if the guild link are unique")
                .addBooleanOption((option) =>
                    option
                        .setName("value")
                        .setDescription("The value to set")
                        .setRequired(true)
                );
        })
        .addSubcommand((subcommand) => {
            return subcommand
                .setName("role")
                .setDescription(
                    "Role to remove and add when a user does the link start"
                )
                .addRoleOption((option) =>
                    option
                        .setName("remove")
                        .setDescription("The role to remove")
                )
                .addRoleOption((option) =>
                    option.setName("add").setDescription("The role to add")
                );
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription("Change the bot's configuration"),
    execute: async (interaction) => {
        const confirmButton = new ButtonBuilder()
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("configConfirmation");

        const cancelButton = new ButtonBuilder()
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("configCancel");

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            confirmButton,
            cancelButton
        );

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setDescription(
                "Are you sure you want to change the configuration?\nUnexpected behavior may occur if you don't know what you're doing."
            );

        const response = await interaction.reply({
            embeds: [embed],
            components: [actionRow],
        });

        const collectorFilter = (i: { user: { id: string } }) =>
            i.user.id === interaction.user.id;

        try {
            const confirmation = await response.awaitMessageComponent({
                filter: collectorFilter,
                time: 60_000,
            });

            if (confirmation.customId === "configCancel") {
                return await interaction.deleteReply();
            } else {
                await handleConfig(interaction);
            }
        } catch (error) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setDescription("No response was given in time."),
                ],
                components: [],
            });
        }
    },
    cooldown: 1,
};

export default command;

async function handleConfig(
    interaction: ChatInputCommandInteraction<CacheType>
) {
    if (interaction.options.getSubcommand() === "guild-link-unique") {
        const value = interaction.options.getBoolean("value", true);
        await interaction.client.db.setGuildOption(
            interaction,
            "isLinkUnique",
            value
        );

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setDescription(`Set \`guild-link-unique\` to \`${value}\``);

        interaction.editReply({
            embeds: [embed],
            components: [],
        });
    } else if (interaction.options.getSubcommand() === "role") {
        const removeRole = interaction.options.getRole("remove");
        const addRole = interaction.options.getRole("add");

        const guildOptionValue: Record<string, string> = {};

        if (removeRole) {
            guildOptionValue["remove"] = removeRole.id;
        }

        if (addRole) {
            guildOptionValue["add"] = addRole.id;
        }

        await interaction.client.db.setGuildOption(
            interaction,
            "role",
            guildOptionValue
        );

        let resultString = "Set ";

        if (removeRole) {
            resultString += `role to remove to <@&${removeRole.id}> `;
        }

        if (removeRole && addRole) {
            resultString += "and ";
        }

        if (addRole) {
            resultString += `role to add to <@&${addRole.id}>`;
        }

        if (!removeRole && !addRole) {
            resultString = "No roles were set.";
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setDescription(resultString);

        interaction.editReply({
            embeds: [embed],
            components: [],
        });
    }
}
