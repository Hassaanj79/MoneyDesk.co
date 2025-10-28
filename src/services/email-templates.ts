// Email templates for MoneyDesk.co

export interface MoneyPoolInvitationData {
  inviteeName: string;
  inviterName: string;
  poolName: string;
  poolDescription?: string;
  contributionAmount?: number;
  poolCurrency?: string;
  joinUrl: string;
}

export const createMoneyPoolInvitationEmail = (data: MoneyPoolInvitationData) => {
  const { inviteeName, inviterName, poolName, contributionAmount, poolCurrency, joinUrl } = data;

  const subject = `You're invited to join a Money Pool: ${poolName}! 🎯`;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Money Pool Invitation - MoneyDesk.co</title>
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
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
        }
        .pool-info {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .pool-info h2 {
            margin: 0 0 10px 0;
            color: #667eea;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .cta-button {
            display: block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            text-align: center;
            margin: 30px auto;
            font-weight: 600;
            font-size: 16px;
            width: fit-content;
        }
        .cta-button:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a42a2 100%);
        }
        .divider {
            height: 1px;
            background: #eee;
            margin: 30px 0;
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
        .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .footer p {
            margin: 5px 0;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎯 Money Pool Invitation</h1>
        </div>
        <div class="content">
            <div class="greeting">
                <p>Hi ${inviteeName}! 👋</p>
            </div>
            
            <p>You've been invited by <strong>${inviterName}</strong> to join a money pool on MoneyDesk.co!</p>
            
            <div class="pool-info">
                <h2>${poolName}</h2>
                ${contributionAmount && poolCurrency ? `
                <div class="info-item">
                    <span class="info-label">Contribution:</span>
                    <span class="info-value">${poolCurrency} ${contributionAmount.toLocaleString()}</span>
                </div>
                ` : ''}
                ${data.poolDescription ? `
                <p style="margin-top: 10px; color: #666;">${data.poolDescription}</p>
                ` : ''}
            </div>

            <p>Click the button below to join this money pool and start contributing!</p>
            
            <a href="${joinUrl}" class="cta-button">
                Join Money Pool Now →
            </a>
            
            <div class="security-note">
                <strong>🔒 Secure Invitation:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This invitation is secure and only you can access it</li>
                    <li>Your money is always under your control</li>
                    <li>Join only if you trust the pool organizer</li>
                </ul>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #666;">
                If you're unable to click the button above, copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; color: #667eea;">
                ${joinUrl}
            </p>
        </div>
        
        <div class="footer">
            <p><strong>MoneyDesk.co</strong></p>
            <p>Smart Financial Management</p>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
Hi ${inviteeName}!

You've been invited by ${inviterName} to join a money pool on MoneyDesk.co!

Pool Details:
- Name: ${poolName}
${contributionAmount && poolCurrency ? `- Contribution: ${poolCurrency} ${contributionAmount.toLocaleString()}` : ''}
${data.poolDescription ? `- Description: ${data.poolDescription}` : ''}

Join this pool by clicking the link below:
${joinUrl}

If you have any questions, please contact ${inviterName}.

Best regards,
MoneyDesk.co Team
  `;

  return { subject, html, text };
};

