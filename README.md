# Obievents

Obievents is an experimental web application for sharing and finding events
within a small community.

## Technical Details:

Obievents is built upon the [Meteor](http://www.meteor.com/) web framework.
[laika](http://arunoda.github.io/laika/) is used for testing, but it sometimes
has hiccups.  To run the tests, meteor must be running, and you must be in the
top-level directory.  On my machine I need to play with laika's ```-m``` and
```-t``` flags:

```
$ laika -m 3002 -t 10000
```

## TODO:

* Features
	* RSVPs
	* email integration
* Styling
