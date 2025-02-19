import { expect, Page } from "@playwright/test";
import PlaywrightWrapper from "../helper/wrapper/PlaywrightWrappers";
import * as dotenv from 'dotenv';
dotenv.config();

export default class AuthenticationPage {
    private base: PlaywrightWrapper
    constructor(private page: Page) {
        this.base = new PlaywrightWrapper(page);
    }

    private Elements = {
        menuLisa: "L!SA",
        menuIris: "",
        menuParalog: "Paralog",
    }


    async EnterAndClickAuthKey() {
      const key = process.env.AUTH_KEY;
      await this.page.getByPlaceholder('XXXX-XXXX-XXXX-XXXX').click();
      await this.page.getByPlaceholder('XXXX-XXXX-XXXX-XXXX').fill(key);
      await this.page.getByRole('button', { name: 'Log In' }).click();
    }
  }
