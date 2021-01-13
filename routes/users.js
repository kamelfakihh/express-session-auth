const {Pool} = require('pg');
const express = require('express');
const {Router} = require('express');
const {isEmail, isPassword} = require('../helper/validation');
const {hashPassword, verifyPassword} = require('../helper/password');
const {protected, loggedIn} = require('../middlewares/protection')
//
const {
    PORT = 5000,
    DB_PORT = 8432,
    SESSION_NAME = 'sid',
    SESSION_SECRET = 'Z@rtU3uXY`BJS[P-2D{<euh:-#{HML~m',
    SESSION_AGE = 1000*60*60*2,
    SESSION_SECURE = process.env.NODE_ENV === "production",
    DB_USER = 'postgres',
    DB_HOST = 'localhost',
    DB = 'sessionauth',
    DB_PASSWORD = '181201'
} = process.env;

// create a new pg pool 
const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB,
    password: DB_PASSWORD,
    port: DB_PORT,
});

const router = new Router();

router.post('/login', loggedIn, async (req, res) => {

    try{
        
        const {email, password} = req.body;

        // validate email and password
        if( isEmail(email) && isPassword(password)){

            // check if user exists in users table
            let result = await pool.query(`SELECT * FROM users WHERE email = '${email}';`);
            const user = result.rows[0];
            
            if(!user) {
                return res.status(400).json({message : 'account does not exist'});
            }


            // verify password is true
            if(await verifyPassword(password, user.password)){
                // add user to session after authorization
                req.session.userId =  user.id;    
                return res.status(200).json({id: user.id, name : user.name});

            } else {
                return res.status(403).json({message : 'incorrect password'})
            }

        }else {
            res.json({message : 'please provide valid parameters'})
        }

    }catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }

});

router.post('/register', loggedIn, async (req, res) => {

    try{
        
        const {email, name, password} = req.body;
        console.log(email);

        // validate email and password
        if( isEmail(email) && isPassword(password)){

            // check if email is already in use
            let result = await pool.query(`SELECT EXISTS(SELECT 1 FROM users WHERE email = '${email}');`);
            const { exists } = result.rows[0];
            if(exists) {
                return res.status(400).json({message : 'email is already in use'});
            }

            // if email is not in use we need to hash password
            // then add it to users table
            const hashedPass = await hashPassword(password);      
    
            result = await pool.query(`INSERT INTO users (email, name, password) VALUES ('${email}', '${name}', '${hashedPass}') RETURNING  *;`) 
            const user = result.rows[0];

            if(!user) {
                return res.status(500).json({message : 'failed to register'});
            }

            // add user id to session
            req.session.userId =  user.id;
            res.status(200).json({message : 'registered'});

        }else {
            res.json({message : 'please provide valid parameters'})
        }

    }catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }

});

router.post('/logout', protected,  (req, res) => {
    req.session.destroy( error => {
        if(error){
            res.json({message : 'failed to logout'});
        }

        res.clearCookie(SESSION_NAME);
        res.json({message : 'logged out'});
    })
});

module.exports = router;

