import { isAuth } from "../middleware/isAuth";
import {
  Arg,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Attendance } from "../entities/Attendance";
import { User, Meeting } from "../entities";
import { getConnection } from "typeorm";

@Resolver()
export class AttendanceResolver {
  // @Query(() => [Attendance])

  @Mutation(() => Attendance, { nullable: true })
  @UseMiddleware(isAuth)
  async addAttendanceRecord(
    @Arg("userId", () => Int) userId: number,
    @Arg("meetingId", () => Int) meetingId: number
  ): Promise<Attendance | null> {
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
    await getConnection().manager.save(attendance);

    return attendance;
  }
}
