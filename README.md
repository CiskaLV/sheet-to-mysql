# Deploying

### Requirements

-   `src/db/schema.ts` should be updated with your database schema
-   `src/cfg.ts` should be updated with your configuration format for the `sheet-cfg.json` file
-   `credentials.json`
-   `sheet-cfg.json`
-   envirement veriable `DATABASE_URL` for the database connection string

### Setup

-   Format for `sheet-cfg.json` file

```json
{
    "east": {
        "spreadsheetID": "[Spreadsheet ID]",
        "sheet": "[Sheet name]",
        "playerIdColumn": [Column number],
        "statusColumn": "[status column letter]",
        "statusColumnID": [status column number],
        "rank": {
            "column": "[rank column letter]",
            "columnID": [rank column number],
            "dbKey": "[rank db key]",
            "levels": ["N/A"]
        }
    },
    "west": {...},
    "independent": {...}
}
```

Anything other then `spreadsheetID`, `sheet`, `playerIdColumn`, `statusColumn`, `statusColumnID` is treated as a rank/wl level.
The `constab` is special and not as other ranks as it is a value to value not a value to index.

-   Obtain a `credentials.json` file from the google cloud console with access to google sheets api.

-   Fill in the `src/db/schema.ts` with your database schema

```typescript
export const playersTable = mysqlTable("players", {
    playerid: varchar({ length: 64 }).notNull(),

    whatever: mysqlEnum(["0", "1"]).default("0").notNull(),
});
```

-   Fill in the `src/cfg.ts` with your configuration format for the `sheet-cfg.json` file

```typescript
const configSchema = z.object({
    east: z.object({}),
    west: z.object({
        whatever: levelSchema,
    }),
    independent: z.object({}),
});
```

# Running in Docker

## Build

```bash
docker build -t <image-name> .
```

## Run

`docker-compose.yml`

```yaml
services:
    web:
        image: <image-name>
        ports:
            - 3000:3000/tcp
        environment:
            - DATABASE_URL=
        volumes:
            - ./credentials.json:/usr/app/credentials.json:ro
            - ./sheet-cfg.json:/usr/app/sheet-cfg.json:ro
```

# Development

### Requirements

-   [Bun](https://bun.sh/)

### Setup

-   ```bash
    bun install
    ```
-   `credentials.json` and `sheet-cfg.json` should be in the root directory
-   copy the `.env.example` to `.env` and fill in the database connection string

### Running

```bash
bun run dev
```
