import { Field, ObjectType, registerEnumType } from "type-graphql";
import { Entity, Column, ManyToOne, PrimaryColumn } from "typeorm";
import { Meeting, User } from ".";

export enum AttendanceType {
  absent = "absent",
  present = "present",
  excused = "excused",
}
registerEnumType(AttendanceType, {
  name: "AttendanceType",
  description: "The different options to describe the user's attendance",
  valuesConfig: {},
});

@ObjectType({
  description: "An attendance record linking a user to a meeting ",
})
@Entity()
export class Attendance {
  @Field()
  @PrimaryColumn()
  public meetingId!: number;

  @Field()
  @PrimaryColumn()
  public userId!: number;

  @ManyToOne(() => Meeting, (meeting) => meeting.attendance)
  public meeting!: Meeting;

  @ManyToOne(() => User, (user) => user.attendance)
  public user!: User;

  @Field(() => AttendanceType, { nullable: true })
  @Column({
    type: "enum",
    enum: AttendanceType,
    nullable: true,
    default: "absent",
  })
  public attendanceState?: AttendanceType;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false }) // Was user discussion leader
  public isDiscussionLeader?: boolean;
}
