import { Hono } from "hono";
import db from "~/db";
import { playersTable } from "./db/schema";
import { getConfig, levelSchemaType } from "~/cfg";
import { auth, sheets } from "@googleapis/sheets";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { rateLimiter } from "hono-rate-limiter";

function nToAZ(n: number): string {
    let a: number;
    return (a = Math.floor(n / 26)) >= 0 ? nToAZ(a - 1) + String.fromCharCode(65 + (n % 26)) : "";
}

const app = new Hono();

const cfg = await getConfig();

const authGoogle = new auth.GoogleAuth({ keyFile: "credentials.json", scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const sheetsClient = sheets({ version: "v4", auth: authGoogle });

app.get("/", (c) => {
    return c.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
})
    .use(
        rateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            limit: 15,
            standardHeaders: "draft-6",
            keyGenerator: (c) => c.req.path ?? "",
        })
    )
    .get("/cfg", (c) => {
        return c.json(cfg);
    })
    .get("/:set", async (c) => {
        const params = z.object({ set: z.enum(["east", "west", "independent"]) }).safeParse(c.req.param());
        const query = z
            .object({
                debug: z
                    .string()
                    .transform((value) => {
                        if (value === "true") {
                            return true;
                        } else if (value === "false") {
                            return false;
                        } else {
                            throw new Error("The string must be 'true' or 'false'");
                        }
                    })
                    .optional(),
            })
            .parse(c.req.query());

        if (!params.success) {
            return c.json({ error: "Invalid set." }, 400);
        }

        const { set } = params.data;

        const { spreadsheetID, sheet, playerIdColumn, statusColumnID, ...other } = cfg[set];

        const sheetData = await sheetsClient.spreadsheets.values.get(
            {
                spreadsheetId: spreadsheetID,
                range: sheet,
            },
            { responseType: "json" }
        );

        if (!sheetData.data.values) return c.json({ error: "No data." }, 400);

        const data = sheetData.data.values
            .filter((row) => z.string().regex(new RegExp("7656119[0-9]{10}")).safeParse(row[playerIdColumn]).success)
            .map((row) => {
                const setObj: { [key: string]: string } = {};

                for (const [unit, { columnID, levels }] of Object.entries(other)) {
                    if (unit === "constab") {
                        setObj[(cfg[set][unit as keyof (typeof cfg)[typeof set]] as levelSchemaType).dbKey] = row[columnID] || "N/A";
                        continue;
                    }
                    setObj[(cfg[set][unit as keyof (typeof cfg)[typeof set]] as levelSchemaType).dbKey] = (
                        levels.indexOf(row[columnID]) === -1 ? 0 : levels.indexOf(row[columnID])
                    ).toString();
                }

                return {
                    playerID: row[playerIdColumn],
                    setObj,
                };
            });

        let sheetUpdate: { playerId: string; outCome: string }[] = [];

        await db.transaction(async (tx) => {
            // let returnData = [];
            for (const { playerID, setObj } of data) {
                const player = await tx.select({ playerid: playersTable.playerid }).from(playersTable).where(eq(playersTable.playerid, playerID));
                if (player.length === 0) {
                    sheetUpdate.push({ playerId: playerID, outCome: "Player not found" });
                    continue;
                }
                const pla = await tx.update(playersTable).set(setObj).where(eq(playersTable.playerid, playerID));
                // returnData.push(pla);
                sheetUpdate.push({ playerId: playerID, outCome: "Player updated" });
            }
            // return returnData;
        });

        let toBeUpdated: { value: string[][]; range: string }[] = [];
        let toBeCleared: string[] = [];

        sheetData.data.values.forEach((row, index) => {
            const playerID = row[playerIdColumn];
            const playerIndex = sheetUpdate.findIndex((v) => v.playerId === playerID);
            if (playerIndex !== -1) {
                toBeUpdated.push({ value: [[sheetUpdate[playerIndex].outCome]], range: `${sheet}!${nToAZ(statusColumnID)}${index + 1}` });
            }
        });

        sheetsClient.spreadsheets.values.batchUpdate({
            spreadsheetId: spreadsheetID,
            requestBody: { valueInputOption: "USER_ENTERED", data: toBeUpdated.map((v) => ({ range: v.range, values: v.value })) },
        });
        sheetsClient.spreadsheets.values.batchClear({ spreadsheetId: spreadsheetID, requestBody: { ranges: toBeCleared } });

        if (query.debug) {
            return c.json({ data, sheetUpdate });
        }
        return c.json({ success: true });
    });

export default app;
