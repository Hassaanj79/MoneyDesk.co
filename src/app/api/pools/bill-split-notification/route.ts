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
      participantEmail, 
      participantName,
      poolName,
      totalAmount,
      participantShare,
      totalParticipants,
      addedBy,
      addedByName,
      currency = 'USD'
    } = await request.json();
    
    if (!participantEmail || !poolName || !totalAmount || !participantShare) {
      return NextResponse.json(
        { error: 'participantEmail, poolName, totalAmount, and participantShare are required' },
        { status: 400 }
      );
    }

    console.log('💰 Sending bill split notification to:', participantEmail);

    const subject = `You've been added to a split payment - ${poolName}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Split Payment Notification - MoneyDesk.co</title>
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
        .payment-info {
            background: #f9f9f9;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .payment-info h3 {
            margin: 0 0 20px 0;
            color: #667eea;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 8px 0;
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
            font-weight: 500;
        }
        .share-highlight {
            background: #e8f5e8;
            border: 2px solid #28a745;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .share-amount {
            font-size: 28px;
            font-weight: bold;
            color: #28a745;
            margin: 10px 0;
        }
        .action-buttons {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 0 10px;
            font-weight: 600;
        }
        .button:hover {
            background: #5a6fd8;
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
        .note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .note strong {
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>💰 Split Payment Added</h1>
            <p>MoneyDesk.co Money Pool</p>
        </div>
        <div class="content">
            <h2>Hello ${participantName || 'there'},</h2>
            <p><strong>${addedByName || addedBy}</strong> has added you to a split payment in the <strong>"${poolName}"</strong> money pool.</p>
            
            <div class="payment-info">
                <h3>📊 Payment Details</h3>
                <div class="info-row">
                    <span class="info-label">Money Pool:</span>
                    <span class="info-value">${poolName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Amount:</span>
                    <span class="info-value">${currency} ${totalAmount.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Participants:</span>
                    <span class="info-value">${totalParticipants}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Added by:</span>
                    <span class="info-value">${addedByName || addedBy}</span>
                </div>
            </div>

            <div class="share-highlight">
                <h3 style="margin: 0 0 10px 0; color: #28a745;">Your Share</h3>
                <div class="share-amount">${currency} ${participantShare.toFixed(2)}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                    ${totalParticipants > 1 ? `Split equally among ${totalParticipants} participants` : 'Full amount'}
                </p>
            </div>

            <div class="note">
                <strong>💡 What's Next:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Review the payment details in your MoneyDesk.co account</li>
                    <li>Make your contribution when ready</li>
                    <li>Track the progress of the money pool</li>
                    <li>Contact ${addedByName || addedBy} if you have any questions</li>
                </ul>
            </div>

            <div class="action-buttons">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pools" class="button">
                    💰 View Money Pool
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signin" class="button secondary">
                    🔐 Sign In
                </a>
            </div>

            <p>If you have any questions about this split payment or need assistance, please contact our support team.</p>
        </div>
        
        <div class="footer">
            <p><strong>MoneyDesk.co</strong></p>
            <p>Smart Financial Management</p>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">
                This is an automated notification. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Split Payment Notification - MoneyDesk.co

Hello ${participantName || 'there'},

${addedByName || addedBy} has added you to a split payment in the "${poolName}" money pool.

Payment Details:
- Money Pool: ${poolName}
- Total Amount: ${currency} ${totalAmount.toFixed(2)}
- Total Participants: ${totalParticipants}
- Added by: ${addedByName || addedBy}

Your Share: ${currency} ${participantShare.toFixed(2)}
${totalParticipants > 1 ? `Split equally among ${totalParticipants} participants` : 'Full amount'}

What's Next:
- Review the payment details in your MoneyDesk.co account
- Make your contribution when ready
- Track the progress of the money pool
- Contact ${addedByName || addedBy} if you have any questions

If you have any questions about this split payment or need assistance, please contact our support team.

Best regards,
MoneyDesk.co Team
    `;

    const msg = {
      to: participantEmail,
      from: process.env.FROM_EMAIL || 'noreply@moneydesk.co',
      subject,
      text: text,
      html: html,
    };

    console.log('📤 Sending bill split notification with SendGrid...');
    await sgMail.send(msg);
    console.log('✅ Bill split notification sent successfully to:', participantEmail);

    return NextResponse.json({
      success: true,
      message: 'Bill split notification sent successfully',
    });
  } catch (error: any) {
    console.error('❌ Error sending bill split notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send bill split notification',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
