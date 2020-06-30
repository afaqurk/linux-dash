// *** TO BE CUSTOMISED ***

var style_cookie_name = "style" ;
var style_cookie_duration = 30 ;
var style_domain = "athe.moe" ;

// *** END OF CUSTOMISABLE SECTION ***
// You do not need to customise anything below this line


function switch_style ( css_title )
{
  var i, link_tag ;
  for (i = 0, link_tag = document.getElementsByTagName("link") ;
    i < link_tag.length ; i++ ) {
    if ((link_tag[i].rel.indexOf( "stylesheet" ) != -1) &&
      link_tag[i].title) {
      link_tag[i].disabled = true ;
      if (link_tag[i].title == css_title) {
        link_tag[i].disabled = false ;
      }
    }
    set_cookie( style_cookie_name, css_title,
      style_cookie_duration, style_domain );
  }
}
function set_style_from_cookie()
{
  var css_title = get_cookie( style_cookie_name );
  if (css_title.length) {
    switch_style( css_title );
  }
}
function set_cookie ( cookie_name, cookie_value,
    lifespan_in_days, valid_domain )
{
    var domain_string = valid_domain ?
                       ("; domain=" + valid_domain) : '' ;
    document.cookie = cookie_name +
                       "=" + encodeURIComponent( cookie_value ) +
                       "; max-age=" + 60 * 60 *
                       24 * lifespan_in_days +
                       "; path=/" + domain_string ;
}
function get_cookie ( cookie_name )
{
	var cookie_string = document.cookie ;
	if (cookie_string.length != 0) {
		var cookie_array = cookie_string.split( '; ' );
		for (i = 0 ; i < cookie_array.length ; i++) {
			cookie_value = cookie_array[i].match ( cookie_name + '=(.*)' );
			if (cookie_value != null) {
				return decodeURIComponent ( cookie_value[1] ) ;
			}
		}
	}
	return '' ;
}


  document.addEventListener('DOMContentLoaded', function () {
    var checkbox = document.querySelector('input[type="checkbox"]');
    get_cookie (style_cookie_name); 
    console.log(cookie_value);
    allcookies = document.cookie;
    const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('style'))
    .split('=')[1];
    console.log(cookieValue);
    var enablecheck = document.getElementById("cb3")
    if (cookieValue === "vanilla") {
      checkbox.checked = true;
      console.log("new value for checkbox is " + enablecheck.value)
    } else {
      console.log("checkbox is set to: " + enablecheck.value)
      
    }
  })

