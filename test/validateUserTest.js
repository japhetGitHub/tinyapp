const { assert } = require('chai');

const { validateUser } = require('../views/helpers/userHelpers');

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

describe('validateUser', function() {
  it('should return true given the userID is valid', function() {
    assert.isTrue(validateUser("user2RandomID", testUsers));
  });

  it('should return false given the userID is invalid', function() {
    assert.isFalse(validateUser("1userRandomID", testUsers));
  });

  it('should return false given the userID is undefined', function() {
    assert.isFalse(validateUser(undefined, testUsers));
  });

  it('should return false given the user list is empty', function() {
    assert.isFalse(validateUser("userRandomID", {}));
  });
});