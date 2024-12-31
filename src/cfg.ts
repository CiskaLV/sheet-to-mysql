import { z } from "zod";

const levelSchema = z.object({
    column: z.string(),
    columnID: z.number(),
    dbKey: z.string(),
    levels: z.array(z.string()),
});

type levelSchemaType = z.infer<typeof levelSchema>;

const configSchema = z.object({
    east: z.object({
        spreadsheetID: z.string(),
        sheet: z.string(),
        playerIdColumn: z.number(),
        statusColumn: z.string(),
        statusColumnID: z.number(),
        rank: levelSchema,
    }),
    west: z.object({
        spreadsheetID: z.string(),
        sheet: z.string(),
        playerIdColumn: z.number(),
        statusColumn: z.string(),
        statusColumnID: z.number(),
        rank: levelSchema,
        constab: levelSchema,
    }),
    independent: z.object({
        spreadsheetID: z.string(),
        sheet: z.string(),
        playerIdColumn: z.number(),
        statusColumn: z.string(),
        statusColumnID: z.number(),
        rank: levelSchema,
    }),
});

const getConfig = async () => {
    const file = Bun.file("./sheet-cfg.json");
    const cfg = await file.json();
    const parsed = configSchema.safeParse(cfg);

    if (!parsed.success) {
        console.error("❌ Invalid Cfg File:", JSON.stringify(parsed.error.format(), null, 4));
        process.exit(1);
    }

    return parsed.data;
};

export { getConfig, type levelSchemaType };
