const { assert } = require('chai');

const { getTemplateVars } = require('../views/helpers/userHelpers');

const testUsers = {
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

describe('getTemplateVars', function() {
  it('should return object with passed in code, user, message, and options', function() {
    const templateVars = getTemplateVars(200, testUsers['userRandomID'], 'some options', 'at the end');
    const expectedOutput = {
      user: {
        id: "userRandomID", 
        email: "user@example.com", 
        password: "purple-monkey-dinosaur"
      },
      code: 200,
      statusMessage: "OK",
      error_options: ['some options', 'at the end']
    };
    assert.deepEqual(templateVars, expectedOutput);
  });

  it('should return object with passed in 4xx client erro code, user, error message, and options', function() {
    const templateVars = getTemplateVars(400, testUsers['userRandomID'], 'an option');
    const expectedOutput = {
      user: {
        id: "userRandomID", 
        email: "user@example.com", 
        password: "purple-monkey-dinosaur"
      },
      code: 400,
      statusMessage: "Bad Request",
      error_options: ['an option']
    };
    assert.deepEqual(templateVars, expectedOutput);
  });

  it('should return object that includes user as undefined given undefined user was specified', function() {
    const templateVars = getTemplateVars(403, undefined, 'an option');
    const expectedOutput = {
      user: undefined,
      code: 403,
      statusMessage: "Forbidden",
      error_options: ['an option']
    };
    assert.deepEqual(templateVars, expectedOutput);
  });

  it('should return empty error_options array given no options were specified', function() {
    const templateVars = getTemplateVars(403, testUsers['userRandomID']);
    const expectedOutput = {
      user: {
        id: "userRandomID", 
        email: "user@example.com", 
        password: "purple-monkey-dinosaur"
      },
      code: 403,
      statusMessage: "Forbidden",
      error_options: []
    };
    assert.deepEqual(templateVars, expectedOutput);
  });

});