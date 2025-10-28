// Test the updated is2FAEnabled function
const testUpdated2FA = async () => {
  try {
    console.log('🧪 Testing updated is2FAEnabled function...');
    
    // Simulate what the 2FA guard does: send2FACode(user.uid, user.email)
    const testUID = 'E-4U-DF'; // Truncated UID from logs
    const testEmail = 'hassyku786@gmail.com';
    
    console.log('📧 Testing with UID:', testUID, 'and email:', testEmail);
    
    // Test the send2FACode function (which calls is2FAEnabled internally)
    const response = await fetch('http://localhost:3000/api/auth/send-2fa-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUID,
        email: testEmail
      })
    });
    
    const result = await response.json();
    console.log('✅ send2FACode result:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testUpdated2FA();
