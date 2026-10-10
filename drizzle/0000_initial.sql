CREATE TYPE "public"."role" AS ENUM('superadmin', 'admin', 'utilisateur');--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"uai" text NOT NULL,
	"commune" text DEFAULT '' NOT NULL,
	"annee_scolaire" text NOT NULL,
	"types_plage" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "colleges_uai_unique" UNIQUE("uai")
);
--> statement-breakpoint
CREATE TABLE "eleves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"prenom" text NOT NULL,
	"division" text NOT NULL,
	"niveau" text NOT NULL,
	"cle" text NOT NULL,
	"actif" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motifs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"libelle" text NOT NULL,
	"ordre" smallint NOT NULL,
	"actif" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"eleve_id" uuid NOT NULL,
	"motif_id" uuid NOT NULL,
	"type_plage" text NOT NULL,
	"jour" date NOT NULL,
	"minute" integer NOT NULL,
	"saisi_par" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"jour" smallint NOT NULL,
	"debut" smallint NOT NULL,
	"fin" smallint NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid,
	"email" text NOT NULL,
	"nom" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motifs" ADD CONSTRAINT "motifs_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_eleve_id_eleves_id_fk" FOREIGN KEY ("eleve_id") REFERENCES "public"."eleves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_motif_id_motifs_id_fk" FOREIGN KEY ("motif_id") REFERENCES "public"."motifs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_saisi_par_users_id_fk" FOREIGN KEY ("saisi_par") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plages" ADD CONSTRAINT "plages_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "eleves_college_idx" ON "eleves" USING btree ("college_id","actif");--> statement-breakpoint
CREATE UNIQUE INDEX "eleves_unicite" ON "eleves" USING btree ("college_id","cle","division");--> statement-breakpoint
CREATE INDEX "motifs_college_idx" ON "motifs" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "passages_college_jour_idx" ON "passages" USING btree ("college_id","jour");--> statement-breakpoint
CREATE INDEX "passages_eleve_idx" ON "passages" USING btree ("eleve_id");--> statement-breakpoint
CREATE INDEX "plages_college_idx" ON "plages" USING btree ("college_id","jour");