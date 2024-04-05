import {
    ApplicationCommandOptionType,
    BaseInteraction,
    CacheType,
    Colors,
    CommandInteractionOption,
    EmbedBuilder,
    GuildMember,
} from "discord.js";
import { ApiError } from "./typings/anilist";
import chalk from "chalk";

export function handleApiError(
    interaction: BaseInteraction<CacheType>,
    error: ApiError
) {
    interaction.client.logger.error(
        `${chalk.blue(
            `[G#${interaction.guildId}] [U#${interaction.user.id}]`
        )} An error occurred while requesting the api: ${chalk.green(
            `[${error.status} - ${error.statusText}]`
        )}`
    );

    let helpMessage: string | undefined;
    switch (error.status) {
        case 404:
            helpMessage =
                "Please wait for a result to show up in the autocomplete.";
            break;
        case 429:
            helpMessage = "Rate limit hit. Please try again in a few seconds.";
            break;
        case 500:
            helpMessage =
                "It seems like the api is down. Please try again later.";
            break;
        default:
            break;
    }

    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(
            `Error: ${error.statusText} (${error.status})${
                helpMessage ? `\n${helpMessage}` : ""
            }`
        );
    return interaction.channel?.send({
        embeds: [embed],
    });
}

export async function handleRenameGuildMember(
    interaction: BaseInteraction<CacheType>,
    nickname: string
) {
    let failMessage;
    if (interaction.member instanceof GuildMember) {
        try {
            await interaction.member.setNickname(nickname);
        } catch (error) {
            interaction.client.logger.error(
                `${chalk.blue(
                    `[G#${interaction.guildId}][U#${interaction.user.id}]`
                )} Can't set nickname to ${chalk.green(`[${nickname}]`)}`
            );
            failMessage = await interaction.channel?.send("Failed to set nickname");
        }
    } else {
        failMessage = await interaction.channel?.send("Failed to set nickname");
    }

    if (failMessage) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await failMessage.delete();
    }
}

export function displayInteractionOption(
    optionsData: readonly CommandInteractionOption<CacheType>[]
): string {
    const options = optionsData
        .map((option) => {
            switch (option.type) {
                case ApplicationCommandOptionType.Subcommand:
                    return `${option.name}:${displayInteractionOption(
                        option.options ?? []
                    )}`;
                default:
                    return `${option.name}:${option.value}`;
            }
        })
        .join(", ");

    return `[${options}]`;
}
