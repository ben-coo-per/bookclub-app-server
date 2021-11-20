import { Field, Float, Int, ObjectType, registerEnumType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Rating } from "./Rating";

export enum ReadingType {
  play = "play",
  novel = "novel",
  nonFiction = "nonFiction",
}
registerEnumType(ReadingType, {
  name: "ReadingType",
  description: "The different options for the type of reading",
  valuesConfig: {},
});

@ObjectType({
  description:
    "A Reading the club has completed. Could be a book, article, play, etc.",
})
@Entity()
export class Reading extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  author!: string;

  @Field(() => ReadingType, { nullable: true })
  @Column({ type: "enum", enum: ReadingType, nullable: true })
  type?: ReadingType;

  @OneToMany(() => Rating, (rating) => rating.reading, {
    eager: true,
  })
  @JoinTable()
  ratings: Rating[];

  @Field(() => Float, { nullable: true })
  @Column({ type: "float", nullable: true })
  avgRating?: number;

  @Field()
  @Column({ default: true })
  currentlyReading: boolean;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  // @Field(() => [Meeting])
  // @ManyToMany(() => Meeting, "reading", { owner: true })
  // meetings = new Collection<Meeting>(this);

  // @Field(() => String, { nullable: true })
  // @Property({ type: "date", nullable: true })
  // dateOfFirstMeeting: Date;

  // @Field(() => String, { nullable: true })
  // @Property({ type: "date", nullable: true })
  // dateOfLastMeeting: Date;
}
