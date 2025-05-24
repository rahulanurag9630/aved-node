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
const { findUser, findAllUsers, updateUser, createUser } = userServices;
import { adminServices } from "../../services/admin"
const { listSubAdmin } = adminServices;

export class subAdminController{
      /**
   * @swagger
   * /subadmin/createSubadmin:
   *   post:
   *     tags:
   *       - SUBADMIN MANAGEMENT
   *     description: Create a new subadmin with predefined permissions and send login credentials via email
   *     summary: Create Subadmin by the admin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authtoken
   *         description: Admin token
   *         in: header
   *         required: true
   *       - name: body
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           required:
   *             - fullName
   *             - email
   *             - permissions
   *           properties:
   *             fullName:
   *               type: string
   *               example: "John Doe"
   *             email:
   *               type: string
   *               example: "john.doe@example.com"
   *             permissions:
   *               type: object
   *               items:
   *                 type: string
   *               example: {"Dashboard" : true , "Sub-Admin" : true , "Job Seeker Management" : true}
   *     responses:
   *       200:
   *         description: Subadmin created and email sent successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Something went wrong
   */
  async createSubadmin(req, res, next) {
    const validationSchema = Joi.object({
      userId: Joi.string().allow(null, ""), // Allows empty or null values, effectively optional
      fullName: Joi.string().required(),
      email: Joi.string().email().required(),
      permissions: Joi.object().required(),
    });

    try {
      const { error, value: validatedBody } = validationSchema.validate(
        req.body
      );
      if (error) return next(error);
      const authCheck = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN] },
      });

      if (!authCheck) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
      const existingAdmin = await findUser({ email: validatedBody.email });
      if (existingAdmin) {
        throw apiError.alreadyExist(responseMessage.EMAIL_EXIST);
      }
      if (validatedBody.userId) {
        const updatedObject = {};
      } else {
        const generatedPassword = await commonFunction.generateRandomPassword();
        console.log("The GeneratedPassword is", generatedPassword);
        const subadminData = {
          userType: userType.SUBADMIN,
          fullName: validatedBody.fullName,
          email: validatedBody.email,
          password: bcrypt.hashSync(generatedPassword),
          permissions: validatedBody.permissions,
          isVerified: true,
          verifiedStatus: status.VERIFIED,
        };
        const newSubadmin = await createUser(subadminData);
        console.log("The permissions are ", validatedBody.permissions);
        let formattedPermissions = "";
        
        if (typeof validatedBody.permissions === "object" && !Array.isArray(validatedBody.permissions)) {
          const grantedPermissions = Object.keys(validatedBody.permissions).filter(
            (permission) => validatedBody.permissions[permission] === true
          );
          formattedPermissions = grantedPermissions.join(", ");
        }
        
        console.log("Formatted Permissions:", formattedPermissions);
        
        console.log("The formattedPermissions is", formattedPermissions);
        if (newSubadmin) {
          let jio = await commonFunction.sendSubAdminMail(
            validatedBody.email,
            validatedBody.fullName,
            validatedBody.email,
            generatedPassword,
            formattedPermissions
          );
         
        }
        return res.json(
          new response(
            newSubadmin,
            responseMessage.SUBADMIN_CREATED_AND_EMAIL_SENT
          )
        );
      }
    } catch (error) {
      console.log("~ adminController ~ createSubadmin ~ error:", error);
      return next(error);
    }
  }

   /**
   * @swagger
   * /subadmin/listSubadmin:
   *   get:
   *     tags:
   *       - SUBADMIN MANAGEMENT
   *     summary: List subadmin with filters
   *     description: Fetch a list of subadmin with optional filters for status and title.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authtoken
   *         description: Admin token
   *         in: header
   *         required: true
   *       - name: status
   *         description: Filter by status (active/inactive)
   *         in: query
   *         required: false
   *       - name: search
   *         description: Filter by name
   *         in: query
   *         required: false
   *       - name: page
   *         description: Page number for pagination
   *         in: query
   *         required: false
   *       - name: limit
   *         description: Number of records per page
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: List of subadmin fetched successfully.
   *       401:
   *         description: Unauthorized access.
   */
   async listSubadmin(req, res, next) {
    try {
      const { status, search, fromDate, toDate, page, limit } = req.query;

      // Check if the requester is an ADMIN or SUBADMIN
      const authCheck = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
      });

      if (!authCheck) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

      // Fetch the list of sub-admins using the service
      const subAdminList = await listSubAdmin({
        search,
        status,
        fromDate,
        toDate,
        page,
        limit,
      });

      // Respond with the paginated sub-admin list
      return res.json(new response(subAdminList, responseMessage.DATA_FOUND));
    } catch (error) {
      console.error("Error listing sub-admins:", error);
      return next(error);
    }
  }
   /**
   * @swagger
   * /subadmin/editSubAdmin:
   *   patch:
   *     tags:
   *       - SUBADMIN MANAGEMENT
   *     description: Update the Subadmin
   *     summary: Update the Subadmin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authtoken
   *         description: Admin token
   *         in: header
   *         required: true
   *       - name: body
   *         in: body
   *         required: true
   *         schema:
   *           type: object
   *           required:
   *             - userId
   *             - email
   *             - fullName
   *             - permissions
   *           properties:
   *             userId:
   *               type: string
   *             fullName:
   *               type: string
   *             email:
   *               type: string
   *             permissions:
   *               type: object
   *               items:
   *                 type: string
   *               example: {"Dashboard" : true, "Sub-Admin" : true, "Job Seeker Management" : false}
   *     responses:
   *       200:
   *         description: Subadmin editSubAdmin and email sent successfully
   *       400:
   *         description: Bad request
   *       500:
   *         description: Something went wrong
   */
   async editSubAdmin(req, res, next) {
    const validationSchema = Joi.object({
      userId: Joi.string().required(), // Allows empty or null values, effectively optional
      fullName: Joi.string().optional(),
      email: Joi.string().email().optional(),
      permissions: Joi.object().optional(),
    });

    try {
      const { error, value: validatedBody } = validationSchema.validate(
        req.body
      );
      if (error) return next(error);
      const authCheck = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN] },
      });

      if (!authCheck) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
      // const existingAdmin = await findUser({ email: validatedBody.email });
      // if (existingAdmin) {
      //   throw apiError.alreadyExist(responseMessage.EMAIL_EXIST);
      // }
      const findSubAdmin = await findUser(
        { _id: validatedBody.userId },
        { userType: userType.SUBADMIN }
      );
      if (!findSubAdmin) {
        throw apiError.notFound(responseMessage.SUBADMIN_NOT_FOUND);
      }

      const subadminData = {
        // userType: userType.SUBADMIN,
        fullName: validatedBody.fullName,
        // email: validatedBody.email,
        permissions: validatedBody.permissions,
      };
      const editedSubadmin = await updateUser(
        { _id: findSubAdmin._id },
        subadminData
      );
      //  await commonFunction.sendSubAdminMail(findSubAdmin.email,  findSubAdmin.fullName , validatedBody.email, generatedPassword);
      return res.json(
        new response(editedSubadmin, responseMessage.SUBADMIN_UPDATED)
      );
    } catch (error) {
      console.log("~ adminController ~ createSubadmin ~ error:", error);
      return next(error);
    }
  }

   /**
   * @swagger
   * /subadmin/blockUnblockSubAdmin:
   *   put:
   *     tags:
   *       - SUBADMIN MANAGEMENT
   *     description: blockUnblockSubAdmin
   *     summary: Block or Unblock a subadmin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authtoken
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

   async blockUnblockSubAdmin(req, res, next) {
    const validationSchema = Joi.object({
      _id: Joi.string().required(),
    });
    try {
      let validatedBody = await validationSchema.validateAsync(req.body);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $in: userType.ADMIN },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
      }
      var userInfo = await findUser({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      if (userInfo.status == status.ACTIVE) {
        let blockRes = await updateUser(
          { _id: userInfo._id },
          { status: status.BLOCK }
        );
        return res.json(new response(blockRes, responseMessage.BLOCK_BY_ADMIN));
      } else {
        let activeRes = await updateUser(
          { _id: userInfo._id },
          { status: status.ACTIVE }
        );
        return res.json(
          new response(activeRes, responseMessage.UNBLOCK_BY_ADMIN)
        );
      }
    } catch (error) {
      console.log("~ adminController ~ blockUnblockSubAdmin ~ error:", error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /subadmin/viewSubAdmin:
   *   get:
   *     tags:
   *       - SUBADMIN MANAGEMENT
   *     description: viewSubAdmin
   *     summary: viewSubAdmin by the admin 
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authtoken
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async viewSubAdmin(req, res, next) {
    var validationSchema = Joi.object({
      _id: Joi.string().required(),
    });
    try {
      const validatedBody = await validationSchema.validateAsync(req.query);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);
      }
      const userInfo = await findUser({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      return res.json(new response(userInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

    /**
   * @swagger
   * /subadmin/deleteSubAdmin:
   *   delete:
   *     tags:
   *       - SUBADMIN MANAGEMENT
   *     description: deleteUser
   *     summary: delete the subadmin by admin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: authtoken
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

    async deleteSubAdmin(req, res, next) {
        const validationSchema = Joi.object({
          _id: Joi.string().required(),
        });
        try {
          let validatedBody = await validationSchema.validateAsync(req.body);
    
          let userResult = await findUser({
            _id: req.userId,
            userType: { $in: userType.ADMIN },
          });
          if (!userResult) {
            throw apiError.notFound(responseMessage.USER_NOT_FOUND);
          }
          var userInfo = await findUser({
            _id: validatedBody._id,
            status: { $ne: status.DELETE },
          });
          if (!userInfo) {
            throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
          }
          let deleteRes = await updateUser(
            { _id: userInfo._id },
            { status: status.DELETE }
          );
          return res.json(new response(deleteRes, responseMessage.SUBADMIN_DELETED));
        } catch (error) {
            console.log("❌ The Error is Occured in deleteSubAdmin", error);
          return next(error);
        }
      }



}

export default new subAdminController();