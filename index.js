//package's
const path = require('path')
const express = require('express');
const express_session = require('express-session');
const edge = require('edge.js');
const expressEdge = require('express-edge');
const connectmongo = require('connect-mongo');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

//controller's
const stroeUserController = (req,res) => {
    User.create(req.body, (error,user) => {
    if(error) {
        return res.redirect('/auth/register');
    } res.redirect('/');
})};

const loginUserController = (req,res) => {
    const {email,password} = req.body;
    
    User.findOne({email},(error,user) => {
        if(user) {
            bcryptjs.compare(password,user.password, (error,same)=> {
                if(same){
                    req.session.userId = user.id
                    res.redirect('/');
                } else {
                    res.redirect('/auth/login');
                }
            })
        } else {
            return res.redirect('/auth/login');
        }
    });
}

//main
const app = new express();
const mongoStore = connectmongo(express_session);

app.set('views',`${__dirname}/views`);

app.use(express_session({
    resave: true,
    saveUninitialized: true,
    secret: 'secret',
    store : new mongoStore({mongooseConnection:mongoose.connection})
}));

mongoose.connect('mongodb://localhost/auth-login-logout', {useUnifiedTopology: true, useNewUrlParser: true});

app.use(expressEdge.engine);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('*',(req,res,next) => {
    edge.global('auth',req.session.userId)
    next()
});

app.get('/',(req,res) => {res.render('homepage')});
app.get('/register',(req,res)=>{res.render('register')})
app.post('/user/register',stroeUserController);
app.post('/user/login',loginUserController)
app.get('/login',(req,res) => {res.render('login')});
app.get('/logout',(req,res) => {req.session.destroy(() => {res.redirect('/')})});

app.listen(4000,
    console.log('server is started')
);

//DataBase
const UserSechema = new mongoose.Schema({
    username: {
    type:String,
    required: true
},
    email: {
        type: String,
        required: true,
        unique: true
},
    password: {
        type: String,
        required: true
    }
})

UserSechema.pre('save', function(next){
    const user = this
    bcryptjs.hash(user.password, 10, function(error,hash) {
        user.password = hash
        next()
    })
})
                        
const User = mongoose.model('User',UserSechema)