// init I18next
// t function that takes a language and a key and returns a string
import i18next from "i18next";
import { backendOptions } from "../i18n/settings";
import I18NexFsBackend from "i18next-fs-backend";

export class i18nInstance {
  private i18nInstance;

  constructor() {
    this.i18nInstance = this.initI18next();
  }

  private initI18next = () => {
    const i18nInstance = i18next.createInstance();
    i18nInstance.use(I18NexFsBackend).init(backendOptions);

    return i18nInstance;
  };

  public t = (language: string, key: string, variables?: Record<string, string>): string => {
    return this.i18nInstance.t(key, { lng: language, variables });
  };
}
