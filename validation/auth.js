import {body} from 'express-validator';

export const registerValidation = [
    body('email', 'Неверный формат почты').isEmail(),
    body('password', 'Длина пароля меньше 5 символов').isLength({min: 5}),
    body('firstName', 'Укажите имя').isLength({min: 2}),
    body('lastName', 'Укажите фамилию').isLength({min: 2}),
]