import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(request: NextRequest) {
  try {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

    if (!SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SENDGRID_API_KEY not found in environment variables' },
        { status: 500 }
      );
    }

    // Set API key
    sgMail.setApiKey(SENDGRID_API_KEY);

    const body = await request.json();
    const { to, from } = body;

    // Prepare email message
    const msg = {
      to: to || 'test@example.com', // Change to your email
      from: from || process.env.FROM_EMAIL || 'noreply@moneydesk.co',
      subject: 'SendGrid Test Email from MoneyDesk.co',
      text: 'This is a test email from MoneyDesk.co. If you received this, SendGrid is working correctly!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>SendGrid Test Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0;">✅ SendGrid Integration Test</h1>
              <p style="margin: 10px 0 0 0;">MoneyDesk.co</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2>Hello! 👋</h2>
              <p>This is a test email from MoneyDesk.co to verify that SendGrid is working correctly.</p>
              <p>If you received this email, your SendGrid integration is successful!</p>
              <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>✅ Status:</strong> SendGrid is properly configured and sending emails successfully.
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                MoneyDesk.co Team
              </p>
            </div>
          </body>
        </html>
      `,
    };

    // Send email
    await sgMail.send(msg);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      details: {
        to: msg.to,
        from: msg.from,
      },
    });
  } catch (error: any) {
    console.error('SendGrid Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SendGrid Test API',
    instructions: 'Send a POST request with { "to": "your-email@example.com" } to test email sending',
  });
}

