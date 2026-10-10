CREATE TYPE "public"."statut_demande" AS ENUM('en_attente', 'acceptee', 'refusee');--> statement-breakpoint
CREATE TABLE "demandes_college" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"ville" text NOT NULL,
	"code_postal" text NOT NULL,
	"academie" text NOT NULL,
	"uai" text,
	"email_documentaliste" text NOT NULL,
	"statut" "statut_demande" DEFAULT 'en_attente' NOT NULL,
	"college_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"traitee_le" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jetons" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "colleges" ALTER COLUMN "uai" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ADD COLUMN "code_postal" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ADD COLUMN "academie" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "demandes_college" ADD CONSTRAINT "demandes_college_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jetons" ADD CONSTRAINT "jetons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demandes_statut_idx" ON "demandes_college" USING btree ("statut");