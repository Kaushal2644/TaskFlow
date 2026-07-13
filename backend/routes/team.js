const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTeamMembers,
  inviteMember,
  updateMemberRole,
  removeMember
} = require('../controllers/teamController');

router.get('/',           protect, getTeamMembers);
router.post('/invite',    protect, inviteMember);
router.put('/:id/role',   protect, updateMemberRole);
router.delete('/:id',     protect, removeMember);

module.exports = router;