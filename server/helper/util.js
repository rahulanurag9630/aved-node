import jwt from "jsonwebtoken";
import fs from "fs";
import sharp from "sharp";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import nodemailer from "nodemailer";
import cloudinary from "cloudinary";
import mailTemplates from "./mailTemplates";

const execAsync = promisify(exec);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Compress PDF using Ghostscript
const compressPdfWithGhostscript = async (inputPath, outputPath) => {
  const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

  try {
    await execAsync(command);
    return { success: true };
  } catch (error) {
    console.error("Ghostscript PDF compression failed:", error);
    return { success: false, error };
  }
};

module.exports = {
  getOTP() {
    return Math.floor(100000 + Math.random() * 900000);
  },

  sendSms: async (to, message) => {
    try {
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_MOBILE_NUMBER,
        to,
      });
      console.log("Message sent:", result.sid);
    } catch (error) {
      console.error("Error sending message:", error.message);
    }
  },

  getToken: async (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
  },

  generateRandomPassword: (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  },

  sendSubAdminMail: async (email, userName, userEmail, generatedPassword, permissions) => {
    const html = mailTemplates.subAdminMailTemplate(userName, userEmail, generatedPassword, permissions);
    const transporter = nodemailer.createTransport({
      service: process.env.NODEMAILER_SERVICE,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    return await transporter.sendMail({
      from: "<do_not_reply@gmail.com>",
      to: email,
      subject: "Welcome to the MUIRL App - You are now appointed as a Sub-Admin",
      html,
    });
  },

  sendMail: async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
      service: process.env.NODEMAILER_SERVICE,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    return await transporter.sendMail({
      from: "<do_not_reply@gmail.com>",
      to,
      subject,
      text,
    });
  },

  sendOTPMail: async (to, otp) => {
    const html = mailTemplates.otpMailTemplate(otp);
    const transporter = nodemailer.createTransport({
      service: process.env.NODEMAILER_SERVICE,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    return await transporter.sendMail({
      from: "<do_not_reply@gmail.com>",
      to,
      subject: "OTP Verification",
      html,
    });
  },

  sendResendOTP: async (to, otp) => {
    const html = mailTemplates.resendOtpMailTemplate(otp);
    const transporter = nodemailer.createTransport({
      service: process.env.NODEMAILER_SERVICE,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    return await transporter.sendMail({
      from: "<do_not_reply@gmail.com>",
      to,
      subject: "Resend OTP for Verification",
      html,
    });
  },

  getImageUrl: async (file) => {
    const fileSizeInBytes = file.size;
    const filePath = file.path;
    const ext = path.extname(file.originalname).toLowerCase();

    let optimizedPath = filePath;

    if (fileSizeInBytes > 10 * 1024 * 1024) {
      if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        const compressedPath = filePath.replace(ext, `_compressed${ext}`);
        await sharp(filePath)
          .toFormat(ext.replace(".", ""), { quality: 70 })
          .toFile(compressedPath);
        optimizedPath = compressedPath;
      } else if (ext === ".pdf") {
        const compressedPath = filePath.replace(".pdf", `_compressed.pdf`);
        const result = await compressPdfWithGhostscript(filePath, compressedPath);
        if (result.success) {
          optimizedPath = compressedPath;
        } else {
          console.warn("PDF compression failed, using original");
        }
      }
    }

    const result = await cloudinary.v2.uploader.upload(optimizedPath, {
      resource_type: "auto",
    });

    console.log("Cloudinary URL:", result.secure_url);

    if (optimizedPath !== filePath) {
      fs.unlinkSync(optimizedPath);
    }

    return result.secure_url;
  },

  removeFile: async (path) => {
    if (path) {
      fs.unlink(path, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting uploaded file:", unlinkErr);
        }
      });
    }
  },

  calculateMatchScore: (userA, userB) => {
    let score = 0;
    let total = 0;

    const compareValues = (a, b) => {
      total += 1;
      if (a && b && a.toLowerCase() === b.toLowerCase()) score += 1;
    };

    const compareArrays = (a = [], b = []) => {
      total += 1;
      const common = a.filter((val) => b.includes(val));
      if (common.length) score += 1;
    };

    compareValues(userA.gendervalue, userB.preferencesgender);
    compareValues(userB.gendervalue, userA.preferencesgender);
    compareArrays(userA.seeking, userB.seeking);
    compareArrays(userA.whoIAm, userB.whoIAm);
    compareArrays(userA.dateVibes, userB.dateVibes);
    compareArrays(userA.funFacts, userB.funFacts);
    compareArrays(userA.deepTalk, userB.deepTalk);
    compareArrays(userA.letsChat, userB.letsChat);
    compareArrays(userA.wellness, userB.wellness);
    compareArrays(userA.yourLikes, userB.yourLikes);
    compareValues(userA.drinkingvalue, userB.drinkingvalue);
    compareValues(userA.smokingvalue, userB.smokingvalue);
    compareValues(userA.drugsvalue, userB.drugsvalue);

    return Math.round((score / total) * 100);
  }
};
