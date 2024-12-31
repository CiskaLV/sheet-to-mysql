import { mysqlEnum, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const playersTable = mysqlTable("players", {
    playerid: varchar({ length: 64 }).notNull(),

    //Police Level
    coplevel: mysqlEnum(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]).default("0").notNull(),
    polConstab: mysqlEnum(["Command", "Patrol Command", "Patrol", "Academy Command", "Academy", "N/A"]).default("N/A").notNull(),

    //Medic Level
    mediclevel: mysqlEnum(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]).default("0").notNull(),

    //Blackwater Level
    bwLevel: mysqlEnum(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]).default("0").notNull(),
});
