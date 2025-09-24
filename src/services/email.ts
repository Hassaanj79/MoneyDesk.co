// Email service for admin notifications
// This is a placeholder for email functionality
// In a real implementation, you would integrate with an email service like SendGrid, AWS SES, or Nodemailer

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    console.log('Email would be sent:', emailData);
    
    // In a real implementation, you would:
    // 1. Use SendGrid, AWS SES, or Nodemailer
    // 2. Send the actual email
    // 3. Return true/false based on success
    
    // For now, we'll just log the email data
    console.log('📧 Email Notification:');
    console.log('To:', emailData.to);
    console.log('Subject:', emailData.subject);
    console.log('Body:', emailData.body);
    
    // Simulate email sending
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendUserAccessUpdateEmail = async (
  userEmail: string,
  userName: string,
  moduleAccess: any,
  changes: string[]
): Promise<boolean> => {
  const subject = 'Your MoneyDesk.co Access Has Been Updated';
  const body = `
Hello ${userName},

Your access to MoneyDesk.co modules has been updated by an administrator.

Changes made:
${changes.map(change => `• ${change}`).join('\n')}

Current access:
• Dashboard: ${moduleAccess.dashboard ? 'Enabled' : 'Disabled'}
• Transactions: ${moduleAccess.transactions ? 'Enabled' : 'Disabled'}
• Loans: ${moduleAccess.loans ? 'Enabled' : 'Disabled'}
• Reports: ${moduleAccess.reports ? 'Enabled' : 'Disabled'}
• Settings: ${moduleAccess.settings ? 'Enabled' : 'Disabled'}
• Accounts: ${moduleAccess.accounts ? 'Enabled' : 'Disabled'}
• Budgets: ${moduleAccess.budgets ? 'Enabled' : 'Disabled'}
• Categories: ${moduleAccess.categories ? 'Enabled' : 'Disabled'}

If you have any questions, please contact support.

Best regards,
MoneyDesk.co Team
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    body
  });
};

export const sendSubscriptionUpdateEmail = async (
  userEmail: string,
  userName: string,
  tier: string,
  status: string
): Promise<boolean> => {
  const subject = 'Your MoneyDesk.co Subscription Has Been Updated';
  const body = `
Hello ${userName},

Your MoneyDesk.co subscription has been updated by an administrator.

New subscription details:
• Tier: ${tier.charAt(0).toUpperCase() + tier.slice(1)}
• Status: ${status.charAt(0).toUpperCase() + status.slice(1)}

If you have any questions, please contact support.

Best regards,
MoneyDesk.co Team
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    body
  });
};

export const sendUserStatusUpdateEmail = async (
  userEmail: string,
  userName: string,
  isActive: boolean
): Promise<boolean> => {
  const subject = isActive 
    ? 'Your MoneyDesk.co Account Has Been Reactivated'
    : 'Your MoneyDesk.co Account Has Been Suspended';
  
  const body = `
Hello ${userName},

Your MoneyDesk.co account status has been updated by an administrator.

Account status: ${isActive ? 'Active' : 'Suspended'}

${isActive 
  ? 'You can now access all your features and data.'
  : 'Your account has been temporarily suspended. Please contact support for more information.'
}

If you have any questions, please contact support.

Best regards,
MoneyDesk.co Team
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    body
  });
};

export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetLink: string
): Promise<boolean> => {
  const subject = 'Password Reset Request - MoneyDesk.co';
  const body = `
Hello ${userName},

You have requested a password reset for your MoneyDesk.co account.

To reset your password, please click the link below:
${resetLink}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

For security reasons, please do not share this link with anyone.

If you have any questions or need assistance, please contact our support team.

Best regards,
MoneyDesk.co Team
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - MoneyDesk.co</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background: #5a6fd8; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .security-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Password Reset Request</h1>
        <p>MoneyDesk.co</p>
    </div>
    <div class="content">
        <h2>Hello ${userName},</h2>
        <p>You have requested a password reset for your MoneyDesk.co account.</p>
        
        <p>To reset your password, please click the button below:</p>
        
        <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset My Password</a>
        </div>
        
        <div class="security-note">
            <strong>⚠️ Security Notice:</strong>
            <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you did not request this password reset, please ignore this email</li>
                <li>Do not share this link with anyone</li>
            </ul>
        </div>
        
        <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">${resetLink}</p>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
    </div>
    <div class="footer">
        <p>Best regards,<br>MoneyDesk.co Team</p>
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    body,
    html
  });
};

export const sendExitSurveyEmail = async (
  adminEmail: string,
  surveyData: {
    name: string;
    email: string;
    reason: string;
    userId: string;
    submittedAt: string;
  }
): Promise<boolean> => {
  const subject = 'User Account Cancellation - Exit Survey';
  const body = `
A user has submitted an exit survey before canceling their account:

User Details:
• Name: ${surveyData.name}
• Email: ${surveyData.email}
• User ID: ${surveyData.userId}
• Submitted At: ${surveyData.submittedAt}

Reason for Canceling:
${surveyData.reason}

Please reach out to this user to understand their concerns and potentially retain them as a customer.

Best regards,
MoneyDesk.co System
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    body
  });
};
