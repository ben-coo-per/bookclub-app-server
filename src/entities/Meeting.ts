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
import { Attendance } from "./Attendance";
import { MeetingToReading } from "./MeetingToReading";

@ObjectType({
  description: "A Meeting ",
})
@Entity()
export class Meeting extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column({ type: "timestamp" })
  meetingDate: Date;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  meetingLink: string;

  // UTIL STUFF
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => MeetingToReading,
    (meetingToReading) => meetingToReading.meeting
  )
  public meetingToReading!: MeetingToReading[];

  @OneToMany(() => Attendance, (attendance) => attendance.meeting)
  public attendance!: Attendance[];
}
