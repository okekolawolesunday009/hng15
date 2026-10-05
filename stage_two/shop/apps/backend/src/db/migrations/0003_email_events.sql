CREATE TABLE "email_events" (
	"event_key" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"user_id" uuid,
	"recipient" text NOT NULL,
	"status" text DEFAULT 'sending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "email_events_status_check" CHECK ("email_events"."status" in ('sending', 'sent', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;