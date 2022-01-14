# LSB Discord Bot

A Discord.js bot for the LSB Discord server.

# Roadmap

-   [ ] Economy system for "Param Pupees"
-   [x] Levelling system like Mee6
-   [x] Guild specific configuration

# Dependencies

-   [Node JS](https://nodejs.org/en/) 16.13.1 or higher

# Installation

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
5. Open a terminal and use `yarn` to install dependencies.

    ```sh
    $ yarn
    ```

6. Start the bot in development using the provided script.

    ```sh
    $ yarn dev
    ```

-   To start the bot in production, you can use `yarn start` or simply `node .`
    -   Make sure you've run `yarn build` first, and have a `token` configured in [`config.json`](./config.json)
-   If you don't have `yarn` installed, you can install it via `npm` using `npm i -g yarn`

# Levels

If you want user levels to carry over from when Mee6 was in use, you can run the porting script using `yarn port`.

You'll need to enter the ID of the server, and make sure Mee6 hasn't left it yet.

Once you do this, you'll see a message about loading legacy data when you start the bot.

After you've started it once (in development or production), you can safely delete the `archive` folder.
