import "reflect-metadata";
import express from "express";
import { COOKIE_NAME, __prod__ } from "./constants";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { RedisStore, redis, session } from "./redis";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import cors from "cors";
import { createConnection } from "typeorm";

import {
  UserResolver,
  ReadingResolver,
  RatingResolver,
  MeetingResolver,
} from "./resolvers";
import { Reading, User, Rating, Meeting } from "./entities";
import { ReadingRatingSubscriber } from "./subscriptions";
import { MeetingToReading } from "./entities/MeetingToReading";
import { Attendance } from "./entities/Attendance";
import { AttendanceResolver } from "./resolvers/attendance";

const main = async () => {
  //Initialize Typeorm
  await createConnection({
    type: "postgres",
    username: "bencooper",
    password: "postgres",
    database: "postgres",
    logging: true,
    synchronize: true,
    entities: [User, Reading, Rating, Meeting, MeetingToReading, Attendance],
    subscribers: [ReadingRatingSubscriber],
  });

  //Create espress app
  const app = express();

  // Setting up Redis store
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: process.env.REDIS_SECRET || " ",
      resave: false,
    })
  );

  // Handling CORS
  app.use(cors({ origin: "http://localhost:3000", credentials: true }));

  // Setting up Apollo server
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        ReadingResolver,
        UserResolver,
        RatingResolver,
        MeetingResolver,
        AttendanceResolver,
      ],
      validate: false,
    }),
    context: ({ req, res }: any) => ({
      req,
      res,
      redis,
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  // Starting Apollo server
  await apolloServer.start();

  // Applying Apollo middleware
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => console.error(err));
