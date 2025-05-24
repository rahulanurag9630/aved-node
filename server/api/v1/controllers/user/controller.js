import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import responseMessage from "../../../../../assets/responseMessage";
import notificationTemplates from "../../../../../assets/notificationTemplates";
import commonFunction from "../../../../helper/util";
import _ from "lodash";
import bcrypt from "bcryptjs";

import { userServices } from "../../services/user";
const {
  checkUserExists,
  createUser,
  updateUser,
  findUser,
  createUserProfile,
  getUserProfile,
  getUserFilteredData,
  updateUserProfile,
  updateUserBlockStatus,
  updateUserHideStatus,
} = userServices;
import { notificationServices } from "../../services/notification";
const { createNotification, findNotification } = notificationServices;

export class userController {
  /**
   * @swagger
   * /user/login:
   *   post:
   *     summary: User Login
   *     description: Endpoint for user authentication
   *     tags: [Authentication]
   *     parameters:
   *       - in: body
   *         name: login
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             email:
   *               type: string
   *             mobileNumber:
   *               type: string
   *             deviceToken:
   *               type: string
   *     responses:
   *       '200':
   *         description: LOGIN_SUCCESS
   *       '400':
   *         description: INVALID_CREDENTIALS
   *       '500':
   *         description: INTERNAL_ERROR
   */
  async login(req, res, next) {
    const validationSchema = Joi.object({
      email: Joi.string().email().optional(),
      mobileNumber: Joi.string().optional(),
      deviceToken: Joi.string().optional(),
    });
    try {
      const { error, value: loginData } = validationSchema.validate(req.body);
      if (error) return next(error);
      const { email, mobileNumber, deviceToken } = loginData;
      if (!email && !mobileNumber)
        throw apiError.badRequest(responseMessage.INCORRECT_LOGIN);
      let userQuery = { $or: [] };
      if (email) userQuery.$or.push({ email });
      if (mobileNumber) userQuery.$or.push({ mobileNumber });
      let user = await userServices.checkUserExists(userQuery);
      const otp = commonFunction.getOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      if (!user) {
        user = await createUser({
          ...loginData,
          otp,
          otpExpiresAt,
          isActive: true,
        });
        setImmediate(async () => {
          const subject = notificationTemplates.accountCreated.subject;
          const text = notificationTemplates.accountCreated.body;
          if (email) {
            await commonFunction.sendMail(user.email, subject, text);
          } else if (mobileNumber) {
            await commonFunction.sendSms(mobileNumber, text);
          }
        });
      } else {
        if (deviceToken) {
          if (!user.deviceTokens) user.deviceTokens = [];
          if (!user.deviceTokens.includes(deviceToken)) {
            user.deviceTokens.push(deviceToken);
          }
        }
        await updateUser(
          { _id: user.id },
          { otp, otpExpiresAt, deviceTokens: user.deviceTokens, isActive: true }
        );
      }
      setImmediate(async () => {
        const subject = notificationTemplates.otpVerification.subject;
        const text = notificationTemplates.otpVerification.body.replace(
          "{{otpCode}}",
          otp
        );
        if (email) {
          await commonFunction.sendMail(user.email, subject, text);
        } else if (mobileNumber) {
          // await commonFunction.sendSms(mobileNumber, otp);
        }
      });
      const result = {
        userId: user._id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        otp,
      };
      let jh = await createNotification({
        userId: user._id,
        title: "USER_LOGGED_IN",
        title: "uSER IS LOGGED IN ",
      });
      console.log("asasasasas", jh);
      return res.json(new response(result, responseMessage.LOGIN));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/socialLogin:
   *   post:
   *     summary: User socialLogin
   *     description: Endpoint for user authentication
   *     tags: [Authentication]
   *     parameters:
   *       - in: body
   *         name: socialLogin
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             socialId:
   *               type: string
   *             email:
   *               type: string
   *             provider:
   *               type: string
   *               enum:
   *                 - google, facebook, apple, snapchat
   *             deviceToken:
   *               type: string
   *     responses:
   *       '200':
   *         description: LOGIN_SUCCESS
   *       '400':
   *         description: INVALID_CREDENTIALS
   *       '500':
   *         description: INTERNAL_ERROR
   */
  async socialLogin(req, res, next) {
    const validationSchema = Joi.object({
      socialId: Joi.string().required(),
      email: Joi.string().email().optional(),
      provider: Joi.string()
        .valid("google", "facebook", "apple", "snapchat")
        .required(),
      deviceToken: Joi.string().optional(),
    });
    try {
      const { error, value: loginData } = validationSchema.validate(req.body);
      if (error) return next(error);
      const { socialId, email, provider, deviceToken } = loginData;
      let userQuery = { $or: [{ socialId }] };
      if (email) userQuery.$or.push({ email });
      let user = await userServices.checkUserExists(userQuery);
      if (!user) {
        user = await createUser({ ...loginData, isActive: true });
        setImmediate(async () => {
          const subject = notificationTemplates.accountCreated.subject;
          const text = notificationTemplates.accountCreated.body;
          if (email) {
            await commonFunction.sendMail(user.email, subject, text);
          }
        });
      } else {
        if (deviceToken) {
          if (!user.deviceTokens) user.deviceTokens = [];
          if (!user.deviceTokens.includes(deviceToken)) {
            user.deviceTokens.push(deviceToken);
          }
        }
        await updateUser(
          { _id: user.id },
          { deviceTokens: user.deviceTokens, isActive: true }
        );
      }
      const token = await commonFunction.getToken({
        _id: user._id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        userType: user.userType,
      });
      const result = {
        userId: user._id,
        email: user.email,
        socialId: user.socialId,
        provider: user.provider,
        mobileNumber: user.mobileNumber,
        userType: user.userType,
        authToken: token,
        isVerified: user.isVerified,
        isProfileCompleted: user.isProfileCompleted,
        isActive: true,
      };
      return res.json(new response(result, responseMessage.LOGIN));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resendOTP:
   *   post:
   *     summary: user send otp
   *     description: Endpoint to user send otp
   *     tags: [Authentication]
   *     parameters:
   *       - name: resendOTP
   *         description: resendOTP
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             email:
   *               type: string
   *             mobileNumber:
   *               type: string
   *     responses:
   *       '200':
   *         description: OTP_SEND.
   *       '400':
   *         description: USER_NOT_FOUND.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async resendOtp(req, res, next) {
    const validationSchema = Joi.object({
      email: Joi.string().email().optional(),
      mobileNumber: Joi.string().optional(),
    });
    try {
      const { error, value: requestData } = validationSchema.validate(req.body);
      if (error) return next(error);
      const { email, mobileNumber } = requestData;
      if (!email && !mobileNumber) {
        throw apiError.badRequest(responseMessage.INVALID_CREDENTIALS);
      }
      let userQuery = {};
      if (email) userQuery.email = email;
      if (mobileNumber) userQuery.mobileNumber = mobileNumber;
      let user = await userServices.checkUserExists(userQuery);
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const otp = commonFunction.getOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await updateUser({ _id: user._id }, { otp, otpExpiresAt });
      setImmediate(async () => {
        const subject = notificationTemplates.otpVerification.subject;
        const text = notificationTemplates.otpVerification.body.replace(
          "{{otpCode}}",
          otp
        );
        if (email) {
          await commonFunction.sendMail(email, subject, text);
        } else if (mobileNumber) {
          await commonFunction.sendSms(mobileNumber, otp);
        }
      });
      return res.json(new response({ otp }, responseMessage.OTP_SEND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/verifyOTP:
   *   post:
   *     summary: user verify otp
   *     description: Endpoint to user verify otp
   *     tags: [Authentication]
   *     parameters:
   *       - name: verifyOTP
   *         description: verifyOTP
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             email:
   *               type: string
   *             mobileNumber:
   *               type: string
   *             otp:
   *               type: string
   *     responses:
   *       '200':
   *         description: OTP_VERIFY.
   *       '400':
   *         description: USER_NOT_FOUND.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async verifyOtp(req, res, next) {
    const validationSchema = Joi.object({
      email: Joi.string().email().optional(),
      mobileNumber: Joi.string().optional(),
      otp: Joi.string().required(),
    });
    try {
      const { error, value: requestData } = validationSchema.validate(req.body);
      if (error) return next(error);
      const { email, mobileNumber, otp } = requestData;
      if (!email && !mobileNumber) {
        throw apiError.badRequest(responseMessage.INVALID_CREDENTIALS);
      }
      let userQuery = {};
      if (email) userQuery.email = email;
      if (mobileNumber) userQuery.mobileNumber = mobileNumber;
      const user = await userServices.checkUserExists(userQuery);
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (user.otp !== otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      if (user.otpExpiresAt && new Date(user.otpExpiresAt) < new Date()) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      await updateUser({ _id: user._id }, { otp: null, otpExpiresAt: null });
      const token = await commonFunction.getToken({
        _id: user._id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        userType: user.userType,
      });
      const result = {
        userId: user._id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        userType: user.userType,
        authToken: token,
        isVerified: user.isVerified,
        isProfileCompleted: user.isProfileCompleted,
        isActive: true,
      };
      setImmediate(async () => {
        const subject = notificationTemplates.otpVerified.subject;
        const text = notificationTemplates.otpVerified.body;
        if (email) {
          await commonFunction.sendMail(email, subject, text);
        } else if (mobileNumber) {
          await commonFunction.sendSms(mobileNumber, otp);
        }
      });
      return res.json(new response(result, responseMessage.OTP_VERIFY));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/logout:
   *   post:
   *     summary: user logout
   *     description: Endpoint to user logout
   *     tags: [Authentication]
   *     parameters:
   *       - name: authToken
   *         description: authToken
   *         in: header
   *         required: true
   *       - name: logout
   *         description: logout
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             deviceToken:
   *               type: string
   *     responses:
   *       '200':
   *         description: USER_LOGOUT.
   *       '400':
   *         description: USER_NOT_FOUND.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async logout(req, res, next) {
    const validationSchema = Joi.object({
      deviceToken: Joi.string().optional(),
    });
    try {
      const { error, value: requestData } = validationSchema.validate(req.body);
      if (error) return next(error);
      const { deviceToken } = requestData;
      const authCheck = await findUser({
        _id: req.userId,
        status: status.ACTIVE,
      });
      if (!authCheck) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      let updatedDeviceTokens = userDetails.deviceTokens || [];
      if (
        deviceToken &&
        Array.isArray(updatedDeviceTokens) &&
        updatedDeviceTokens.length
      ) {
        updatedDeviceTokens = updatedDeviceTokens.filter(
          (token) => token !== deviceToken
        );
      }
      await updateUserDetails(
        { where: { id: userDetails.id } },
        { deviceTokens: updatedDeviceTokens, isActive: false }
      );
      return res.json(new response("", responseMessage.USER_LOGOUT));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/uploadFile:
   *   post:
   *     tags:
   *       - uploadFiles
   *     description: upload Image/ Video
   *     summary: upload Image/ Video
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: file
   *         description: file
   *         in: formData
   *         type: file
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async uploadFile(req, res, next) {
    try {
      let file = req.files[0];
      let imageUrl = await commonFunction.getImageUrl(file);
      await commonFunction.removeFile(file.path);
      return res.json(new response(imageUrl, responseMessage.IMAGE_UPLOADED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/updateProfile:
   *   put:
   *     summary: Update user profile
   *     description: API to update the user's profile information.
   *     tags: [User]
   *     security:
   *       - authToken: []
   *     parameters:
   *       - name: authToken
   *         in: header
   *         description: Authentication token.
   *         required: true
   *         schema:
   *           type: string
   *       - name: updateProfile
   *         description: updateProfile
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *               userId:
   *                 type: string
   *               fullName:
   *                 type: string
   *               userName:
   *                 type: string
   *               bio:
   *                 type: string
   *               dateOfBirth:
   *                 type: string
   *                 format: date
   *               gender:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: [male, female, other]
   *                   status:
   *                     type: boolean
   *               sexualOrientation:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                   status:
   *                     type: boolean
   *               relationshipType:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Monogamy", "Non-monogamy", "Figuring out my relation type", "friendship", "Prefer not to say"]
   *                   status:
   *                     type: boolean
   *               preferences:
   *                 type: object
   *                 properties:
   *                   gender:
   *                     type: string
   *                     enum: ["male", "female", "other", "any"]
   *                   datingIntention:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: array
   *                         items:
   *                           type: string
   *                       status:
   *                         type: boolean
   *                   location:
   *                     type: string
   *                   transportMode:
   *                     type: string
   *                   distance:
   *                     type: string
   *               latitude:
   *                 type: number
   *                 format: float  # To specify floating point precision
   *               longitude:
   *                 type: number
   *                 format: float  # To specify floating point precision
   *               height:
   *                 type: string
   *               schoolName:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                   status:
   *                     type: boolean
   *               whoIAm:
   *                 type: array
   *                 items:
   *                   type: string
   *               wellness:
   *                 type: array
   *                 items:
   *                   type: string
   *               seeking:
   *                 type: array
   *                 items:
   *                   type: string
   *               dateVibes:
   *                 type: array
   *                 items:
   *                   type: string
   *               funFacts:
   *                 type: array
   *                 items:
   *                   type: string
   *               storyTime:
   *                 type: array
   *                 items:
   *                   type: string
   *               deepTalk:
   *                 type: array
   *                 items:
   *                   type: string
   *               letsChat:
   *                 type: array
   *                 items:
   *                   type: string
   *               drinking:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Not for me", "Sober", "On special occasions", "Socially on weekends", "Most Nights"]
   *                   status:
   *                     type: boolean
   *               smoking:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Social Smoker", "Smoker when drinking", "Non-smoker", "Smoker", "Trying to quit"]
   *                   status:
   *                     type: boolean
   *               pets:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: array
   *                     items:
   *                       type: string
   *                       enum: ["Dog", "Cat", "Reptile Amphibian", "Bird", "Fish", "Don't have but love", "Other", "Turtle"]
   *                   status:
   *                     type: boolean
   *               drugs:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Yes", "Sometimes", "No", "Prefer not to say"]
   *                   status:
   *                     type: boolean
   *               communicationStyle:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["I stay on WhatsApp all day", "Big Time Texter", "Phone caller", "Video Chatter", "Bad Texter", "I'm slow to answer on WhatsApp"]
   *                   status:
   *                     type: boolean
   *               receiveLove:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Thoughtful gestures", "Presents", "Touch", "Compliments", "Time Together"]
   *                   status:
   *                     type: boolean
   *               educationLevel:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Bachelors", "In college", "High School", "PhD.", "Don't have but love", "Other", "Turtle"]
   *                   status:
   *                     type: boolean
   *               zodiacSign:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Aries", "Cancer", "Gemini"]
   *                   status:
   *                     type: boolean
   *               religion:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Christianity", "Islam", "Hinduism", "Buddhism", "Sikhism", "Judaism"]
   *                   status:
   *                     type: boolean
   *               politicalBelief:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Liberal", "Conservative", "Moderate", "Libertarian", "Progressive", "Socialist", "Communist", "Anarchist", "Centrist", "Independent", "Apolitical", "Prefer not to say", "Other"]
   *                   status:
   *                     type: boolean
   *               children:
   *                 type: object
   *                 properties:
   *                   value:
   *                     type: string
   *                     enum: ["Yes", "No", "Expecting", "Prefer not to say"]
   *                   status:
   *                     type: boolean
   *               values:
   *                 type: object
   *                 properties:
   *                   qualities:
   *                     type: array
   *                     items:
   *                       type: string
   *                   dealBreakers:
   *                     type: string
   *               yourLikes:
   *                 type: array
   *                 items:
   *                   type: string
   *               recentPics:
   *                 type: array
   *                 items:
   *                   type: string
   *               guardianDetails:
   *                 type: object
   *                 properties:
   *                   name:
   *                     type: string
   *                   email:
   *                     type: string
   *                     format: email
   *                   mobileNumber:
   *                     type: string
   *                   otp:
   *                     type: string
   *                   otpExpiresAt:
   *                     type: string
   *                     format: date-time
   *                   isVerified:
   *                     type: boolean
   *               selfAssessment:
   *                 type: object
   *                 properties:
   *                   authenticity:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                       status:
   *                         type: boolean
   *                   empathy:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                       status:
   *                         type: boolean
   *                   respectfulness:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                       status:
   *                         type: boolean
   *                   communicationClarity:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                       status:
   *                         type: boolean
   *                   positivity:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                       status:
   *                         type: boolean
   *                   curiosity:
   *                     type: object
   *                     properties:
   *                       value:
   *                         type: string
   *                       status:
   *                         type: boolean
   *               regularPlaces:
   *                 type: object
   *                 properties:
   *                   city:
   *                     type: string
   *                   primaryLocation:
   *                     type: string
   *                   frequentLocation:
   *                     type: string
   *               isProfileCompleted:
   *                 type: boolean
   *               pushNotification:
   *                 type: boolean
   *               sendEmail:
   *                 type: boolean
   *               showOnlineStatus:
   *                 type: boolean
   *               status:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated successfully.
   *       400:
   *         description: Invalid input data.
   *       401:
   *         description: Unauthorized, invalid token.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal server error.
   */
  async updateProfile(req, res, next) {
    const validatedBody = Joi.object({
      userId: Joi.string().required(),
      fullName: Joi.string().optional(),
      userName: Joi.string().optional(),
      bio: Joi.string().optional(),
      dateOfBirth: Joi.date().optional(),
      gender: Joi.object({
        value: Joi.string().valid("male", "female", "other", null).optional(),
        status: Joi.boolean().optional(),
      }).optional(),

      sexualOrientation: Joi.object({
        value: Joi.string().optional(),
        status: Joi.boolean().optional(),
      }).optional(),

      relationshipType: Joi.object({
        value: Joi.string()
          .valid(
            "Monogamy",
            "Non-monogamy",
            "Figuring out my relation type",
            "friendship",
            "Prefer not to say",
            null
          )
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),

      preferences: Joi.object({
        gender: Joi.string().valid("male", "female", "other", "any").optional(),
        datingIntention: Joi.object({
          value: Joi.array().items(Joi.string()).optional(),
          status: Joi.boolean().optional(),
        }).optional(),
        location: Joi.string().optional(),
        transportMode: Joi.string().optional(),
        distance: Joi.string().optional(),
      }).optional(),
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      height: Joi.string().optional(),
      schoolName: Joi.object({
        value: Joi.string().optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      whoIAm: Joi.array().items(Joi.string()).optional(),
      wellness: Joi.array().items(Joi.string()).optional(),
      seeking: Joi.array().items(Joi.string()).optional(),
      dateVibes: Joi.array().items(Joi.string()).optional(),
      funFacts: Joi.array().items(Joi.string()).optional(),
      storyTime: Joi.array().items(Joi.string()).optional(),
      deepTalk: Joi.array().items(Joi.string()).optional(),
      letsChat: Joi.array().items(Joi.string()).optional(),
      drinking: Joi.object({
        value: Joi.string()
          .valid(
            "Not for me",
            "Sober",
            "On special occasions",
            "Socially on weekends",
            "Most Nights",
            null
          )
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      smoking: Joi.object({
        value: Joi.string()
          .valid(
            "Social Smoker",
            "Smoker when drinking",
            "Non-smoker",
            "Smoker",
            "Trying to quit",
            null
          )
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      pets: Joi.object({
        value: Joi.array().items(Joi.string()).optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      drugs: Joi.object({
        value: Joi.string()
          .valid("Yes", "Sometimes", "No", "Prefer not to say", null)
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      communicationStyle: Joi.object({
        value: Joi.string()
          .valid(
            "I stay on WhatsApp all day",
            "Big Time Texter",
            "Phone caller",
            "Video Chatter",
            "Bad Texter",
            "I'm slow to answer on WhatsApp",
            null
          )
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      receiveLove: Joi.object({
        value: Joi.string()
          .valid(
            "Thoughtful gestures",
            "Presents",
            "Touch",
            "Compliments",
            "Time Together",
            null
          )
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      educationLevel: Joi.object({
        value: Joi.string()
          .valid(
            "Bachelors",
            "In college",
            "High School",
            "PhD.",
            "Don't have but love",
            "Other",
            "Turtle",
            null
          )
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      zodiacSign: Joi.object({
        value: Joi.string().valid("Aries", "Cancer", "Gemini", null).optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      religion: Joi.object({
        value: Joi.string()
          .valid(
            "Christianity",
            "Islam",
            "Hinduism",
            "Buddhism",
            "Sikhism",
            "Judaism",
            null
          )
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      politicalBelief: Joi.object({
        value: Joi.string()
          .valid(
            "Liberal",
            "Conservative",
            "Moderate",
            "Libertarian",
            "Progressive",
            "Socialist",
            "Communist",
            "Anarchist",
            "Centrist",
            "Independent",
            "Apolitical",
            "Prefer not to say",
            "Other",
            null
          )
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      children: Joi.object({
        value: Joi.string()
          .valid("Yes", "No", "Expecting", "Prefer not to say", null)
          .optional(),
        status: Joi.boolean().optional(),
      }).optional(),
      values: Joi.object({
        qualities: Joi.array().items(Joi.string()).optional(),
        dealBreakers: Joi.string().optional(),
      }).optional(),
      yourLikes: Joi.array().items(Joi.string()).optional(),
      recentPics: Joi.array().items(Joi.string()).optional(),
      guardianDetails: Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().optional(),
        mobileNumber: Joi.string().optional(),
        otp: Joi.string().optional(),
        otpExpiresAt: Joi.date().optional(),
        isVerified: Joi.boolean().optional().default(false),
      }).optional(),
      selfAssessment: Joi.object({
        authenticity: Joi.object({
          value: Joi.string().optional(),
          status: Joi.boolean().optional(),
        }).optional(),
        empathy: Joi.object({
          value: Joi.string().optional(),
          status: Joi.boolean().optional(),
        }).optional(),
        respectfulness: Joi.object({
          value: Joi.string().optional(),
          status: Joi.boolean().optional(),
        }).optional(),
        communicationClarity: Joi.object({
          value: Joi.string().optional(),
          status: Joi.boolean().optional(),
        }).optional(),
        positivity: Joi.object({
          value: Joi.string().optional(),
          status: Joi.boolean().optional(),
        }).optional(),
        curiosity: Joi.object({
          value: Joi.string().optional(),
          status: Joi.boolean().optional(),
        }).optional(),
      }).optional(),
      regularPlaces: Joi.object({
        city: Joi.string().optional(),
        primaryLocation: Joi.string().optional(),
        frequentLocation: Joi.string().optional(),
      }).optional(),
      isProfileCompleted: Joi.boolean().optional(),
      pushNotification: Joi.boolean().optional(),
      sendEmail: Joi.boolean().optional(),
      showOnlineStatus: Joi.boolean().optional(),
      status: Joi.string().optional(),
    });

    try {
      const { error, value: updateData } = validatedBody.validate(req.body);
      if (error) return next({ message: error.details[0].message });

      const userId = req.userId;
      const userDetails = await checkUserExists({ _id: userId });
      if (!userDetails) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      let existingProfile = await getUserProfile({ userId });
      if (!existingProfile) {
        existingProfile = await createUserProfile({ userId });
      }

      if (updateData.preferences)
        updateData.preferences = {
          ...existingProfile.preferences,
          ...updateData.preferences,
        };

      if (updateData.guardianDetails) {
        updateData.guardianDetails = {
          ...existingProfile.guardianDetails,
          ...updateData.guardianDetails,
        };
        if (
          updateData.guardianDetails.email &&
          (!existingProfile.guardianDetails ||
            !existingProfile.guardianDetails.isVerified)
        ) {
          const otp = commonFunction.getOTP();
          const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
          updateData.guardianDetails.otp = otp;
          updateData.guardianDetails.otpExpiresAt = otpExpiresAt;

          setImmediate(async () => {
            const subject = notificationTemplates.guardianOtp.subject;
            const text = notificationTemplates.guardianOtp.body
              .replace(
                "{{userName}}",
                updateData.fullName || existingProfile.fullName
              )
              .replace("{{guardianName}}", updateData.guardianDetails.name)
              .replace("{{otpCode}}", otp);
            await commonFunction.sendMail(
              updateData.guardianDetails.email,
              subject,
              text
            );
          });
        }
      }

      // Handle latitude and longitude update within the location.coordinates array
      if (
        updateData.latitude !== undefined &&
        updateData.longitude !== undefined &&
        updateData.latitude !== null &&
        updateData.longitude !== null
      ) {
        updateData.location = {
          type: "Point",
          coordinates: [updateData.longitude, updateData.latitude], // [lng, lat]
        };

        delete updateData.latitude;
        delete updateData.longitude;
      }

      const {
        isProfileCompleted,
        status,
        pushNotification,
        sendEmail,
        showOnlineStatus,
        ...profileUpdateData
      } = updateData;
      const updatedProfile = await userServices.updateUserProfile(
        { userId },
        profileUpdateData
      );

      if (isProfileCompleted || status)
        await updateUser(
          { _id: userId },
          {
            isProfileCompleted,
            status,
            pushNotification,
            sendEmail,
            showOnlineStatus,
          }
        );

      return res.json(
        new response(updatedProfile, responseMessage.USER_UPDATED)
      );
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/verifyGuardianOtp:
   *   post:
   *     summary: user guardian verify otp
   *     description: Endpoint to user guardian verify otp
   *     tags: [Authentication]
   *     parameters:
   *       - name: authToken
   *         description: authToken
   *         in: header
   *         required: true
   *       - name: verifyGuardianOtp
   *         description: verifyGuardianOtp
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             otp:
   *               type: string
   *     responses:
   *       '200':
   *         description: OTP_VERIFY.
   *       '400':
   *         description: USER_NOT_FOUND.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async verifyGuardianOtp(req, res, next) {
    const validationSchema = Joi.object({
      otp: Joi.string().required(),
    });
    try {
      const { error, value: requestData } = validationSchema.validate(req.body);
      if (error) return next(error);
      const { otp } = requestData;
      const userId = req.userId;
      const user = await userServices.checkUserExists({ _id: req.userId });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      const existingProfile = await getUserProfile({ userId });
      if (!existingProfile || !existingProfile.emergencyDetails)
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      if (existingProfile.emergencyDetails.otp !== otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      if (
        existingProfile.emergencyDetails.otpExpiresAt &&
        new Date(existingProfile.emergencyDetails.otpExpiresAt) < new Date()
      ) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      existingProfile.emergencyDetails = {
        otp: null,
        otpExpiresAt: null,
        isVerified: true,
        ...existingProfile.emergencyDetails,
      };
      await userServices.updateUserProfile(
        { userId },
        { emergencyDetails: existingProfile.emergencyDetails }
      );
      return res.json(new response("", responseMessage.OTP_VERIFY));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resendGuardianOtp:
   *   post:
   *     summary: user send guardian otp
   *     description: Endpoint to user send guardian otp
   *     tags: [Authentication]
   *     parameters:
   *       - name: authToken
   *         description: authToken
   *         in: header
   *         required: true
   *     responses:
   *       '200':
   *         description: OTP_SEND.
   *       '400':
   *         description: USER_NOT_FOUND.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async resendGuardianOtp(req, res, next) {
    try {
      const userId = req.userId;
      const user = await userServices.checkUserExists({ _id: req.userId });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      const existingProfile = await getUserProfile({ userId });
      if (!existingProfile || !existingProfile.emergencyDetails)
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      const otp = commonFunction.getOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      existingProfile.emergencyDetails = {
        otp,
        otpExpiresAt,
        isVerified: false,
        ...existingProfile.emergencyDetails,
      };
      await updateUser(
        { _id: user._id },
        { emergencyDetails: existingProfile.emergencyDetails }
      );
      setImmediate(async () => {
        const subject = notificationTemplates.guardianOtp.subject;
        const text = notificationTemplates.guardianOtp.body
          .replace("{{userName}}", existingProfile.fullName)
          .replace(
            "{{guardianName}}",
            existingProfile.emergencyDetails.guardianName
          )
          .replace("{{otpCode}}", otp);
        await commonFunction.sendMail(existingProfile.email, subject, text);
      });
      return res.json(new response({ otp }, responseMessage.OTP_SEND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getUserDetails:
   *   get:
   *     summary: getUserDetails
   *     description: Endpoint to getUserDetails
   *     tags: [Authentication]
   *     parameters:
   *       - in: header
   *         name: token
   *         description: token
   *         required: true
   *       - in: query
   *         name: userId
   *         description: userId
   *         required: false
   *     responses:
   *       '200':
   *         description: USER_DETAILS.
   *       '400':
   *         description: USER_NOT_FOUND.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async getUserDetails(req, res, next) {
    const validationSchema = Joi.object({
      userId: Joi.string().optional(),
    });
    try {
      const { error, value: validatedBody } = validationSchema.validate(
        req.query
      );
      if (error) return next(error);
      const user = await findUser({ _id: req.userId, status: status.ACTIVE });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      const userId = validatedBody.userId ? validatedBody.userId : req.userId;
      let userDetails;
      if (userId === req.userId) {
        userDetails = await getUserProfile({ userId });
      } else {
        userDetails = await getUserFilteredData(userId);
      }
      return res.json(new response(userDetails, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/updateBlockStatus:
   *   post:
   *     summary: Block or unblock a user
   *     description: Allows the authenticated user to block or unblock another user.
   *     tags: [User]
   *     parameters:
   *       - name: authToken
   *         description: authToken
   *         in: header
   *         required: true
   *         type: string
   *       - name: body
   *         description: Request body containing targetUserId and action ("block" or "unblock")
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             targetUserId:
   *               type: string
   *             action:
   *               type: string
   *               enum: ["block", "unblock"]
   *     responses:
   *       '200':
   *         description: User block status updated successfully.
   *       '400':
   *         description: Bad Request.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async updateBlockStatus(req, res, next) {
    const schema = Joi.object({
      targetUserId: Joi.string().required(),
      action: Joi.string().valid("block", "unblock").required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return next(apiError.badRequest(error.details[0].message));
    const userId = req.userId;
    const { targetUserId, action } = value;
    try {
      const user = await updateUserBlockStatus(userId, targetUserId, action);
      const message =
        action === "block"
          ? responseMessage.USER_BLOCKED
          : responseMessage.USER_UNBLOCKED;
      return res.json({ message, user });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /user/updateHideStatus:
   *   post:
   *     summary: Hide or unhide a matched user
   *     description: Allows the authenticated user to hide or unhide a matched user from the matched list.
   *     tags: [User]
   *     parameters:
   *       - name: authToken
   *         description: authToken
   *         in: header
   *         required: true
   *         type: string
   *       - name: body
   *         description: Request body containing targetUserId and action ("hide" or "unhide")
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             targetUserId:
   *               type: string
   *             action:
   *               type: string
   *               enum: ["hide", "unhide"]
   *     responses:
   *       '200':
   *         description: User hide status updated successfully.
   *       '400':
   *         description: Bad Request.
   *       '500':
   *         description: INTERNAL_ERROR.
   */
  async updateHideStatus(req, res, next) {
    const schema = Joi.object({
      targetUserId: Joi.string().required(),
      action: Joi.string().valid("hide", "unhide").required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return next(apiError.badRequest(error.details[0].message));
    const userId = req.userId;
    const { targetUserId, action } = value;
    try {
      const user = await updateUserHideStatus(userId, targetUserId, action);
      const message =
        action === "hide"
          ? responseMessage.USER_HIDDEN
          : responseMessage.USER_UNHIDDEN;
      return res.json({ message, user });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /user/changePassword:
   *   post:
   *     tags:
   *       - User
   *     description: changePassword
   *     summary: changePassword of the USER
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
      const { error, value: validatedBody } = validationSchema.validate(
        req.body
      );
      if (error) return next(error);
      // let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (
        !bcrypt.compareSync(validatedBody.currentPassword, userResult.password)
      ) {
        throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
      }
      if (validatedBody.currentPassword == validatedBody.newPassword) {
        throw apiError.badRequest(responseMessage.OLD_PWD_NOT_SAME);
      }

      let updated = await updateUser(userResult._id, {
        password: bcrypt.hashSync(validatedBody.newPassword),
      });
      updated = _.omit(JSON.parse(JSON.stringify(updated)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      return res.json(new response(updated, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/userForgotPassword:
   *   post:
   *     tags:
   *       - User
   *     description: forgotPassword by user on plateform when he forgot password
   *     summary: forgotPassword by user on plateform when he forgot password
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
      const { error, value: validatedBody } = validationSchema.validate(
        req.body
      );
      if (error) return next(error);
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const { email } = validatedBody;
      var userResult = await findUser({
        $and: [
          {
            status: {
              $ne: status.DELETE,
            },
          },
          {
            userType: {
              $ne: userType.ADMIN,
            },
          },
          {
            $or: [
              {
                email: email,
              },
            ],
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000; //OTP expires in 3 MINS
        await commonFunction.sendOTPMail(userResult.email, newOtp);
        var updateResult = await updateUser(
          {
            _id: userResult._id,
          },
          {
            otp: newOtp,
            otpExpiresAt: time,
          }
        );
        console.log("The updateResult is ---> ", updateResult);
        updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), [
          "otp",
          "password",
          "base64",
          "secretGoogle",
          "emailotp2FA",
          "withdrawOtp",
          "password",
        ]);

        return res.json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log("❌ The Error Occures at forgetPassword user---> ", error);
      return next(error);
    }
  }
   /**
     * @swagger
     * /user/userResetPassword:
     *   post:
     *     tags:
     *       - User
     *     description: resetPassword
     *     summary: resetPassword of the user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: authToken
     *         description: token
     *         in: header
     *         required: false
     *       - name: newPassword
     *         description: newPassword
     *         in: formData
     *         required: true
     *       - name: confirmPassword
     *         description: confirmPassword
     *         in: formData
     *         required: true
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
        const {newPassword , confirmPassword} = validatedBody;
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
            $ne: userType.ADMIN
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
        console.log("❌ Error Occured at ResetPassword USER ---> ",error);
        return next(error);
      }
    }
}

export default new userController();
