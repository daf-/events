Events = new Meteor.Collection('Events');

if (Meteor.isClient) {
  Template.events.allEvents = function () {
    return Events.find();
  };

  Template.addEvent.events({
    "click #submitEvent": function (evt, templ) {
      var title = templ.find("#eventTitle").value;
      var loc = templ.find("#eventLocation").value;
      var desc = templ.find("#eventDescription").value;
      Events.insert({title: title, loc: loc, desc: desc});
    }
  });

  Template.events.events({
    "click .event": function (evt, templ) {
      $(evt.currentTarget).find(".description").slideToggle("fast");
    }
  });
}
