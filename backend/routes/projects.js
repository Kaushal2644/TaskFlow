const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getDashboardStats
} = require('../controllers/projectController');

router.get('/stats/dashboard', protect, getDashboardStats);
router.route('/')
  .get(protect, getProjects)
  .post(protect, createProject);
router.route('/:id')
  .get(protect, getProject)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

module.exports = router;