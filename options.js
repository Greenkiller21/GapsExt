let valUsr = document.getElementById('valUsr');
let valPwd = document.getElementById('valPwd');
let btnOk = document.getElementById('btnOk');

loadInputs();

btnOk.addEventListener('click', async () => {
  submitInputs();
});

function loadInputs() {
  chrome.storage.sync.get("loginInfos", ({ loginInfos }) => {
    valUsr.value = loginInfos.usr;
    valPwd.value = loginInfos.pwd;
  });
}

function submitInputs() {
  let loginInfos = {
    usr: valUsr.value,
    pwd: valPwd.value
  };

  chrome.storage.sync.set({ loginInfos });
}