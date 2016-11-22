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
