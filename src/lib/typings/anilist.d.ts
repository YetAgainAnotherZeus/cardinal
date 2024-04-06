export interface Data<T> {
    data: T
}

export interface SearchResponse<T> {
    Page: T
}

export interface GetResponse {
    Character: Character,
}

export interface Character {
    id: number;
    name: {
        full: string;
        native: string;
        userPreferred: string;
        alternative: string[];
        alternativeSpoiler: string[];
    };
    image: {
        large: string;
    };
    media: {
        nodes: {
            id: number;
            title: {
                english: string;
                romaji: string;
                native: string;
                userPreferred: string;
            };
            format: string;
        }[];
    };
    siteUrl: string;
}

export interface CharacterSearch {
    pageInfo: {
        total: number;
    };
    characters: Character[];
}

export interface ApiError {
    status: number;
    statusText: string;
}

export interface LastCharacterId {
    Page: {
        pageInfo: {
            total: number;
        };
        characters: {
            id: number;
        }[];
    };
}