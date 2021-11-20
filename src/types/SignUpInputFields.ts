import { Field, InputType } from "type-graphql";

@InputType()
export class UserInputFields {
  @Field()
  email: string;
  @Field()
  password: string;
}

@InputType()
export class SignUpInputFields extends UserInputFields {
  @Field()
  name: string;
}
