Events = new Meteor.Collection('Events');

if (Meteor.isClient) {
  /*
   * addEvent template functions
   */
  Template.addEvent.rendered = function () {
    $('#datetimepicker').datetimepicker({
      language: "en",
      pick12HourFormat: true,
      pickSeconds: false
    });
  };

  Template.addEvent.userId = function () {
    return Meteor.userId();
  };

  Template.addEvent.events({
    "click #event-form-toggler" : function (evt, templ) {
      $("#form-container").slideToggle();
    },

    "click #submitEvent": function (evt, templ) {
      var title = templ.find("#eventTitle").value;
      var loc = templ.find("#eventLocation").value;
      var desc = templ.find("#eventDescription").value;
      var date = Date(templ.find("#eventDate").value);
      Events.insert({
        title: title,
        loc: loc,
        desc: desc,
        date: date,
        owner: Meteor.userId()
      });
      $("#form-container").slideToggle();
    }
  });


  /*
   * events template functions
   */
  Template.events.allEvents = function () {
    return Events.find({}, {
      sort: {date: 1}           // sort by increasing date
    });
  };

  Template.events.niceDate = function () {
    return moment(this.date).format('dddd, MMM Do');
  };

  Template.events.events({
    "click .event-container": function (evt, templ) {
      $(evt.currentTarget).find(".description").toggle();
    }
  });
}
