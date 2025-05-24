import _ from "lodash";
import Joi from "joi";
import apiError from "../../../../helper/apiError";
import auth from "../../../../helper/auth";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import commonFunction from "../../../../helper/util";

import { userServices } from "../../services/user";
const {
  checkUserExists,
  userList,
  emailMobileExist,
  createUser,
  findUser,
  findAllUser,
  findAllDeveloper,
  updateUser,
  updateUserById,
  paginateSearch,
  insertManyUser,
  listUser,
  subAdminList,
} = userServices;

import { contactusServices } from "../../services/contactUs";
const { createContact, findContactUs, deleteContactUs, contactUsLists , updateContactUs} =
  contactusServices;



export class contactUsController {
  /**
   * @swagger
   * /contact/createContactUs:
   *   post:
   *     tags:
   *       - CONTACTUS MANAGEMENT
   *     summary: Create contact us data by using user token.
   *     description: Create Contact Us and store the data on database.s
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken    
   *         description: token
   *         in: header
   *         required: true
   *       - name: name
   *         description: name
   *         in: formData
   *         required: false
   *       - name: email
   *         description: email
   *         in: formData
   *         required: false
   *       - name: message
   *         description: message
   *         in: formData
   *         required: true
   *       - name: attachFile
   *         description: attachFile
   *         in: formData
   *         type: file
   *         required: false
   *     responses:
   *       200:
   *         description: Data found successfully .
   *       401:
   *         description: Invalid file format
   */
  async createContactUs(req, res, next) {
    const validationSchema = Joi.object({
      name: Joi.string().optional(),
      email: Joi.string().optional(),
      message: Joi.string().optional(),
      attachFile: Joi.string().optional(),
    });
    try {
      let validatedBody = await validationSchema.validateAsync(req.body);

      let userResult = await findUser({
        _id: req.userId,
        userType: userType.USER,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (req.files) {
        let imgUrl = await commonFunction.getImageUrl(req.files[0]);
        validatedBody.attachFile = imgUrl;
      }
      validatedBody.userId = userResult._id;
      const contactRes = await createContact(validatedBody);
      return res.json(  new response(contactRes, responseMessage.CONTACTUS_ADDED) );
    
    } catch (error) {
      console.log("❌ Error occured at createContactUs --->>" , error.message);
      return next(error);
    }
  }
  /**
   * @swagger
   * /contact/listContactUs:
   *   get:
   *     tags:
   *       - CONTACTUS MANAGEMENT
   *     summary: Listing of all contact us by using admin token
   *     description: Listing of all contact us requests.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         description: token
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
   *       200:
   *         description: Data found successfully .
   *       401:
   *         description: Invalid file format
   */
  async listContactUs(req, res, next) {
    let validationSchema = Joi.object({
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      userType: Joi.string().optional(),
      status: Joi.string().optional(),
    });
    try {
      let validatedBody = await await validationSchema.validateAsync(req.query);
      let adminData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
      });
      if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

      let allContactDetails = await contactUsLists(validatedBody);
      if (allContactDetails.length == 0)
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);

      return res.json(
        new response(allContactDetails, responseMessage.DATA_FOUND)
      );
    } catch (error) {
        console.log('❌ Error occured at listContactUs --->>' , error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /contact/viewcontactus:
   *   get:
   *     tags:
   *       - CONTACTUS MANAGEMENT
   *     summary: Get contact us detail by using admin token and contact us id.
   *     description: Get single contact us request by ObjectId
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully .
   *       401:
   *         description: Invalid file format
   */
  async viewcontactus(req, res, next) {
    let validationSchema = Joi.object({
      _id: Joi.string().required(),
    });
    try {
      let validatedBody = await validationSchema.validateAsync(req.query);
      let adminData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
      });
      if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

      let contactusRes = await findContactUs({ _id: validatedBody._id });
      if (!contactusRes) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);

      return res.json(new response(contactusRes, responseMessage.DATA_FOUND));
    } catch (error) {
    console.log('❌ Error occured at viewContactUs --->>' , error);
      return next(error);
    }
  }

    /**
   * @swagger
   * /contact/replyContactUs:
   *   post:
   *     tags:
   *       - CONTACTUS MANAGEMENT
   *     summary: replyContactUs the contact Us
   *     description: replyContactUs
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: id of the document to replay
   *         in: query
   *         required: true
   *       - name: message
   *         description: replay message
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully .
   *       401:
   *         description: Invalid file format
   */
    async replyContactUs(req, res, next) {
        let validationSchema = Joi.object({
          _id: Joi.string().required(),
          message: Joi.string().required(),
        });
        try {
          let validatedBody = await await validationSchema.validateAsync(req.query);
          let adminData = await findUser({
            _id: req.userId,
            userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
          });
          if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
    
          let viewContactUsData = await findContactUs({_id : validatedBody._id , replayStatus : false});
          if (!viewContactUsData) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
          
          //send mail
          await commonFunction.sendMail(viewContactUsData.email, 'Contact US response', validatedBody.message);
         //  commonFunction
          let updateResult = await updateContactUs({_id : viewContactUsData._id} , 
            {replayMessage : validatedBody.message , replayStatus : true});
          return res.json(
            new response(updateResult, responseMessage.CONTACT_US_REPLAY)
          );
        } catch (error) {
            console.log('❌ Error occured at replyContactUs --->>' , error);
          return next(error);
        }
      }

        /**
   * @swagger
   * /contact/deleteContactUs:
   *   delete:
   *     tags:
   *       - CONTACTUS MANAGEMENT
   *     summary: delete of the contact us 
   *     description: Delete the contact Us.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: id of the document to replay
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully .
   *       401:
   *         description: Invalid file format
   */
    async deleteContactUs(req, res, next) {
        let validationSchema = Joi.object({
          _id: Joi.string().required(),
        });
        try {
          let validatedBody = await await validationSchema.validateAsync(req.query);
          let adminData = await findUser({
            _id: req.userId,
            userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
          });
          if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
    
          let viewContactUsData = await findContactUs({_id : validatedBody._id , status : status.ACTIVE});
          if (!viewContactUsData) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);

          let updateResult = await updateContactUs({_id : viewContactUsData._id} , 
            {status :  status.DELETE});
          return res.json(
            new response(updateResult, responseMessage.CONTACT_US_DELETED)
          );
        } catch (error) {
            console.log('❌ Error occured at deleteContactUs --->>' , error);
          return next(error);
        }
      }

 
}
export default new contactUsController();
