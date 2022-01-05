import { Meeting } from "../entities/Meeting";
import {
  Arg,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Reading } from "../entities";
import { MeetingToReading } from "../entities/MeetingToReading";

@InputType()
class ReadingAssignment {
  @Field()
  readingId!: number;

  @Field({ nullable: true })
  readingAssignmentType?: string;

  @Field({ nullable: true })
  readingAssignmentStart?: string;

  @Field({ nullable: true })
  readingAssignmentEnd?: string;
}

@InputType()
class MeetingInput {
  @Field(() => String, { nullable: true })
  meetingDate?: Date;

  @Field({ nullable: true })
  meetingLink?: string;

  @Field(() => [ReadingAssignment], { nullable: true })
  readingAssignments?: ReadingAssignment[];
}

@ObjectType()
export class AllMeetingsResponse {
  @Field(() => String, { nullable: true })
  nextCursor?: Date | null;

  @Field(() => String, { nullable: true })
  previousCursor?: Date | null;

  @Field(() => [Meeting], { nullable: true })
  meetings?: Meeting[];
}

@ObjectType()
class ReadingAssignmentsResponse {
  @Field()
  readingId: number;

  @Field()
  meetingId: number;

  @Field({ nullable: true })
  readingAssignmentType?: string;

  @Field({ nullable: true })
  readingAssignmentStart?: string;

  @Field({ nullable: true })
  readingAssignmentEnd?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  author?: string;

  @Field(() => String, { nullable: true })
  meetingDate?: Date;
}

@Resolver()
export class MeetingResolver {
  @Query(() => AllMeetingsResponse, { description: "Get all Meetings" })
  async allMeetings(
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Arg("limit", () => Int) limit: number
  ): Promise<AllMeetingsResponse> {
    const realLimit = Math.min(50, limit);
    const qb = getConnection()
      .getRepository(Meeting)
      .createQueryBuilder("r")
      .orderBy('"meetingDate"', "DESC")
      .take(realLimit);

    if (cursor) {
      qb.where('"meetingDate" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    const meetings = await qb.getMany();
    const allPostsLoaded = meetings.length < realLimit;

    const previousCursor = !allPostsLoaded
      ? meetings[meetings.length - 1].meetingDate
      : null;

    return {
      meetings: meetings,
      nextCursor: null,
      previousCursor: previousCursor,
    };
  }

  @Query(() => AllMeetingsResponse, { description: "Get meetings by month" })
  async meetingsByMonth(
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<AllMeetingsResponse> {
    const date = cursor ? new Date(parseInt(cursor)) : new Date();

    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    let startOfLastMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    let endOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    let nextMonth;
    let previousMonth;

    // Get all meetings from this month and the following month
    let allMeetings = await getConnection()
      .createQueryBuilder()
      .select()
      .from(Meeting, "meeting")
      .orderBy('"meetingDate"', "DESC")
      .where('"meetingDate" > :start', {
        start: startOfLastMonth,
      })
      .andWhere('"meetingDate" < :end', {
        end: endOfNextMonth,
      })
      .execute();

    // Filter down to the meetings for this month -> what the user actually wants back
    let meetings = allMeetings.filter(
      (meeting: Meeting) =>
        meeting.meetingDate < lastDay && meeting.meetingDate > firstDay
    );

    // If there are no meetings for this month, set allmeetings to the meetigns from last month
    if (meetings.length == 0) {
      let twoMonthsAgo = new Date(date.getFullYear(), date.getMonth() - 2, 1);
      allMeetings = await getConnection()
        .createQueryBuilder()
        .select()
        .from(Meeting, "meeting")
        .orderBy('"meetingDate"', "DESC")
        .where('"meetingDate" > :start', {
          start: twoMonthsAgo,
        })
        .execute();

      meetings = allMeetings.filter(
        (meeting: Meeting) => meeting.meetingDate > startOfLastMonth
      );

      // If the meetings for previous month array is not 0 (i.e. if there are meetings for the previous month), return the previousMonth cursor
      // If not, return null
      const previousMonthsMeetings = allMeetings.filter(
        (meeting: Meeting) => meeting.meetingDate < startOfLastMonth
      );
      previousMonth = previousMonthsMeetings.length > 0 ? twoMonthsAgo : null;
    } else {
      // If the meetings for next month array is not 0 (i.e. if there are meetings for the next month), return the nextMonth cursor
      // If not, return null
      const nextMonthsMeetings = allMeetings.filter(
        (meeting: Meeting) => meeting.meetingDate > lastDay
      );
      nextMonth =
        nextMonthsMeetings.length > 0
          ? new Date(date.getFullYear(), date.getMonth() + 1, 1)
          : null;

      // If the meetings for previous month array is not 0 (i.e. if there are meetings for the previous month), return the previousMonth cursor
      // If not, return null
      const previousMonthsMeetings = allMeetings.filter(
        (meeting: Meeting) => meeting.meetingDate < firstDay
      );
      previousMonth =
        previousMonthsMeetings.length > 0 ? startOfLastMonth : null;
    }

    return {
      meetings: meetings,
      nextCursor: nextMonth,
      previousCursor: previousMonth,
    };
  }

  @Query(() => [ReadingAssignmentsResponse])
  async readingAssignments(
    @Arg("meetingId", () => Int, { nullable: true }) meetingId: number | null
  ) {
    const currentReadingMeetings = await getConnection()
      .getRepository(Meeting)
      .createQueryBuilder("m")
      .where({ id: meetingId })
      .innerJoinAndSelect("m.meetingToReading", "mtr")
      .leftJoinAndSelect("mtr.reading", "r")
      .getRawMany();

    let readingAssignments = currentReadingMeetings.map((rm) => {
      return {
        readingId: rm.r_id,
        meetingId: rm.m_id,
        readingAssignmentType: rm.mtr_readingAssignmentType,
        readingAssignmentStart: rm.mtr_readingAssignmentStart,
        readingAssignmentEnd: rm.mtr_readingAssignmentEnd,
        author: rm.r_author,
        title: rm.r_title,
        meetingDate: rm.m_meetingDate,
      };
    });

    return readingAssignments;
  }

  @Mutation(() => Meeting)
  @UseMiddleware(isAuth)
  async createMeeting(
    @Arg("meetingInput", () => MeetingInput) meetingInput: MeetingInput
  ) {
    const meeting = await Meeting.create({
      meetingDate: meetingInput.meetingDate,
      meetingLink: meetingInput.meetingLink,
    }).save();

    if (
      meetingInput.readingAssignments &&
      meetingInput.readingAssignments.length > 0
    ) {
      // Find associated readings
      const associatedReadings = await getConnection()
        .createQueryBuilder()
        .select("*")
        .from(Reading, "")
        .where("id IN(:...ids)", {
          ids: meetingInput.readingAssignments.map((ra) => ra.readingId),
        })
        .execute();

      await associatedReadings.forEach(async (reading: Reading) => {
        const thisReading = meetingInput.readingAssignments?.filter(
          (ra) => ra.readingId === reading.id
        )[0];
        const mtr = new MeetingToReading();
        mtr.meetingId = meeting.id;
        mtr.readingId = reading.id;
        mtr.meeting = meeting;
        mtr.reading = reading;
        mtr.readingAssignmentType = thisReading?.readingAssignmentType;
        mtr.readingAssignmentStart = thisReading?.readingAssignmentStart;
        mtr.readingAssignmentEnd = thisReading?.readingAssignmentEnd;
        await getConnection().manager.save(mtr);
      });
    }

    return meeting;
  }

  @Mutation(() => Meeting)
  @UseMiddleware(isAuth)
  async updateMeeting(
    @Arg("meetingInput", () => MeetingInput) meetingInput: MeetingInput,
    @Arg("id", () => Int) id: number
  ) {
    const meeting = await Meeting.findOne(id);
    if (
      meetingInput.readingAssignments &&
      meetingInput.readingAssignments.length > 0 &&
      meeting
    ) {
      // Find associated readings
      const associatedReadings = await getConnection()
        .createQueryBuilder()
        .select("*")
        .from(Reading, "")
        .where("id IN(:...ids)", {
          ids: meetingInput.readingAssignments.map((ra) => ra.readingId),
        })
        .execute();

      await associatedReadings.forEach(async (reading: Reading) => {
        const thisReading = meetingInput.readingAssignments?.filter(
          (ra) => ra.readingId === reading.id
        )[0];
        const mtr = new MeetingToReading();
        mtr.meetingId = meeting.id;
        mtr.readingId = reading.id;
        mtr.meeting = meeting;
        mtr.reading = reading;
        mtr.readingAssignmentType = thisReading?.readingAssignmentType;
        mtr.readingAssignmentStart = thisReading?.readingAssignmentStart;
        mtr.readingAssignmentEnd = thisReading?.readingAssignmentEnd;
        await getConnection().manager.save(mtr);
      });
    }
    const updatedMeeting = {
      ...meeting,
      meetingDate: meetingInput.meetingDate || meeting?.meetingDate,
      meetingLink: meetingInput.meetingLink || meeting?.meetingLink,
    };

    await Meeting.update({ id }, { ...updatedMeeting });

    return meeting;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async removeReadingFromMeeting(
    @Arg("readingId", () => Int) readingId: number,
    @Arg("meetingId", () => Int) meetingId: number
  ) {
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(MeetingToReading, "")
        .where("readingId = :readingId", {
          readingId: readingId,
        })
        .andWhere("meetingId = :meetingId", {
          meetingId: meetingId,
        })
        .execute();

      return true;
    } catch {
      return false;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteMeeting(@Arg("meetingId", () => Int) meetingId: number) {
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(Meeting, "")
        .andWhere("id = :meetingId", {
          meetingId: meetingId,
        })
        .execute();

      return true;
    } catch {
      return false;
    }
  }
}
