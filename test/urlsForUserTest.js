const { assert } = require('chai');

const { urlsForUser } = require('../views/helpers/userHelpers');

const testURL = {
  shortURL1: {
    longURL: "https://www.tsn.ca",
    UID: "user1RandomID",
    created: "Thur Sep 30 2021 - 12:14:38 PM",
    visits: 0
  },
  shortURL2: {
    longURL: "https://www.google.ca",
    UID: "user1RandomID",
    created: "Wed Sep 29 2021 - 5:08:27 PM",
    visits: 7
  },
  shortURL3: {
    longURL: "https://www.reddit.com",
    UID: "user2RandomID",
    created: "Mon Sep 27 2021 - 9:53:11 AM",
    visits: 2
  }
};

describe('urlsForUser', function() {
  it('should return all URLs with matching UID', function() {
    const urls = urlsForUser("user1RandomID", testURL);
    const expectedOutput = {
      shortURL1: {
        longURL: "https://www.tsn.ca",
        UID: "user1RandomID",
        created: "Thur Sep 30 2021 - 12:14:38 PM",
        visits: 0
      },
      shortURL2: {
        longURL: "https://www.google.ca",
        UID: "user1RandomID",
        created: "Wed Sep 29 2021 - 5:08:27 PM",
        visits: 7
      }
    };
    assert.deepEqual(urls, expectedOutput);
  });

  it('should return empty object for UID with no matching URLs', function() {
    const urls = urlsForUser("user3RandomID", testURL);
    assert.isEmpty(urls);
  });
  
  it('should return empty object given undefined UID', function() {
    const urls = urlsForUser(undefined, testURL);
    assert.isEmpty(urls);
  });
  
  it('should return empty object given empty URL list', function() {
    const urls = urlsForUser("userRandomID", {});
    assert.isEmpty(urls);
  });
});