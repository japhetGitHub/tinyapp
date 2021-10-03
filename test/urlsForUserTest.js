const { assert } = require('chai');

const { urlsForUser } = require('../views/helpers/userHelpers');

const testURL = {
  shortURL1: {
      longURL: "https://www.tsn.ca",
      userID: "user1RandomID"
  },
  shortURL2: {
      longURL: "https://www.google.ca",
      userID: "user1RandomID"
  },
  shortURL3: {
    longURL: "https://www.reddit.com",
    userID: "user2RandomID"
  }
};

describe('urlsForUser', function() {
  it('should return all URLs with matching userID', function() {
    const urls = urlsForUser("user1RandomID", testURL)
    const expectedOutput = {
      shortURL1: {
        longURL: "https://www.tsn.ca",
        userID: "user1RandomID"
      },
      shortURL2: {
          longURL: "https://www.google.ca",
          userID: "user1RandomID"
      }
    };
    assert.deepEqual(urls, expectedOutput);
  });

  it('should return empty object for userID with no matching URLs', function() {
    const urls = urlsForUser("user3RandomID", testURL)
    assert.isEmpty(urls);
  });
  
  it('should return empty object given undefined userID', function() {
    const urls = urlsForUser(undefined, testURL)
    assert.isEmpty(urls);
  });
  
  it('should return empty object given empty URL list', function() {
    const urls = urlsForUser("userRandomID", {})
    assert.isEmpty(urls);
  });
});