import { Migration } from '@mikro-orm/migrations';

export class Migration20211113215953 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "rating" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "member" jsonb not null, "reading" jsonb not null, "vote" int4 not null);');

    this.addSql('create table "reading" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null, "author" text not null, "type" text null, "rating" int4 null);');

    this.addSql('create table "user" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "email" text not null, "password" text not null, "name" text not null, "avatar" jsonb not null);');
    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');
  }

}
