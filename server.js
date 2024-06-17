import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { validationResult } from 'express-validator';
import {registerValidation} from './validation/auth.js';
import { PrismaClient } from '@prisma/client'
import checkAuth from './utils/checkAuth.js';

const prisma = new PrismaClient()
const app = express();

app.use(cors())
app.use(express.json());

app.get('/school', async(req, res) => { 
    try{
        let school = await prisma.school.findMany();

        res.json(school)
    } catch(err) {
        console.log(err)
        res.status(400).json({
            message: 'Не удалось получить список школ'
        })
    }


})

app.post('/auth/login', async (req, res) => {
    try{
        let user;
        const {role, email, password} = req.body;

        if(role === 'STUDENT') {
            user = await prisma.student.findUnique({
                where:{
                    email
                }
            })
        }else if(role === 'TEACHER') {
            user = await prisma.teacher.findUnique({
                where:{
                    email
                }
            })
        }       
       
        if(!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            })
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if(!isValidPassword) {
            return res.status(404).json({
                message: 'Не верный логин или пароль'
            })
        }

        const token = jwt.sign({
            id: user.id,
            role,
            schoolId: user.schoolId
        }, 
        'secret',
        {
            expiresIn: '30d'
        }
        );

        res.json({
            ...user,
            token
        })    
        
    }catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось авторизоваться'
        })
    }
})

app.post('/auth/register', registerValidation, async (req, res) => {
   console.log(req.body)
    try {
        const {role, firstName, lastName, age, grade, schoolId, email, password} = req.body;
        const errors = validationResult(req);
        console.log(role, firstName, lastName, age, schoolId, email, password)
        if(!errors.isEmpty()) {
            return res.status(400).json(errors.array());
        }
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        let user;
        if(role === 'STUDENT') {
            user = await prisma.student.create({
                data: {
                  role, 
                  firstName,
                  lastName,
                  age,
                  grade: '', 
                  schoolId: Number(schoolId),
                  password: passwordHash,
                  email,
                  coursesNames: ''
                },
            })
        } else if(role === 'TEACHER') {
            user = await prisma.teacher.create({
                data: {
                  role, 
                  firstName,
                  lastName,
                  age, 
                  schoolId: Number(schoolId),
                  password: passwordHash,
                  email,
                },
            })
        }
        
        const token = jwt.sign({
            id: user.id,
            role,
            schoolId
        }, 
        'secret',
        {
            expiresIn: '30d'
        }
        );

        res.json({
            ...user,
            token
        })    

    } catch(err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось зарегестрироваться'
        })
    }

})

app.get('/auth/me', checkAuth,  async (req, res) => {
    try{
        let user;

        if(req.body.role === 'STUDENT') {
            user = await prisma.student.findUnique({
                where: {
                    id: req.body.userId
                }
            })
        } else if (req.body.role === 'TEACHER') {
            user = await prisma.teacher.findUnique({
                where: {
                    id: req.body.userId
                }
            })
        }

        if(!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            }) 
        } 
        
        res.json({
            ...user
        })

    } catch(err) {
        return res.status(404).json({
            message: 'Пользователь не найден'
        }) 
    }
})

app.get('/auth/all', checkAuth, async(req, res) => {
  try{
    let user;
    if(req.body.role !== 'TEACHER') {
        return res.json({
            message: 'Нет доступа'
        })
    } else if(req.body.role === "TEACHER") {
        user = await prisma.student.findMany({
            where: {
                schoolId: req.body.schoolId
            }
        })
    }

    res.json(user)
    
  } catch (err){
    console.log(err)
    res.status(404).json({
        message: 'Не удалось получить данные'
    })
  }
})

app.put('/api/student/:id', async (req, res) => {
    const { id } = req.params;
    const { role, coursesNames, bonusPoints, coursesCompleted } = req.body;
    
    let user;
    let updatedStudent;
    try {
        
        if(role === 'TEACHER' ) {
            user = await prisma.teacher.findUnique({
                where: { id:Number(id) },
            });

            updatedStudent = await prisma.teacher.update({
                where: { id:Number(id)},
                data: {
                    coursesNames: user.coursesNames + coursesNames,
                    bonusPoints: user.bonusPoints + bonusPoints,
                    coursesCompleted: user.coursesCompleted + coursesCompleted,
                },
            });

        } else if(role === 'STUDENT') {
            user = await prisma.student.findUnique({
                where: { id:Number(id) },
            });

            updatedStudent = await prisma.student.update({
                where: { id: Number(id) },
                data: {
                    coursesNames: coursesNames,
                    bonusPoints: user.bonusPoints + bonusPoints,
                    coursesCompleted: user.coursesCompleted + coursesCompleted,
                },
            });

        }
    
    res.json(updatedStudent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Произошла ошибка при обновлении данных студента' });
    }
});

app.get('/posts', async (req, res) => {
    const posts = await prisma.post.findMany({
      include: {
        comments: true,
        teacher: true,
        student: true
      }
    });
    res.json(posts);
  });
  
app.post('/posts', async (req, res) => {
    const { title, content, role, userId } = req.body;
    let post;
    if(role === 'TEACHER') {
        post = await prisma.post.create({
            data: { 
                title, 
                content,
                teacher: {
                    connect: {
                        id: userId
                    }
                }     
            },
            include: {
                teacher: true
            }
          });
    } else if(role === 'STUDENT') {
        post = await prisma.post.create({
            data: { 
                title, 
                content,
                student: {
                    connect: {
                        id: userId
                    }
                }     
            },
            include: {
                student: true
            }
          });
    }
    res.json(post);
});
  
app.post('/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const comments = await prisma.comment.create({
      data: {
        content,
        post: { 
            connect: { id: Number(postId) } 
        }
      }
    });
    res.json(comments);
});



app.listen(4444, (err) => {
    if(err) {
        return console.log(err)
    }
    console.log('server OK')
});


