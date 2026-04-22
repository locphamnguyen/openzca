/**
 * test-redis.js — Emit typing event to trigger Redis writes
 * Run: node test-redis.js
 */
import { io } from 'socket.io-client';

const socket = io('http://localhost:3080', {
  transports: ['websocket'],
  reconnection: true,
});

socket.on('connect', () => {
  console.log('✓ Connected to server');

  // Listen for events from server
  socket.on('chat:typing', (data) => {
    console.log('📥 Received chat:typing from server:', data);
  });

  // Emit typing event (triggers eventBuffer.recordTyping)
  const conversationId = '123e4567-e89b-12d3-a456-426614174000'; // test ID
  const userId = 'user-123';
  const userName = 'Test User';

  console.log(`\n📤 Emitting typing event to server...`);
  socket.emit('chat:typing', {
    conversationId,
    userId,
    userName,
  });

  // Emit multiple times to fill buffer
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      socket.emit('chat:typing', {
        conversationId,
        userId: `user-${i}`,
        userName: `User ${i}`,
      });
      console.log(`  → Emit ${i + 1}`);
    }, i * 500);
  }

  // Disconnect after 5s
  setTimeout(() => {
    console.log('\n✓ Test complete. Check Redis logs and:');
    console.log('  docker exec zalo-crm-redis redis-cli KEYS "eb:typing:*"');
    console.log('  docker logs -f zalo-crm-redis');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('error', (err) => {
  console.error('✗ Connection error:', err);
  process.exit(1);
});

socket.on('connect_error', (err) => {
  console.error('✗ Connection error:', err);
  process.exit(1);
});
