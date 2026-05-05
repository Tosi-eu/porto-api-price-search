-- Cria o schema dedicado ao cache de preços do price-search.
CREATE SCHEMA IF NOT EXISTS "pricing";

-- CreateEnum
CREATE TYPE "pricing"."PriceItemType" AS ENUM ('medicine', 'input');

-- CreateTable
CREATE TABLE "pricing"."cached_price" (
    "id" SERIAL NOT NULL,
    "itemType" "pricing"."PriceItemType" NOT NULL,
    "nameCanonical" VARCHAR(500) NOT NULL,
    "dosageCanonical" VARCHAR(200) NOT NULL DEFAULT '',
    "unitCanonical" VARCHAR(50) NOT NULL DEFAULT '',
    "nameOriginal" VARCHAR(500) NOT NULL,
    "dosageOriginal" VARCHAR(200),
    "unitOriginal" VARCHAR(50),
    "averagePrice" DECIMAL(10,2),
    "sources" VARCHAR(255),
    "pricesPerSource" JSONB,
    "lastAttemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSucceededAt" TIMESTAMP(3),
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_cached_price_canonical"
    ON "pricing"."cached_price"("itemType", "nameCanonical", "dosageCanonical", "unitCanonical");

CREATE INDEX "idx_cached_price_last_succeeded" ON "pricing"."cached_price"("lastSucceededAt");
CREATE INDEX "idx_cached_price_last_attempted" ON "pricing"."cached_price"("lastAttemptedAt");
