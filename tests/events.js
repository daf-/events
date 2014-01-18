var assert = require('assert');

// Built off of example at
// https://github.com/arunoda/meteor-user-authorization-test-with-laika/blob/master/tests/posts.js

suite('Permissions', function() {
  /*
   * Logged-in.
   */
  test('logged-in users can add well-formed event', function(done, server, client) {
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

  test('logged-in users can not add ill-formed event', function(done, server, client) {
    server.eval(function() {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function() {
      client.eval(observeCollection);
    });

    function observeCollection() {
      Events.find().observe({
        removed: function(doc) {
          emit('removed', doc);
        }
      });
    }

    client.once('removed', function(doc) {
      assert.equal(doc.title, 'hello');
      done();
    });

    client.eval(function() {
      Meteor.loginWithPassword('a@a.com', '123456', function() {
        Events.insert({title: 'hello'});
      });
    });
  });

  test('logged-in users can update permitted fields', function(done, server, client) {
    server.eval(function() {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function() {
      client.eval(observeCollection);
    });

    function observeCollection() {
      Events.find().observe({
        changed: function(newdoc, olddoc) {
          emit('changed', newdoc, olddoc);
        }
      });
    }

    client.once('changed', function(newdoc, olddoc) {
      assert.equal(olddoc.title, 'hello');
      assert.equal(olddoc.loc, 'some place');
      assert.equal(olddoc.date, 'doesnt matter');

      assert.equal(newdoc.title, 'newtitle');
      assert.equal(newdoc.loc, 'newloc');
      assert.equal(newdoc.desc, 'newdesc');
      assert.equal(newdoc.date, 'newdate');

      done();
    });

    client.eval(function() {
      Meteor.loginWithPassword('a@a.com', '123456', function() {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
        var doc = Events.findOne({title: 'hello'});
        Events.update({_id: doc._id}, {
          $set: {
            title: 'newtitle',
            loc: 'newloc',
            desc: 'newdesc',
            date: 'newdate'
          }
        });
      });
    });
  });

  test('logged-in users can not update prohibited fields', function(done, server, client) {
    server.eval(function() {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function() {
      client.eval(observeCollection);
    });

    function observeCollection() {
      Events.find().observe({
        changed: function(olddoc, newdoc) {
          emit('changed', olddoc, newdoc);
        }
      });
    }

    // the attempted change should be changed back; the old doc's owner
    // should be the attempted new owner
    client.once('changed', function(olddoc, newdoc) {
      assert.equal(olddoc.owner, 'newowner');

      done();
    });

    client.eval(function() {
      Meteor.loginWithPassword('a@a.com', '123456', function() {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
        var doc = Events.findOne({title: 'hello'});
        Events.update({_id: doc._id}, {
          $set: {
            owner: 'newowner'
          }
        });
      });
    });
  });


  /*
   * Not logged-in.
   */
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

  test('non-logged-in users can not update events', function(done, server, client) {
    server.eval(function() {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function() {
      client.eval(observeCollection);
    });

    function observeCollection() {
      Events.find().observe({
        changed: function(olddoc, newdoc) {
          emit('changed', olddoc, newdoc);
        }
      });
    }

    client.once('changed', function(olddoc, newdoc) {
      assert.equal(olddoc.title, 'newtitle');

      done();
    });

    client.eval(function() {
      Meteor.loginWithPassword('a@a.com', '123456', function() {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
        Meteor.logout();
        var doc = Events.findOne({title: 'hello'});
        Events.update({_id: doc._id}, {
          $set: {
            title: 'newtitle'
          }
        });
      });
    });
  });
});
