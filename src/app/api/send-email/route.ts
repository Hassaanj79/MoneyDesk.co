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
  console.log('📧 SendGrid API Route Called');
  console.log('SENDGRID_API_KEY exists:', !!SENDGRID_API_KEY);
  console.log('SENDGRID_API_KEY length:', SENDGRID_API_KEY?.length);
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL);

  try {
    if (!SENDGRID_API_KEY) {
      console.warn('Email service disabled - no API key');
      return NextResponse.json(
        { error: 'Email service not configured - SENDGRID_API_KEY missing' },
        { status: 503 }
      );
    }

    const { to, subject, body, html } = await request.json();
    
    console.log('📧 Email request received:');
    console.log('  To:', to);
    console.log('  Subject:', subject);
    console.log('  Has body:', !!body);
    console.log('  Has html:', !!html);

    if (!to || !subject) {
      console.error('❌ Missing required fields');
      console.error('  to:', to);
      console.error('  subject:', subject);
      return NextResponse.json(
        { error: 'Missing required fields (to, subject)' },
        { status: 400 }
      );
    }

    const msg = {
      to,
      from: process.env.FROM_EMAIL || 'noreply@moneydesk.co',
      subject,
      text: body,
      html: html || body,
    };

    console.log('📤 Sending email with SendGrid...');
    console.log('  Message:', JSON.stringify(msg, null, 2));

    await sgMail.send(msg);
    console.log('✅ Email sent successfully to:', to);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error: any) {
    console.error('❌ SendGrid Error Details:');
    console.error('  Error:', error);
    console.error('  Message:', error.message);
    console.error('  Response:', error.response?.body);
    console.error('  Code:', error.code);
    console.error('  Stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error.message || 'Unknown error',
        response: error.response?.body,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

