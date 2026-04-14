ALTER TABLE `user_settings` ADD COLUMN `auto_import_enabled` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_settings` ADD COLUMN `auto_import_source_path` text;
--> statement-breakpoint
ALTER TABLE `user_settings` ADD COLUMN `auto_import_library_root` text;
--> statement-breakpoint
ALTER TABLE `user_settings` ADD COLUMN `auto_import_rename_enabled` integer DEFAULT 1 NOT NULL;
