const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// ─── @route   GET /api/tasks ──────────────────────────────────────────────────
// ─── @access  Private (My Tasks) ──────────────────────────────────────────────
const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;

    let query = { assignedTo: req.user._id };

    if (status && status !== 'All Status')
      query.status = status;
    if (priority && priority !== 'All Priority')
      query.priority = priority;
    if (search)
      query.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(query)
      .populate('project', 'name status')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   GET /api/tasks/project/:projectId ───────────────────────────────
// ─── @access  Private (Kanban Board) ──────────────────────────────────────────
const getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });

    // Group by status for Kanban
    const kanbanBoard = {
      Backlog:      [],
      Todo:         [],
      'In Progress': [],
      Review:       [],
      Done:         []
    };

    tasks.forEach(task => {
      if (kanbanBoard[task.status]) {
        kanbanBoard[task.status].push(task);
      }
    });

    res.status(200).json({
      success: true,
      tasks,
      kanbanBoard
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   POST /api/tasks ─────────────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, project, assignedTo, dueDate, tags } = req.body;

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const task = await Task.create({
      title, description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
      tags: tags || []
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name');

    const io = req.app.get('io');

    // ── Emit live new task event ────────────────────────────────────────────
    io.emit('taskCreated', { task });

    if (assignedTo && assignedTo !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient:  assignedTo,
        sender:     req.user._id,
        type:       'task_assigned',
        message:    `${req.user.name} assigned you a task: "${title}"`,
        link:       `/projects/${project}`,
        refProject: project,
        refTask:    task._id
      });

      // ── Emit notification to assigned user's room ──────────────────────
      io.to(assignedTo).emit('newNotification', notification);
    }

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ─── @route   PUT /api/tasks/:id ──────────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const previousStatus = task.status;

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name');

    // Notify if status changed to Done
    if (previousStatus !== 'Done' && task.status === 'Done') {
      if (task.createdBy._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient:  task.createdBy._id,
          sender:     req.user._id,
          type:       'task_completed',
          message:    `"${task.title}" was marked as Done`,
          link:       `/projects/${task.project._id}`,
          refProject: task.project._id,
          refTask:    task._id
        });
      }
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   DELETE /api/tasks/:id ───────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   PUT /api/tasks/:id/move ─────────────────────────────────────────
// ─── @access  Private (Kanban drag and drop) ──────────────────────────────────
const moveTask = async (req, res, next) => {
  try {
    const { status, order } = req.body;

    const previousTask = await Task.findById(req.params.id);
    if (!previousTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const previousStatus = previousTask.status;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status, order },
      { new: true }
    )
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name');

    let projectAutoCompleted = false;
    let projectName          = null;

    // ── Get io instance ─────────────────────────────────────────────────────
    const io = req.app.get('io');

    // ── Emit live task move to everyone on the Kanban board ────────────────
    io.emit('taskMoved', {
      taskId:   task._id,
      newStatus: status,
      task
    });

    if (previousStatus !== 'Done' && status === 'Done') {
      const totalTasks = await Task.countDocuments({ project: task.project._id });
      const doneTasks  = await Task.countDocuments({
        project: task.project._id,
        status:  'Done'
      });

      if (totalTasks > 0 && totalTasks === doneTasks) {
        const project = await Project.findById(task.project._id)
          .populate('members.user', 'name email')
          .populate('owner', 'name email');

        if (project && project.status !== 'Completed' && project.status !== 'Cancelled') {
          project.status         = 'Completed';
          project.completionRate = 100;
          await project.save();

          projectAutoCompleted = true;
          projectName          = project.name;

          const memberIds = project.members
            .map(m => m.user._id)
            .filter(id => id.toString() !== req.user._id.toString());

          const notifications = memberIds.map(memberId => ({
            recipient:  memberId,
            sender:     req.user._id,
            type:       'project_updated',
            message:    `🎉 All tasks in "${project.name}" are done! Project auto-completed.`,
            link:       `/projects`,
            refProject: project._id
          }));

          notifications.push({
            recipient:  req.user._id,
            sender:     req.user._id,
            type:       'project_updated',
            message:    `🎉 "${project.name}" was automatically marked as Completed!`,
            link:       `/projects`,
            refProject: project._id
          });

          const created = await Notification.insertMany(notifications);

          // ── Emit notification to every member's personal room ────────────
          created.forEach(notif => {
            io.to(notif.recipient.toString()).emit('newNotification', notif);
          });

          // ── Emit project update to everyone ──────────────────────────────
          io.emit('projectUpdated', { projectId: project._id, project });
        }
      }
    }

    res.status(200).json({
      success: true,
      task,
      projectAutoCompleted,
      projectName
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTasks,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTask
};