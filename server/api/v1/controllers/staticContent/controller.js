import Joi from 'joi';
import * as express from 'express'
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import bcrypt from "bcryptjs";
import userType from '../../../../enums/userType';
import commonFunction from '../../../../helper/util';
import status from '../../../../enums/status';
import responseMessage from '../../../../../assets/responseMessage';

import { userServices } from "../../services/user";
const {
  findUser,
} = userServices;

import { staticContentServices } from "../../services/staticContent";
const {
  addStaticContent,
  updateStaticContent,
  getAllStaticContent,
  getAllStaticContentByType,
  deleteAllStaticContent
} = staticContentServices;

export class staticController {

  /**
   * @swagger
   * /staticContent/addStaticContent:
   *   post:
   *     tags:
   *       - STATIC CONTENT
   *     description: admin addStaticContent =====>>>>> where contentType enum:['privacyPolicy', 'termsCondition', 'aboutUs', 'faq', 'banner' , 'conversationStarter' , 'gettingStarted']
   *     summary: Add Static Content
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authtoken
   *         description: Admin token
   *         in: header
   *         required: true
   *       - name: contentType
   *         description: contentType
   *         in: formData
   *         enum: ['privacyPolicy', 'termsCondition', 'aboutUs', 'faq', 'banner' , 'conversationStarter' , 'gettingStarted']
   *         required: true
   *       - name: title
   *         description: title
   *         in: formData
   *         required: true
   *       - name: description
   *         description: description
   *         in: formData
   *         required: false
   *       - name: question
   *         description: question for faqs
   *         in: formData
   *         required: false
   *       - name: answer
   *         description: answer for faqs
   *         in: formData
   *         required: false
   *       - name: imageUrl
   *         description: imageUrl for banner
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Static content add successfully.
   *       409:
   *         description: Data already exits.
   *       501:
   *         description: Something went wrong!
   */
  async addStaticContent(req, res, next) {
    const validationSchema = Joi.object({ 
      contentType: Joi.string().required(),
      title: Joi.string().required(),
      description: Joi.string().optional(),
      question: Joi.string().optional(),
      answer: Joi.string().optional(),
      imageUrl: Joi.string().optional(),
    });
    try {
      const { error, value: validatedBody } = validationSchema.validate(req.body);
      if (error) {
        return next(error);
      }
      const authCheck = await findUser({ _id: req.userId, status: status.ACTIVE, userType: userType.ADMIN });
      if (!authCheck) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        const saveResult = await addStaticContent(validatedBody);
        return res.json(new response(saveResult, responseMessage.ADD_CONTENT));
      }
    } catch (error) {
      return next(error);
    }
  }


  /**
   * @swagger
   * /staticContent/updateStaticContent:
   *   put:
   *     tags:
   *       - STATIC CONTENT
   *     description: admin addStaticContent =====>>>>> where contentType enum:['privacyPolicy', 'termsCondition', 'aboutUs', 'faq', 'banner' , 'conversationStarter' , 'gettingStarted' ]
   *     summary: Update Static Content
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: Admin token
   *         in: header
   *         required: true
   *       - name: staticContentId
   *         description: content Id
   *         in: formData
   *         required: true
   *       - name: contentType
   *         description: contentType
   *         in: formData
   *         enum: ['privacyPolicy', 'termsCondition', 'aboutUs', 'faq', 'banner']
   *         required: true
   *       - name: title
   *         description: title
   *         in: formData
   *         required: true
   *       - name: description
   *         description: description
   *         in: formData
   *         required: false
   *       - name: question
   *         description: question for faqs
   *         in: formData
   *         required: false
   *       - name: answer
   *         description: answer for faqs
   *         in: formData
   *         required: false
   *       - name: imageUrl
   *         description: imageUrl for banner
   *         in: formData
   *         required: false
   *       - name: isActive
   *         description: isActive 
   *         in: formData
   *         required: false
   *       - name: status
   *         description: status 
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Static content updated successfully.
   *       409:
   *         description: Data already exits.
   *       501:
   *         description: Something went wrong!
   */

  async updateStaticContent(req, res, next) {
    const validationSchema = Joi.object({
      staticContentId: Joi.string().required(),
      contentType: Joi.string().optional(),
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      question: Joi.string().optional(),
      answer: Joi.string().optional(),
      imageUrl: Joi.string().optional(),
      isActive: Joi.boolean().optional(),
      status: Joi.string().optional(),
    });
    try {
      const { value: validBody, error } = validationSchema.validate(req.body);
      if (error) {
        throw apiError.badRequest(error.details[0].message);
      }
      const { staticContentId, ...staticContentData } = validBody;
      const authCheck = await findUser({ _id: req.userId, status: status.ACTIVE, userType: userType.ADMIN });
      if (!authCheck) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const result = await updateStaticContent(staticContentId, staticContentData);
      return res.json(new response(result, responseMessage.CONTENT_UPDATED));
    } catch (error) {
      return next(error);
    }
  }



  /**
   * @swagger
   * /staticContent/getAllStaticContent:
   *   get:
   *     summary: Get all Static Content
   *     description: Endpoint to  get all Static Content
   *     tags: [STATIC CONTENT]
   *     responses:
   *       '200':
   *         description: STATIC_CONTENT_FOUND
   *       '500':
   *         description: Internal server error.
   */
  async getAllStaticContent(req, res, next) {
    try {
      // const { error, value: validatedBody } = validationSchema.validate(req.body);
      // if (error) {
      //   return next(error);
      // }
      // const user = await findUser({ _id: req.userId, userType: userType.ADMIN, status: status.ACTIVE });
      // if (!user) {
      //   throw apiError.notFound(responseMessage.UNAUTHORIZED);
      // }
      const allStaticContent = await getAllStaticContent();
      return res.json(new response(allStaticContent, responseMessage.STATIC_CONTENT_FOUND));
    } catch (error) {
      return next(error);
    }
  }



  /**
   * @swagger
   * /staticContent/getAllStaticContentByType:
   *   get:
   *     summary: Get all Static Content By Type
   *     description: Endpoint to get all Static Content By Type
   *     tags: [STATIC CONTENT]
   *     parameters:
   *       - in: query
   *         name: contentType
   *         description: contentType
   *         required: true
   *     responses:
   *       '200':
   *         description: STATIC_CONTENT_FOUND
   *       '500':
   *         description: Internal server error.
   */
  /**
   * @swagger
   * /staticContent/getAllStaticContentByType:
   *   get:
   *     summary: Get all Static Content By Type
   *     description: Endpoint to get all Static Content By Type
   *     tags: [STATIC CONTENT]
   *     parameters:
   *       - in: query
   *         name: contentType
   *         enum: ['privacyPolicy', 'termsCondition', 'aboutUs', 'faq', 'banner' , 'conversationStarter' , 'gettingStarted']
   *         description: contentType
   *         required: true
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: userType
   *         description: userType
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
   *         description: STATIC_CONTENT_FOUND
   *       '500':
   *         description: Internal server error.
   */
  async getAllStaticContentByType(req, res, next) {
    const validationSchema = Joi.object({
      contentType: Joi.string().required(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      status: Joi.string().optional(),
    });
    try {
      const { error, value: validatedBody } = validationSchema.validate(req.query);
      if (error) {
        return next(error);
      }
      const contentType = validatedBody.contentType;
      const allStaticContent = await getAllStaticContentByType(validatedBody);
      return res.json(new response(allStaticContent, responseMessage.STATIC_CONTENT_FOUND));
    } catch (error) {
      return next(error);
    }
  }
 
  /**
 * @swagger
 * /staticContent/deleteAllStaticContent:
 *   delete:
 *     tags: [STATIC CONTENT]
 *     summary: Delete all static content
 *     description: Permanently delete all static content entries from the database also can be regenreted once server restarted.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         description: ADMIN token
 *         in: header
 *         required: true
 *     responses:
 *       200:
 *         description: All content deleted successfully
 *       401:
 *         description: Unauthorized or user not found
 */
  async deleteAllStaticContent(req, res, next) {
    try {
      // Admin authentication check
      const authCheck = await findUser({
        _id: req.userId,
        status: status.ACTIVE,
        userType: {$ne: userType.USER},
      });
  
      if (!authCheck) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
  
      // Hard delete all static content
      await deleteAllStaticContent();
  
      return res.json(new response({}, responseMessage.ALL_STATIC_CONTENT_DELETED));
    } catch (error) {
      console.log("❌ Error Occurred in deleteAllStaticContent -->", error);
      return next(error);
    }
  }

}



export default new staticController();