//HELPER FUNCTIONS
const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

const checkEmailRegistered = function(email, users) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return undefined;
};

const urlsForUser = function(id, urlDatabase) {
  let userURLs = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};

const getTemplateVars = function(code, user, ...options) {
  let message;
  if (code === 200) {
    message = 'OK';
  } else if(code === 403) {
    message = 'Forbidden';
  } else if (code === 400) {
    message = 'Bad Request';
  } 

  return { 
    user: user,
    code: code,
    statusMessage: message,
    error_options: options
  };
};

const validateUser = function(userID, users) { // needed as a security check incase user has old userid cookie but is no longer registered
  if(userID) { //short-circuit for undefined case to improve performance
    for(const user in users) {
      if (users[user].id === userID) { 
        return true;
      }
    }
  }
  return false;
};

module.exports = { generateRandomString, checkEmailRegistered, urlsForUser, getTemplateVars, validateUser };