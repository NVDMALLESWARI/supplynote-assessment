const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');
const bcrypt=require("bcrypt")
const app = express();
const passport = require("passport")
const initializePassport=require("./passport-config")
initializePassport( passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)
const flash = require("express-flash")
const session = require("express-session")
const methodOverride = require("method-override")
mongoose.connect(process.env.MONGODB_URI);


const users=[]
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, 
    saveUninitialized: false
}))
app.use(passport.initialize()) 
app.use(passport.session())
app.use(methodOverride("_method"))


app.post("/login", checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))

// Configuring the register post functionality
app.post("/register", checkNotAuthenticated, async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(), 
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        })
        console.log(users); // Display newly registered in the console
        res.redirect("/login")
        
    } catch (e) {
        console.log(e);
        res.redirect("/register")
    }
})

// Routes
app.get('/', checkAuthenticated, async(req, res) => {
  try {
    const shortUrls = await ShortUrl.find();
    res.render('index', { shortUrls: shortUrls });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render("login.ejs")
})

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render("register.ejs")
})
// End Routes

// app.delete('/logout', (req, res) => {
//     req.logOut()
//     res.redirect('/login')
//   })


app.delete("/logout", (req, res) => {
  req.logout(req.user, err => {
    if (err) return next(err)
    res.redirect("/")
  })
})

function checkAuthenticated(req, res, next){
  if(req.isAuthenticated()){
      return next()
  }
  res.redirect("/login")
}

function checkNotAuthenticated(req, res, next){
  if(req.isAuthenticated()){
      return res.redirect("/")
  }
  next()
}


  app.post('/shortUrls', async (req, res) => {
    try {
      await ShortUrl.create({ full: req.body.fullUrl });
      res.redirect('/');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  app.get('/:shortUrl', async (req, res) => {
    try {
      const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
      if (shortUrl == null) return res.sendStatus(404);
  
      shortUrl.clicks++;
      shortUrl.save();
  
      res.redirect(shortUrl.full);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  

app.listen(process.env.PORT || 5000);
