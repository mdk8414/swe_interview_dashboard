-- CreateTable
CREATE TABLE "LeetCodeProblem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "acRate" REAL
);

-- CreateTable
CREATE TABLE "LeetCodeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL,
    CONSTRAINT "LeetCodeSubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "LeetCodeProblem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeetCodeCredential" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "sessionCookie" TEXT NOT NULL,
    "csrfToken" TEXT NOT NULL,
    "username" TEXT,
    "lastSyncAt" DATETIME
);

-- CreateTable
CREATE TABLE "SystemDesignProblem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Diagram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sceneJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Diagram_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "SystemDesignProblem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BehavioralCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BehavioralQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCommon" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "BehavioralQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BehavioralCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BehavioralAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "projectTag" TEXT,
    "situation" TEXT NOT NULL DEFAULT '',
    "task" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BehavioralAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "BehavioralQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LeetCodeProblem_slug_key" ON "LeetCodeProblem"("slug");

-- CreateIndex
CREATE INDEX "LeetCodeSubmission_problemId_submittedAt_idx" ON "LeetCodeSubmission"("problemId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemDesignProblem_slug_key" ON "SystemDesignProblem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralCategory_name_key" ON "BehavioralCategory"("name");
