// Test to get full Firebase UID
const getFullUID = async () => {
  try {
    console.log('🔍 Getting full Firebase UID...');
    
    const response = await fetch('http://localhost:3000/api/debug-user-id', {
      method: 'GET'
    });
    
    const result = await response.json();
    console.log('✅ Full UID:', result);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

getFullUID();
