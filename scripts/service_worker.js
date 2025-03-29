chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "startTimer") {
    startTimer(message.time);
  } else if (message.command === "resetTimer") {
    stopTimer();
    resetTimer();
  } else if (message.command === "stopTimer") {
    shownButtons = ["resume", "reset"];
    stopTimer();
  } else if (message.command === "updateBlockedSites") {
    blockedSites = message.blockedSites;
    chrome.storage.sync.set({ blockedSites: blockedSites });
  } else if (message.command === "getBlockedSites") {
    try {
      chrome.runtime.sendMessage({ blockedSites });
    } catch (e) {
      console.log("error", e);
    }
  } else if (message.command === "getInitialState") {
    getInitialState();
  }
});

let defaultTime = 1800;
let timer;
let hasTimerStarted = false;
let blockedSites;
let blockingEnabled = false;
let shownButtons = ["start"]; //start, stop, resume, reset

const setBlockedSites = () => {
  chrome.storage.sync.get("blockedSites", (data) => {
    if (data.blockedSites) {
      blockedSites = data.blockedSites;
    } else {
      blockedSites = ["youtube.com", "facebook.com", "reddit.com"];
    }
  });
};

const getInitialState = () => {
  setBlockedSites();

  chrome.runtime.sendMessage({
    function: "setInitialState",
    state: {
      defaultTime,
      shownButtons,
      blockedSites,
      disableTimeInput: hasTimerStarted,
    },
  });
};

////////////////////////
//TIMER FUNCTIONALITY///
////////////////////////

const startTimer = (time = defaultTime) => {
  try {
    chrome.runtime.sendMessage({ function: "adjustInputAbility_true" });
  } catch (e) {
    console.log(e);
  }

  blockingEnabled = true;
  hasTimerStarted = true;

  if (time?.length) {
    let totalSeconds = 0;
    const minutesPerHour = 60;
    const secondsPerMinute = 60;

    totalSeconds += time[0] * minutesPerHour * secondsPerMinute;
    totalSeconds += parseInt(time[1] + "" + time[2]) * secondsPerMinute;
    totalSeconds += parseInt(time[3] + "" + time[4]);

    defaultTime = totalSeconds;
  }

  shownButtons = ["stop", "reset"];
  timer = setInterval(runTimer, 1000);
};

const runTimer = () => {
  if (defaultTime === 0) {
    shownButtons = ["reset"];
    stopTimer();
    return;
  } else {
    shownButtons = ["stop", "reset"];
    defaultTime = defaultTime - 1;
    try {
      chrome.runtime.sendMessage({
        function: "adjustTimeDisplay",
        time: defaultTime,
      });
    } catch (e) {
      return;
    }
  }
};

const stopTimer = () => {
  clearInterval(timer);
  blockingEnabled = false;
};

const resetTimer = () => {
  shownButtons = ["start"];
  clearInterval(timer);
  hasTimerStarted = false;
  blockingEnabled = false;

  try {
    chrome.runtime.sendMessage({ function: "setDefaultTime" });
  } catch (e) {}
};

////////////////////////
//TIMER FUNCTIONALITY///
////////////////////////

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (!tab.url.includes("chrome://")) {
      sendMessageToContentScript("Hello from the service worker!", tab.url);
    }
  }
});

const sendMessageToContentScript = (message, url) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      let activeTabId = tabs[0].id;
      //Can probably refactor this to fix an issue that will probably occur
      if (blockingEnabled & (typeof url === "string")) {
        blockedSites.forEach((site) => {
          if (url.includes(site)) {
            chrome.tabs.sendMessage(activeTabId, { hideBodyContent: true });
          }
        });
      } else {
        return;
      }
    }
  });
};
