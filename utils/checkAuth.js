import jwt from 'jsonwebtoken';

export default (req, res, next) => {
    
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    console.log(token)

    if(token) {
        try{
            const decoded = jwt.verify(token, 'secret');
            
            req.body.userId = decoded.id;
            req.body.role = decoded.role;
            req.body.schoolId = decoded.schoolId;
            console.log(req.body)
        }catch(err) {
            return res.status(403).json({
                message: 'Нет доступа'
            }) 
        }

    }else {
        return res.status(403).json({
            message: 'Нет доступа'
        }) 
    }
    next();
}