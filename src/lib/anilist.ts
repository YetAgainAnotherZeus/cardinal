import axios from "axios";
import rateLimit, {
    type rateLimitOptions,
    RateLimitedAxiosInstance,
} from "axios-rate-limit";
import { Collection } from "discord.js";
import {
    ApiError,
    Character,
    CharacterSearch,
    Data,
    GetResponse,
    LastCharacterId,
    SearchResponse,
} from "./typings/anilist";

export const queries = {
    get: {
        character:
            "query ($search: Int) { Character(id: $search) { id name { full native userPreferred alternative alternativeSpoiler } image { large } media(sort: POPULARITY_DESC, perPage: 1) { nodes { id title { english romaji native userPreferred } format } } siteUrl } }",
        media: "query ($search: Int) { Media(id: $search) { id isAdult title { english romaji native userPreferred } type format status nextAiringEpisode { airingAt timeUntilAiring episode } season seasonYear episodes duration chapters volumes source coverImage { large } genres averageScore studios { nodes { name isAnimationStudio } } externalLinks { id site url } siteUrl } }",
        studio: "query ($search: Int) { Studio(id: $search) { id name isAnimationStudio media(sort: POPULARITY_DESC, perPage: 3) { nodes { id title { english romaji native userPreferred } format siteUrl } } favourites siteUrl } } ",
        voiceActor: "query ($search: Int) { }",
        lastCharacterId:
            "query { Page(page: 0, perPage: 1) { pageInfo { total } characters(sort: ID_DESC) { id } } }",
    },
    search: {
        character:
            "query ($search: String) { Page(perPage: 25) { pageInfo { total } characters(search: $search) { id name { full native userPreferred alternative alternativeSpoiler } image { large } media(sort: POPULARITY_DESC, perPage: 1) { nodes { format title { english romaji native userPreferred } } } siteUrl } } }",
        media: "query ($search: String) { Page(perPage: 25) { pageInfo { total } media(search: $search) { id isAdult title { english romaji native userPreferred } type format status coverImage { large } genres meanScore siteUrl } } }",
        studio: "query ($search: String) { Page(perPage: 25) { pageInfo { total } studios(search: $search) { id name isAnimationStudio media(sort: POPULARITY_DESC, perPage: 3){ nodes { id title { english romaji native userPreferred } format siteUrl } } favourites siteUrl } } } ",
        voiceActor: "query ($search: String) { }",
    },
};

export class Anilist {
    private axios: RateLimitedAxiosInstance;
    private characterCache = new Collection<number, Character>();

    constructor(options: rateLimitOptions = { maxRPS: 1 }) {
        this.axios = rateLimit(axios.create(), options);
    }

    addCharacterToCache(character: Character): void {
        if (this.characterCache.has(character.id)) return;

        this.characterCache.set(character.id, character);
    }

    async searchCharactersByName(name: string): Promise<CharacterSearch | ApiError> {
        const res: Data<SearchResponse<CharacterSearch>> | ApiError = await this.axios
            .post(
                "https://graphql.anilist.co",
                JSON.stringify({
                    query: queries.search.character,
                    variables: { search: name },
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
            .then((res) => res.data)
            .catch((err) => {
                return {
                    status: err.response.status,
                    statusText: err.response.statusText,
                };
            });
        
        if ("status" in res) return res;

        res.data.Page.characters.forEach((character) => {
            this.addCharacterToCache(character);
        });

        return res.data.Page;
    }

    async getCharacterById(id: number): Promise<Character | ApiError> {
        if (this.characterCache.has(id))
            return this.characterCache.get(id) as Character;

        const res: Data<Pick<GetResponse, "Character">> | ApiError = await this.axios
            .post(
                "https://graphql.anilist.co",
                JSON.stringify({
                    query: queries.get.character,
                    variables: { search: id },
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
            .then((res) => res.data)
            .catch((err) => {
                return {
                    status: err.response.status,
                    statusText: err.response.statusText,
                };
            });
        
        if ("status" in res) return res;

        this.addCharacterToCache(res.data.Character);

        return res.data.Character;
    }

    async getLatestCharacterId(): Promise<number | ApiError> {
        const res: Data<LastCharacterId> | ApiError = await this.axios
            .post(
                "https://graphql.anilist.co",
                JSON.stringify({
                    query: queries.get.lastCharacterId,
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
            .then((res) => res.data)
            .catch((err) => {
                return {
                    status: err.response.status,
                    statusText: err.response.statusText,
                };
            });

        if ("status" in res) return res;

        return res.data.Page.characters[0].id;
    }
}
