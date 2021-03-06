var assert = require('assert');
var _ = require('underscore');

suite('Permissions', function () {
  /*
   * Logged-in.
   */
  test('Logged in: can add well-formed event', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function () {
      server.eval(observeCollection);
    });

    function observeCollection () {
      Events.find().observe({
        added: function (doc) {
          emit('added', doc);
        }
      });
    }

    // An event has been added -- should be the Event we added
    server.once('added', function (doc) {
      assert.equal(doc.title, 'hello');
      done();
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
      });
    });
  });

  test('Logged in: can not add ill-formed event', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello'}, insertCallback);
      });

      function insertCallback (error, id) {
        emit('attempted insert', error);
      }
    });

    client.once('attempted insert', function (error) {
      assert.equal(error.message, 'Access denied [403]');
      done();
    });
  });

  test('Logged in: can update permitted fields', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function () {
      client.eval(observeCollection);
    });

    function observeCollection () {
      Events.find().observe({
        changed: function (newdoc, olddoc) {
          emit('changed', newdoc, olddoc);
        }
      });
    }

    client.once('changed', function (newdoc, olddoc) {
      assert.equal(olddoc.title, 'hello');
      assert.equal(olddoc.loc, 'some place');
      assert.equal(olddoc.date, 'doesnt matter');

      assert.equal(newdoc.title, 'newtitle');
      assert.equal(newdoc.loc, 'newloc');
      assert.equal(newdoc.desc, 'newdesc');
      assert.equal(newdoc.date, 'newdate');

      done();
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        var id = Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
        Events.update({_id: id}, {
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

  test('Logged in: can not update prohibited fields', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        var id = Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
        Events.update(
          {_id: id},
          {
            $set: {
              owner: 'newowner'
            }
          },
          updatedCallback
        );
      });

      function updatedCallback (error, numDocs) {
        emit('attempted update', error);
      }
    });

    client.once('attempted update', function (error) {
      assert.equal(error.message, 'Access denied [403]');
      done();
    });
  });

  test('Logged in: can remove own event', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function () {
      server.eval(observeCollection);
    });

    function observeCollection () {
      Events.find().observe({
        removed: function (olddoc) {
          emit('removed', olddoc);
        }
      });
    }

    server.once('removed', function (olddoc) {
      assert.equal(olddoc.title, 'hello');
      done();
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        var id = Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
        Events.remove(id);
      });
    });
  });

  test('Logged in: can not remove other\'s event', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      Accounts.createUser({email: 'b@b.com', password: '789012'});
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'},
                      addedCallback);
      });

      function addedCallback (error, id) {
        Meteor.logout();
        Meteor.loginWithPassword('b@b.com', '789012', function () {
          Events.remove(id, removedCallback);
        });
      }

      function removedCallback (error) {
        emit('attempted removal', error);
      }
    });

    client.once('attempted removal', function (error) {
      assert.equal(error.message, 'Access denied [403]');
      done();
    });
  });


  /*
   * Not logged-in.
   */
  test('Not logged in: cannot create events', function (done, server, client) {
    client.eval(function () {
      Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'},
                    insertCallback);

      function insertCallback (error, id) {
        emit('attempted insert', error);
      }
    });

    client.once('attempted insert', function (error) {
      assert.equal(error.message, 'Access denied [403]');
      done();
    });
  });

  test('Not logged in: can not update events', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'},
                      addedCallback);
      });

      // Once we add our event, log out and try to update it
      function addedCallback (error, id) {
        Meteor.logout();
        Events.update(
          {_id: id},
          {
            $set: {
              title: 'newtitle'
            }
          },
          updatedCallback
        );
      }

      function updatedCallback (error, numDocs) {
        emit('attempted update', error);
      }
    });

    client.once('attempted update', function (error) {
      assert.equal(error.message, 'Access denied [403]');
      done();
    });
  });

  test('Not logged in: can not remove events', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'},
                      addedCallback);
      });

      function addedCallback (error, id) {
        Meteor.logout();
        Events.remove(id, removedCallback);
      }

      function removedCallback (error) {
        emit('attempted removal', error);
      }
    });

    client.once('attempted removal', function (error) {
      assert.equal(error.message, 'Access denied [403]');
      done();
    });
  });
});

suite('Guests', function () {
  test('Owner is only guest upon creation', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function () {
      server.eval(observeCollection);
    });

    function observeCollection () {
      Events.find().observe({
        added: function (newdoc) {
          emit('added', newdoc);
        }
      });
    }

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'});
      });
    });

    server.once('added', function (newdoc) {
      assert.equal(newdoc.guests.length, 1);
      assert.equal(newdoc.guests[0], newdoc.owner);
      done();
    });
  });

  test('Can join any event as a guest when logged in', function (done, server, client) {
    server.eval(function () {
      // make global userId vars in server for both users
      owner = Accounts.createUser({email: 'a@a.com', password: '123456'});
      guest = Accounts.createUser({email: 'b@b.com', password: '789012'});
      emit('done');
    }).once('done', function () {
      server.eval(observeCollection);
    });

    function observeCollection () {
      Events.find().observe({
        changed: function (newdoc, olddoc) {
          emit('changed', newdoc, olddoc, owner, guest);
        }
      });
    }

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'},
                      addedCallback);
      });

      function addedCallback (error, id) {
        Meteor.logout();
        Meteor.loginWithPassword('b@b.com', '789012', function () {
          Events.update({_id: id}, {$addToSet: {guests: Meteor.userId()}});
        });
      }
    });

    server.once('changed', function (newdoc, olddoc, owner, guest) {
      assert.ok(_.isEqual(olddoc.guests.sort(), [owner].sort()));
      assert.ok(_.isEqual(newdoc.guests.sort(), [owner, guest].sort()));
      done();
    });
  });

  test('Can not add arbitrary string to guest list', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      Accounts.createUser({email: 'b@b.com', password: '789012'});
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'},
                      addedCallback);
      });

      function addedCallback (error, id) {
        Meteor.logout();
        Meteor.loginWithPassword('b@b.com', '789012', function () {
          Events.update({_id: id},
                        {$addToSet: {guests: 'fake_id'}},
                        updatedCallback);
        });
      }

      function updatedCallback (error, numDocs) {
        emit('attempted update', error);
      }
    });

    client.once('attempted update', function (error) {
      assert.equal(error.message, 'Access denied [403]');
      done();
    });
  });

  test('Can remove self from guest list', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      emit('done');
    }).once('done', function () {
      server.eval(observeCollection);
    });

    function observeCollection () {
      Events.find().observe({
        changed: function (newdoc, olddoc) {
          emit('changed', newdoc, olddoc);
        }
      });
    }

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'},
                      addedCallback);
      });

      function addedCallback (error, id) {
        Events.update({_id: id}, {$pull: {guests: Meteor.userId()}});
      }
    });

    server.once('changed', function (newdoc, olddoc) {
      assert.ok(_.isEqual(olddoc.guests, [olddoc.owner]));
      assert.ok(_.isEqual(newdoc.guests, []));
      done();
    });
  });

  test('Can not remove other user from guest list', function (done, server, client) {
    server.eval(function () {
      Accounts.createUser({email: 'a@a.com', password: '123456'});
      Accounts.createUser({email: 'b@b.com', password: '789012'});
    });

    client.eval(function () {
      Meteor.loginWithPassword('a@a.com', '123456', function () {
        Events.insert({title: 'hello', loc: 'some place', date: 'doesnt matter'},
                      addedCallback);
      });

      function addedCallback (error, id) {
        Meteor.logout();
        Meteor.loginWithPassword('b@b.com', '789012', function () {
          var doc = Events.findOne(id);
          Events.update({_id: id},
                        {$pull: {guests: doc.owner}},
                        updatedCallback);
        });
      }

      function updatedCallback (error, numDocs) {
        emit('attempted update', error);
      }
    });

    client.once('attempted update', function (error) {
      assert.equal(error.message, 'Access denied [403]');
      done();
    });
  });
});
