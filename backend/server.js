const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app        = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'https://task-flow-five-mu.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// ── Make io accessible in all routes/controllers ────────────────────────────
app.set('io', io);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '🚀 TaskFlow API is running!', version: '1.0.0' });
});

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/projects',      require('./routes/projects'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/comments',      require('./routes/comments'));
app.use('/api/team',          require('./routes/team'));
app.use('/api/notifications', require('./routes/notifications'));

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const socketHandler = require('./socket/socketHandler');
socketHandler(io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    httpServer.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  });