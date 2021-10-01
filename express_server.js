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
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => { // Create New URL page route
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => { // Create New URL form submit route
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/:shortURL', (req, res) => { // Show individual URL summary page route
  const templateVars = {
    user: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => { // Update/Edit URL
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => { // Delete URL
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => { // URL redirect
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = {
    user: undefined //undefined because user is not logged in if at registration form (also so that header partial will still work)
  };
  res.render('registration', templateVars);
});

app.post('/register', (req, res) => {
  const id = generateRandomString();
  users[id] = {
    id: id,
    email: req.body.email,
    password: req.body.password
  };
  console.log(users[id]);
  res.cookie('user_id', id);
  res.redirect('/urls');
});

//LISTEN FOR REQUESTS
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});