const { body } = require('express-validator');

const register = [
  body('organizationId')
    .trim()
    .notEmpty()
    .withMessage('Organization ID/Code is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const login = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  register,
  login
};
