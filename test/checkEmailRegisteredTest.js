const { assert } = require('chai');

const { checkEmailRegistered } = require('../helpers/userHelpers');

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

describe('checkEmailRegistered', function() {
  it('should return a user with valid email', function() {
    const user = checkEmailRegistered("user@example.com", testUsers);
    const expectedOutput = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(user, expectedOutput);
  });

  it('should return undefined with an invalid email', function() {
    const user = checkEmailRegistered("invalid@example.com", testUsers);
    assert.isUndefined(user);
  });
});