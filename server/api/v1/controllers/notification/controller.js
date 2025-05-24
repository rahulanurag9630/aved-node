import Joi from "joi";
import * as express from "express";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import bcrypt from "bcryptjs";
import userType from "../../../../enums/userType";
import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import responseMessage from "../../../../../assets/responseMessage";

import { userServices } from "../../services/user";
const { findUser } = userServices;

import { notificationServices } from "../../services/notification";
const {
  createNotification,
  findNotification,
  updateNotification,
  deleteNotification,
  NotificationLists,
  updateAllNotification
} = notificationServices;

export class notificationController {
  
  /**
   * @swagger
   * /notification/usersInAppNotification:
   *   get:
   *     tags: 
   *        - NOTIFICATION MANAGEMENT
   *     summary: Get all usersInAppNotification
   *     description: Endpoint usersInAppNotification
   *     parameters:
   *       - name: authtoken
   *         description: Admin token
   *         in: header
   *         required: true
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: type
   *         description: type of the notification INFO , WARNING , MESSAGE , ALERT
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         type: integer
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         type: integer
   *         required: false
   *     responses:
   *       '200':
   *         description: NOTIFICATION CONTENT FOUND
   *       '500':
   *         description: Internal server error.
   */
  async usersInAppNotification(req, res, next) {
    const validationSchema = Joi.object({
      type: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      status: Joi.string().optional(),
    });
    try {
      const { error, value: validatedBody } = validationSchema.validate(
        req.query
      );
      if (error) {
        return next(error);
      }
      let userResult = await findUser({
        _id: req.userId,
        // userType: userType.USER,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const contentType = validatedBody.contentType;
      const allStaticContent = await NotificationLists(validatedBody);
      return res.json(
        new response(allStaticContent, responseMessage.STATIC_CONTENT_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
    /**
     * @swagger
     * /notification/deleteNotification:
     *   delete:
     *     tags:
     *       - NOTIFICATION MANAGEMENT
     *     summary: notification tip by using id 1
     *     description: notification tip 
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: authToken
     *         description: USER token
     *         in: header
     *         required: true
     *       - name: _id
     *         description:  id of the notifcation
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Data found successfully .
     *       401:
     *         description: Invalid file format
     */
    async deleteNotification(req, res, next) {
      const validationSchema = Joi.object({
        _id: Joi.string().required(),
      });
      try {
        let validatedBody = await validationSchema.validateAsync(req.query);
  
        let userData = await findUser({
          _id: req.userId,
          userType: { $in: [userType.ADMIN, userType.SUBADMIN , userType.USER] },
        });
        if (!userData) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
  
        let notifiData = await findNotification({
            _id: validatedBody._id,
            status: { $ne: status.DELETE }
          });
        if (!notifiData) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
  
        let notifiRes = await updateNotification(
          { _id: notifiData._id },
          { $set: { status: status.DELETE } }
        );
        return res.json(new response(notifiRes, responseMessage.NOTIFICATION_DELETED));
      } catch (error) {
        console.log("❌ Error Occured at deleteNotification -->" ,error);
        return next(error);
      }
    }
    /**
 * @swagger
 * /notification/deleteAllNotifications:
 *   delete:
 *     tags:
 *       - NOTIFICATION MANAGEMENT
 *     summary: Delete all notifications for the logged-in user
 *     description: Deletes all active notifications for the current user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         description: USER token
 *         in: header
 *         required: true
 *     responses:
 *       200:
 *         description: All notifications deleted successfully.
 *       401:
 *         description: Unauthorized or invalid user.
 */
async deleteAllNotifications(req, res, next) {
    try {
      // Validate user
      let userData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN, userType.USER] },
      });
      if (!userData) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
  
      // Soft delete all active notifications for that user
    //   let updateRes = await notificationModel.updateMany(
    //     { userId: req.userId, status: { $ne: status.DELETE } },
    //     { $set: { status: status.DELETE } }
    //   );
      let updateRes = await updateAllNotification(
        { userId: req.userId, status: { $ne: status.DELETE } },
        { $set: { status: status.DELETE } }
      );
      
  
      return res.json(new response(updateRes, responseMessage.NOTIFICATIONS_DELETED));
    } catch (error) {
      console.log("❌ Error Occurred at deleteAllNotifications -->", error);
      return next(error);
    }
  }
  /**
 * @swagger
 * /notification/hideUnhideNotification:
 *   patch:
 *     tags:
 *       - NOTIFICATION MANAGEMENT
 *     summary: Hide or Unhide a notification
 *     description: Toggle the visibility of a specific notification
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         in: header
 *         required: true
 *         description: USER token
 *       - name: _id
 *         description:  id of the notifcation
 *         in: query
 *         required: true
 *       - name: isHide
 *         description:  isHide of the notifcation boolean true / false
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Notification updated successfully
 */
async hideUnhideNotification(req, res, next) {
    const validationSchema = Joi.object({
      _id: Joi.string().required(),
      isHide: Joi.boolean().required(),
    });
  
    try {
      let validatedBody = await validationSchema.validateAsync(req.query);
      
      let userData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN, userType.USER] },
      });
      if (!userData) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
  
      let notification = await findNotification({
        _id: validatedBody._id,
        userId: req.userId,
        status: { $ne: status.DELETE }
      });
  
      if (!notification) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
  
      let updated = await updateNotification(
        { _id: validatedBody._id },
        { $set: { isHide: validatedBody.isHide } }
      );
  
      return res.json(new response(updated, responseMessage.NOTIFICATION_UPDATED));
    } catch (error) {
      console.log("❌ Error in hideUnhideNotification -->", error);
      return next(error);
    }
  }

  /**
 * @swagger
 * /notification/markAsReadUnread:
 *   patch:
 *     tags:
 *       - NOTIFICATION MANAGEMENT
 *     summary: Mark a notification as read
 *     description: Marks a single notification as read
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         in: header
 *         required: true
 *         description: USER token
 *       - name: _id
 *         description:  id of the notifcation
 *         in: query
 *         required: true
 *       - name: isRead
 *         description:  isRead of the notifcation boolean true / false
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
async markAsReadUnread(req, res, next) {
    const validationSchema = Joi.object({
      _id: Joi.string().required(),
      isRead: Joi.boolean().required()
    });
  
    try {
      const validatedBody = await validationSchema.validateAsync(req.query);
  
      const notification = await findNotification({
        _id: validatedBody._id,
        userId: req.userId,
        status: { $ne: status.DELETE }
      });
  
      if (!notification) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
  
      const updated = await updateNotification(
        { _id: validatedBody._id },
        { $set: { isRead: validatedBody.isRead } }
      );
  
      return res.json(new response(updated, responseMessage.NOTIFICATION_UPDATED));
    } catch (error) {
      console.log("❌ Error in markAsReadUnread -->", error);
      return next(error);
    }
  }

  /**
 * @swagger
 * /notification/markAllAsReadUnread:
 *   patch:
 *     tags:
 *       - NOTIFICATION MANAGEMENT
 *     summary: Mark all notifications as read
 *     description: Marks all unread notifications for the logged-in user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         in: header
 *         required: true
 *       - name: isRead
 *         description:  isRead of the notifcation boolean true / false
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
  async markAllAsReadUnread(req, res, next) {
    const validationSchema = Joi.object({
        isRead: Joi.boolean().required()
      });
    try {
        const validatedBody = await validationSchema.validateAsync(req.query);
      const userData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN, userType.USER] }
      });
  
      if (!userData) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
  
    //   const result = await notificationModel.updateMany(
    //     {
    //       userId: req.userId,
    //       isRead: false,
    //       status: { $ne: status.DELETE }
    //     },
    //     { $set: { isRead: true } }
    //   );
      const result = await updateAllNotification(
        {
          userId: req.userId,
        //   isRead: validatedBody.isRead,
          status: { $ne: status.DELETE }
        },
        { $set: { isRead: validatedBody.isRead } }
      );
  
      return res.json(new response(result, responseMessage.NOTIFICATION_UPDATED));
    } catch (error) {
      console.log("❌ Error in markAllAsReadUnread -->", error);
      return next(error);
    }
  }
  
  
  


}

export default new notificationController();
