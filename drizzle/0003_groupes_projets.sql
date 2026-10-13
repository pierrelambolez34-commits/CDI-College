CREATE TABLE "groupe_eleves" (
	"groupe_id" uuid NOT NULL,
	"eleve_id" uuid NOT NULL,
	CONSTRAINT "groupe_eleves_groupe_id_eleve_id_pk" PRIMARY KEY("groupe_id","eleve_id")
);
--> statement-breakpoint
CREATE TABLE "groupes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projet_groupes" (
	"projet_id" uuid NOT NULL,
	"groupe_id" uuid NOT NULL,
	CONSTRAINT "projet_groupes_projet_id_groupe_id_pk" PRIMARY KEY("projet_id","groupe_id")
);
--> statement-breakpoint
CREATE TABLE "projets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"partenaires" text DEFAULT '' NOT NULL,
	"debut" date NOT NULL,
	"fin" date,
	"classes" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "passages" ADD COLUMN "projet_id" uuid;--> statement-breakpoint
ALTER TABLE "groupe_eleves" ADD CONSTRAINT "groupe_eleves_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupe_eleves" ADD CONSTRAINT "groupe_eleves_eleve_id_eleves_id_fk" FOREIGN KEY ("eleve_id") REFERENCES "public"."eleves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupes" ADD CONSTRAINT "groupes_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projet_groupes" ADD CONSTRAINT "projet_groupes_projet_id_projets_id_fk" FOREIGN KEY ("projet_id") REFERENCES "public"."projets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projet_groupes" ADD CONSTRAINT "projet_groupes_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projets" ADD CONSTRAINT "projets_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "groupe_eleves_eleve_idx" ON "groupe_eleves" USING btree ("eleve_id");--> statement-breakpoint
CREATE INDEX "groupes_college_idx" ON "groupes" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "projets_college_idx" ON "projets" USING btree ("college_id");--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_projet_id_projets_id_fk" FOREIGN KEY ("projet_id") REFERENCES "public"."projets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passages_projet_idx" ON "passages" USING btree ("projet_id");