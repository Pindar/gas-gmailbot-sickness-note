# Sickness Note Google App Script

> This script act as GMailBot and auto replys to sickness notes with some get well messages.

*Note: you need to have the recognition service as API running somewhere else.*

## Development

1. Install dependencies `npm i`
2. Setup clasp `npm run login`, create `.clasp.json` (see [example.clasp.json](./example.clasp.json)) and create `appscript.json` (see [example.appscript.json](./example.appscript.json))
3. Do changes in [main.ts](./main.ts)
4. Push changes with `npm run push`
5. Deploy changes with `npm run deploy`
