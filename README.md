# JSON-UI Dumper

You can choose the version you want to see:

- [Preview](https://theoristmc.github.io/JSON-UI-Dumper/?version=preview)
- [Stable](https://theoristmc.github.io/JSON-UI-Dumper/?version=stable)

Dumps all available elements seen on the vanilla UI, generated based on the latest bedrock samples.

## Roadmap

- Better code format for the JSON dumps.
- Allow users to switch across multiple versions.
- Migrate from JS to TS.
- ~~Dumps all properties with accuracies~~

## Contributing

### Frontend

- Install the necessary modules, run `npm i` in the CLI.
- For testing, start a dev server by running `npm run dev`.

### Backend

- The backend uses Deno. Install deno in your system first.
- A local machine can't access the prod backend, therefore, you need to run a local one.
  - Start by creating an `.env` file inside the `server/` folder and create the following keys:
    - `GITHUB_TOKEN` — You can input your own fine-grained token here; no permissions is fine.
    - `ENVIRONMENT` — The value of this key should be equal to `development`.
  - To start the server, run `deno run --allow-net --allow-env --unstable-kv  --env-file=server/.env server/main.ts` in the CLI.

## Special Thanks

[@MinecraftBedrockArabic](https://github.com/MinecraftBedrockArabic) — for both indirectly and directly helping me with the CSS.