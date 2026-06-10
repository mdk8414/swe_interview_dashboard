-- CreateTable
CREATE TABLE "AICredential" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "apiKey" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DesignConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DesignConversation_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "SystemDesignProblem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "diagramLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DesignMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "DesignConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignConversation_problemId_key" ON "DesignConversation"("problemId");

-- CreateIndex
CREATE INDEX "DesignMessage_conversationId_createdAt_idx" ON "DesignMessage"("conversationId", "createdAt");
