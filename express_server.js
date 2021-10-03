const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
var cookieSession = require('cookie-session')
const { generateRandomString, checkEmailRegistered, urlsForUser, getTemplateVars, validateUser } = require('./views/helpers/userHelpers');
const protectRoutes = require('./views/helpers/authHelpers');

// MIDDLEWARE
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['some secret key to encrypt the session value', 'another one to allow for key rotation'],
}));
app.use(protectRoutes());

//TEMPLATE ENGINE
app.set('view engine', 'ejs');

//DATA STORE
app.locals.urlDatabase = {

};

app.locals.users = { 

};

// TINY APP ROUTES
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/urls', (req, res) => { // My URLs route
  const templateVars = getTemplateVars(200, req.app.locals.users[req.session['user_id']]);
  templateVars.urls = urlsForUser(req.session['user_id'], req.app.locals.urlDatabase); // required for urls_index template 
  
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => { // Create New URL page route
  const templateVars = getTemplateVars(200, req.app.locals.users[req.session['user_id']]);

  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => { // Create New URL form submit route
  const longURL = req.body.longURL;

  if (req.headers.referer) { // prevents a cURL with -L flag from redirecting this POST route repeatedly
    if (longURL === "") { // can be built out more for other invalid url cases (better to handle it in frontend for future)
      const templateVars = getTemplateVars(400, req.app.locals.users[req.session['user_id']], 'Invalid URL');
      return res.render('urls_new', templateVars);
    }
    const shortURL = generateRandomString();
    req.app.locals.urlDatabase[shortURL] = {
      longURL: /^http:\/\//.test(longURL) ? longURL : `http://${longURL}`, //uses regex to add http:// to the link
      userID: req.session['user_id'] 
    };
    return res.redirect(`/urls/${shortURL}`);
  }
  return res.redirect(409, '/urls')
});

app.get('/urls/:shortURL', (req, res) => { // Show individual short URL info page route
  if (Object.keys(urlsForUser(req.session['user_id'], req.app.locals.urlDatabase)).includes(req.params.shortURL)) { //checks if requested shortURL was made by this user
    const templateVars = {
      user: req.app.locals.users[req.session['user_id']],
      shortURL: req.params.shortURL,
      longURL: req.app.locals.urlDatabase[req.params.shortURL].longURL,
      code: 200
    };
    res.render('urls_show', templateVars);
  } else { //if user tried to access a short URL info page that didn't exist or they didn't have access to
    const templateVars = getTemplateVars(403, req.app.locals.users[req.session['user_id']], 'Not One of Your URLs');
    templateVars.urls = urlsForUser(req.session['user_id'], req.app.locals.urlDatabase); // required for urls_index template 

    res.render('urls_index', templateVars); //better UX than explicit 403 redirect call
  }
});

app.post('/urls/:shortURL', (req, res) => { // Update/Edit URL
  const urlData = req.app.locals.urlDatabase[req.params.shortURL];
  
  if (urlData) {
    if (req.session['user_id'] === urlData.userID) { // gatekeeps editing privilege
      urlData.longURL = /^http:\/\//.test(req.body.longURL) ? req.body.longURL : `http://${req.body.longURL}`; //uses regex to add http:// to the edited link;
      return res.redirect('/urls');
    } else {// handles when (valid) user submits the edit form on another user's url page (i.e. by maliciously swapping user_id cookies) ** consider refactoring - may not be needed b/c sessions.
      return res.redirect('/urls');
    }
  } else { //false - shortURL isn't in Database
    // handle when (valid) user tries to edit invalid/nonexistent url
    return res.redirect('/urls');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => { // Delete URL
  //SEE SECURITY CONCERNS FROM - POST /urls/:shortURL
  const urlData = req.app.locals.urlDatabase[req.params.shortURL];

  if (urlData) {
    if (req.session['user_id'] === urlData.userID) { // gatekeeps delete privilege
      delete req.app.locals.urlDatabase[req.params.shortURL];
      return res.redirect('/urls');
    } else {
      return res.redirect('/urls');
    }
  } else {
    return res.redirect('/urls');
  }
});

app.get("/u/:shortURL", (req, res) => { // URL redirect
  if (Object.keys(req.app.locals.urlDatabase).includes(req.params.shortURL)) {
    const longURL = req.app.locals.urlDatabase[req.params.shortURL].longURL;
    if (longURL) { // ensures user can't crash the system by inputting an undefined longURL
      res.redirect(longURL);
    } else {
      res.redirect('/urls');
    }
  } else {
    const templateVars = getTemplateVars(400, undefined, "Invalid URL Requested");
    if (req.app.locals.users[req.session['user_id']]) {
      templateVars.user = req.app.locals.users[req.session['user_id']];
    }

    res.render('url_dead', templateVars); //better UX than explicit 403 redirect call
  }
});

app.get('/login', (req, res) => {
  const templateVars = getTemplateVars(200, undefined);
  
  res.render('login', templateVars);
});

app.post('/login', (req, res) => { //receives login form input
  const registeredUser = checkEmailRegistered(req.body.email, req.app.locals.users); //returns user object if email exists or false if not
  if (!registeredUser) { //user not found
    const templateVars = getTemplateVars(403, undefined, 'User Not Found');
    res.render('login', templateVars); //better UX than explicit 403 redirect call
  } else if (!bcrypt.compareSync(req.body.password, registeredUser.password)) { //check incorrect password with bcryptjs
    const templateVars = getTemplateVars(403, undefined, 'Incorrect Password');
    res.render('login', templateVars); //better UX than explicit 403 redirect call
  } else { //successful login
    req.session.user_id = registeredUser.id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get('/register', (req, res) => {
  const templateVars = getTemplateVars(200, undefined);

  res.render('registration', templateVars);
});

app.post('/register', (req, res) => { //receives registration form input
  if (req.body.email === '' || req.body.password === '') {
    const templateVars = getTemplateVars(400, undefined, 'Empty Fields');
    res.render('registration', templateVars); //better UX than explicit 403 redirect call
  } else if (checkEmailRegistered(req.body.email, req.app.locals.users)) {
    const templateVars = getTemplateVars(400, undefined, 'Email Already Registered');
    res.render('registration', templateVars); //better UX than explicit 403 redirect call
  } else {
    const id = generateRandomString();

    req.app.locals.users[id] = {
      id: id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) // hasing password with bcryptjs
    };
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

//LISTEN FOR REQUESTS
app.listen(PORT, () => {
  console.log(`TinyURL app listening on port ${PORT}!`);
});