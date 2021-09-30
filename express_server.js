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

//DATABASE
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//HELPER FUNCTIONS
function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

// TINY APP ROUTES
app.get('/', (req, res) => {
  res.redirect('/urls')
});

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

app.get('/urls', (req, res) => { // My URLs route
  const templateVars = { 
    username: req.cookies['username'],
    urls: urlDatabase 
  }
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => { // Create New URL page route
  const templateVars = { username: req.cookies['username'] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => { // Create New URL form submit route
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`)
});

app.get('/urls/:shortURL', (req, res) => { // Show individual URL summary page route
  const templateVars = { 
    username: req.cookies['username'],
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
  res.redirect('/urls')
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});