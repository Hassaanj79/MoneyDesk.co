# Email Integration Guide for MoneyDesk

## Overview
This guide explains how to send emails from different modules in the MoneyDesk application.

## Current Email Services

### 1. **Pool Invitations** (`src/services/pool-invitations.ts`)
- **Purpose**: Invite people to join money pools
- **Function**: `sendPoolInvitation()`
- **Endpoint**: `/api/pools/invite`
- **Email Type**: HTML invitation with join code

### 2. **Email OTP** (`src/services/email-otp.ts`)
- **Purpose**: Email verification codes
- **Function**: `createEmailOTP()`
- **Email Type**: Verification code

### 3. **2FA Codes** (`src/services/email-2fa.ts`)
- **Purpose**: Two-factor authentication codes
- **Function**: `send2FACode()`
- **Email Type**: 2FA code

### 4. **General Email** (`src/services/email.ts`)
- **Purpose**: General notifications
- **Function**: `sendEmail()`, `sendUserAccessUpdateEmail()`
- **Email Type**: Various notifications

## How to Send Emails from Different Modules

### For Pool Invitations

```typescript
import { sendPoolInvitation } from '@/services/pool-invitations';

// Example usage
await sendPoolInvitation(
  poolId: 'pool123',
  inviteeEmail: 'user@example.com',
  inviteeName: 'John Doe',
  invitedBy: 'user456',
  invitedByEmail: 'inviter@example.com',
  poolName: 'Office Fundraiser'
);
```

**Or via API:**
```typescript
const response = await fetch('/api/pools/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    poolId: 'pool123',
    inviteeEmail: 'user@example.com',
    inviteeName: 'John Doe',
    invitedBy: 'user456',
    invitedByEmail: 'inviter@example.com',
    poolName: 'Office Fundraiser',
  }),
});
```

### For Transaction Notifications

```typescript
// Create a new service: src/services/transaction-notifications.ts
import { sendEmail } from '@/services/email';

export async function sendTransactionNotification(
  userEmail: string,
  transactionAmount: number,
  transactionType: 'income' | 'expense'
) {
  await sendEmail({
    to: userEmail,
    subject: `New ${transactionType} recorded`,
    html: `
      <h2>Transaction Recorded</h2>
      <p>You have a new ${transactionType}: ${transactionAmount}</p>
    `
  });
}
```

### For Budget Alerts

```typescript
// Create: src/services/budget-notifications.ts
import { sendEmail } from '@/services/email';

export async function sendBudgetAlert(
  userEmail: string,
  budgetName: string,
  spent: number,
  limit: number
) {
  const percentage = (spent / limit) * 100;
  
  await sendEmail({
    to: userEmail,
    subject: `${budgetName} - Budget Alert`,
    html: `
      <h2>Budget Alert</h2>
      <p>You've spent ${percentage.toFixed(1)}% of your ${budgetName} budget</p>
      <p>Spent: ${spent} / Limit: ${limit}</p>
    `
  });
}
```

### For Loan Reminders

```typescript
// Create: src/services/loan-notifications.ts
import { sendEmail } from '@/services/email';

export async function sendLoanReminder(
  userEmail: string,
  borrowerName: string,
  amount: number,
  dueDate: string
) {
  await sendEmail({
    to: userEmail,
    subject: 'Loan Payment Reminder',
    html: `
      <h2>Loan Payment Due</h2>
      <p>${borrowerName} owes you ${amount}</p>
      <p>Due date: ${new Date(dueDate).toLocaleDateString()}</p>
    `
  });
}
```

## Email Service Implementation

### Current Implementation (Console Log Only)
The current email service logs to console instead of sending actual emails:

```typescript
// src/services/email.ts
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  console.log('📧 Email would be sent:', emailData);
  return true; // Placeholder - not actually sending
};
```

### To Enable Real Email Sending

You need to integrate with an email service provider:

#### Option 1: SendGrid
```typescript
import sgMail from '@sendgrid/mail';

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    
    await sgMail.send({
      to: emailData.to,
      from: 'noreply@moneydesk.co',
      subject: emailData.subject,
      html: emailData.html || emailData.body || '',
    });
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
```

#### Option 2: AWS SES
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const ses = new SESClient({ region: 'us-east-1' });
    
    await ses.send(new SendEmailCommand({
      Source: 'noreply@moneydesk.co',
      Destination: { ToAddresses: [emailData.to] },
      Message: {
        Subject: { Data: emailData.subject },
        Body: { Html: { Data: emailData.html || '' } },
      },
    }));
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
```

#### Option 3: Nodemailer (Simple Setup)
```typescript
import nodemailer from 'nodemailer';

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    await transporter.sendMail({
      from: 'noreply@moneydesk.co',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html || '',
    });
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
```

## Environment Variables Required

Add to `.env.local`:

```bash
# Email Service (Choose one)
SENDGRID_API_KEY=your_sendgrid_key
# OR
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your_access_key
AWS_SES_SECRET_KEY=your_secret_key
# OR
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Firestore Collection for Invitations

The system creates a `pool_invitations` collection with this structure:

```typescript
{
  poolId: string;
  poolName: string;
  invitedBy: string;
  invitedByEmail: string;
  inviteeEmail: string;
  inviteeName: string;
  status: 'pending' | 'accepted' | 'declined';
  joinCode: string;
  createdAt: string;
  expiresAt: string; // 7 days from creation
}
```

## Summary

1. **Pool Invitations**: Send email invites to join pools with join codes
2. **Transaction Notifications**: Alert users of new transactions
3. **Budget Alerts**: Warn when approaching budget limits
4. **Loan Reminders**: Send payment due date reminders

All services use a unified `sendEmail()` function that you can configure with your preferred email provider.

