import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    BaseInteraction,
    CacheType,
    Colors,
    CommandInteractionOption,
    EmbedBuilder,
    GuildMember,
} from "discord.js";
import { ApiError } from "./typings/anilist";
import chalk from "chalk";

export async function handleApiError(
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
    const message = await interaction.channel?.send({
        embeds: [embed],
    });
    if (message) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await message.delete();
    }
}

export async function handleRenameGuildMember(
    interaction: BaseInteraction<CacheType>,
    nickname: string,
    member?: GuildMember
) {
    if (interaction.member instanceof GuildMember && member === undefined) {
        try {
            await interaction.member.setNickname(nickname, "Character link");
        } catch (error) {
            interaction.client.logger.error(
                `${chalk.blue(
                    `[G#${interaction.guildId}][U#${interaction.user.id}]`
                )} Can't set nickname to ${chalk.green(`[${nickname}]`)}`
            );
        }
    } else if (member) {
        try {
            await member.setNickname(nickname, "Character link");
        } catch (error) {
            interaction.client.logger.error(
                `${chalk.blue(
                    `[G#${interaction.guildId}][U#${interaction.user.id}]`
                )} Can't set nickname to ${chalk.green(`[${nickname}]`)}`
            );
        }
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
                case ApplicationCommandOptionType.String:
                    return `${option.name}:"${option.value}"`;
                default:
                    return `${option.name}:${option.value}`;
            }
        })
        .join(", ");

    return `[${options}]`;
}

export async function autocompleteCharacterSearch(interaction: AutocompleteInteraction<CacheType>) {
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
}