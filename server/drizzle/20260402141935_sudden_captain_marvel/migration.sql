CREATE TABLE "conversation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conversation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"parent_message_id" integer,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shot" (
	"player1_name" text,
	"player2_name" text,
	"player1_hand" text,
	"player2_hand" text,
	"player1_points" integer,
	"player2_points" integer,
	"player1_games" integer,
	"player2_games" integer,
	"player1_sets" integer,
	"player2_sets" integer,
	"match_date" text,
	"tournament" text,
	"shot_type" smallint,
	"from_court" smallint,
	"shot_code" smallint,
	"direction" smallint,
	"to_court" smallint,
	"depth" smallint,
	"touched_net" smallint,
	"hit_depth" smallint,
	"approach_shot" smallint,
	"shot_outcome" smallint,
	"fault_type" smallint,
	"prev_shot_type" smallint,
	"prev_from_court" smallint,
	"prev_shot_code" smallint,
	"prev_direction" smallint,
	"prev_to_court" smallint,
	"prev_depth" smallint,
	"prev_touched_net" smallint,
	"prev_hit_depth" smallint,
	"prev_approach" smallint,
	"prev_outcome" smallint,
	"prev_fault_type" smallint,
	"pp_shot_type" smallint,
	"pp_from_court" smallint,
	"pp_shot_code" smallint,
	"pp_direction" smallint,
	"pp_to_court" smallint,
	"pp_depth" smallint,
	"pp_touched_net" smallint,
	"pp_hit_depth" smallint,
	"pp_approach" smallint,
	"pp_outcome" smallint,
	"pp_fault_type" smallint,
	"url" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL UNIQUE,
	"password" text NOT NULL UNIQUE,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "fk_message_parent" FOREIGN KEY ("parent_message_id") REFERENCES "message"("id") ON UPDATE CASCADE;