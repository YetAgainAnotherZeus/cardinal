// TODO: implement chalk so that we can have colored logs
// TODO: swap out console.log with pino: https://discordjs.guide/miscellaneous/useful-packages.html#pino

import chalk from "chalk";

export class Logger {
    private shardId: number[] | undefined;

    constructor(shardId: number[] | undefined) {
        this.shardId = shardId;
    }

    log(message: string): void {
        console.log(`${chalk.cyan("[LOG]")}${chalk.magenta(`[#${this.shardId}]`)} ${message}`);
    }

    info(message: string): void {
        console.log(`${chalk.green("[INFO]")}${chalk.magenta(`[#${this.shardId}]`)} ${message}`);
    }

    warn(message: string): void {
        console.log(`${chalk.yellow("[WARN]")}${chalk.magenta(`[#${this.shardId}]`)} ${message}`);
    }

    error(message: string): void {
        console.log(`${chalk.red.bold("[ERROR]")}${chalk.magenta(`[#${this.shardId}]`)} ${message}`);
    }
}
