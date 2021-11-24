import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Meeting, Reading } from ".";

@Entity()
export class MeetingToReading {
  @PrimaryGeneratedColumn()
  public meetingToReadingId!: number;

  @Column()
  public meetingId!: number;

  @Column()
  public readingId!: number;

  @ManyToOne(() => Meeting, (meeting) => meeting.meetingToReading)
  public meeting!: Meeting;

  @ManyToOne(() => Reading, (reading) => reading.meetingToReading)
  public reading!: Reading;
}
