document.addEventListener('DOMContentLoaded', function () {
  var checkbox = document.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', function () {
  if (checkbox.checked) {
    switch_style('vanilla');
    console.log('Checked');
    return false;
  } else {
    switch_style('darkmode');
    console.log('Not checked');

    return false;
  }
} 
    
)})
