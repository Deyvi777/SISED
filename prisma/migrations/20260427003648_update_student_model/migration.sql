/*
  Warnings:

  - Added the required column `fullName` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "studentId" TEXT NOT NULL,
    "ci" TEXT,
    "gender" TEXT,
    "course" TEXT,
    "birthDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Student" ("birthDate", "createdAt", "email", "firstName", "id", "isActive", "lastName", "studentId", "updatedAt") SELECT "birthDate", "createdAt", "email", "firstName", "id", "isActive", "lastName", "studentId", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");
CREATE UNIQUE INDEX "Student_ci_key" ON "Student"("ci");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
