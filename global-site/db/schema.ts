import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const leads = sqliteTable('leads', { id:text('id').primaryKey(), name:text('name').notNull(), phone:text('phone').notNull(), program:text('program').notNull(), createdAt:text('created_at').notNull() });
