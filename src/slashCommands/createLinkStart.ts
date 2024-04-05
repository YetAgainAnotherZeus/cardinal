import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("create_link_start")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .setDescription("Create a link start for your server"),
    execute: async (interaction) => {
        const doesWelcomeMessageExist =
            await interaction.client.db.linkStartExists(interaction);
        
        if (doesWelcomeMessageExist) {
            // ignore this part of the code because discord.js is just broken
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await interaction.client.channels.cache
                    .get(doesWelcomeMessageExist.channel)
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    .messages.fetch(doesWelcomeMessageExist.message)
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    .then((message) => message.delete());
            } catch (error) {
                interaction.client.logger.warn("No link start found");
            }
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle("Hey, to access this server click the button below.")
            .setDescription(
                "**Note:** By clicking the button below you agree to the rules of the server and Discord's Terms of Service."
            );
        
        const startButton = new ButtonBuilder()
            .setLabel("Link Start")
            .setCustomId("linkStartButton")
            .setEmoji("784802400715407370")
            .setStyle(ButtonStyle.Primary);
        
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(startButton);

        const message = await interaction.channel?.send({
            embeds: [embed],
            components: [actionRow],
        });

        if (!message) {
            return;
        }
        await interaction.client.db.setLinkStart(interaction, message.id);

        await interaction.reply({
            content: "Successfully set the link start!",
            ephemeral: true,
        });
    },
    cooldown: 1,
};

export default command;
