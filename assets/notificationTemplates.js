const notificationTemplates = {
  accountCreated: {
    subject: "Welcome to Our Platform!",
    body: "Hello user,\n\nYour account has been successfully created. We're excited to have you on board!\n\nBest Regards,\nPrepaid Dating Team"
  },
  otpVerification: {
    subject: "OTP Verification Code",
    body: "Dear user,\n\nYour OTP code for verification is: {{otpCode}}\nThis code will expire in 10 minutes.\n\nBest Regards,\nPrepaid Dating Team"
  },
  otpVerified: {
    subject: "OTP Verification Successful",
    body: "Dear User,\n\nYour One-Time Password (OTP) has been successfully verified. You can now proceed with accessing your account securely.\n\nIf you did not request this verification, please contact our support team immediately.\n\nBest Regards,\nPrepaid Dating Team"
  },
  passwordReset: {
    subject: "Password Reset Request",
    body: "Dear user,\n\nWe received a request to reset your password. Use the following OTP code to reset it: {{otpCode}}\n\nIf you didn't request this, please ignore this email.\n\nBest Regards,\nPrepaid Dating Team"
  },
  guardianOtp: {
    subject: "Guardian Verification OTP for {{userName}}",
    body: "Dear {{guardianName}},\n\n{{userName}} has added you as their guardian on Prepaid Dating.\n\nTo verify this, please use the OTP code below:\n\nOTP Code: {{otpCode}}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest Regards,\nPrepaid Dating Team"
  },
  subscriptionUpgraded: {
    subject: "Subscription Upgrade Successful",
    body: "Hello {{name}},\n\nYour subscription has been upgraded to {{subscriptionType}}. Enjoy your premium benefits!\n\nBest Regards,\nPrepaid Dating Team"
  },
  newMessageNotification: {
    subject: "You have a new message",
    body: "Hello {{name}},\n\nYou have received a new message from {{senderName}}. Open the app to read it.\n\nBest Regards,\nPrepaid Dating Team"
  }
};

export default notificationTemplates;
