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
class MeetingInput {
  @Field(() => String)
  meetingDate: Date;

  @Field(() => [Int], { nullable: true })
  readingIds?: number[];

  @Field({ nullable: true })
  readingAssignment?: string;

  @Field({ nullable: true })
  meetingLink?: string;
}

@ObjectType()
class MeetingResponse {
  @Field(() => Meeting, { nullable: true })
  meeting: Meeting;
}

@Resolver()
export class MeetingResolver {
  @Query(() => [Meeting])
  async allMeetings() {
    return await Meeting.find();
  }

  @Query(() => [Meeting])
  async currentReadingMeetings() {
    const currentReadingMeetings = await getConnection()
      .getRepository(Reading)
      .createQueryBuilder("r")
      .where({ currentlyReading: true })
      .innerJoin("r.meetingToReading", "mtr")
      .leftJoinAndSelect("mtr.meeting", "m")
      .getRawMany();

    let meetings = currentReadingMeetings.map((rm) => {
      return {
        id: rm.m_id,
        meetingDate: rm.m_meetingDate,
        readingAssignment: rm.m_readingAssignment,
        createdAt: rm.m_createdAt,
        updatedAt: rm.m_updatedAt,
      };
    });

    return meetings;
  }

  @Mutation(() => Meeting)
  @UseMiddleware(isAuth)
  async createMeeting(
    @Arg("data", () => MeetingInput) meetingInput: MeetingInput
  ) {
    const meeting = await Meeting.create({
      meetingDate: meetingInput.meetingDate,
      readingAssignment: meetingInput.readingAssignment,
      meetingLink: meetingInput.meetingLink,
    }).save();

    if (meetingInput.readingIds) {
      // Find associated readings
      const associatedReadings = await getConnection()
        .createQueryBuilder()
        .select("*")
        .from(Reading, "")
        .where("id IN(:...ids)", {
          ids: meetingInput.readingIds,
        })
        .execute();

      await associatedReadings.forEach(async (reading: Reading) => {
        const mtr = new MeetingToReading();
        mtr.meetingId = meeting.id;
        mtr.readingId = reading.id;
        mtr.meeting = meeting;
        mtr.reading = reading;
        await getConnection().manager.save(mtr);
      });
    }

    return meeting;
  }
}

/// How to handle getting Readings from Meeting
// const stuff = await getConnection()
// .getRepository(Meeting)
// .createQueryBuilder("m")
// .innerJoin("m.meetingToReading", "mtr")
// .leftJoinAndSelect("mtr.reading", "r")
// .execute();
