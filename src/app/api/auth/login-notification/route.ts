import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid API key (server-side only)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('⚠️ SENDGRID_API_KEY not found in environment variables.');
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userEmail, 
      userName, 
      loginTime, 
      deviceInfo, 
      location, 
      ipAddress 
    } = await request.json();
    
    if (!userEmail || !userName) {
      return NextResponse.json(
        { error: 'userEmail and userName are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Sending login notification to:', userEmail);

    const subject = 'New Login Detected - MoneyDesk.co';
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Login Detected - MoneyDesk.co</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .login-info {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .login-info h3 {
            margin: 0 0 15px 0;
            color: #667eea;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .security-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .security-note strong {
            color: #856404;
        }
        .action-buttons {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: #dc3545;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 0 10px;
            font-weight: 600;
        }
        .button:hover {
            background: #c82333;
        }
        .button.secondary {
            background: #6c757d;
        }
        .button.secondary:hover {
            background: #5a6268;
        }
        .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .timestamp {
            color: #999;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔐 New Login Detected</h1>
            <p>MoneyDesk.co Security Alert</p>
        </div>
        <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We detected a new login to your MoneyDesk.co account. If this was you, no action is needed. If this wasn't you, please secure your account immediately.</p>
            
            <div class="login-info">
                <h3>📱 Login Details</h3>
                <div class="info-row">
                    <span class="info-label">Time:</span>
                    <span class="info-value">${loginTime || new Date().toLocaleString()}</span>
                </div>
                ${deviceInfo ? `
                <div class="info-row">
                    <span class="info-label">Device:</span>
                    <span class="info-value">${deviceInfo}</span>
                </div>
                ` : ''}
                ${location ? `
                <div class="info-row">
                    <span class="info-label">Location:</span>
                    <span class="info-value">${location}</span>
                </div>
                ` : ''}
                ${ipAddress ? `
                <div class="info-row">
                    <span class="info-label">IP Address:</span>
                    <span class="info-value">${ipAddress}</span>
                </div>
                ` : ''}
            </div>

            <div class="security-note">
                <strong>🔒 Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>If this login was not authorized by you, please change your password immediately</li>
                    <li>Consider enabling two-factor authentication for additional security</li>
                    <li>Review your account activity regularly</li>
                    <li>Never share your login credentials with anyone</li>
                </ul>
            </div>

            <div class="action-buttons">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/security" class="button secondary">
                    🔐 Security Settings
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signin" class="button">
                    🚨 Secure Account
                </a>
            </div>

            <p>If you have any concerns about this login or need assistance, please contact our support team immediately.</p>
            
            <div class="timestamp">
                This notification was sent at ${new Date().toLocaleString()}
            </div>
        </div>
        
        <div class="footer">
            <p><strong>MoneyDesk.co</strong></p>
            <p>Smart Financial Management</p>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">
                This is an automated security notification. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
New Login Detected - MoneyDesk.co

Hello ${userName},

We detected a new login to your MoneyDesk.co account. If this was you, no action is needed. If this wasn't you, please secure your account immediately.

Login Details:
- Time: ${loginTime || new Date().toLocaleString()}
${deviceInfo ? `- Device: ${deviceInfo}` : ''}
${location ? `- Location: ${location}` : ''}
${ipAddress ? `- IP Address: ${ipAddress}` : ''}

Security Notice:
- If this login was not authorized by you, please change your password immediately
- Consider enabling two-factor authentication for additional security
- Review your account activity regularly
- Never share your login credentials with anyone

If you have any concerns about this login or need assistance, please contact our support team immediately.

Best regards,
MoneyDesk.co Security Team

This notification was sent at ${new Date().toLocaleString()}
    `;

    const msg = {
      to: userEmail,
      from: process.env.FROM_EMAIL || 'noreply@moneydesk.co',
      subject,
      text: text,
      html: html,
    };

    console.log('📤 Sending login notification with SendGrid...');
    await sgMail.send(msg);
    console.log('✅ Login notification sent successfully to:', userEmail);

    return NextResponse.json({
      success: true,
      message: 'Login notification sent successfully',
    });
  } catch (error: any) {
    console.error('❌ Error sending login notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send login notification',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
