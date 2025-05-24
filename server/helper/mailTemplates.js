module.exports = {
    otpMailTemplate(otp) {
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>OTP Verification</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: #f4f8fc;
                font-family: 'Arial', 'Helvetica', sans-serif;
                color: #333;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 30px auto;
                background: #ffffff;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                border: 1px solid #dce4ed;
              }
              .header {
                background-color: #6C638E;
                color: #fff;
                text-align: center;
                padding: 30px 20px;
              }
              /*.header img {*/
              /*  width: 250px;*/
              /*  margin-bottom: 10px;*/
              /*  background-color: white;*/
              /*  border-radius: 5px;*/
                 
              /*}*/
              .header img {
          height: 150px;
          width: 150px;
          margin-bottom: 10px;
          background-color: #111;
          border-radius: 50%;
        }
              .header h2 {
                margin: 0;
                font-size: 25px;
                font-weight: bold;
                text-transform: uppercase;
              }
              .content {
                padding: 25px;
                text-align: left;
              }
              .content h1 {
                font-size: 26px;
                color: #222;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
              }
              .content p {
                font-size: 16px;
                color: #555;
                margin-bottom: 20px;
                line-height: 1.8;
              }
              .otp {
                display: inline-block;
                background: #6C638E;
                color: #fff;
                font-size: 22px;
                padding: 14px 28px;
                border-radius: 12px;
                font-weight: bold;
                letter-spacing: 1.5px;
                margin-bottom: 20px;
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
                text-transform: uppercase;
                
                  
              }
              .cta {
                margin: 20px 0;
              }
              .cta a {
                display: inline-block;
                background: #00C64F;
                color: #fff;
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                padding: 12px 30px;
                border-radius: 8px;
                text-decoration: none;
                transition: background 0.3s ease;
              }
              .cta a:hover {
                background: #007B3E;
              }
              .footer {
                background: #333;
                color: #ccc;
                text-align: center;
                padding: 20px;
                font-size: 14px;
                line-height: 1.6;
              }
              .footer a {
                color: #11D9EF;
                /*color: black;*/
                text-decoration: none;
                font-weight: bold;
              }
              .footer a:hover {
                text-decoration: underline;
              }
              .social-icons {
                margin: 15px 0;
              }
              .social-icons img {
                width: 24px;
                margin: 0 8px;
              }
              .address {
                font-size: 12px;
                color: #bbb;
                margin-top: 10px;
              }
              @media screen and (max-width: 600px) {
                .container {
                  margin: 10px;
                }
                .content {
                  padding: 15px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Header Section -->
              <div class="header">
                <img  src="https://res.cloudinary.com/daz8utdju/image/upload/v1746595138/1746595137017_Group1261155033_w31upy.png" alt="MUIRL Logo" height="150px" width="50px">
                <h2>YOUR DATING PARTNER</h2>
              </div>
              <!-- Content Section -->
              <div class="content">
                <h1>Your Security Is Our Priority</h1>
                <p>
                 Thank you for signing up with Muirl! To complete your registration, please verify your phone number by entering the OTP code below:
                </p>
              <div style="display: flex; justify-content: center; align-items: center;">
    <div class="otp">${otp}</div>
    </div>
    
                <p>
                  <strong>Important:</strong> This OTP is valid for <strong>3 minutes</strong>. For your protection, never share this code with anyone, 
                  including our team.
                </p>
                <p>If you didn’t request this verification, please contact our support team immediately at <b>support@muirl.com</b></p>
                     <p>Best regards,<br>The Muirl Team</p>
              </div>
              
              <!-- Footer Section -->
              <div class="footer">
                <p>Stay Connected:</p>
                <div class="social-icons">
               <a href="https://x.com/yourdatingapp" target="_blank"> 
           <img src="https://res.cloudinary.com/dnbt2zgcr/image/upload/v1735584821/ahq8vxq3zllckov49pcj.png" 
                 alt="Twitter" 
                 style="width: 24px; height: 24px; border-radius: 90%;">
            </a>
          
                  <a href="https://facebook.com/yourdatingapp" target="_blank">
                    <img src="https://res.cloudinary.com/dnbt2zgcr/image/upload/v1735585295/cekapf8roxyiel0tbbqm.png" alt="Facebook">
                  </a>
                  <a href="https://linkedin.com/company/yourdatingapp" target="_blank">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn">
                  </a>
                </div>
                <p>© 2025 Muirl. All rights reserved.</p>
                <p>
                  Need assistance? <a href="mailto:support@muril.com">Contact Support</a>
                </p>
                <div class="address">
                 86 Whitehaven Crescent ,Australia 2540
                </div>
              </div>
            </div>
          </body>
    </html>`;
      },
      resendOtpMailTemplate(otp) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Resend OTP Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f8fc;
      font-family: 'Arial', 'Helvetica', sans-serif;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      border: 1px solid #dce4ed;
    }
    .header {
      background-color: #6C638E;
      color: #fff;
      text-align: center;
      padding: 30px 20px;
    }
    .header img {
      height: 150px;
      width: 150px;
      margin-bottom: 10px;
      background-color: #111;
      border-radius: 50%;
    }
    .header h2 {
      margin: 0;
      font-size: 25px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .content {
      padding: 25px;
      text-align: center;
    }
    .content h1 {
      font-size: 26px;
      color: #222;
      margin: 20px 0;
      font-weight: bold;
    }
    .content p {
      font-size: 16px;
      color: #555;
      margin-bottom: 20px;
      line-height: 1.8;
    }
    .otp {
      display: inline-block;
      background: #6C638E;
      color: #fff;
      font-size: 22px;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: bold;
      letter-spacing: 1.5px;
      margin-bottom: 20px;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
      text-transform: uppercase;
    }
    .footer {
      background: #333;
      color: #ccc;
      text-align: center;
      padding: 20px;
      font-size: 14px;
      line-height: 1.6;
    }
    .footer a {
      color: #11D9EF;
      text-decoration: none;
      font-weight: bold;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .address {
      font-size: 12px;
      color: #bbb;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/daz8utdju/image/upload/v1746595138/1746595137017_Group1261155033_w31upy.png" alt="MUIRL Logo">
      <h2>YOUR DATING PARTNER</h2>
    </div>
    <div class="content">
      <h1>Your OTP Code (Resent)</h1>
      <p>Please use the OTP code below to complete your verification. This OTP is valid for <strong>3 minutes</strong>.</p>
      <div class="otp">${otp}</div>
      <p>If you did not request this OTP, please ignore this email or contact support immediately at <b>support@muirl.com</b>.</p>
      <p>Best regards,<br>The Muirl Team</p>
    </div>
    <div class="footer">
      <p>Stay Connected:</p>
      <p>© 2025 Muirl. All rights reserved.</p>
      <p>Need assistance? <a href="mailto:support@muirl.com">Contact Support</a></p>
      <div class="address">
        86 Whitehaven Crescent, Australia 2540
      </div>
    </div>
  </div>
</body>
</html>
`
      },
      subAdminMailTemplate(userName, userEmail, generatedPassword, permissions) {
        return `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Subadmin Account Assigned</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: #f4f8fc;
                font-family: 'Arial', 'Helvetica', sans-serif;
                color: #333;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 30px auto;
                background: #ffffff;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                border: 1px solid #dce4ed;
              }
              .header {
                background-color: #6C638E;
                color: #fff;
                text-align: center;
                padding: 30px 20px;
              }
              /*.header img {*/
              /*  width: 250px;*/
              /*  margin-bottom: 10px;*/
              /*  background-color: white;*/
              /*  border-radius: 5px;*/
              /*}*/
              .header img {
                height: 150px;
              width: 150px;
              margin-bottom: 10px;
              background-color: #111;
              border-radius: 50%;
             }
              .header h2 {
                margin: 0;
                font-size: 25px;
                font-weight: bold;
                text-transform: uppercase;
              }
              .content {
                padding: 25px;
                text-align: left;
              }
              .content h1 {
                font-size: 20px;
                color: #333;
                margin-bottom: 20px;
              }
              .content p {
                font-size: 16px;
                color: #555;
                margin-bottom: 15px;
                line-height: 1.6;
              }
              .credentials {
                background: #f9f9f9;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
              }
              .credentials p {
                margin: 5px 0;
                font-size: 16px;
              }
              .footer {
                background: #333;
                color: #ccc;
                text-align: center;
                padding: 20px;
                font-size: 14px;
                line-height: 1.6;
              }
              .footer a {
                color: #11D9EF;
                text-decoration: none;
                font-weight: bold;
              }
              .footer a:hover {
                text-decoration: underline;
              }
              .social-icons {
                margin: 15px 0;
              }
              .social-icons img {
                width: 24px;
                margin: 0 8px;
              }
              .address {
                font-size: 12px;
                color: #bbb;
                margin-top: 10px;
              }
              @media screen and (max-width: 600px) {
                .container {
                  margin: 10px;
                }
                .content {
                  padding: 15px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Header Section -->
              <div class="header">
                <img src="https://res.cloudinary.com/daz8utdju/image/upload/v1746595138/1746595137017_Group1261155033_w31upy.png" alt="MUIRL Logo" >
               <h2>YOUR DATING PARTNER</h2>
              </div>
              <!-- Content Section -->
              <div class="content">
                   <h2>Welcome to the Team!</h2>
                <p>Dear ${userName},</p>
                <p>Congratulations! You have been assigned as a Subadmin on the Muirl Investment Platform.</p>
                <p>Here are your login credentials:</p>
                <div class="credentials">
                  <p><strong>Email:</strong> ${userEmail}</p>
                  <p><strong>Temporary Password:</strong> ${generatedPassword}</p>
                  <p><strong>Your Permissions:</strong> ${permissions}</p>
                  </div>
                <p>Please ensure you update your password after your first login to maintain the security of your account.</p>
                <p>If you have any questions or require assistance, feel free to reach out to our support team.</p>
                <p>Best regards,<br>The Muirl Team</p>
              </div>
              <!-- Footer Section -->
              <div class="footer">
                <p>Stay Connected:</p>
                <div class="social-icons">
                  <a href="https://x.com/yourdatingapp" target="_blank">
                    <img src="https://res.cloudinary.com/dnbt2zgcr/image/upload/v1735584821/ahq8vxq3zllckov49pcj.png" alt="Twitter" style="width: 24px; height: 24px; border-radius: 90%;">
                  </a>
                  <a href="https://facebook.com/yourdatingapp" target="_blank">
                    <img src="https://res.cloudinary.com/dnbt2zgcr/image/upload/v1735585295/cekapf8roxyiel0tbbqm.png" alt="Facebook">
                  </a>
                  <a href="https://linkedin.com/company/yourdatingapp" target="_blank">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn">
                  </a>
                </div>
                <p>© 2025 Muirl. All rights reserved.</p>
                <p>Need assistance? <a href="mailto:support@Muirla.com">Contact Support</a></p>
                <div class="address">
                86 Whitehaven Crescent, Australia 2540
                </div>
              </div>
            </div>
          </body>
          </html>
       `;
      },
}