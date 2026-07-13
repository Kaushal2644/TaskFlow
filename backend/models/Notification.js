const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: [
      'task_assigned',
      'task_completed',
      'task_updated',
      'comment_added',
      'project_created',
      'project_updated',
      'member_invited',
      'deadline_reminder'
    ],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  // Reference to what triggered this notification
  refProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  refTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  }
}, {
  timestamps: true
});

// Auto set readAt when notification is marked read
NotificationSchema.pre('save', function (next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);