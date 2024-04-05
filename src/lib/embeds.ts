import { Colors, EmbedBuilder } from "discord.js";
import { Character } from "./typings/anilist";

export const characterCard = (character: Character): EmbedBuilder => {
    const alternativeNames = character.name.alternative.concat(character.name.alternativeSpoiler.map((name) => `||${name}||`));

    return new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`${character.name.full} (${character.name.native})`)
        .setURL(`${character.siteUrl}`)
        .setDescription(
            `${character.media.nodes[0].title.english ?? character.media.nodes[0].title.userPreferred} (${character.media.nodes[0].format})`,
        )
        .addFields(
            {
                name: "Alternative names",
                value: alternativeNames.join(", ") || "None",
            },
        )
        .setFooter({
            text: `ID: ${character.id}`,
        })
        .setImage(`${character.image.large}`);
};