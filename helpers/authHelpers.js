const { urlencoded } = require('body-parser');
const { validateUser } = require('./userHelpers');

module.exports = () => (req, res, next) => {
  const whiteListRoutes = ['/', '/login', '/register'];
  const path = req.path;
  
  if (whiteListRoutes.includes(path)) {
    if (validateUser(req.session['userID'], req.app.locals.users)) { // if valid logged in user tries to request login/request/'root' page redirect to /urls page
      return res.redirect('/urls');
    }
    return next(); // else show login page
  }
  if (/^\/u\//.test(path)) { //a regex to check if req.path starts with /u/ (i.e. is a shortURL)
    return next();
  }
  if (/\/urls/.test(path)) {
    if (validateUser(req.session['userID'], req.app.locals.users)) { // if valid logged in user tries to request /urls page let them through
      return next();
    } else { // when user tries to access /urls(/:id) without logging in redirect with query string which is handled in next if-statment
      return res.redirect('/login/?code=401');
    }
  }
  if (/\/login\/\?code/.test(req.originalUrl)) { // for login paths with query string
    if (!validateUser(req.session['userID'], req.app.locals.users)) {
      // adds error information to req.body to be displayed below login form
      req.originalUrl = '/login'; //clear query string
      req.body.code = 401;
      req.body.msg = 'Login to gain access';
      return next();
    } else {
      return res.redirect('/urls');
    }
  }
  if (!validateUser(req.session['userID'], req.app.locals.users)) { // when 1. userID cookie doesn't exist 2. or userID cookie is invalid (i.e. using an old/modified userID) redirect all requests
    return res.redirect(`/login`);
  }
  return next();
};