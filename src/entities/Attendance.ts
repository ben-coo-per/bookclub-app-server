import { Field, ObjectType } from "type-graphql";
import { Entity, Column, ManyToOne, PrimaryColumn } from "typeorm";
import { Meeting, User } from ".";

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

  @Field({ nullable: true })
  @Column({ nullable: true, default: "absent" }) // Was user present, absent, or excused
  public attendanceState?: "absent" | "present" | "excused";

  @Field({ nullable: true })
  @Column({ nullable: true, default: false }) // Was user discussion leader
  public isDiscussionLeader?: boolean;
}
