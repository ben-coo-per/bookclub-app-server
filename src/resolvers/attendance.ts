import { isAuth } from "../middleware/isAuth";
import {
  Arg,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Attendance, AttendanceType } from "../entities/Attendance";
import { User, Meeting } from "../entities";
import { getConnection } from "typeorm";

@ObjectType()
export class UserAttendanceResponse {
  @Field(() => User)
  user: User;

  @Field(() => AttendanceType)
  attendanceState: AttendanceType;
}

@Resolver()
export class AttendanceResolver {
  @Query(() => [UserAttendanceResponse])
  async meetingUsersAttendance(
    @Arg("meetingId", () => Int, { nullable: true }) meetingId?: number
  ) {
    if (!meetingId) return [];
    const attendanceRecords = await getConnection()
      .getRepository(Meeting)
      .createQueryBuilder("m")
      .where({ id: meetingId })
      .innerJoinAndSelect("m.attendance", "attnd")
      .leftJoinAndSelect("attnd.user", "u")
      .getRawMany();

    const response = attendanceRecords.map((ar) => {
      return {
        // userResponse: {
        user: {
          id: ar.u_id,
          email: ar.u_email,
          name: ar.u_name,
          createdAt: ar.u_createdAt,
          updatedAt: ar.u_updatedAt,
        },
        // },
        attendanceState: ar.attnd_attendanceState,
      };
    });
    return response;
  }

  @Mutation(() => Attendance, { nullable: true })
  @UseMiddleware(isAuth)
  async addAttendanceRecord(
    @Arg("userId", () => Int) userId: number,
    @Arg("meetingId", () => Int) meetingId: number,
    @Arg("attendanceState", () => AttendanceType, { nullable: true })
    attendanceState?: AttendanceType
  ): Promise<Attendance | null> {
    const existingRecord = await getConnection()
      .getRepository(Attendance)
      .createQueryBuilder("a")
      .where({ meetingId: meetingId })
      .andWhere({ userId: userId })
      .getOne();

    const user = await User.findOne({ id: userId });
    const meeting = await Meeting.findOne({ id: meetingId });
    if (!user || !meeting) {
      return null;
    }

    const attendance = new Attendance();
    attendance.meetingId = meeting.id;
    attendance.userId = user.id;
    attendance.meeting = meeting;
    attendance.user = user;
    attendance.attendanceState = attendanceState;
    attendance.isDiscussionLeader = existingRecord?.isDiscussionLeader;
    await getConnection().manager.save(attendance);

    return attendance;
  }
}
