Events = new Meteor.Collection('Events');

Events.before.insert(function (userId, doc) {
  doc.owner = userId;
  doc.guests = [userId];
});

if (Meteor.isClient) {
  /*
   * page template functions
   */
  Template.page.helpers({
    userId: function() {
      return Meteor.userId();
    }
  });

  Template.page.events({
    "click #event-form-toggler": function (evt, templ) {
      $(evt.currentTarget).siblings(".form-container").slideToggle();
    }
  });


  /*
   * eventForm template functions
   */
  Template.eventForm.rendered = function () {
    $('.datetimepicker').datetimepicker({
      language: "en",
      pick12HourFormat: true,
      pickSeconds: false
    });
  };

  Template.eventForm.events({
    "click .submit": function (evt, templ) {
      var title = templ.find("#eventTitle").value;
      var loc = templ.find("#eventLocation").value;
      var desc = templ.find("#eventDescription").value;
      var date = Date.parse(templ.find("#eventDate").value);
      Events.insert({
        title: title,
        loc: loc,
        desc: desc,
        date: date
      });
      $(evt.currentTarget).closest(".form-container").slideToggle();
      $(evt.currentTarget).closest(".event-form")[0].reset();
      return false;
    },

    "click .update": function (evt, templ) {
      var title = templ.find("#eventTitle").value;
      var loc = templ.find("#eventLocation").value;
      var desc = templ.find("#eventDescription").value;
      var date = Date.parse(templ.find("#eventDate").value);

      var id = this._id;
      Events.update({_id: id}, {
        $set: {
          title: title,
          loc: loc,
          desc: desc,
          date: date
        }
      });
      $(evt.currentTarget).closest(".form-container").slideToggle();
      $(evt.currentTarget).closest(".event-form")[0].reset();
      return false;
    },

    "click .cancel": function (evt, templ) {
      $(evt.currentTarget).closest(".form-container").slideToggle();
      $(evt.currentTarget).closest(".event-form")[0].reset();
      return false;
    }
  });



  /*
   * events template functions
   */
  Template.events.helpers({
    allEvents: function () {
      return Events.find({}, {
        sort: {date: 1}         // sort by increasing date
      });
    },

    amOwner: function () {
      return (Meteor.userId && Meteor.userId() === this.owner);
    },

    amAttending: function () {
      return _.contains(this.guests, Meteor.userId());
    },

    numGuests: function() {
      return this.guests.length;
    },

    niceDate: function () {
      return moment(this.date).format('dddd, MMM Do');
    }
  });

  Template.events.events({
    "click .event-container .title": function (evt, templ) {
      $(evt.currentTarget).siblings(".description").slideToggle("fast");
    },

    "click .event-controls .edit": function (evt, templ) {
      // If the template hasn't yet been rendered, render it.
      // Otherwise just toggle the template and event description.
      var curDoc = this;
      var formContainerNode = $(evt.currentTarget).parents('.event-controls').siblings(".edit-form-container");
      if (formContainerNode.find(".form-container").length === 0) {
        var fragment = Meteor.render(function () {
          // need to parse date for datetimepicker.js
          var dateParsed = moment(new Date(curDoc.date)).format("MM/DD/YYYY hh:mm:ss A");
          return Template.eventForm({update: true, title: curDoc.title, loc: curDoc.loc, date: dateParsed, desc: curDoc.desc, _id: curDoc._id});
        });
        formContainerNode.html(fragment);
        formContainerNode.find(".form-container").slideToggle();
      } else {
        formContainerNode.find(".form-container").slideToggle();
      }
      return false;
    },

    "click .event-controls .remove": function (evt, templ) {
      var id = this._id;
      Events.remove({_id: id});
      return false;
    },

    "click .event-controls .join": function (evt, templ) {
      var id = this._id;
      Events.update({_id: id}, {$addToSet: {guests: Meteor.userId()}});
      return false;
    },

    "click .event-controls .leave": function (evt, templ) {
      var id = this._id;
      Events.update({_id: id}, {$pull: {guests: Meteor.userId()}});
      return false;
    }
  });
}




if (Meteor.isServer) {
  Events.allow({
    "insert": function (userId, doc) {
      return (userId && doc.owner
              && doc.owner === userId
              && doc.title && doc.loc && doc.date);
    },

    "update": function (userId, doc, fields, modifier) {
      // can only modify events if logged in
      var valid = userId;

      // If not our event, can only modify guest list
      if (doc.owner !== userId) {
        valid = valid && _.isEqual(fields, ['guests']);
      }

      // If modifying guest list, can only add/remove ourselves
      var permittedOps = ['$addToSet', '$pull'];
      for (var i = 0; i < permittedOps.length; i++) {
        var op = permittedOps[i];
        if (modifier[op] && modifier[op]['guests']) {
          var uid = modifier[op]['guests'];
          valid = valid && (uid === userId);
        }
      }

      return valid;
    },

    "remove": function (userId, doc) {
      return (userId && doc.owner === userId);
    }
  });

  Events.deny({
    update: function (userId, doc, fields, modifier) {
      // Can't change owner
      return _.contains(fields, 'owner');
    }
  });
}
