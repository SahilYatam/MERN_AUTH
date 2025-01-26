import { mailtrapClient, sender } from "./mailtrap.config.js";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./emailTemplates.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email verification",
    });

    console.log("Email send successfully ", response);
  } catch (error) {
    console.log(`Error sending verification Email ${error.message}`);
    throw new Error(`Error sending verification Email ${error}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      template_uuid: "4d72cbed-fa9f-43fb-8376-cd3e5098cdc0",
      template_variables: {
        company_info_name: "Auth Company",
        name: name,
      },
    });
    console.log("Welcome Email send successfully ", response);
  } catch (error) {
    console.log(`Error sending welcome Email ${error.message}`);
    throw new Error(`Error sending welcome Email ${error}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password reset",
    });
    console.log("Password reset Email send successfully ", response);
  } catch (error) {
    console.log(`Error sending reset password Email ${error.message}`);
    throw new Error(`Error sending reset password Email ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    });
    console.log("Password reset success Email send successfully ", response);
  } catch (error) {
    console.log(`Error sending password reset success Email ${error.message}`);
    throw new Error(`Error sending password reset success Email ${error}`);
  }
};
