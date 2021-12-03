console.clear();

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("loginInfos", ({ loginInfos }) => {
    if (!loginInfos) {
      loginInfos = {
        usr: '',
        pwd: ''
      }
      chrome.storage.sync.set({ loginInfos });
    }
  });
  chrome.storage.sync.get("grades", ({ grades }) => {
    if (!grades) {
      grades = {}
      chrome.storage.sync.set({ grades });
    }
  });
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