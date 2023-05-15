import chalk from "chalk";

import sodium from "sodium-native";

const buffer = Buffer.allocUnsafe(sodium.crypto_secretbox_KEYBYTES);
sodium.randombytes_buf(buffer);

const hexKey = buffer.toString("hex");

console.log(``);
console.log(`${chalk.magenta("swan-partner-frontend")}`);
console.log(`${chalk.white("---")}`);
console.log("you can paste the following key in the root .env file:");
console.log(``);
console.log(hexKey);
console.log(`${chalk.white("---")}`);

export {};
