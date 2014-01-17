var assert = require('assert');

// Built off of example at
// https://github.com/arunoda/meteor-user-authorization-test-with-laika/blob/master/tests/posts.js

suite('User Privileges', function() {
  test('can add well-formed event when logged-in', function(done, server, client) {
    server.eval(function() {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function() {
      server.eval(observeCollection);
    });

    // User account has been created
    function observeCollection() {
      Events.find().observe({
        added: function(doc) {
          emit('added', doc);
        }
      });
    }

    // An event has been added -- should be the Event we added
    server.once('added', function(doc) {
      assert.equal(doc.title, 'hello');
      done();
    });

    client.eval(function() {
      Meteor.loginWithPassword('a@a.com', '123456', function() {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
      });
    });
  });

  test('non-logged-in users cannot create events', function(done, server, client) {
    client.eval(function() {
      Events.find().observe({
        removed: function(doc) {
          emit('remove', doc);
        }
      });

      // Try to insert a (well-formed) document without being logged in.
      // Should be removed.
      Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
    });

    client.once('remove', function(doc) {
      assert.equal(doc.title, 'hello');
      done();
    });
  });
});
