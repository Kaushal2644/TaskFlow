const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyTasks,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTask
} = require('../controllers/taskController');

router.get('/',                          protect, getMyTasks);
router.get('/project/:projectId',        protect, getProjectTasks);
router.post('/',                         protect, createTask);
router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);
router.put('/:id/move',                  protect, moveTask);

module.exports = router;