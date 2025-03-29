const timerBlock = document.querySelector(".timer");
const timerInput = document.querySelectorAll(".timer-input");

const startButton = document.querySelector(".start-button");
const stopButton = document.querySelector(".stop-button");
const resumeButton = document.querySelector(".resume-button");
const resetButton = document.querySelector(".reset-button");

const controlButtons = document.querySelectorAll(".control-button");

const blockWebsiteInput = document.querySelector(".block-website-input");
const blockedWebsitesContainer = document.querySelector(".websites-container");
const addBlockedWebsite = document.querySelector(".add-website");

let blockedSites;

///////////////////////////
////VALIDATE TIME INPUT////
///////////////////////////

const createValidator = (element) => {
  return () => {
    var min = parseInt(element.getAttribute("min")) || 0;
    var max = parseInt(element.getAttribute("max")) || 0;

    var value = parseInt(element.value) || min;
    element.value = value;

    if (value < min) element.value = min;
    if (value > max) element.value = max;
  };
};

const elm = document.querySelectorAll(".timer-input");
elm.forEach((el) => {
  el.onkeyup = createValidator(el);
});

/////////////////////////////
//TIMER INPUT MANIPULATION///
/////////////////////////////

const disableTimerInput = (disabled) => {
  timerInput.forEach((el) => {
    el.disabled = disabled;
  });
};

const adjustTimeDisplay = (time) => {
  const hours = Math.floor(time / 3600);
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;

  if (minutes < 10) {
    minutes = "0" + minutes.toString();
  }

  if (seconds < 10) {
    seconds = "0" + seconds.toString();
  }

  timerInput.forEach((el, index) => {
    if (index === 0) {
      el.value = hours;
    } else if (index === 1) {
      el.value = (minutes + "")[0];
    } else if (index === 2) {
      el.value = (minutes + "")[1];
    } else if (index === 3) {
      el.value = (seconds + "")[0];
    } else if (index === 4) {
      el.value = (seconds + "")[1];
    }
  });

  if (time === 0) {
    handleButtonAdjustments(["reset"]);
  }
};

const setDefaultTime = () => {
  disableTimerInput(false);
  defaultTime = 1800;
  timerInput.forEach((el, index) => {
    if (index === 1) {
      el.value = 3;
    } else {
      el.value = 0;
    }
  });
};

const handleButtonAdjustments = (buttonsToShow) => {
  controlButtons.forEach((button) => {
    button.classList.add("hide-button");
  });

  buttonsToShow.forEach((button) => {
    switch (button) {
      case "start":
        startButton.classList.remove("hide-button");
        break;
      case "stop":
        stopButton.classList.remove("hide-button");
        break;
      case "resume":
        resumeButton.classList.remove("hide-button");
        break;
      case "reset":
        resetButton.classList.remove("hide-button");
        break;
    }
  });
};

///////////////////////////
//BLOCKED SITE FUNCTIONS///
///////////////////////////

const addNewBlockedWebsite = () => {
  const websiteToBlock = blockWebsiteInput.value;
  blockedSites.push(websiteToBlock);
  addBlockedWebsiteToDOM(websiteToBlock);
  blockWebsiteInput.value = "";
};

const addBlockedWebsiteToDOM = (website) => {
  const blockedWebsiteTemplate = `
  <button class="blocked-website" data-blocked-site=${website}>
    <h3>${website}</h3>
    <div class="remove-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="24.749" height="24.749" viewBox="0 0 24.749 24.749">
        <g id="Group_1" data-name="Group 1" transform="translate(-780.055 -418.197)">
          <line id="Line_3" data-name="Line 3" x2="30" transform="translate(781.822 441.178) rotate(-45)" fill="none" stroke="#23272a" stroke-width="5"/>
          <line id="Line_2" data-name="Line 2" x2="30" transform="translate(781.822 419.964) rotate(45)" fill="none" stroke="#23272a" stroke-width="5"/>
        </g>
      </svg>
    </div>
  </button>
  `;

  blockedWebsitesContainer.insertAdjacentHTML(
    "beforeend",
    blockedWebsiteTemplate
  );
};

///////////////////////////
//////EVENT HANDLERS///////
///////////////////////////

//Start timer on button click
startButton.addEventListener("click", () => {
  const time = [];

  timerInput.forEach((input) => {
    time.push(input.value);
  });

  chrome.runtime.sendMessage({ command: "startTimer", time });

  startButton.classList.add("hide-button");
  stopButton.classList.remove("hide-button");
  resetButton.classList.remove("hide-button");
});

//Add website when user presses enter
blockWebsiteInput.addEventListener("keyup", (e) => {
  if (blockWebsiteInput.value === "") return;
  if (e.key === "Enter" || e.keyCode === 13) {
    addNewBlockedWebsite();

    chrome.runtime.sendMessage({ command: "updateBlockedSites", blockedSites });
  }
});

//Add website when user presses add button
addBlockedWebsite.addEventListener("click", () => {
  if (blockWebsiteInput.value === "") return;

  addBlockedWebsiteToDOM(blockWebsiteInput.value);
  chrome.runtime.sendMessage({ command: "updateBlockedSites", blockedSites });
});

//Removes specific blocked website based on which el is clicked
blockedWebsitesContainer.addEventListener("click", (e) => {
  const clickTarget = e.target;
  if (clickTarget.tagName === "BUTTON") {
    const targetSite = clickTarget.getAttribute("data-blocked-site");
    blockedSites = blockedSites.filter((site) => {
      return site !== targetSite;
    });
    clickTarget.remove();
    chrome.runtime.sendMessage({ command: "updateBlockedSites", blockedSites });
  }
});

//Resume Timer
resumeButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "startTimer" });

  resumeButton.classList.add("hide-button");
  stopButton.classList.remove("hide-button");
});

//Pauses/Stops timer
stopButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "stopTimer" });

  resumeButton.classList.remove("hide-button");
  resetButton.classList.remove("hide-button");
  stopButton.classList.add("hide-button");
});

//Resets timer
resetButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "resetTimer" });

  startButton.classList.remove("hide-button");
  resumeButton.classList.add("hide-button");
  resetButton.classList.add("hide-button");
  stopButton.classList.add("hide-button");
});

chrome.runtime.sendMessage({ command: "getInitialState" });

//Receive Messages from service_worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.function === "adjustInputAbility_true") {
    disableTimerInput(true);
  } else if (message.function === "setDefaultTime") {
    setDefaultTime();
  } else if (message.function === "adjustTimeDisplay") {
    adjustTimeDisplay(message.time);
  } else if (message.function === "setInitialState") {
    disableTimerInput(message.state.disableTimeInput);

    blockedSites = message.state.blockedSites;
    if (blockedSites) {
      blockedSites.forEach((site) => {
        addBlockedWebsiteToDOM(site);
      });
    } else {
      chrome.storage.sync.get("blockedSites", (data) => {
        blockedSites = data.blockedSites;
        data.blockedSites.forEach((site) => {
          addBlockedWebsiteToDOM(site);
        });
      });
    }

    adjustTimeDisplay(message.state.defaultTime);
    handleButtonAdjustments(message.state.shownButtons);
  }
});
