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
const urlsForUser = function(id) {
  let userURLs = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};
const getErrorVars = function(code, ...options) {
  let message = '';
  if(code === 403) {
    message = 'Forbidden';
  } else if (code === 400) {
    message = 'Bad Request';
  } else {
    message = 'Not Found';
  }
  return { 
    user: undefined,
    code: code,
    error_message: message,
    error_options: options
  };
};
const validateUser = function(userID) { // needed as a security check incase user has old userid cookie but is no longer registered
  if(userID) { //short-circuit for undefined case to improve performance
    for(const user in users) {
      if (users[user].id === userID) { 
        return true;
      }
    }
  }
  return false;
};

app.use((req, res, next) => {
  const whiteListRoutes = ['/', '/login', '/register'];
  const path = req.path;
  const method = req.method;

  if (whiteListRoutes.includes(path)) {
    if(validateUser(req.cookies['user_id'])) { // if valid logged in user tries to request login/request/'root' page redirect to /urls page
      return res.redirect('/urls');
    }
    res.clearCookie('user_id'); // clears old/invalid cookie
    return next(); // else show login page
  }
  if (!validateUser(req.cookies['user_id'])) { // when 1. user_id cookie doesn't exist 2. or user_id cookie is invalid (i.e. using an old/modified user_id) redirect all requests
    res.clearCookie('user_id'); // clears old/invalid cookie
    return res.redirect('/login');
  }
  return next();
});

// TINY APP ROUTES
app.get('/', (req, res) => {

  res.redirect('/login');

  // if (req.cookies['user_id']) {
  //   res.redirect('/login');
  // } else {
  //   res.redirect('/urls');
  // }
});

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

app.get('/urls', (req, res) => { // My URLs route
  if (validateUser(req.cookies['user_id']) === false) {
    const templateVars = getErrorVars(403, 'Login', 'Register');
    res.render('urls_index', templateVars);
  } else {
    const templateVars = {
      user: users[req.cookies['user_id']],
      urls: urlsForUser(req.cookies['user_id']),
      code: 200
    };
    res.render('urls_index', templateVars);
  }
});

app.get("/urls/new", (req, res) => { // Create New URL page route
  if (validateUser(req.cookies['user_id']) === false) {
    const templateVars = getErrorVars(403, 'Login');
    res.render('urls_new', templateVars);
  } else {
    const templateVars = { 
      user: users[req.cookies['user_id']],
      code: 200
    };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => { // Create New URL form submit route
  if (validateUser(req.cookies['user_id']) === false) {
    const templateVars = getErrorVars(403, 'Login');
    res.render('urls_new', templateVars);
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
  if (validateUser(req.cookies['user_id']) === false) { //if user is not logged in they can't edit urls
    const templateVars = getErrorVars(403, 'Login', 'Register');
    res.render('urls_show', templateVars); //better UX than explicit 403 redirect call
    // res.redirect(403, '/login');
  } else if (Object.keys(urlsForUser(req.cookies['user_id'])).includes(req.params.shortURL)) { //checks if requested shortURL was made by this user
    const templateVars = {
      user: users[req.cookies['user_id']],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      code: 200
    };
    res.render('urls_show', templateVars);
  } else { //if user tried to access a short URL info page that didn't exist or they didn't have access to
    const templateVars = getErrorVars(403, 'Not One of Your URLs', "URLs");
    templateVars.user = users[req.cookies['user_id']]; // user is technically logged in but just forbidden access 
    res.render('urls_show', templateVars); //better UX than explicit 403 redirect call
    // res.redirect('/urls');
  }
});

app.post('/urls/:shortURL', (req, res) => { // Update/Edit URL
  if (validateUser(req.cookies['user_id']) && urlDatabase[req.params.shortURL] && req.cookies['user_id'] === urlDatabase[req.params.shortURL].userID) { // checks that both exist (incase logged out user tries to delete a nonexistent shortURL)
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    if(validateUser(req.cookies['user_id'])) {
      const templateVars = getErrorVars(403, 'Cannot Edit URL', "URLs");
      templateVars.user = users[req.cookies['user_id']];

    } else {
      const templateVars = getErrorVars(403, "Login", "Register");
    }
    res.render('urls_index', templateVars); //better UX than explicit 403 redirect call
    // res.redirect(403, '/urls');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => { // Delete URL
  if (validateUser(req.cookies['user_id']) && urlDatabase[req.params.shortURL] && req.cookies['user_id'] === urlDatabase[req.params.shortURL].userID) { // checks that both exist incase logged out user tries to delete a nonexistent shortURL
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    if(validateUser(req.cookies['user_id'])) {
      const templateVars = getErrorVars(403, 'Cannot Delete URL', "URLs");
      templateVars.user = users[req.cookies['user_id']];

    } else {
      const templateVars = getErrorVars(403, "Login", "Register");
    }
    res.render('urls_index', templateVars); //better UX than explicit 403 redirect call
    // res.redirect(403, '/urls');
  }
});

app.get("/u/:shortURL", (req, res) => { // URL redirect
  if (Object.keys(urlDatabase).includes(req.params.shortURL)) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    if (longURL) { // ensures user can't crash the system by inputting an undefined longURL
      res.redirect(longURL);
    } else {
      res.redirect('/urls');
    }
  } else {
    const templateVars = getErrorVars(400, "URL doesn't exist");
    res.render('urls_index', templateVars); //better UX than explicit 403 redirect call
  }
});

app.get('/login', (req, res) => {
  if (validateUser(req.cookies['user_id'])) { //checks that user is already logged in
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: undefined, //undefined when no user_id cookie exists and login form is requested
      code: 200
    };
    res.render('login', templateVars);
  }
});

app.post('/login', (req, res) => { //receives login form input
  const registeredUser = checkEmailRegistered(req.body.email); //returns user object if email exists or false if not
  if (!registeredUser) { //user not found
    const templateVars = getErrorVars(403, 'User Not Found', 'Login', "Register");
    res.render('login', templateVars); //better UX than explicit 403 redirect call
    // res.redirect(403, '/login');
  } else if (registeredUser.password !== req.body.password) { //incorrect password
    const templateVars = getErrorVars(403, 'Incorrect Password', 'Login');
    res.render('login', templateVars); //better UX than explicit 403 redirect call
    // res.redirect(403, '/login');
  } else { //successful login
    res.cookie('user_id', registeredUser.id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/');
});

app.get('/register', (req, res) => {
  if (validateUser(req.cookies['user_id'])) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: undefined, //undefined when no user_id cookie exists and registration form is requested
      code: 200
    };
    res.render('registration', templateVars);
  }
});

app.post('/register', (req, res) => { //receives registration form input
  if (req.body.email === '' || req.body.password === '') {
    // console.log('Empty fields.');
    const templateVars = getErrorVars(400, 'Empty Fields', 'Register');
    res.render('registration', templateVars); //better UX than explicit 403 redirect call
    // res.redirect(400, '/register');
  } else if (checkEmailRegistered(req.body.email)) {
    // console.log('Email Exists.');
    const templateVars = getErrorVars(400, 'Email Already Registered', 'Login');
    res.render('registration', templateVars); //better UX than explicit 403 redirect call
    // res.redirect(400, '/register');
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