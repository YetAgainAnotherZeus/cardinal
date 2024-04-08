import { Root, Surreal } from "surrealdb.node";

import { env } from "../env";
import { FieldGuildOptions, TableCharacter, TableLink } from "./typings/database";
import { APIInteractionGuildMember, APIUser, BaseInteraction, CacheType, Guild, GuildMember, User } from "discord.js";
import { ApiError, Character } from "./typings/anilist";

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

    async ensureGuild(guild: Guild) {
        let guildExists: { guildId: string }[] = await this.client.query(
            "SELECT guildId FROM guild WHERE guildId = $guildId",
            {
                guildId: guild.id,
            }
        );

        if (!guildExists.length) {
            guildExists = await this.client.create("guild", {
                guildId: guild.id,
                name: guild.name,
            });
        }

        return guildExists[0];
    }

    async ensureUser(user: User | APIUser) {
        let res: { userId: string }[] = await this.client.query(
            "SELECT userId FROM user WHERE userId = $userId",
            {
                userId: user.id,
            }
        );

        if (!res.length) {
            res = await this.client.create("user", {
                userId: user.id,
                name: user.username,
                displayName: "displayName" in user ? user.displayName : user.global_name || "",
            });
        }

        return res[0];
    }

    async ensureCharacter(
        interaction: BaseInteraction<CacheType>,
        character: number | Character,
    ): Promise<TableCharacter | ApiError> {
        let tableCharacter: TableCharacter | undefined = await this.client
            .query("SELECT * FROM character WHERE characterId = $characterId", {
                characterId: typeof character === "object" ? character.id : character,
            })
            .then((query: TableCharacter[]) => {
                return query[0];
            });

        if (!tableCharacter) {
            const charData = typeof character === "object" ? character : await interaction.client.anilist.getCharacterById(
                character
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

            tableCharacter = query[0];
        }

        return tableCharacter;
    }

    async isGuildLinkUnique(
        interaction: BaseInteraction<CacheType>
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
        interaction: BaseInteraction<CacheType>,
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

    async getCurrentLink(member: GuildMember): Promise<TableLink | undefined> {
        const link: TableLink[] = await this.client.query(
            "SELECT * FROM ONLY link WHERE user.userId = $userId AND guild.guildId = $guildId LIMIT 1 FETCH user, guild, character;",
            {
                userId: member.user.id,
                guildId: member.guild.id,
            }
        );

        return link[0];
    }

    async linkCharacter(
        member: GuildMember | APIInteractionGuildMember,
        characterId: number,
        characterName: string
    ) {
        member = member as GuildMember;
        const result: TableLink[] = await this.client.query(
            `CREATE ONLY link SET
            guild = type::thing((SELECT VALUE id FROM ONLY guild WHERE guildId = $guild LIMIT 1)),
            user = type::thing((SELECT VALUE id FROM ONLY user WHERE userId = $user LIMIT 1)),
            character = type::thing((SELECT VALUE id FROM ONLY character WHERE characterId = $character LIMIT 1)),
            name = $name;`,
            {
                guild: member.guild.id,
                user: member.user.id,
                character: characterId,
                name: characterName,
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

    async setLinkName(linkId: string, name: string) {
        await this.client.query(
            "UPDATE link SET name = $name WHERE id = $linkId;",
            {
                linkId: linkId,
                name: name,
            }
        );
    }

    async getGuildOption(
        guild: Guild,
        key: FieldGuildOptions
    ) {
        const result: unknown[] = await this.client.query(
            `SELECT VALUE options.${key} FROM ONLY guild WHERE guildId = $guildId LIMIT 1;`,
            {
                guildId: guild.id,
            }
        );

        return result[0];
    }

    async setGuildOption(
        interaction: BaseInteraction<CacheType>,
        key: FieldGuildOptions,
        value: any
    ) {
        await this.client.query(
            `UPDATE guild SET options.${key} = $value WHERE guildId = $guildId;`,
            {
                value: value,
                guildId: interaction.guildId,
            }
        );
    }

    async linkStartExists(
        interaction: BaseInteraction<CacheType>
    ) {
        const result: { channel: string, message: string }[] = await this.client.query(
            "SELECT VALUE options.linkStart FROM ONLY guild WHERE guildId = $guildId LIMIT 1;",
            {
                guildId: interaction.guildId,
            }
        );

        return result[0];
    }

    async setLinkStart(
        interaction: BaseInteraction<CacheType>,
        messageId: string
    ) {
        await this.client.query(
            "UPDATE guild SET options.linkStart = { channel: $channelId, message: $messageId } WHERE guildId = $guildId;",
            {
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                messageId: messageId,
            }
        );
    }
}
