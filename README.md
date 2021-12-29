# LSB Discord Bot

A Discord.js bot for the LSB Discord server.

# Roadmap

-   [ ] Economy System for "Param Pupees"

# Dependencies

-   [Node](https://nodejs.org/en/) v16.6 or higher

# Installation (Development)

_Follow these instructions to set up your own development version of the bot._

1. Register your bot on the [Discord Developer Portal](https://discord.com/developers/applications).

    - Intents:
        - Presence
        - Server Members
        - Message Content
    - Permissions:
        - Administrator

2. Invite the bot to your Discord server using the OAuth2 URL Generator with the `bot` scope and `Administrator` bot permission.
3. Clone [this repository](https://github.com/NachoToast/LSB-Discord-Bot).
4. Copy the [`auth.example.json`](./auth.example.json) file.
    1. Rename the copy to [`auth.json`](./auth.json).
    2. Replace the [`devToken`](./auth.example.json#L3) field with the token of the bot you just registered.
5. Use `yarn` to install dependencies.

    ```sh
    $ yarn
    ```

6. Start the bot in development using the provided script.

    ```sh
    $ yarn dev
    ```

-   To start the bot in production, you can use `yarn start` or simply `node .` (make sure you've built first using `yarn build`)
-   If you don't have `yarn` installed, you can install it via `npm` using `npm i -g yarn`
