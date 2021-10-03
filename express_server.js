const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
// const url = require('url');
const { generateRandomString, checkEmailRegistered, urlsForUser, getTemplateVars } = require('./views/helpers/userHelpers');
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
  /**
   * URL data of the form:
      shortURL: {
        longURL: "https://www.tsn.ca",
        UID: "user1RandomID",
        created: "Wed Sep 29 2021 - 5:08:27 PM",
        visits: 0
      }
  */
};

app.locals.users = {
  /**
   * User data of the form:
      "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "foo-bar-baz"
      }
  */
};

// TINY APP ROUTES
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/urls', (req, res) => { // My URLs route
  const templateVars = getTemplateVars(200, req.app.locals.users[req.session['userID']]);
  templateVars.urls = urlsForUser(req.session['userID'], req.app.locals.urlDatabase); // required for urls_index template
  
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => { // 'Create New URL' form submit route
  const longURL = req.body.longURL;

  if (req.headers.referer) { // prevents a cURL with -L flag from redirecting this POST route repeatedly
    if (longURL === "") { // can be built out more for other invalid url cases (better to handle it in frontend for future)
      const templateVars = getTemplateVars(400, req.app.locals.users[req.session['userID']], 'Invalid URL');
      return res.render('urls_new', templateVars);
    }
    const shortURL = generateRandomString();
    const date = new Date();
    req.app.locals.urlDatabase[shortURL] = {
      longURL: /^http:\/\//.test(longURL) ? longURL : `http://${longURL}`, //uses regex to add http:// to the link
      UID: req.session['userID'],
      created: `${date.toDateString()} - ${date.toLocaleTimeString()}`,
      visits: 0
    };
    return res.redirect(`/urls/${shortURL}`);
  }
  return res.redirect(400, '/urls');
});

app.get("/urls/new", (req, res) => { // Create New URL page route
  const templateVars = getTemplateVars(200, req.app.locals.users[req.session['userID']]);

  res.render("urls_new", templateVars);
});


app.get('/urls/:shortURL', (req, res) => { // Show individual short URL info page route
  if (Object.keys(urlsForUser(req.session['userID'], req.app.locals.urlDatabase)).includes(req.params.shortURL)) { //checks if requested shortURL was made by this user
    const templateVars = {
      user: req.app.locals.users[req.session['userID']],
      shortURL: req.params.shortURL,
      urlData: req.app.locals.urlDatabase[req.params.shortURL],
      code: 200
    };
    res.render('urls_show', templateVars);
  } else { //if user tried to access a short URL info page that didn't exist or they didn't have access to
    const templateVars = getTemplateVars(403, req.app.locals.users[req.session['userID']], 'Not One of Your URLs');
    templateVars.urls = urlsForUser(req.session['userID'], req.app.locals.urlDatabase); // required for urls_index template

    res.render('urls_index', templateVars); //better UX than explicit 403 redirect call
  }
});

app.post('/urls/:shortURL', (req, res) => { // Update/Edit URL
  const urlData = req.app.locals.urlDatabase[req.params.shortURL];
  
  if (urlData) {
    if (req.session['userID'] === urlData.UID) { // gatekeeps editing privilege
      urlData.longURL = /^http:\/\//.test(req.body.longURL) ? req.body.longURL : `http://${req.body.longURL}`; //uses regex to add http:// to the edited link;
      const date = new Date();
      urlData.created = `${date.toDateString()} - ${date.toLocaleTimeString()}`; //updates time b/c URL modified
      urlData.visits = 0;
      return res.redirect('/urls');
    } else {
      // handles when (valid) user submits the edit form on another user's url page (i.e. by maliciously swapping session and session.sig)
      return res.redirect('/urls');
    }
  } else { //false - shortURL isn't in Database
    // handle when (valid) user tries to edit invalid/nonexistent url
    return res.redirect('/urls');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => { // Delete URL
  const urlData = req.app.locals.urlDatabase[req.params.shortURL];

  if (urlData && req.session['userID'] === urlData.UID) { // gatekeeps delete privilege
    delete req.app.locals.urlDatabase[req.params.shortURL];
    return res.redirect('/urls');
  }
  return res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => { // URL redirect
  if (Object.keys(req.app.locals.urlDatabase).includes(req.params.shortURL)) {
    const longURL = req.app.locals.urlDatabase[req.params.shortURL].longURL;
    if (longURL) { // ensures user can't crash the system by inputting an undefined longURL
      req.app.locals.urlDatabase[req.params.shortURL].visits += 1;
      res.redirect(longURL);
    } else {
      res.redirect('/urls');
    }
  } else {
    const templateVars = getTemplateVars(400, undefined, "Invalid URL Requested");

    if (req.app.locals.users[req.session['userID']]) {
      templateVars.user = req.app.locals.users[req.session['userID']]; //ensure _header partial shows proper logged in/out status when rendering below
    }
    res.render('url_dead', templateVars); //better UX than explicit 403 redirect call
  }
});

app.get('/login', (req, res) => {
  ///login/:type(/vars/)
  // if (!req.locals.code) {
  //   console.log('here');
  //   res.render('login', templateVars);
  // }
  // console.log("params:", req.params);
  // console.log("query:", req.query);
  // console.log("converted:", Buffer.from(req.query, 'base64').toString('ascii'));
  console.log('In plain login.');
  console.log(req.query);
  console.log("STRINGIFIED:" + JSON.stringify(req.query));
  console.log('str:', req.query.str);
  console.log('debuffed:', Buffer.from(req.query.str ? req.query.str : "", 'base64').toString('ascii'));

  // var search = Buffer.from(req.query.str ? req.query.str : "", 'base64').toString('ascii');
  
  // // from https://stackoverflow.com/questions/8648892/how-to-convert-url-parameters-to-a-javascript-object
  // var result = !search ? "try again" : JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
  // console.log(result);
  
  const templateVars = getTemplateVars(200, undefined); // default case

  let unbase64d = Buffer.from(req.query.str ? req.query.str : "", 'base64').toString('ascii'); //reverse the base64 encoding
  if(unbase64d) {
    const shapedText = unbase64d.replace(/&/g, '","').replace(/=/g, '":"'); //regex replace all (global) & with , and = with :
    const reviver = (key, value) => {
      if(key === "") { 
        return value;
      } else {
        return decodeURIComponent(value); // for all 'values' except when value = the whole object (i.e. when key = "") transform the values by unencoding them (i.e. replacing %20 with space, etc.)
      }
    }
    console.log("shapedText:",shapedText);
    const queryParams = JSON.parse(`"{"${shapedText}"}"`, reviver);
    templateVars.code = queryParams.code;
    templateVars.statusMessage = queryParams.msg;
    templateVars.user = queryParams.user;
  }

  // JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
  // console.log('decoubuffed:', decodeURIComponent(Buffer.from(req.query.str ? req.query.str : "", 'base64').toString('ascii')));
  // console.log('trythis:', JSONdecodeURIComponent(Buffer.from(req.query.str ? req.query.str : "", 'base64').toString('ascii')).msg);
  // console.log(Buffer.from(req.query.str ? req.query.str : "", 'base64').toString('ascii'));

  res.render('login', templateVars);
});

// app.get('/login/:vars', (req, res) => {

//   console.log("params:", req.params);
//   console.log("query:", req.query);
//   console.log("vars:", req.params.vars);
//   res.redirect('/login');
// });

app.post('/login', (req, res) => { //receives login form input
  console.log(req.headers);
  const registeredUser = checkEmailRegistered(req.body.email, req.app.locals.users); //returns user object if email exists or false if not
  if (!registeredUser) { //user not found
    const templateVars = getTemplateVars(403, undefined, 'User Not Found');
    res.render('login', templateVars); //better UX than explicit 403 redirect call
  } else if (!bcrypt.compareSync(req.body.password, registeredUser.password)) { //check incorrect password with bcryptjs
    const templateVars = getTemplateVars(403, undefined, 'Incorrect Password');
    res.render('login', templateVars); //better UX than explicit 403 redirect call
  } else { //successful login
    req.session.userID = registeredUser.id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null; //destroys the session
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
    req.session.userID = id;
    res.redirect('/urls');
  }
});

//LISTEN FOR REQUESTS
app.listen(PORT, () => {
  console.log(`TinyURL app listening on port ${PORT}!`);
});