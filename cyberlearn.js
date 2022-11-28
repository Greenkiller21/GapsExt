let openInNewTab = [ '.pdf', '.txt', '.cpp' ];

/**
 * Changement de la couleur du texte de la balise code en darkmode
 */
if (document.body.classList.contains('darkmode')) {
  var observer = new MutationObserver(function(mutations) {
    var codeTag = document.querySelector("pre");
    if (codeTag !== null) {
      codeTag.setAttribute("style", "color: white;");
      observer.disconnect();
    }
  });
  
  observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
}

/**
 * Execution de code en fonction des options
 */
chrome.storage.local.get("options", ({ options }) => {
  if (options.redirectAfterLogin) {
    redirectAfterLogin();
  }

  if (options.removeForceDownload) {
    removeForceDownload();
  }
});

/**
 * Redirection lors du login sur la liste des cours
 */
function redirectAfterLogin() {
  if (document.URL.endsWith("cyberlearn.hes-so.ch/my/")) {
    window.location.replace(document.URL + 'courses.php');
  }
}

/**
 * Supression du ?forcedownlaod=1 dans les liens
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