import { Reading } from "../entities";
import { ReadingType } from "../entities/Reading";
import {
  Arg,
  Field,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";

@InputType()
class ReadingInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  author?: string;

  @Field(() => ReadingType, { nullable: true })
  type?: ReadingType;

  @Field({ nullable: true })
  currentlyReading?: boolean;
}

@Resolver()
export class ReadingResolver {
  @Query(() => [Reading], { description: "Get all Readings" })
  previousReadings(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<Reading[]> {
    const realLimit = Math.min(50, limit);
    const qb = getConnection()
      .getRepository(Reading)
      .createQueryBuilder("r")
      .orderBy('"createdAt"', "DESC")
      .where('"currentlyReading" = :currentlyReading', {
        currentlyReading: false,
      })
      .take(realLimit);

    if (cursor) {
      qb.where('"createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    return qb.getMany();
  }

  @Query(() => [Reading], { description: "Get all Current Readings" })
  async currentlyReading(): Promise<Reading[]> {
    const currentReadings = await getConnection()
      .createQueryBuilder()
      .select("*")
      .from(Reading, "")
      .where('"currentlyReading" = :currentlyReading', {
        currentlyReading: true,
      })
      .execute();

    return currentReadings;
  }

  @Query(() => Reading, {
    nullable: true,
    description: "Get Reading based on given ID",
  })
  reading(@Arg("id", () => Int) id: number): Promise<Reading | undefined> {
    return Reading.findOne(id);
  }

  // @Query(() => Reading, {
  //   nullable: true,
  //   description: "Get Reading based on given ID",
  // })
  // readings(@Arg("id", () => Int) id: number): Promise<Reading | undefined> {
  //   return Reading.findOne(id);
  // }

  // MUTATIONS
  @Mutation(() => Reading, { description: "Create a new Reading" })
  @UseMiddleware(isAuth)
  async createReading(
    @Arg("data", () => ReadingInput) readingInput: ReadingInput
  ): Promise<Reading> {
    return Reading.create({ ...readingInput }).save();
  }

  @Mutation(() => Reading, {
    nullable: true,
    description: "Update an existing Reading",
  })
  @UseMiddleware(isAuth)
  async updateReading(
    @Arg("id", () => Int) id: number,
    @Arg("data", () => ReadingInput) readingInput: ReadingInput
  ): Promise<Reading | null> {
    let reading = await Reading.findOne(id);
    if (!reading) {
      return null;
    }

    try {
      if (typeof readingInput !== null) {
        console.log("called");
        await Reading.update({ id }, { ...readingInput });
      }

      //Make changes to reading object
      if (readingInput.title && readingInput.title != null)
        reading.title = readingInput.title;
      if (readingInput.author && readingInput.author != null)
        reading.author = readingInput.author;
      if (readingInput.type && readingInput.type != null)
        reading.type = readingInput.type;
      if (
        readingInput.currentlyReading &&
        readingInput.currentlyReading != null
      )
        reading.currentlyReading = readingInput.currentlyReading;
    } catch (err) {
      console.error(err);
    }

    return reading;
  }

  @Mutation(() => Boolean, { description: "Delete an existing Reading" })
  @UseMiddleware(isAuth)
  async deleteReading(
    @Arg("ids", () => [Int]) ids: number[]
  ): Promise<Boolean> {
    try {
      getConnection()
        .createQueryBuilder()
        .delete()
        .from(Reading)
        .where("id IN(:...ids)", {
          ids: ids,
        })
        .execute();

      return true;
    } catch (err) {
      return false;
    }
  }
}
