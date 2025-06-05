CREATE TABLE IF NOT EXISTS "job_activity_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "consultant_id" uuid,
  "entity_type" varchar(20) NOT NULL,
  "entity_id" text NOT NULL,
  "action" varchar(50) NOT NULL,
  "details" text,
  "ip_address" varchar(45),
  "timestamp" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "job_activity_logs" 
  ADD CONSTRAINT "job_activity_logs_consultant_id_consultants_id_fk" 
  FOREIGN KEY ("consultant_id") 
  REFERENCES "consultants"("id") 
  ON DELETE set null 
  ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
