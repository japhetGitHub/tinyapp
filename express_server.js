const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

// MIDDLEWARE
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//TEMPLATE ENGINE
app.set('view engine', 'ejs');

//DATA STORE
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//HELPER FUNCTIONS
const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};
const checkEmailRegistered = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};
const getURLsByID = function(id) {
  let userURLs = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};

// TINY APP ROUTES
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

app.get('/urls', (req, res) => { // My URLs route
  const templateVars = {
    user: users[req.cookies['user_id']],
    urls: getURLsByID(req.cookies['user_id'])
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => { // Create New URL page route
  if (!req.cookies['user_id']) {
    res.redirect(403, '/login');
  } else {
    const templateVars = { user: users[req.cookies['user_id']] };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => { // Create New URL form submit route
  if (!req.cookies['user_id']) {
    res.redirect(403, '/login');
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies['user_id'] 
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get('/urls/:shortURL', (req, res) => { // Show individual short URL info page route
  if (!req.cookies['user_id']) { //if not logged in user can't get shortURL info
    res.redirect(403, '/login');
  } else if (Object.prototype.hasOwnProperty.call(getURLsByID(req.cookies['user_id']), req.params.shortURL)) { //checks if requested shortURL was made by this user
    const templateVars = {
      user: users[req.cookies['user_id']],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render('urls_show', templateVars);
  } else { //redirects to url list if user tried to access a short URL info page that didn't exist or they didn't have access to
    res.redirect('/urls');
  }
});

app.post('/urls/:shortURL', (req, res) => { // Update/Edit URL
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => { // Delete URL
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => { // URL redirect
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  if (req.cookies['user_id']) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: undefined //undefined when no user_id cookie exists and login form is requested
    };
    res.render('login', templateVars);
  }
});

app.post('/login', (req, res) => { //receives login form input
  const userCheck = checkEmailRegistered(req.body.email); //returns user object or false
  if (!userCheck) { //user not found
    // console.log('user not found.');
    res.redirect(403, '/login');
  } else if (userCheck.password !== req.body.password) { //incorrect password
    // console.log('incorrect password.');
    res.redirect(403, '/login');
  } else { //successful login
    // console.log('login successful. user:', userCheck);
    res.cookie('user_id', userCheck.id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.cookies['user_id']) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: undefined //undefined when no user_id cookie exists and registration form is requested
    };
    res.render('registration', templateVars);
  }
});

app.post('/register', (req, res) => { //receives registration form input
  if (req.body.email === '' || req.body.password === '') {
    console.log('Empty fields.');
    res.redirect(400, '/register');
  } else if (checkEmailRegistered(req.body.email)) {
    console.log('Email Exists.');
    res.redirect(400, '/register');
  } else {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: req.body.email,
      password: req.body.password
    };
    // console.log('User created.');
    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});

//LISTEN FOR REQUESTS
app.listen(PORT, () => {
  console.log(`TinyURL app listening on port ${PORT}!`);
});