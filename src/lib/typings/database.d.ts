export type TableRecord<T> = T | string;

export interface TableGuildOptionsLinkStart {
    channel: string;
    message: string;
}

export interface TableGuildOptionsRole {
    remove: string;
    add: string;
}

export interface TableGuildOptions {
    isLinkUnique: boolean;
    linkStart: TableGuildOptionsLinkStart | undefined;
    role: TableGuildOptionsRole | undefined;
}

export interface TableGuild {
    id: string;
    guildId: string;
    name: string;
    options: TableGuildOptions;
}

export interface TableUser {
    id: string;
    userId: string;
    name: string;
    displayName: string | undefined;
}

export interface TableCharacterName {
    full: string;
    native: string;
    userPreferred: string;
    alternative: string[];
    alternativeSpoiler: string[];
}

export interface TableCharacter {
    id: string;
    characterId: number;
    name: TableCharacterName;
    image: string;
    siteUrl: string;
}

export interface TableLink {
    id: string;
    guild: TableRecord<TableGuild>;
    user: TableRecord<TableUser>;
    character: TableRecord<TableCharacter>;
    date: string;
}

export interface TableLinkHistory {
    id: string;
    guild: TableRecord<TableGuild>;
    user: TableRecord<TableUser>;
    character: TableRecord<TableCharacter>;
    from: string;
    to: string;
}

export type FieldGuildOptions = "isLinkUnique" | "linkStart" | "role";