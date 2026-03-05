ALTER TABLE "Campaign"
ADD COLUMN "assessmentMonth" VARCHAR(7);

UPDATE "Campaign"
SET "assessmentMonth" = TO_CHAR(DATE_TRUNC('month', COALESCE("startedAt", "createdAt")), 'YYYY-MM')
WHERE "assessmentMonth" IS NULL;

ALTER TABLE "Campaign"
ALTER COLUMN "assessmentMonth" SET NOT NULL;

CREATE INDEX "Campaign_assessmentMonth_idx" ON "Campaign"("assessmentMonth");
