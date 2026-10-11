ALTER TABLE "colleges" ADD COLUMN "etape_accueil" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
-- Les collèges existants ont déjà été paramétrés : leur parcours d'accueil est terminé.
UPDATE "colleges" SET "etape_accueil" = 5;