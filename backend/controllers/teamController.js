const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// ─── @route   GET /api/team ───────────────────────────────────────────────────
const getTeamMembers = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const members = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      members
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   POST /api/team/invite ───────────────────────────────────────────
const inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // In production you'd send an email here
    // For now we create the user with a temp password
    const tempPassword = Math.random().toString(36).slice(-8);

    const newUser = await User.create({
      name:     email.split('@')[0],
      email,
      password: tempPassword,
      role:     role || 'Team Member'
    });

    // Notify the inviter
    await Notification.create({
      recipient: req.user._id,
      sender:    req.user._id,
      type:      'member_invited',
      message:   `You invited ${email} to join as ${role || 'Team Member'}`,
      link:      '/team'
    });

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${email}`,
      member: {
        _id:   newUser._id,
        name:  newUser.name,
        email: newUser.email,
        role:  newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   PUT /api/team/:id/role ──────────────────────────────────────────
const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Only Admin can change roles
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admin can update member roles'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      member: user
    });
  } catch (err) {
    next(err);
  }
};

// ─── @route   DELETE /api/team/:id ────────────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admin can remove members'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from all projects
    await Project.updateMany(
      { 'members.user': req.params.id },
      { $pull: { members: { user: req.params.id } } }
    );

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTeamMembers,
  inviteMember,
  updateMemberRole,
  removeMember
};