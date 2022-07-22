let valUsr = document.getElementById('valUsr');
let valPwd = document.getElementById('valPwd');
let btnOk = document.getElementById('btnOk');

loadInputs();

btnOk.addEventListener('click', async () => {
  submitInputs();
});

function loadInputs() {
  chrome.storage.local.get("loginInfos", ({ loginInfos }) => {
    valUsr.value = atob(loginInfos.usr);
    valPwd.value = atob(loginInfos.pwd);
  });
}

function submitInputs() {
  let loginInfos = {
    usr: btoa(valUsr.value),
    pwd: btoa(valPwd.value)
  };

  chrome.storage.local.set({ loginInfos });
}

