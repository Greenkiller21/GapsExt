const VERSION = 1.5;

console.clear();

chrome.runtime.onInstalled.addListener(async () => {
  chrome.storage.local.get("loginInfos", ({ loginInfos }) => {
    if (!loginInfos) {
      loginInfos = {
        usr: '',
        pwd: ''
      };
      chrome.storage.local.set({ loginInfos });
    }
  });

  chrome.storage.local.get("options", ({ options }) => {
    if (!options) {
      options = {
        redirectAfterLogin: true,
        removeForceDownload: true
      };
      chrome.storage.local.set({ options });
    }
  });

  await checkVersion();

  /*var popups = chrome.extension.getViews({type: "popup"});
  if (popups.length > 0) {
    var gradesCount = await popups[0].reloadGapsGrades();
    await chrome.action.setBadgeText({ text: gradesCount });
    await chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });
  }*/
});

async function checkVersion() {
  var p = new Promise(function(resolve, reject) {
    chrome.storage.local.get("version", ({ version }) => {
      if (version === undefined) {
        version = 0.0;
      }

      if (version === VERSION) {
        resolve();
        return;
      }

      if (version < 1.0) {
        chrome.storage.local.remove("grades");
        
        version = 1.0;
      }

      if (version < 1.1) {
        chrome.storage.local.get("loginInfos", ({ loginInfos }) => {
          loginInfos.usr = btoa(loginInfos.usr);
          loginInfos.pwd = btoa(loginInfos.pwd);

          chrome.storage.local.set({ loginInfos });
        });

        version = 1.1;
      }

      if (version < VERSION) {
        version = VERSION;
      }

      chrome.storage.local.set({ version });
      resolve();
    });
  });

  return p;
}

///
/// DEV ONLY
///

var onMessageListener = function(message, sender, sendResponse) {
  switch(message.type) {
      case "bglog":
          console.log(message.obj);
      break;
  }
  return true;
}
chrome.runtime.onMessage.addListener(onMessageListener);