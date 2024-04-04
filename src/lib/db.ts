import { Root, Surreal } from "surrealdb.node";

import { env } from "../env";
import { FieldGuildOptions, TableCharacter, TableLink } from "./typings/database";
import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { ApiError } from "./typings/anilist";

export class Database {
    public client: Surreal;

    constructor() {
        this.client = new Surreal();
    }

    async init() {
        await this.client.connect(env.DATABASE_URL);

        const root: Root = {
            username: env.DATABASE_USERNAME,
            password: env.DATABASE_PASSWORD,
        };

        await this.client.signin(root);

        await this.client.use({ ns: env.DATABASE_NAMESPACE, db: "cardinal" });
    }

    async ensureCharacter(
        interaction: ChatInputCommandInteraction<CacheType>,
        characterId: number
    ): Promise<TableCharacter | ApiError> {
        let character: TableCharacter | undefined = await this.client
            .query("SELECT * FROM character WHERE characterId = $characterId", {
                characterId: characterId,
            })
            .then((query: TableCharacter[]) => {
                return query[0];
            });

        if (!character) {
            const charData = await interaction.client.anilist.getCharacterById(
                characterId
            );

            if ("status" in charData) return charData;

            const query: TableCharacter[] = await this.client.create(
                "character",
                {
                    characterId: charData.id,
                    image: charData.image.large,
                    name: charData.name,
                    siteUrl: charData.siteUrl,
                }
            );

            character = query[0];
        }

        return character;
    }

    async isGuildLinkUnique(
        interaction: ChatInputCommandInteraction<CacheType>
    ) {
        const result: boolean[] = await this.client.query(
            "SELECT VALUE isLinkUnique FROM ONLY guild WHERE guildId = $guildId LIMIT 1;",
            {
                guildId: interaction.guildId,
            }
        );

        return result[0];
    }

    async isCharacterAlreadyLinked(
        interaction: ChatInputCommandInteraction<CacheType>,
        characterId: number
    ) {
        const result: Pick<TableLink, "id">[] = await this.client.query(
            "SELECT id FROM ONLY link WHERE character.characterId = $characterId AND guild.guildId = $guildId LIMIT 1 FETCH character, guild;",
            {
                character: characterId,
                guildId: interaction.guildId,
            }
        );

        return Boolean(result[0]);
    }

    async getCurrentLink(interaction: ChatInputCommandInteraction<CacheType>): Promise<TableLink | undefined> {
        const link: TableLink[] = await this.client.query(
            "SELECT * FROM ONLY link WHERE user.userId = $userId AND guild.guildId = $guildId LIMIT 1 FETCH user, guild, character;",
            {
                userId: interaction.user.id,
                guildId: interaction.guildId,
            }
        );

        return link[0];
    }

    async linkCharacter(
        interaction: ChatInputCommandInteraction<CacheType>,
        characterId: number
    ) {
        const result: TableLink[] = await this.client.query(
            `CREATE ONLY link SET
            guild = type::thing((SELECT VALUE id FROM ONLY guild WHERE guildId = $guild LIMIT 1)),
            user = type::thing((SELECT VALUE id FROM ONLY user WHERE userId = $user LIMIT 1)),
            character = type::thing((SELECT VALUE id FROM ONLY character WHERE characterId = $character LIMIT 1));`,
            {
                guild: interaction.guildId,
                user: interaction.user.id,
                character: characterId,
            }
        );

        return result[0];
    }

    async unlinkCharacter(linkId: string) {
        await this.client.query(
            "DELETE FROM link WHERE id = $linkId;",
            {
                linkId: linkId,
            }
        );
    }

    async setGuildOption(
        interaction: ChatInputCommandInteraction<CacheType>,
        key: FieldGuildOptions,
        value: any
    ) {
        await this.client.query(
            `UPDATE guild SET ${key} = $value WHERE guildId = $guildId;`,
            {
                value: value,
                guildId: interaction.guildId,
            }
        );
    }
}
