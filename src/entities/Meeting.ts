import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { MeetingToReading } from "./MeetingToReading";

@ObjectType({
  description: "A Meeting ",
})
@Entity()
export class Meeting extends BaseEntity {
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column({ type: "timestamp" })
  meetingDate: Date;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  readingAssignment: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  meetingLink: string;

  @OneToMany(
    () => MeetingToReading,
    (meetingToReading) => meetingToReading.meeting
  )
  public meetingToReading!: MeetingToReading[];
}
