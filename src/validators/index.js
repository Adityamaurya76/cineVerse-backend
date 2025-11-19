import { body } from 'express-validator';
import { AvailableUserRole } from '../utils/constants.js';

const userRegistrationValidator = () => {
    return [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('fullName').trim().notEmpty().withMessage('Full name is required'),
        body('role').optional().isIn(AvailableUserRole).withMessage(`Role must be one of the following: ${AvailableUserRole.join(', ')}`),
    ]
}


export { userRegistrationValidator };