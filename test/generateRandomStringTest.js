const { assert } = require('chai');

const { generateRandomString } = require('../helpers/userHelpers');

describe('generateRandomString', function() {
  it('should return a non-empty string', function() {
    const value = generateRandomString();
    assert.exists(value);
    assert.isNotEmpty(generateRandomString());
  });
});