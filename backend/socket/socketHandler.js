const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;