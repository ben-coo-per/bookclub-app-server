import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { Redis } from "ioredis";

export type MyContext = {
  req: Request & {
    session: Session & Partial<SessionData> & SessionStorage;
  };
  res: Response;
  redis: Redis;
};

type SessionStorage = {
  userId: number;
};
