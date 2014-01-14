Events = new Meteor.Collection('Events');

if (Meteor.isClient) {
  Template.events.allEvents = function () {
    return Events.find();
  };


  /*
   * addEvent template functions
   */
  Template.addEvent.rendered = function () {
    $(".datepicker").datepicker();
  };

  Template.addEvent.userId = function () {
    return Meteor.userId();
  };

  Template.addEvent.events({
    "click #submitEvent": function (evt, templ) {
      var title = templ.find("#eventTitle").value;
      var loc = templ.find("#eventLocation").value;
      var desc = templ.find("#eventDescription").value;
      var date = templ.find("#eventDate").value;
      Events.insert({
        title: title,
        loc: loc,
        desc: desc,
        date: date,
        owner: Meteor.userId()
      });
    }
  });

  Template.events.events({
    "click .event": function (evt, templ) {
      $(evt.currentTarget).find(".description").slideToggle("fast");
    }
  });
}
