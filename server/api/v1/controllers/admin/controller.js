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
import { blogServices } from "../../services/blog";
import blogModel from "../../../../models/blog";
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

class AdminController {

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
      const authToken = req.headers.authtoken;
      if (!authToken) return next(apiError.unauthorized("authToken is required."));

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
      const authToken = req.headers.authtoken;
      if (!authToken) return next(apiError.unauthorized("authToken is required."));
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
    // Validate input
    const { error, value } = schema.validate(req.body);
    if (error) return next(apiError.badRequest(error.message));

    // Check authToken
    const authToken = req.headers.authtoken;
    if (!authToken) return next(apiError.unauthorized("authToken is required."));

    // Check if blog exists
    const blog = await blogModel.findById(value.id);
    if (!blog) return next(apiError.notFound("Blog not found"));

    // Perform hard delete
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



}

export default new adminController();