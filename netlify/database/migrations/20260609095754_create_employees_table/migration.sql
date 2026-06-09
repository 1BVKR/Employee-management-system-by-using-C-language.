CREATE TABLE "employees" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"employee_id" integer NOT NULL UNIQUE,
	"department" text DEFAULT 'General' NOT NULL,
	"role" text DEFAULT 'Staff' NOT NULL,
	"salary" real DEFAULT 0 NOT NULL,
	"leaves_allowed" integer DEFAULT 5 NOT NULL,
	"leaves_taken" integer DEFAULT 0 NOT NULL,
	"leaves_pending" integer DEFAULT 0 NOT NULL,
	"leave_status" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"join_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
