import { join } from "node:path";
import { readdirSync, lstatSync } from "node:fs";
import { InitOptions } from "i18next";
import { FsBackendOptions } from "i18next-fs-backend";

export const backendOptions: InitOptions<FsBackendOptions> = {
    // debug: true,
    initImmediate: false,
    fallbackLng: "en",
    lng: "en",
    preload: readdirSync(join(__dirname, "../i18n/locales")).filter((file) => {
        const joinedPath = join(join(__dirname, "../i18n/locales"), file);
        const isDirectory = lstatSync(joinedPath).isDirectory();
        return isDirectory;
    }),
    ns: "common",
    defaultNS: "common",
    backend: {
        loadPath: join(__dirname, "../i18n/locales/{{lng}}/{{ns}}.json"),
    }
};