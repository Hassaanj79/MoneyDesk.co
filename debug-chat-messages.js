// Debug script to check chat messages structure
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ",
  authDomain: "chirpchat-yi7xn.firebaseapp.com",
  projectId: "chirpchat-yi7xn",
  storageBucket: "chirpchat-yi7xn.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugChatMessages() {
  try {
    console.log('🔍 Checking chat messages structure...');
    
    // Get recent messages
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    
    console.log(`📊 Found ${querySnapshot.docs.length} recent messages:`);
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📝 Message ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Conversation ID: ${data.conversationId}`);
      console.log(`  Sender ID: ${data.senderId}`);
      console.log(`  User ID: ${data.userId || 'MISSING'}`);
      console.log(`  Sender Type: ${data.senderType}`);
      console.log(`  Message: ${data.message?.substring(0, 50)}...`);
      console.log(`  Timestamp: ${data.timestamp?.toDate?.()?.toISOString() || 'Invalid'}`);
    });
    
    // Check conversations
    console.log('\n🔍 Checking conversations...');
    const conversationsQuery = query(
      collection(db, 'chat_conversations'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    
    const convSnapshot = await getDocs(conversationsQuery);
    
    console.log(`📊 Found ${convSnapshot.docs.length} recent conversations:`);
    
    convSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n💬 Conversation ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  User ID: ${data.userId}`);
      console.log(`  User Name: ${data.userName}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Subject: ${data.subject}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging chat messages:', error);
  }
}

debugChatMessages();
