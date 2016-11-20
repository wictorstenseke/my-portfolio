// Loop through Array of Objects
var objPeople = [
  { // Object @ 0 index
    username: "wictor",
    password: "password"
  },
  { // Object @ 1 index
    username: "anton",
    password: "noizier"
  },
  { // Object @ 2 index
    username: "chris",
    password: "forever"
  }

]

function getInfo() {
  var username = document.getElementById('username').value
  var password = document.getElementById('password').value

  for(var i = 0; i < objPeople.length; i++) {
    // check is user input matches username and password of a current index of the objPeople array
    if(username == objPeople[i].username && password == objPeople[i].password) {
      console.log(username + " is logged in!!!")
      // similar behavior as clicking on a link
      window.location.href = "testpage.html";
      // stop the function if this is found to be true
      return
    }
  }
  console.log("incorrect username or password")
  document.getElementById("error").innerHTML = "Du har angett fel användarnamn eller lösenord.";
}

$(document).ready(function(){
  $('a[href^="#"]').on('click',function (e) {
    e.preventDefault();

    var target = this.hash;
    var $target = $(target);

    // Scroll to show the link
    $('html, body').animate({
      'scrollTop': $target.offset().top
    }, 600, 'swing');
  });
});
