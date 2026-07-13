const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// ─── @route   GET /api/comments/task/:taskId ──────────────────────────────────
const getTaskComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatar role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   POST /api/comments ──────────────────────────────────────────────
const createComment = async (req, res, next) => {
  try {
    const { content, taskId } = req.body;

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = await Comment.create({
      content,
      task:    taskId,
      project: task.project,
      author:  req.user._id
    });

    await comment.populate('author', 'name email avatar role');

    // ── Emit real-time event to everyone viewing this task ─────────────────
    const io = req.app.get('io');
    if (io) {
      io.emit('newComment', { taskId, comment });
    }

    // Notify task assignee about new comment
    if (
      task.assignedTo &&
      task.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      // ── FIX: store the created notification in a variable ────────────────
      const notification = await Notification.create({
        recipient:  task.assignedTo._id,
        sender:     req.user._id,
        type:       'comment_added',
        message:    `${req.user.name} commented on "${task.title}"`,
        link:       `/projects/${task.project}`,
        refProject: task.project,
        refTask:    task._id
      });

      // ── Emit notification to the specific user's room ────────────────────
      if (io) {
        io.to(task.assignedTo._id.toString()).emit('newNotification', notification);
      }
    }

    res.status(201).json({
      success: true,
      comment
    });
  } catch (err) {
    console.error('❌ createComment error:', err.message);
    next(err);
  }
};

// ─── @route   PUT /api/comments/:id ───────────────────────────────────────────
const updateComment = async (req, res, next) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only author can edit
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }

    comment.content  = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('author', 'name email avatar role');

    res.status(200).json({
      success: true,
      comment
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   DELETE /api/comments/:id ────────────────────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment
};