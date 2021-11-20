import { Rating, Reading } from "../entities";
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from "typeorm";

@EventSubscriber()
export class ReadingRatingSubscriber
  implements EntitySubscriberInterface<Rating>
{
  /**
   * Indicates that this subscriber only listen to Post events.
   */
  listenTo() {
    return Rating;
  }

  // async afterInsert(event: InsertEvent<Rating>) {
  //   // console.log(`AFTER ENTITY Inserted: `, event.entity);
  //   const reading = await Reading.findOne({ id: event.entity.readingId });
  //   // console.log("ratings:", await reading?.ratings);
  //   // await Reading.update({...reading});
  // }
  // async afterUpdate(event: UpdateEvent<Rating>) {
  //   // console.log(`AFTER ENTITY UPDATED: `, event.entity);
  //   if (event.entity) {
  //     const reading = await Reading.findOne({ id: event.entity.readingId });
  //   }
  // }
}
