-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Teacher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "coursesNames" TEXT NOT NULL DEFAULT '',
    "coursesCompleted" INTEGER DEFAULT 0,
    "rank" TEXT DEFAULT 'Новичок',
    "bonusPoints" INTEGER DEFAULT 0,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "schoolId" INTEGER,
    CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Teacher" ("age", "bonusPoints", "coursesCompleted", "email", "firstName", "id", "lastName", "password", "rank", "role", "schoolId") SELECT "age", "bonusPoints", "coursesCompleted", "email", "firstName", "id", "lastName", "password", "rank", "role", "schoolId" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
