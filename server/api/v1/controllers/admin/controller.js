import Joi from 'joi';
import * as express from 'express'
const mongoose = require("mongoose");
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import status from '../../../../enums/status';
import responseMessage from '../../../../../assets/responseMessage';
import userType from '../../../../enums/userType';
import commonFunction from "../../../../helper/util";
import { notificationServices } from "../../services/notification";
import { amenitiesServices } from '../../services/amenities';
import { blogServices } from "../../services/blog";
import blogModel from "../../../../models/blog";
import { teamServices } from "../../services/team";
import teamModel from "../../../../models/team";

const {
  createNotification, findNotification,
} = notificationServices;
import bcrypt from "bcryptjs";
import { userServices } from "../../services/user";
const {
  findUser,
  findAllUsers,
  updateUser
} = userServices;
import _ from "lodash";

export class adminController {

  /**
   * @swagger
   * /admin/listAllUsers:
   *   get:
   *     summary: listAllUsers
   *     description: Endpoint to listAllUsers
   *     tags: [ADMIN]
   *     parameters:
   *       - in: header
   *         name: token
   *         description: Authentication token
   *         required: true
   *       - in: query
   *         name: search
   *         description: search
   *         required: false
   *       - in: query
   *         name: page
   *         description: page
   *         required: false
   *       - in: query
   *         name: limit
   *         description: limit
   *         required: false
   *       - in: query
   *         name: fromDate
   *         description: fromDate
   *         required: false
   *       - in: query
   *         name: toDate
   *         description: toDate
   *         required: false
   *       - in: query
   *         name: filter
   *         description: filter
   *         required: false
   *     responses:
   *       '200':
   *         description: USER_FOUND
   *       '400':
   *         description: USER_NOT_FOUND/UNAUTHORIZED.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async listAllUsers(req, res, next) {
    const validationSchema = Joi.object({
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      filter: Joi.string().optional(),
    });
    try {
      const { error, value: validatedBody } = validationSchema.validate(req.query);
      if (error) return next(error);
      const { search, fromDate, toDate, filter } = validatedBody;
      const user = await findUser({ _id: req.userId });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      if (user.userType !== 'ADMIN') throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      let whereClause = { userType: 'USER' };
      if (search) {
        whereClause[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }
      if (fromDate) whereClause.createdAt = { [Op.gte]: new Date(fromDate) };
      if (toDate) whereClause.createdAt = { ...whereClause.createdAt, [Op.lte]: new Date(toDate) };
      if (filter) whereClause.status = filter;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;
      const result = await findAllUsers(whereClause, skip, limit);
      return res.json(new response(result, responseMessage.USER_LIST_FOUND));
    } catch (error) {
      console.log(error)
      return next(error);
    }
  }
  /**
  * @swagger
  * /admin/changePassword:
  *   post:
  *     tags:
  *       - ADMIN
  *     description: changePassword
  *     summary: changePassword of the admin 
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: authToken
  *         description: token
  *         in: header
  *         required: true
  *       - name: changePassword
  *         description: changePassword
  *         in: body
  *         required: true
  *         schema:
  *           $ref: '#/definitions/changePassword'
  *     responses:
  *       200:
  *         description: Returns success message
  */
  async changePassword(req, res, next) {
    const validationSchema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
    });
    try {
      const { error, value: validatedBody } = validationSchema.validate(req.body);
      if (error) return next(error);
      // let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(validatedBody.currentPassword, userResult.password)) {
        throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
      }
      if (validatedBody.currentPassword == validatedBody.newPassword) {
        throw apiError.badRequest(responseMessage.OLD_PWD_NOT_SAME);
      }

      let updated = await updateUser(userResult._id, {
        password: bcrypt.hashSync(validatedBody.newPassword),
      });
      updated = _.omit(JSON.parse(JSON.stringify(updated)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

      return res.json(new response(updated, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/resetPassword:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: resetPassword
   *     summary: resetPassword of the admin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         description: token
   *         in: header
   *         required: false
   *       - name: resetPassword
   *         description: resetPassword
   *         in: body
   *         required: false
   *         schema:
   *           $ref: '#/definitions/resetPassword'
   *     responses:
   *       200:
   *         description: Your password has been successfully changed.
   *       404:
   *         description: This user does not exist.
   *       422:
   *         description: Password not matched.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async resetPassword(req, res, next) {
    const validationSchema = Joi.object({
      newPassword: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    });
    try {
      const { error, value: validatedBody } = validationSchema.validate(req.body);
      if (error) return next(error);
      const { newPassword, confirmPassword } = validatedBody;
      // const {
      //   newPassword,
      //   confirmPassword
      // } = await Joi.validate(
      //   req.body,
      //   validationSchema
      // );
      var userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        if (newPassword == confirmPassword) {
          let update = await updateUser({
            _id: userResult._id
          }, {
            password: bcrypt.hashSync(newPassword)
          });
          update = _.omit(JSON.parse(JSON.stringify(update)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

          return res.json(new response(update, responseMessage.PWD_CHANGED));
        } else {
          throw apiError.notFound(responseMessage.PWD_NOT_MATCH);
        }
      }
    } catch (error) {
      console.log("❌ Error Occured at ResetPassword Admin ---> ", error);
      return next(error);
    }
  }
  /**
  * @swagger
  * /admin/login:
  *   post:
  *     tags:
  *       - ADMIN
  *     description: Admin login with email and Password
  *     summary: Admin login with email and Password
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: emailUsernameOrPhone
  *         description: emailUsernameOrPhone
  *         in: formData
  *         required: true
  *         default: 'mobiloitte@mailinator.com'
  *       - name: password
  *         description: password
  *         in: formData
  *         required: true
  *         default: 'Mobiloitte@1'
  *       - name: ip
  *         description: ip address
  *         in: formData
  *         required: false
  *       - name: browser
  *         description: browser of the requested user
  *         in: formData
  *         required: false
  *       - name: device
  *         description: device of the requested User
  *         in: formData
  *         required: false
  *     responses:
  *       200:
  *         description: Returns success message
  */
  async login(req, res, next) {
    var validationSchema = Joi.object({
      emailUsernameOrPhone: Joi.string().required(),
      password: Joi.string().required(),
      ip: Joi.string().optional(),
      browser: Joi.string().optional(),
      device: Joi.string().optional()
    });
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var results;
      // var validatedBody = await Joi.validate(req.body, validationSchema);
      const { error, value: validatedBody } = validationSchema.validate(req.body);
      if (error) return next(error);
      const {
        emailUsernameOrPhone,
        password
      } = validatedBody;
      var userResult = await findUser({
        $and: [{
          status: {
            $ne: status.DELETE
          }
        },
        {
          userType: {
            $ne: userType.USER
          }
        },
        {
          $or: [{
            email: emailUsernameOrPhone
          }]
        },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(password, userResult.password)) {
        throw apiError.conflict(responseMessage.INCORRECT_LOGIN);
      } else {

        var token = await commonFunction.getToken({
          _id: userResult._id,
          email: userResult.email,
          mobileNumber: userResult.mobileNumber,
          userType: userResult.userType,
        });
        results = {
          _id: userResult._id,
          email: userResult.email,
          // speakeasy: userResult.speakeasy,
          userType: userResult.userType,
          token: token,
        };
      }
      let activityObj = {
        userId: userResult._id,
        title: 'LOGIN',
        title: 'User logged in successfully',
      }
      await createNotification(activityObj)
      return res.json(new response(results, responseMessage.LOGIN));
    } catch (error) {
      console.log("Error Occured at Admin Login ---->>> login", error);
      return next(error);
    }
  }

  /**
 * @swagger
 * /admin/details/{id}:
 *   get:
 *     tags:
 *       - ADMIN
 *     summary: Get admin details by ID
 *     description: Requires admin authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the admin
 *       - in: header
 *         name: authToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token of the logged-in admin
 *     responses:
 *       200:
 *         description: Admin details fetched successfully
 *       400:
 *         description: Please provide token
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 */

async getAdminDetails(req, res, next) {
  try {
    const authHeader = req.headers.token;

    if (!authHeader) {
      return res.status(400).json({
        responseCode: 400,
        responseMessage: "Please provide token.",
      });
    }

    const adminId = req.query.adminId;

    if (!adminId) {
     
       throw apiError.badRequest("Admin ID is required");
    }

    const admin = await findUser({
      _id: adminId,
      userType: { $ne: userType.USER },
      status: { $ne: status.DELETE },
    });

    if (!admin) {
       throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
    }
const data= {
        name: admin.name || "",
        email: admin.email || "",
        profilePic: admin.profilePic || "",
      }
              return res.json(new response(data, responseMessage.DETAILS_FETCHED));

  } catch (error) {
    console.error("Error in getAdminDetails:", error);
    return next(error);
  }
}

/**
 * @swagger
 * /admin/details:
 *   put:
 *     tags:
 *       - ADMIN
 *     summary: Update admin details by ID
 *     description: Requires admin authentication
 cd   *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the admin
 *       - in: header
 *         name: authToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token of the logged-in admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               profilePic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin details updated successfully
 *       400:
 *         description: Missing or invalid parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 */

async updateAdminDetails(req, res, next) {
  try {
    const authHeader = req.headers.token;

    if (!authHeader) {
      throw apiError.badRequest("Please provide token.");
    }

     const adminId = req.body.adminId;
     console.log("dskfjkdjf,",adminId)
    if (!adminId) {
      throw apiError.badRequest("Admin ID is required");
    }

    const { name, email, profilePic } = req.body;

    if (!name || !email) {
      throw apiError.badRequest("Name and Email are required");
    }

    const admin = await findUser({
      _id: adminId,
      userType: { $ne: userType.USER },
      status: { $ne: status.DELETE },
    });

    if (!admin) {
      throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
    }

    admin.name = name.trim();
    admin.email = email.trim().toLowerCase();
    if (profilePic) {
      admin.profilePic = profilePic;
    }

    await admin.save();

    return res.json(new response({}, responseMessage.PROFILE_UPDATED));
  } catch (error) {
    console.error("Error in updateAdminDetails:", error);
    return next(error);
  }
}



  /**
 * @swagger
 * /admin/forgetPassword:
 *   post:
 *     tags:
 *       - ADMIN
 *     description: forgotPassword by ADMIN on plateform when he forgot password
 *     summary: forgotPassword by ADMIN on plateform when he forgot password
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: forgotPassword
 *         description: forgotPassword
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/forgotPassword'
 *     responses:
 *       200:
 *         description: Returns success message
 */
  async forgotPassword(req, res, next) {
    var validationSchema = Joi.object({
      email: Joi.string().required(),
    });
    try {
      const { error, value: validatedBody } = validationSchema.validate(req.body);
      if (error) return next(error);
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const {
        email
      } = validatedBody;
      var userResult = await findUser({
        $and: [{
          status: {
            $ne: status.DELETE
          }
        },
        {
          userType: {
            $ne: userType.USER
          },
        },
        {
          $or: [{
            email: email
          }]
        },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000;  //OTP expires in 3 MINS
        await commonFunction.sendOTPMail(userResult.email, newOtp);
        var updateResult = await updateUser({
          _id: userResult._id
        }, {
          otp: newOtp,
          otpExpiresAt: time
        });
        console.log("The updateResult is ---> ", updateResult);
        updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

        return res.json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log("❌ The Error Occures at forgetPassword---> ", error);
      return next(error);
    }
  }

  /**
* @swagger
* /admin/verifyOtp:
*   post:
*     tags:
*       - ADMIN
*     description: verifyOTP
*     summary: verifyOTP of the admin
*     produces:
*       - application/json
*     parameters:
*       - name: verifyOTP
*         description: verifyOTP
*         in: body
*         required: true
*         schema:
*           $ref: '#/definitions/verifyOTP'
*     responses:
*       200:
*         description: OTP send successfully.
*       404:
*         description: This user does not exist.
*       500:
*         description: Internal Server Error
*       501:
*         description: Something went wrong!
*/
  async verifyOtp(req, res, next) {
    var validationSchema = Joi.object({
      email: Joi.string().required(),
      otp: Joi.string().required(),
    });
    try {
      // var validatedBody = await Joi.validate(req.body, validationSchema);
      const { error, value: validatedBody } = validationSchema.validate(req.body);
      if (error) return next(error);
      const {
        email,
        otp
      } = validatedBody;
      let userResult = await findUser({
        email: email,
        userType: {
          $ne: userType.USER
        },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (new Date().getTime() > userResult.otpExpiresAt) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }


      if (userResult.otp != otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      var updateResult = await updateUser({
        _id: userResult._id
      }, {
        isVerified: true,
      });
      var token = await commonFunction.getToken({
        _id: updateResult._id,
        email: updateResult.email,
        mobileNumber: updateResult.mobileNumber,
        userType: updateResult.userType,
      });
      var obj = {
        _id: updateResult._id,
        name: updateResult.name,
        email: updateResult.email,
        countryCode: updateResult.countryCode,
        mobileNumber: updateResult.mobileNumber,
        isVerified: true,
        token: token,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY));
    } catch (error) {
      console.log("⚔️ Error Occured at verifyOtp----> ", error);
      return next(error);
    }
  }

  /**
 * @swagger
 * /admin/resentOtp:
 *   put:
 *     summary: Admin Resent OTP
 *     tags:
 *       - ADMIN
 *     description: Resent OTP
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: email
 *         in: formData
 *         required: true
 *     responses:
 *       200:
 *         description: Returns success message
 *       404:
 *         description: User not found || Data not found.
 *       501:
 *         description: Something went wrong!
 */

  async resentOtp(req, res, next) {
    var validationSchema = Joi.object({
      email: Joi.string().required()
    });
    try {
      var validatedBody = await validationSchema.validateAsync(req.body);
      var userResult = await findUser({
        email: validatedBody.email,
        status: { $ne: status.DELETE },
        userType: [userType.ADMIN, userType.SUBADMIN],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (userResult.otpVerified) {
        throw apiError.badRequest(responseMessage.OTP_ALREADY_VERIFIED);
      }
      // let otp = await commonFunction.getOTPFourDigit();
      var otp = await commonFunction.getOTP();
      let otpTime = new Date().getTime() + 60000;
      const updateResult = await updateUser(
        { _id: userResult._id },
        { otp: otp, otpTime: otpTime }
      );
      await commonFunction.sendResendOTP(userResult.email, otp);
      return res.json(
        new response({ status: true }, responseMessage.OTP_RESEND)
      );
    } catch (error) {
      console.error(error);
      return next(error);
    }
  }

  /**
  * @swagger
  * /admin/dropDatabase:
  *   delete:
  *     summary: Drop the ENTIRE database
  *     description: Drop the ENTIRE database ALERT
  *     tags:
  *       - ADMIN
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: authToken
  *         description: token
  *         in: header
  *         required: true
  *     responses:
  *       200:
  *         description: Returns success message
  *       404:
  *         description: User not found || Data not found.
  *       501:
  *         description: Something went wrong!
  */
  async dropDatabase(req, res, next) {
    try {
      let adminData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN] }, // Only allow admins to drop the database
      });
      if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

      const db = mongoose.connection;
      // await db.dropDatabase();
      return res.json(new response({}, "Database dropped successfully."));
    } catch (error) {
      console.log("❌ Error Occurred at dropDatabase ---> ", error.message);
      return next(error);
    }
  }
  /**
   * @swagger
   * /admin/addUpdateAmenities:
   *   post:
   *     tags:
   *       - AMENITIES MANAGEMENT
   *     summary: Create or update an amenity
   *     description: Create a new amenity or update an existing one based on the presence of an ID.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         in: header
   *         required: true
   *         description: Admin authentication token
   *       - in: body
   *         name: body
   *         description: Amenity details
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             id:
   *               type: string
   *               description: Amenity ID (if updating)
   *             title:
   *               type: string
   *             title_ar:
   *               type: string
   *             image:
   *               type: string
   *             status:
   *               type: string
   *               enum: [ACTIVE, DELETE, BLOCK]
   *     responses:
   *       200:
   *         description: Amenity created/updated successfully.
   *       400:
   *         description: Invalid input.
   *       401:
   *         description: Unauthorized access.
   */
  async addUpdateAmenity(req, res, next) {
    let validationSchema = Joi.object({
      id: Joi.string().optional(), // If present, means update; else create
      title: Joi.string().optional(),
      title_ar: Joi.string().optional(),
      image: Joi.string().optional(),
      status: Joi.string().valid("ACTIVE", "DELETE", "BLOCK").optional(),
    });
    try {
      let validatedBody = await validationSchema.validateAsync(req.body);

      // Check for admin permissions
      let adminData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
      });
      if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

      let result;
      if (validatedBody.id) {
        // Update existing amenity
        result = await amenitiesServices.updateAmenities(validatedBody.id, validatedBody);
        if (!result) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      } else {
        // Create new amenity
        result = await amenitiesServices.addAmenities(validatedBody);
      }

      return res.json(new response(result, responseMessage.AMENITIE_ADD_UPDATED_SUCESS));
    } catch (error) {
      console.log("❌ Error occurred at addUpdateAmenity --->>", error);
      return next(error);
    }
  }

  /**
 * @swagger
 * /admin/blockActiveAmenitie:
 *   patch:
 *     tags:
 *       - AMENITIES MANAGEMENT
 *     summary: Toggle the status of an amenity (ACTIVE/BLOCK)
 *     description: Use this endpoint to change the status of an amenity.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         in: header
 *         required: true
 *         description: Admin authentication token
 *       - in: body
 *         name: body
 *         description: Amenity ID and desired status
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Amenity ID
 *             status:
 *               type: string
 *               enum: [ACTIVE, BLOCK]
 *               description: New status to be set
 *     responses:
 *       200:
 *         description: Status updated successfully.
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized access.
 */
  async toggleAmenityStatus(req, res, next) {
    let validationSchema = Joi.object({
      id: Joi.string().required(),
      status: Joi.string().valid("ACTIVE", "BLOCK").required(),
    });
    try {
      let validatedBody = await validationSchema.validateAsync(req.body);

      // Verify admin privileges
      let adminData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
      });
      if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

      // Update status
      let updatedAmenity = await amenitiesServices.updateAmenities(validatedBody.id, {
        status: validatedBody.status,
      });
      if (!updatedAmenity) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);

      return res.json(new response(updatedAmenity, responseMessage.AMENITIE_STATUS_UPDATED));
    } catch (error) {
      console.log("❌ Error occurred at toggleAmenityStatus --->>", error);
      return next(error);
    }
  }

  /**
    * @swagger
    * /admin/listAmenities:
    *   get:
    *     tags:
    *       - AMENITIES MANAGEMENT
    *     summary: Listing of all amenities us by using admin token
    *     description: Listing of all amenities requests.
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
    *         description: fromDate (ISO string or YYYY-MM-DD)
    *         in: query
    *         required: false
    *       - name: toDate
    *         description: toDate (ISO string or YYYY-MM-DD)
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
    *         description: Data found successfully.
    *       401:
    *         description: Invalid file format
    */

  async listAmenities(req, res, next) {
    let validationSchema = Joi.object({
      search: Joi.string().optional(),
      status: Joi.string().valid("ACTIVE", "BLOCK", "DELETE").optional(),
      fromDate: Joi.date().optional(),
      toDate: Joi.date().optional(),
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(10),
    });

    try {
      let validatedBody = await validationSchema.validateAsync(req.query);

      // Verify admin privileges
      let adminData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
      });
      if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

      // Build query object
      let query = {};
      if (validatedBody.search) {
        query.title = { $regex: validatedBody.search, $options: "i" };
      }
      if (validatedBody.status) {
        query.status = validatedBody.status;
      }

      // Date filter
      if (validatedBody.fromDate || validatedBody.toDate) {
        query.createdAt = {};
        if (validatedBody.fromDate) {
          query.createdAt.$gte = new Date(validatedBody.fromDate);
        }
        if (validatedBody.toDate) {
          // To include the entire toDate day, set time to 23:59:59
          let toDate = new Date(validatedBody.toDate);
          toDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = toDate;
        }
      }

      // Pagination options
      let options = {
        page: validatedBody.page,
        limit: validatedBody.limit,
        sort: { createdAt: -1 },
      };

      let paginatedAmenities = await amenitiesServices.paginateAmenities(query, options);
      if (paginatedAmenities.docs.length === 0)
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);

      return res.json(new response(paginatedAmenities, responseMessage.DATA_FOUND));
    } catch (error) {
      console.log("❌ Error occurred at listAmenities --->>", error);
      return next(error);
    }
  }


  /**
  * @swagger
  * /admin/addOrUpdateBlog:
  *   post:
  *     tags:
  *       - BLOG
  *     description: Add or update a blog
  *     summary: Add or update blog
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: authToken
  *         in: header
  *         required: true
  *         type: string
  *       - name: id
  *         in: formData
  *         required: false
  *         type: string
  *       - name: title
  *         in: formData
  *         required: true
  *         type: string
  *       - name: title_ar
  *         in: formData
  *         required: true
  *         type: string
  *       - name: description
  *         in: formData
  *         required: true
  *         type: string
  *       - name: description_ar
  *         in: formData
  *         required: true
  *         type: string
  *       - name: image
  *         in: formData
  *         required: false
  *         type: string
  *       - name: image_ar
  *         in: formData
  *         required: false
  *         type: string
  *     responses:
  *       200:
  *         description: Blog added or updated successfully
  */

  async addOrUpdateBlog(req, res, next) {
    const validationSchema = Joi.object({
      id: Joi.string().optional(), // Optional for update
      title: Joi.string().required(),
      title_ar: Joi.string().required(),
      description: Joi.string().required(),
      description_ar: Joi.string().required(),
      image: Joi.string().optional(),
      image_ar: Joi.string().optional()
    });

    try {
      // Check if authToken is present

      const { error, value: validatedBody } = validationSchema.validate(req.body);
      if (error) return next(apiError.badRequest(error.message));

      let blog;
      if (validatedBody.id) {
        // Update existing blog
        blog = await blogServices.updateBlog(validatedBody.id, validatedBody);
        return res.json(new response(blog, "Blog updated successfully"));
      } else {
        // Add new blog
        blog = await blogServices.addBlog(validatedBody);
        return res.json(new response(blog, responseMessage.BLOG_ADDED));
      }
    } catch (err) {
      console.log("Error occurred at addOrUpdateBlog ---->>>", err);
      return next(err);
    }
  }


  /**
  * @swagger
  * /admin/toggleBlockStatus:
  *   post:
  *     tags:
  *       - BLOG
  *     description: Block or unblock a blog (status toggle between ACTIVE and BLOCK)
  *     summary: Toggle blog status
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: authToken
  *         in: header
  *         required: true
  *         type: string
  *       - name: id
  *         in: formData
  *         required: true
  *         type: string
  *     responses:
  *       200:
  *         description: Blog status updated
  */

  async toggleBlockStatus(req, res, next) {
    const schema = Joi.object({
      id: Joi.string().required()
    });

    try {
      const { error, value } = schema.validate(req.body);
      if (error) return next(apiError.badRequest(error.message));
      const blog = await blogModel.findById(value.id);
      if (!blog) return next(apiError.notFound("Blog not found"));
      const newStatus = blog.status === status.ACTIVE ? status.BLOCK : status.ACTIVE;
      const updatedBlog = await blogServices.updateBlog(value.id, {
        status: newStatus
      });
      return res.json(
        new response(
          {
            id: updatedBlog._id,
            title: updatedBlog.title,
            description: updatedBlog.description,
            status: updatedBlog.status,
            updatedAt: updatedBlog.updatedAt
          },
          `Blog has been ${newStatus === status.BLOCK ? "blocked" : "unblocked"} successfully`
        )
      );
    } catch (err) {
      console.log("Error in toggleBlockBlog ---->>>", err);
      return next(err);
    }
  };

  /**
 * @swagger
 * /admin/deleteBlog:
 *   post:
 *     tags:
 *       - BLOG
 *     summary: Permanently delete a blog
 *     description: Hard delete a blog from the database
 *     parameters:
 *       - name: authToken
 *         in: header
 *         required: true
 *         type: string
 *       - name: id
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 */

  async deleteBlog(req, res, next) {
    const schema = Joi.object({
      id: Joi.string().required()
    });

    try {
      const { error, value } = schema.validate(req.body);
      if (error) return next(apiError.badRequest(error.message));
      const authToken = req.headers.authtoken;
      const blog = await blogModel.findById(value.id);
      if (!blog) return next(apiError.notFound("Blog not found"));
      const deletedBlog = await blogServices.deleteBlogById(value.id);

      return res.json(
        new response(
          {
            id: deletedBlog._id,
            title: deletedBlog.title,
            description: deletedBlog.description,
            deletedAt: new Date()
          },
          "Blog has been deleted permanently"
        )
      );
    } catch (err) {
      console.log("Error in deleteBlog ---->>>", err);
      return next(err);
    }
  };


  /**
 * @swagger
 * /admin/listBlogs:
 *   get:
 *     tags:
 *       - BLOG MANAGEMENT
 *     summary: Listing of all blogs using admin token
 *     description: Retrieve a list of blogs with optional filters and pagination.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         description: Admin access token
 *         in: header
 *         required: true
 *       - name: search
 *         description: Search by blog title
 *         in: query
 *         required: false
 *       - name: status
 *         description: Blog status (ACTIVE, BLOCK, DELETE)
 *         in: query
 *         required: false
 *       - name: page
 *         description: Page number
 *         in: query
 *         type: integer
 *         required: false
 *       - name: limit
 *         description: Number of items per page
 *         in: query
 *         type: integer
 *         required: false
 *     responses:
 *       200:
 *         description: Blogs listed successfully
 *       401:
 *         description: Unauthorized access
 */

  async listBlogs(req, res, next) {
    const validationSchema = Joi.object({
      search: Joi.string().optional(),
      status: Joi.string().valid("ACTIVE", "BLOCK", "DELETE").optional(),
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(10),
    });
    try {
      const validatedBody = await validationSchema.validateAsync(req.query);

      const query = {};
      if (validatedBody.search) {
        query.title = { $regex: validatedBody.search, $options: "i" };
      }
      if (validatedBody.status) {
        query.status = validatedBody.status;
      }

      const options = {
        page: validatedBody.page,
        limit: validatedBody.limit,
        sort: { createdAt: -1 },
      }; 

      const blogs = await blogServices.paginateBlogs(query, options);

      if (!blogs.docs.length) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(blogs, responseMessage.DATA_FOUND));
    } catch (error) {
      console.error("❌ Error in listBlogs --->>", error);
      return next(error);
    }
  }

  /**
 * @swagger
 * /admin/blogs:
 *   get:
 *     tags:
 *       - BLOG MANAGEMENT
 *     summary: Public listing of all blogs
 *     description: Retrieve a list of all blogs with optional search and pagination. Only ACTIVE blogs are returned.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: search
 *         description: Search by blog title
 *         in: query
 *         required: false
 *       - name: page
 *         description: Page number
 *         in: query
 *         type: integer
 *         required: false
 *       - name: limit
 *         description: Number of items per page
 *         in: query
 *         type: integer
 *         required: false
 *     responses:
 *       200:
 *         description: Blogs listed successfully
 *       500:
 *         description: Internal Server Error
 */
async listPublicBlogs(req, res, next) {
  const validationSchema = Joi.object({
    search: Joi.string().optional(),
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(10),
  });

  try {
    const validatedBody = await validationSchema.validateAsync(req.query);

    const query = {
      status: "ACTIVE", 
    };

    if (validatedBody.search) {
      query.title = { $regex: validatedBody.search, $options: "i" };
    }

    const options = {
      page: validatedBody.page,
      limit: validatedBody.limit,
      sort: { createdAt: -1 },
    };

    const blogs = await blogServices.paginateBlogs(query, options);

    if (!blogs.docs.length) {
      throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
    }

    return res.json(new response(blogs, responseMessage.DATA_FOUND));
  } catch (error) {
    console.error("❌ Error in listPublicBlogs --->>", error);
    return next(error);
  }
}


/**
 * @swagger
 * /admin/getBlogById:
 *   get:
 *     tags:
 *       - BLOG MANAGEMENT
 *     summary: Get a single blog by ID
 *     description: Retrieve a specific blog using its MongoDB ID. Only ACTIVE blogs are returned.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the blog to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Internal Server Error
 */
async getBlogById(req, res, next) {
  try {
    const { id } = req.query;

    // Optional: validate ObjectId format if you're using MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw apiError.invalidId("Invalid blog ID format");
    }

    const blog = await blogServices.getBlogById(id);

    if (!blog || blog.status !== "ACTIVE") {
      throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
    }

    return res.json(new response(blog, responseMessage.DATA_FOUND));
  } catch (error) {
    console.error("❌ Error in getBlogById --->>", error);
    return next(error);
  }
}

  /**
   * @swagger
   * /admin/addOrUpdateTeam:
   *   post:
   *     tags:
   *       - TEAM
   *     description: Add or update a team member
   *     summary: Add or update team
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         in: header
   *         required: true
   *         type: string
   *       - name: id
   *         in: formData
   *         required: false
   *         type: string
   *       - name: name
   *         in: formData
   *         required: true
   *         type: string
   *       - name: position
   *         in: formData
   *         required: true
   *         type: string
   *       - name: thoughts
   *         in: formData
   *         required: true
   *         type: string
   *       - name: facebook
   *         in: formData
   *         required: false
   *         type: string
   *       - name: instagram
   *         in: formData
   *         required: false
   *         type: string
   *       - name: linkedin
   *         in: formData
   *         required: false
   *         type: string
   *       - name: image
   *         in: formData
   *         required: false
   *         type: string
   *       - name: status
   *         in: formData
   *         required: false
   *         type: string
   *     responses:
   *       200:
   *         description: Team member added or updated successfully
   */

  async addOrUpdateTeam(req, res, next) {
    const validationSchema = Joi.object({
      id: Joi.string().allow("", null).optional(),
      name: Joi.string().required(),
      position: Joi.string().required(),
      thoughts: Joi.string().required(),
      facebook: Joi.string().optional().allow(""),
      instagram: Joi.string().optional().allow(""),
      linkedin: Joi.string().optional().allow(""),
      image: Joi.string().optional(),
    });

    try {
      const { error, value: validatedBody } = validationSchema.validate(req.body);
      if (error) return next(apiError.badRequest(error.message));

      // Clean up the `id` field if it's empty
      const isUpdate = validatedBody.id && validatedBody.id.trim() !== "";
      if (!isUpdate) {
        delete validatedBody.id;
      }

      let teamMember;
      if (isUpdate) {
        // Update existing team member
        teamMember = await teamServices.updateTeam(validatedBody.id, validatedBody);
        return res.json(new response(teamMember, "Team member updated successfully"));
      } else {
        // Add new team member
        teamMember = await teamServices.addTeam(validatedBody);
        return res.json(new response(teamMember, "Team member added successfully"));
      }
    } catch (err) {
      console.log("Error occurred at addOrUpdateTeam ---->>>", err);
      return next(err);
    }
  }

  /**
   * @swagger
   * /admin/toggleBlockTeamStatus:
   *   post:
   *     tags:
   *       - TEAM
   *     description: Block or unblock a team member (status toggle between ACTIVE and BLOCK)
   *     summary: Toggle team member status
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         in: header
   *         required: true
   *         type: string
   *       - name: id
   *         in: formData
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Team member status updated
   */

  async toggleBlockTeamStatus(req, res, next) {
    const schema = Joi.object({
      id: Joi.string().required()
    });

    try {
      const { error, value } = schema.validate(req.body);
      if (error) return next(apiError.badRequest(error.message));

      const teamMember = await teamModel.findById(value.id);
      if (!teamMember) return next(apiError.notFound("Team member not found"));

      const newStatus = teamMember.status === status.ACTIVE ? status.BLOCK : status.ACTIVE;

      const updatedTeam = await teamServices.updateTeam(value.id, {
        status: newStatus
      });

      return res.json(
        new response(
          {
            id: updatedTeam._id,
            name: updatedTeam.name,
            position: updatedTeam.position,
            status: updatedTeam.status,
            updatedAt: updatedTeam.updatedAt
          },
          `Team member has been ${newStatus === status.BLOCK ? "blocked" : "unblocked"} successfully`
        )
      );
    } catch (err) {
      console.error("Error in toggleBlockTeamStatus ---->>>", err);
      return next(err);
    }
  }


  /**
   * @swagger
   * /admin/deleteTeam:
   *   post:
   *     tags:
   *       - TEAM
   *     summary: Permanently delete a team member
   *     description: Hard delete a team member from the database
   *     parameters:
   *       - name: authToken
   *         in: header
   *         required: true
   *         type: string
   *       - name: id
   *         in: formData
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Team member deleted successfully
   */
  async deleteTeam(req, res, next) {
    const schema = Joi.object({
      id: Joi.string().required()
    });

    try {
      const { error, value } = schema.validate(req.body);
      if (error) return next(apiError.badRequest(error.message));

      const teamMember = await teamModel.findById(value.id);
      if (!teamMember) return next(apiError.notFound("Team member not found"));

      const deletedTeam = await teamServices.deleteTeamById(value.id);

      return res.json(
        new response(
          {
            id: deletedTeam._id,
            name: deletedTeam.name,
            position: deletedTeam.position,
            deletedAt: new Date()
          },
          "Team member has been deleted permanently"
        )
      );
    } catch (err) {
      console.log("Error in deleteTeam ---->>>", err);
      return next(err);
    }
  }


  /**
   * @swagger
   * /admin/listTeam:
   *   get:
   *     tags:
   *       - TEAM MANAGEMENT
   *     summary: Listing of all team members using admin token
   *     description: Retrieve a list of team members with optional filters and pagination.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authToken
   *         description: Admin access token
   *         in: header
   *         required: true
   *       - name: search
   *         description: Search by name or position
   *         in: query
   *         required: false
   *       - name: status
   *         description: Team member status (ACTIVE, BLOCK, DELETE)
   *         in: query
   *         required: false
   *       - name: page
   *         description: Page number
   *         in: query
   *         type: integer
   *         required: false
   *       - name: limit
   *         description: Number of items per page
   *         in: query
   *         type: integer
   *         required: false
   *     responses:
   *       200:
   *         description: Team listed successfully
   *       401:
   *         description: Unauthorized access
   */

  async listTeam(req, res, next) {
    const validationSchema = Joi.object({
      search: Joi.string().optional(),
      status: Joi.string().valid("ACTIVE", "BLOCK", "DELETE").optional(),
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(10),
    });

    try {
      const validatedBody = await validationSchema.validateAsync(req.query);

      // Verify admin access
      const adminData = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
      });

      if (!adminData) throw apiError.unauthorized(responseMessage.UNAUTHORIZED);

      // Build query
      const query = {};
      if (validatedBody.search) {
        query.$or = [
          { name: { $regex: validatedBody.search, $options: "i" } },
          { position: { $regex: validatedBody.search, $options: "i" } },
        ];
      }
      if (validatedBody.status) {
        query.status = validatedBody.status;
      }

      // Pagination options
      const options = {
        page: validatedBody.page,
        limit: validatedBody.limit,
        sort: { createdAt: -1 },
      };

      // Fetch paginated team members
      const teamList = await teamServices.paginateTeams(query, options);

      if (!teamList.docs.length) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(teamList, responseMessage.DATA_FOUND));
    } catch (error) {
      console.error("❌ Error in listTeam --->>", error);
      return next(error);
    }
  }

    /**
   * @swagger
   * /admin/publicList:
   *   get:
   *     tags:
   *       - TEAM MANAGEMENT (Public)
   *     summary: Public listing of all team members
   *     description: Anyone can retrieve a paginated list of team members. Only ACTIVE team members are returned.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: search
   *         description: Search by name or position
   *         in: query
   *         required: false
   *       - name: page
   *         description: Page number
   *         in: query
   *         type: integer
   *         required: false
   *       - name: limit
   *         description: Number of items per page
   *         in: query
   *         type: integer
   *         required: false
   *     responses:
   *       200:
   *         description: Team listed successfully
   *       500:
   *         description: Internal Server Error
   */
  async publicList(req, res, next) {
    const validationSchema = Joi.object({
      search: Joi.string().optional(),
      page: Joi.number().optional().default(1),
      limit: Joi.number().optional().default(10),
    });

    try {
      const validatedBody = await validationSchema.validateAsync(req.query);

      const query = { status: "ACTIVE" };

      if (validatedBody.search) {
        query.$or = [
          { name: { $regex: validatedBody.search, $options: "i" } },
          { position: { $regex: validatedBody.search, $options: "i" } },
        ];
      }

      const options = {
        page: validatedBody.page,
        limit: validatedBody.limit,
        sort: { createdAt: -1 },
      };

      const teamList = await teamServices.paginateTeams(query, options);

      if (!teamList.docs.length) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(teamList, responseMessage.DATA_FOUND));
    } catch (error) {
      console.error("❌ Error in publicListTeam --->>", error);
      return next(error);
    }
  }



}

export default new adminController();