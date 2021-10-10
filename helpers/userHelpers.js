//HELPER FUNCTIONS
const generateRandomString = () => Math.random().toString(36).substring(2, 8);

const checkEmailRegistered = (email, users) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return undefined;
};

const urlsForUser = (id, urlDatabase) => {
  let userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].UID === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};

const getTemplateVars = (code, user, ...options) => {
  let message;
  if (code === 200) {
    message = 'OK';
  } else if (code === 403) {
    message = 'Forbidden';
  } else if (code === 400) {
    message = 'Bad Request';
  }

  return {
    user: user,
    code: code,
    statusMessage: message,
    errorOptions: options
  };
};

const validateUser = (UID, users) => {
  if (UID) { //short-circuit for undefined case to improve performance
    for (const user in users) {
      if (users[user].id === UID) {
        return true;
      }
    }
  }
  return false;
};

module.exports = { generateRandomString, checkEmailRegistered, urlsForUser, getTemplateVars, validateUser };