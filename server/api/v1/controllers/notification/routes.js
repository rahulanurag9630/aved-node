import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()


  .use(auth.verifyToken)
  .get("/usersInAppNotification", controller.usersInAppNotification)
  .delete("/deleteNotification" , controller.deleteNotification)
  .delete("/deleteAllNotifications" , controller.deleteAllNotifications)
  .patch("/hideUnhideNotification" , controller.hideUnhideNotification)
  .patch("/markAsReadUnread" , controller.markAsReadUnread)
  .patch("/markAllAsReadUnread" , controller.markAllAsReadUnread)
