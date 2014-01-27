# Obievents

Obievents is an experimental web application for sharing and finding events
within a small community.

## Technical Details:

Obievents is built upon the [Meteor](http://www.meteor.com/) web framework which
uses MongoDB.  [laika](http://arunoda.github.io/laika/) is used for testing, but
it sometimes has hiccups.  To run the tests, meteor must be running, and you
must be in the top-level directory. Make sure you run the following command
before running ```laika```:

```
$ mongod --smallfiles --noprealloc --nojournal
```

## TODO:

* Features
	* RSVPs
	* email integration
* Styling
