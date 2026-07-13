const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { register, login, getMe, updateProfile, updatePassword } = require('../controllers/authController.js');
const { protect } = require('../middleware/auth.js');

const registerValidation = [
  check('name', 'Name is required')
    .not().isEmpty().trim(),
  check('email', 'Please enter a valid email')
    .isEmail().normalizeEmail(),
  check('password', 'Password must be at least 6 characters')
    .isLength({ min: 6 })
];

const loginValidation = [
  check('email', 'Please enter a valid email')
    .isEmail().normalizeEmail(),
  check('password', 'Password is required')
    .not().isEmpty()
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/me', protect, getMe);
router.post('/updateProfile', protect, updateProfile);
router.post('/updatePassword', protect, updatePassword);

module.exports = router;