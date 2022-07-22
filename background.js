console.clear();

chrome.runtime.onInstalled.addListener(async () => {
  chrome.storage.local.get("loginInfos", ({ loginInfos }) => {
    if (!loginInfos) {
      loginInfos = {
        usr: '',
        pwd: ''
      }
      chrome.storage.local.set({ loginInfos });
    }
  });

  /*var popups = chrome.extension.getViews({type: "popup"});
  if (popups.length > 0) {
    var gradesCount = await popups[0].reloadGapsGrades();
    await chrome.action.setBadgeText({ text: gradesCount });
    await chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });
  }*/
});

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