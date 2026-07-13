const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// ─── @route   GET /api/projects ───────────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getProjects = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;

    // Build query — only projects where user is owner or member
    let query = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    };

    if (status && status !== 'All Status')   query.status   = status;
    if (priority && priority !== 'All Priority') query.priority = priority;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    // Add task counts to each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const counts = {
          total: 0,
          Backlog: 0, Todo: 0,
          'In Progress': 0,
          Review: 0, Done: 0
        };

        taskCounts.forEach(({ _id, count }) => {
          counts[_id] = count;
          counts.total += count;
        });

        // Calculate completion rate
        const completionRate = counts.total > 0
          ? Math.round((counts.Done / counts.total) * 100)
          : 0;

        return {
          ...project.toObject(),
          taskCounts: counts,
          completionRate
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projects.length,
      projects: projectsWithCounts
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   POST /api/projects ──────────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const {
      name, description,
      status, priority,
      startDate, endDate, members
    } = req.body;

    const project = await Project.create({
      name,
      description,
      status:    status    || 'Planning',
      priority:  priority  || 'Medium',
      startDate: startDate || null,
      endDate:   endDate   || null,
      owner:     req.user._id,
      members:   members   || []
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      project
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   GET /api/projects/:id ───────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const isMember = project.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );
    const isOwner = project.owner._id.toString() === req.user._id.toString();

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    // Get tasks grouped by status
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      project,
      tasks
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   PUT /api/projects/:id ───────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner can update
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can update this project'
      });
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      project
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   DELETE /api/projects/:id ────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can delete this project'
      });
    }

    // Delete all tasks and notifications linked to this project
    await Task.deleteMany({ project: project._id });
    await Notification.deleteMany({ refProject: project._id });
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project and all related data deleted'
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   GET /api/projects/stats/dashboard ───────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Projects where user is owner or member
    const userProjects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });

    const projectIds = userProjects.map(p => p._id);

    // Task stats
    const taskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const taskCounts = {
      total: 0,
      Backlog: 0, Todo: 0,
      'In Progress': 0,
      Review: 0, Done: 0
    };

    taskStats.forEach(({ _id, count }) => {
      taskCounts[_id] = count;
      taskCounts.total += count;
    });

    // Completion rate
    const completionRate = taskCounts.total > 0
      ? Math.round((taskCounts.Done / taskCounts.total) * 100)
      : 0;

    // Active projects count
    const activeProjects = userProjects.filter(
      p => p.status === 'Active'
    ).length;

    // Upcoming deadlines (next 7 days)
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = await Task.find({
      project: { $in: projectIds },
      dueDate: { $gte: now, $lte: next7Days },
      status: { $ne: 'Done' }
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name avatar')
      .sort({ dueDate: 1 })
      .limit(5);

    // Recent activity (last 5 tasks updated)
    const recentTasks = await Task.find({
      project: { $in: projectIds }
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Task distribution for chart
    const taskDistribution = [
      { name: 'Backlog',     value: taskCounts.Backlog },
      { name: 'Todo',        value: taskCounts.Todo },
      { name: 'In Progress', value: taskCounts['In Progress'] },
      { name: 'Review',      value: taskCounts.Review },
      { name: 'Done',        value: taskCounts.Done }
    ];

    res.status(200).json({
      success: true,
      stats: {
        activeProjects,
        totalTasks:     taskCounts.total,
        completedTasks: taskCounts.Done,
        pendingTasks:   taskCounts.total - taskCounts.Done,
        completionRate,
        taskDistribution,
        upcomingDeadlines,
        recentActivity: recentTasks
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getDashboardStats
};