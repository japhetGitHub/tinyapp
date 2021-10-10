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
  if (!validateUser(req.session['userID'], req.app.locals.users)) { // when 1. userID cookie doesn't exist 2. or userID cookie is invalid (i.e. using an old/modified userID) redirect all requests
    return res.redirect('/login');
  }
  return next();
};