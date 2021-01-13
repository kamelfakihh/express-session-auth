const express = require('express');
const session = require('express-session')
const {Pool} = require('pg');
const pgSession = require('connect-pg-simple')(session);
const {protected} = require('./middlewares/protection')

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

// create an express app
const app = express();

// create a new pg pool 
const pgPool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB,
    password: DB_PASSWORD,
    port: DB_PORT,
});

// create connect-pg-simple session object
const pgStore = new pgSession({
    pool : pgPool,
    tableName : 'session'
});

// create a session middleware 
app.use(session({
    store : pgStore,
    name : SESSION_NAME,
    saveUninitialized : false,
    resave : false,
    secret : SESSION_SECRET,
    cookie : {
        path : '/',
        domain : null,
        httpOnly : true,
        maxAge : SESSION_AGE,
        sameSite : true,
        secure : SESSION_SECURE
    }
}));

app.use(express.json());

// gets executed before all middlewares and adds user details to request locals object 
// that is shared accross all middlewares
app.use((req, res, next) => { 
    next();
});

//routes
app.get('/home', (req, res) => {
    res.json({message : 'homepage'});
})

app.get('/dashboard', protected, (req, res) => {
    res.json({message : 'dashboard'})
})

app.use('/users', require('./routes/users'));

app.listen(PORT, console.log(`listening on port ${PORT}\nhttp://localhost:${PORT}/`));