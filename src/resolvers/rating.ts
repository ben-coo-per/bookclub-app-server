import { Reading, Rating } from "../entities";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { MyContext } from "../types/types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";

@InputType()
class RatingInput {
  @Field(() => Int)
  readingId!: number;

  @Field(() => Int)
  rating!: number;
}

@ObjectType()
class RatingResponse {
  @Field(() => Rating, { nullable: true })
  rating: Rating;

  @Field({ nullable: true })
  avgRating?: number;
}

@Resolver()
export class RatingResolver {
  //   @Query(() => [Reading], { description: "Get all Readings" })
  //   allReadings(): Promise<Reading[]> {
  //     return Reading.find();
  //   }

  // GET SPECIFIC READING QUERY
  @Query(() => [Rating], {
    description: "Get Ratings on a Reading based on given ID",
  })
  rating(@Arg("id", () => Int) readingId: number): Promise<Rating[]> {
    return Rating.find({ readingId: readingId });
  }

  // GET User READING QUERY
  @Query(() => Rating, {
    description: "Get Ratings on a Reading based on given ID and userID",
  })
  userRating(
    @Arg("readingId", () => Int) readingId: number,
    @Ctx() { req }: MyContext
  ): Promise<Rating | undefined> {
    return Rating.findOne({ readingId: readingId, userId: req.session.userId });
  }

  // Create a new rating
  @Mutation(() => RatingResponse, { description: "Create a new rating" })
  @UseMiddleware(isAuth)
  async addRating(
    @Arg("input", () => RatingInput) input: RatingInput,
    @Ctx() { req }: MyContext
  ): Promise<RatingResponse> {
    const rating = await Rating.create({
      ...input,
      userId: req.session.userId,
    }).save();

    //Update corresponding reading avg rating
    let updatedAvgRating;
    const reading = await Reading.findOne(rating.readingId, {
      relations: ["ratings"],
    });

    if (reading?.ratings) {
      updatedAvgRating = getAverageRating(reading.ratings);
      await Reading.update({ id: reading.id }, { avgRating: updatedAvgRating });
      return { rating, avgRating: updatedAvgRating };
    }

    return { rating };
  }

  // Update Rating
  @Mutation(() => RatingResponse, {
    description: "Update an existing rating",
    nullable: true,
  })
  @UseMiddleware(isAuth)
  async updateRating(
    @Arg("newRating", () => Int) newRating: number,
    @Arg("id", () => Int) id: number
  ): Promise<RatingResponse | null> {
    let rating = await Rating.findOne(id);
    if (!rating) {
      return null;
    }

    // Update rating record
    rating.rating = newRating;
    await getConnection()
      .createQueryBuilder()
      .update(Rating)
      .set({ rating: newRating })
      .where("id = :id", { id: id })
      .execute();

    //Update corresponding reading avg rating
    let updatedAvgRating;
    const reading = await Reading.findOne(rating.readingId, {
      relations: ["ratings"],
    });

    if (reading?.ratings) {
      updatedAvgRating = getAverageRating(reading.ratings);
      await Reading.update({ id: reading.id }, { avgRating: updatedAvgRating });
      return { rating, avgRating: updatedAvgRating };
    }

    return { rating };
  }
}

function sumRatings(runningTotal: number, rating: number) {
  return runningTotal + rating;
}

function getAverageRating(ratings: Rating[]) {
  return (
    Math.round(
      (ratings.map((obj) => obj.rating).reduce(sumRatings, 0) /
        ratings.length) *
        100
    ) / 100
  );
}
