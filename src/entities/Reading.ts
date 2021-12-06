import { Field, Float, Int, ObjectType, registerEnumType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { MeetingToReading } from "./MeetingToReading";
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
    "A Reading that the group either completed or are currently reading. Could be a book, article, play, etc.",
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
  @JoinColumn()
  ratings: Rating[];

  @Field(() => Float, { nullable: true })
  @Column({ type: "float", nullable: true })
  avgRating?: number;

  @Field()
  @Column({ default: true })
  currentlyReading: boolean;

  // UTIL STUFF
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  createdBy?: number;

  @OneToMany(
    () => MeetingToReading,
    (meetingToReading) => meetingToReading.reading
  )
  public meetingToReading!: MeetingToReading[];
}
