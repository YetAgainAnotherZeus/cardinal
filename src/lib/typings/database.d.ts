export type TableRecord<T> = T | string;

export interface TableGuild {
    id: string;
    guildId: string;
    name: string;
    isLinkUnique: boolean;
}

export interface TableUser {
    id: string;
    userId: string;
    name: string;
    displayName: string | undefined;
}

export interface TableCharacter {
    id: string;
    characterId: number;
    name: {
        full: string;
        native: string;
        userPreferred: string;
        alternative: string[];
        alternativeSpoiler: string[];
    };
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

export type FieldGuildOptions = "isGuildLinkUnique";