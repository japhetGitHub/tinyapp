const { validateUser, getTemplateVars } = require('./userHelpers');
const url = require('url');

module.exports = function() {
  return (req, res, next) => {
    const whiteListRoutes = ['/', '/login', '/register'];
    const path = req.path;
    console.log(path);
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
      // res.locals = {...res.locals, ...getTemplateVars(400, undefined, 'Login First')};
      // return res.render('login');
      // req.path = '/login';
      // return next();
      // if(/^\/login\//.test(path)) {
      //   console.log(path);
      // }
      // let qrys = encodeURIComponent(btoa(url.format({query: {
      //   code: 400,
      //   user: undefined,
      //   msg: 'Login First Please'
      //   }})));
      // return res.redirect('/login/vars' + Buffer.from(url.format({query: {
      //   code: 400,
      //   user: undefined,
      //   msg: 'Login First Please'
      //   }})).toString('base64'));
      console.log('HERE1');
      // return res.redirect('/login/vars=' + Buffer.from(url.format('code=400&user=&msg=Loginng')).toString('base64'));
      return res.redirect(url.format({
        pathname: '/login',
        query: {
          str: Buffer.from(url.format('code=400&user=&msg=Login First Please')).toString('base64')/*
          code: 400,
          user: undefined,
          msg: 'Login First Please'*/
        }
      }));
      // return res.redirect('/login?testpar=seyo');
    }
    return next();
  };
};