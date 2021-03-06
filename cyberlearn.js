let openInNewTab = [ '.pdf', '.txt', '.cpp' ];

/*
  Supression du ?forcedownlaod=1 dans les liens
*/
var fd = document.querySelectorAll('a');
fd.forEach((el) => {
  var forceDownload = '?forcedownload=1';
  if (el.href.includes(forceDownload)) {
    el.href = el.href.split(forceDownload)[0];
  }
  openInNewTab.forEach((ext) => {
    if (el.href.endsWith(ext)) {
      el.target = '_blank';
    }
  });
});


/*
  Supression des cours avec la touche <DELETE>
*/
var courses = document.querySelectorAll('.nav .mycourse .dropdown-menu a.dropdown-item');
var target = null;

document.addEventListener('keydown', function(ev) {
  if (ev.key == 'Delete' && target) {
    var courseId = target.href.split("?id=")[1];
    if (!courseId) return;
    var currentStorage = localStorage.getItem('toRemoveFromList');
    if (!currentStorage) currentStorage = '';
    if (isIn(courseId, currentStorage)) return;
    localStorage.setItem('toRemoveFromList', currentStorage + ';' + courseId);
    target.remove();
  }
});

courses.forEach((el) => {
  var courseId = el.href.split('?id=')[1];
  if (!courseId) return;
  var currentStorage = localStorage.getItem('toRemoveFromList');
  if (!currentStorage) currentStorage = '';
  if (isIn(courseId, currentStorage)) {
    el.remove();
    return;
  }

  el.addEventListener('mouseenter', function(ev) {
    target = ev.target;
  });

  el.addEventListener('mouseleave', function(ev) {
    target = null;
  });
});

function isIn(toSearch, list) {
  var found = false;
  list.split(";").forEach(function (el) {
    if (!el) return;
    if (toSearch == el) {
      found = true;
    }
  });
  return found;
}