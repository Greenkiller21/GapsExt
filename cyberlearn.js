let openInNewTab = [ '.pdf', '.txt', '.cpp' ];

chrome.storage.local.get("options", ({ options }) => {
  if (options.redirectAfterLogin) {
    redirectAfterLogin();
  }

  if (options.removeForceDownload) {
    removeForceDownload();
  }
});

/*
  Redirection lors du login sur la liste des cours
 */
function redirectAfterLogin() {
  if (document.URL.endsWith("cyberlearn.hes-so.ch/my/")) {
    window.location.replace(document.URL + 'courses.php');
  }
}

/*
  Supression du ?forcedownlaod=1 dans les liens
*/
function removeForceDownload() {
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
}