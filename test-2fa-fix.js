// Test script to verify 2FA fix
const test2FAFix = async () => {
  try {
    console.log('🧪 Testing 2FA fix...');
    
    // Test with Firebase UID (should find 2FA enabled via email lookup)
    const response1 = await fetch('http://localhost:3000/api/debug-2fa-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'E-4U-DF' })
    });
    
    const result1 = await response1.json();
    console.log('✅ Test 1 - Firebase UID:', result1);
    
    // Test with email (should find 2FA enabled directly)
    const response2 = await fetch('http://localhost:3000/api/debug-2fa-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'hassyku786@gmail.com' })
    });
    
    const result2 = await response2.json();
    console.log('✅ Test 2 - Email:', result2);
    
    console.log('🎉 2FA fix test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

test2FAFix();
