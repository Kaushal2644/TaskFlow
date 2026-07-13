const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notificationController');

router.get('/',                    protect, getNotifications);
router.put('/markallread',         protect, markAllRead);
router.put('/:id/read',            protect, markAsRead);
router.delete('/:id',              protect, deleteNotification);

module.exports = router;