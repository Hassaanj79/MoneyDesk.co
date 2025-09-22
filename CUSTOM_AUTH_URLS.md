# 🔐 Custom Authentication URLs for MoneyDesk.co

## 🔗 **Unified Authentication Action URL**

### **Single URL for All Auth Actions**
This one URL handles both password reset and email verification automatically:

```
https://yourdomain.com/auth-action?email={USER_EMAIL}&oobCode={OOB_CODE}&mode={MODE}
```

**Examples:**
```
# Password Reset
https://moneydesk.co/auth-action?email=user@example.com&oobCode=ABC123&mode=resetPassword

# Email Verification  
https://moneydesk.co/auth-action?email=user@example.com&oobCode=ABC123&mode=verifyEmail
```

**Benefits:**
- ✅ **One URL to manage** - No need to configure multiple endpoints
- ✅ **Smart Detection** - Automatically detects the action type
- ✅ **Fallback Support** - Works even without mode parameter
- ✅ **Simplified Setup** - Single Firebase configuration

## 🎨 **Unified Authentication Page**

### **Smart Auth Action Page** (`/auth-action`)
- **Features:**
  - ✅ **Auto-Detection** - Automatically detects password reset vs email verification
  - ✅ **Unified Design** - Matches your app's purple theme and styling
  - ✅ **Password Strength** - Visual indicators and real-time validation
  - ✅ **Smart UI** - Shows appropriate form based on action type
  - ✅ **Error Handling** - Comprehensive error states and messaging
  - ✅ **Success Flow** - Automatic redirects after successful actions
  - ✅ **Fallback Support** - Works even if mode parameter is missing

## 🔧 **Configuration**

### **Environment Variables**
Make sure your `.env.local` has:
```bash
NEXT_PUBLIC_APP_DOMAIN=yourdomain.com
```

### **For Local Development**
```bash
NEXT_PUBLIC_APP_DOMAIN=localhost:3000
```

### **For Production (Vercel)**
Set in Vercel dashboard:
```
NEXT_PUBLIC_APP_DOMAIN=moneydesk.co
```

## 📝 **Email Template Examples**

### **Password Reset Email Template**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Reset Your Password - MoneyDesk.co</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed;">MoneyDesk.co</h1>
    </div>
    
    <h2>Reset Your Password</h2>
    <p>Hello,</p>
    <p>You requested to reset your password for your MoneyDesk.co account.</p>
    <p>Click the button below to reset your password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourdomain.com/auth-action?email={USER_EMAIL}&oobCode={OOB_CODE}&mode=resetPassword" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
        </a>
    </div>
    
    <p>If you didn't request this password reset, please ignore this email.</p>
    <p>This link will expire in 1 hour for security reasons.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        The MoneyDesk.co Team
    </p>
</body>
</html>
```

### **Email Verification Template**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Verify Your Email - MoneyDesk.co</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed;">MoneyDesk.co</h1>
    </div>
    
    <h2>Verify Your Email Address</h2>
    <p>Hello,</p>
    <p>Thank you for signing up for MoneyDesk.co! Please verify your email address to complete your registration.</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourdomain.com/auth-action?email={USER_EMAIL}&oobCode={OOB_CODE}&mode=verifyEmail" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
        </a>
    </div>
    
    <p>If you didn't create an account with MoneyDesk.co, please ignore this email.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        The MoneyDesk.co Team
    </p>
</body>
</html>
```

## 🚀 **Testing**

### **Local Testing**
1. Start your development server: `npm run dev`
2. Test unified auth action: `http://localhost:3000/auth-action?email=test@example.com&oobCode=test123&mode=resetPassword`
3. Test email verification: `http://localhost:3000/auth-action?email=test@example.com&oobCode=test123&mode=verifyEmail`

### **Production Testing**
1. Deploy to Vercel
2. Test with your actual domain: `https://moneydesk.co/auth-action?email=test@example.com&oobCode=test123&mode=resetPassword`

## ✅ **Benefits**

- **Professional Design**: Matches your app's purple theme and styling
- **Better UX**: Users stay within your app's ecosystem
- **Security**: Proper validation and error handling
- **Mobile Responsive**: Works on all devices
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Real-time Feedback**: Password strength indicators and validation

## 🔄 **Migration from Firebase Default Pages**

The custom pages automatically replace Firebase's default authentication pages, providing a seamless experience for your users while maintaining all security features.
