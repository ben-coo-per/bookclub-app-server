import { Field, Int, ObjectType } from "type-graphql";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  BaseEntity,
} from "typeorm";
import { User, Reading } from ".";

@ObjectType()
@Entity()
export class Rating extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column()
  userId: number;

  @OneToOne(() => User, (user) => user.ratings, {
    onDelete: "CASCADE",
    cascade: true,
  })
  user: User;

  @Field(() => Int)
  @Column({ type: "integer" })
  readingId: number;

  @OneToOne(() => Reading, (reading) => reading.ratings, {
    onDelete: "CASCADE",
    cascade: true,
  })
  reading: Reading;

  @Field(() => Int, { description: "User's rating from 1 to 5" })
  @Column({ type: "integer" })
  rating: number;
}
