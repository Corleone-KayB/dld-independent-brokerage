-- Developer.slug is added while the table is still empty (Phase 2 just introduced it),
-- so a required unique column can be added directly without a backfill step.
ALTER TABLE "Developer" ADD COLUMN "slug" TEXT NOT NULL;

CREATE UNIQUE INDEX "Developer_slug_key" ON "Developer"("slug");
