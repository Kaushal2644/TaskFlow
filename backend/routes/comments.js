const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');

router.get('/task/:taskId', protect, getTaskComments);
router.post('/',            protect, createComment);
router.route('/:id')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;