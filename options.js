let valUsr = document.getElementById('valUsr');
let valPwd = document.getElementById('valPwd');
let btnSubmitLogin = document.getElementById('btnSubmitLogin');

let valRedirectAfterLogin = document.getElementById('valRedirectAfterLogin');
let valRemoveForceDownload = document.getElementById('valRemoveForceDownload');
let btnSubmitOptions = document.getElementById('btnSubmitOptions');

loadInputs();

function loadInputs() {
  loadLogin();
  loadOptions();
}

/* For the login infos */

btnSubmitLogin.addEventListener('click', async () => {
  submitLogin();
});

function loadLogin() {
  chrome.storage.local.get("loginInfos", ({ loginInfos }) => {
    valUsr.value = atob(loginInfos.usr);
    valPwd.value = atob(loginInfos.pwd);
  });
}

function submitLogin() {
  let loginInfos = {
    usr: btoa(valUsr.value),
    pwd: btoa(valPwd.value)
  };

  chrome.storage.local.set({ loginInfos });
  showMessage("Login infos saved !");
}

/* For the options */

btnSubmitOptions.addEventListener('click', async () => {
  submitOptions();
});

function loadOptions() {
  chrome.storage.local.get("options", ({ options }) => {
    valRedirectAfterLogin.checked = options.redirectAfterLogin;
    valRemoveForceDownload.checked = options.removeForceDownload;
  });
}

function submitOptions() {
  let options = {
    redirectAfterLogin: valRedirectAfterLogin.checked,
    removeForceDownload: valRemoveForceDownload.checked
  };

  chrome.storage.local.set({ options });
  showMessage("Options saved !");
}

function showMessage(msg) {
  var x = document.getElementById("snackbar");

  x.className = "show";
  x.textContent = msg;

  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}
