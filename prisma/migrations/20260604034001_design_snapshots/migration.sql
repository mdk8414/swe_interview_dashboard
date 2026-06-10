-- CreateTable
CREATE TABLE "DesignSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemId" TEXT NOT NULL,
    "name" TEXT,
    "transcript" TEXT NOT NULL,
    "diagramPng" TEXT,
    "diagramLabel" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DesignSnapshot_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "SystemDesignProblem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DesignSnapshot_problemId_createdAt_idx" ON "DesignSnapshot"("problemId", "createdAt");
