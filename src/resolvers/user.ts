import { MyContext } from "../types/types";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { User } from "../entities";
import argon2 from "argon2";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { SignUpInputFields, UserInputFields } from "../types/SignUpInputFields";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";

import { v4 as uuidv4 } from "uuid";

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  // Me endpoint
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    // You is not logged in
    if (!req.session.userId) {
      return null;
    }

    const user = await User.findOne(req.session.userId);
    if (!user) {
      // Error handling
      return null;
    }

    return user;
  }

  @Query(() => [User])
  async allUsers() {
    return await User.find({});
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 5)
      return {
        errors: [
          {
            field: "password",
            message: "Your password must be at least 6 characters long",
          },
        ],
      };

    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return { errors: [{ field: "token", message: "token expired" }] };
    }
    const userIDNum = parseInt(userId);
    const user = await User.findOne(userIDNum);

    if (!user) {
      return {
        errors: [{ field: "token", message: "user no longer exists" }],
      };
    }

    await User.update(
      { id: userIDNum },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);
    // Log in user after password changes
    req.session!.userId = user.id;

    return { user };
  }

  // FORGOT PASSWORD MUTATION
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return true;
    }

    const token = uuidv4();
    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // Expires after three days
    console.log("sending email...");
    await sendEmail(
      email,
      `<a href="http://localhost:3000/auth/forgot/change-password/${token}">Reset Password</a>`
    );

    console.log("sent");
    return true;
  }

  @Mutation(() => UserResponse, { nullable: true })
  async register(
    @Arg("options") options: SignUpInputFields,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse | null> {
    const errors: FieldError[] = validateRegister(options);

    if (errors.length > 0) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      user = await User.create({
        email: options.email.toLowerCase(),
        password: hashedPassword,
        name: options.name,
      }).save();
    } catch (err) {
      if (err.code === "23505") {
        errors.push({
          field: "email",
          message: "This email is already taken",
        });
      }
      return { errors };
    }

    // Set user as logged in
    req.session!.userId = user.id;
    return { user, errors };
  }

  // LOGIN MUTATION
  @Mutation(() => UserResponse, { nullable: true })
  async login(
    @Arg("options") options: UserInputFields,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse | null> {
    const user = await User.findOne({
      where: {
        email: options.email.toLowerCase(),
      },
    });

    if (!user) {
      return {
        errors: [{ field: "email", message: "That email does not exist" }],
      };
    }
    const valid = await argon2.verify(user.password, options.password);

    if (!valid) {
      return { errors: [{ field: "password", message: "incorrect password" }] };
    }

    // Set user as logged in
    req.session!.userId = user.id;

    return { user };
  }

  // LOGOUT MUTATION
  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
        }

        resolve(true);
      })
    );
  }
}

// avatar: {
//   isSet: false,
// options: {
//   top: [
//     TopOptionsArray[Math.floor(Math.random() * TopOptionsArray.length)],
//   ],
//   hairColor: [
//     HairColorOptionsArray[Math.floor(Math.random() * HairColorOptionsArray.length)],
//   ],
//   hatColor: [
//     HatColorOptionsArray[Math.floor(Math.random() * HatColorOptionsArray.length)],
//   ],
//   accessories: [],

//   facialHair: [
//     FacialHairOptionsArray[Math.floor(Math.random() * FacialHairOptionsArray.length)],
//   ],
//   facialHairColor: [],

//   clothes: [
//     ClothesOptionsArray[Math.floor(Math.random() * ClothesOptionsArray.length)],
//   ],
//   clothesColor: [
//     ClothesColorOptionsArray[Math.floor(Math.random() * ClothesColorOptionsArray.length)],
//   ],
//   clotheGraphic: [
//     ClotheGraphicsOptionsArray[Math.floor(Math.random() * ClotheGraphicsOptionsArray.length)],
//   ],

//   skin: [
//     SkinOptionsArray[Math.floor(Math.random() * SkinOptionsArray.length)],
//   ],
// },
// },
