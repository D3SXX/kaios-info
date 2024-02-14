"use strict";

const buildInfo = ["1.0.1e Beta", "14.02.2024"];
let localeData;

fetch("src/locale.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => initProgram(data));

function initProgram(data) {
  debug.toggle();
  const initFunctions = [
    (callback) => systemData.init(callback),
    (callback) => displayData.init(callback),
    (callback) => cpuData.init(callback),
    (callback) => gpuData.init(callback),
    (callback) => storageData.init(callback),
    (callback) => batteryData.init(callback),
    (callback) => cameraData.init(callback),
  ];
  let completedCount = 0;
  function onInitComplete(description = "", skipCount = false) {
    if (!skipCount) {
      completedCount++;
    }
    draw.updateProgressBar(
      completedCount,
      initFunctions.length,
      "Initialized " + description
    );
    debug.print("initialized " + description);
    if (completedCount === initFunctions.length) {
      finishInitialization(data);
    }
  }
  initFunctions.forEach((initFunction) => {
    initFunction(onInitComplete);
  });
}

function finishInitialization(data) {
  navigator.mozBluetooth;
  const userLocale = navigator.language;
  localeData = data[userLocale] || data["en-US"];
  console.log(`KaiOS Info ver. ${buildInfo[0]} initialized`);
  softkeys.draw();
  draw.initListMenu();
  draw.initSideMenu();
  draw.closeLoadingPage();
  draw.toggleListMenu();

}

const debug = {
  enableDebug: false,
  toggle: function () {
    this.enableDebug = !this.enableDebug;
    this.print("Debug output activated");
    const debugElement = document.getElementById("debug");
    if (this.enableDebug) {
      debugElement.innerHTML = "Debug output activated";
    } else {
      debugElement.innerHTML = "";
    }
  },
  print: function (msg, flag = null) {
    if (this.enableDebug) {
      switch (flag) {
        case "error":
          console.error(msg);
          break;
        case "warning":
          console.warn(msg);
          break;
        default:
          console.log(msg);
          break;
      }
    }
  },
  show: function (key = "") {
    if (this.enableDebug) {
      const debugElement = document.getElementById("debug");
      debugElement.innerHTML = `nav: ${key} row: ${controls.row} (${controls.rowLimit}) col: ${controls.col}`;
    }
  },
};

const controls = {
  row: 1,
  col: 1,
  rowMenu: 0,
  colMenu: 0,
  rowMenuLimit: 0,
  colMenuLimit: 0,
  rowLimit: 0,
  colLimit: 0,
  scrollLimit: 0,
  resetControls: function (type = "", extra = "") {
    let col = `col${extra}`;
    let row = `row${extra}`;
    switch (type) {
      case "col":
        this[col] = 1;
        break;
      case "row":
        this[row] = 1;
        break;
      default:
        this[col] = 1;
        this[row] = 1;
        break;
    }
    debug.print(`controls.resetControls() - ${type + extra} - reset`);
  },
  increase: function (type) {
    let limit = type + "Limit";
    if (this[type] < this[limit]) {
      this[type]++;
    } else {
      this[type] = 1;
    }
    debug.print(`controls.increase() - ${type}: ${this[type]}`);
    scrollHide();
  },
  decrease: function (type) {
    let limit = type + "Limit";
    if (this[type] > 1) {
      this[type]--;
    } else {
      this[type] = this[limit];
    }
    debug.print(`controls.decrease() - ${type}: ${this[type]}`);
    scrollHide();
  },
  updateLimits: function (col = this.colLimit, row = this.rowLimit, type = "") {
    let colLimit = `col${type}Limit`;
    let rowLimit = `row${type}Limit`;
    this[colLimit] = col;
    this[rowLimit] = row;
    debug.print(
      `controls.updateLimits() - New limits for col and row are set to ${col} and ${row}`
    );
  },
  updateControls: function (col = this.col, row = this.row) {
    this.col = col;
    this.row = row;
    debug.print(
      `controls.updateControls() - col: ${this.col} row: ${this.row}`
    );
  },
  handleEnter: function () {
    if (draw.sideMenuState) {
      switch (controls.rowMenu) {
        case 1:
          draw.toggleListMenu();
          break;
        case 2:
          menu.forceDisableRefresh = !menu.forceDisableRefresh;
          toast(`Auto refresh is set to ${!menu.forceDisableRefresh}`);
          debug.print(
            `controls.handleEnter() - forceDisableRefresh is set to ${menu.forceDisableRefresh}`
          );
          break;
        case 3:
          menu.draw(11);
          break;
        case 4:
          window.close();
      }
      draw.toggleSideMenu();
      return;
    }
    switch (this.col) {
      default:
        draw.toggleDetails();
        break;
      case 11:
        switch (controls.row) {
          case 1:
            open("https://github.com/D3SXX/kaios-info");
            break;
          case 2:
            open("https://github.com/D3SXX/kaios-info/releases");
            break;
          case 3:
            open("./changelog.txt");
            break;
        }
        break;
    }
  },
  handleSoftLeft: function () {
    switch (this.col) {
      case 7:
        if (controls.row === 1) {
          toggleWifi();
          menu.refreshMenu();
        }
        break;
      case 8:
        if (menu.networkToggleList.includes(controls.row)) {
          toggleNetwork(menu.networkToggleList.indexOf(controls.row));
        }
        break;
      case 9:
        if (controls.row === 1) {
          toggleBluetooth();
          menu.refreshMenu();
        }
        break;
    }
  },
  handleKeydown: function (e) {
    debug.print(`${e.key} triggered`);
    let rowType = "row";
    let hoverArg = "";
    if (draw.sideMenuState) {
      rowType = rowType + "Menu";
      hoverArg = "m";
      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowLeft" ||
        e.key === "SoftLeft"
      ) {
        return;
      }
    }
    if(draw.detailsState){
      rowType = rowType + "Details";
      hoverArg = "details-";
    }
    if (draw.listMenuState) {
      hoverArg = "";
      let pastCol = controls.col;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "8":
        case "6":
          controls.increase("col");
          controls.row = controls.col;
          menuHover(controls.col, pastCol, hoverArg);
          scrollHide();
          return;
        case "ArrowLeft":
        case "ArrowUp":
        case "2":
        case "4":
          controls.decrease("col");
          controls.row = controls.col;
          menuHover(controls.col, pastCol, hoverArg);
          scrollHide();
          return;
        case "Enter":
        case "5":
          draw.toggleListMenu();
          return;
        case "#":
          debug.toggle();
          return;
        case "Backspace":
          close();
          return;
        default:
          return;
      }
    }
    let pastRow = controls[rowType];
    switch (e.key) {
      case "ArrowUp":
      case "2":
        controls.decrease(rowType);
        menuHover(controls[rowType], pastRow, hoverArg);
        break;
      case "ArrowDown":
      case "8":
        controls.increase(rowType);
        menuHover(controls[rowType], pastRow, hoverArg);
        break;
      case "ArrowRight":
      case "6":
        controls.increase("col");
        menu.draw();
        break;
      case "ArrowLeft":
      case "4":
        controls.decrease("col");
        menu.draw();
        break;
      case "Enter":
      case "5":
        controls.handleEnter();
        break;
      case "SoftRight":
        draw.toggleSideMenu();
        break;
      case "SoftLeft":
        controls.handleSoftLeft();
        break;
      case "#":
        debug.toggle();
        break;
      case "Backspace":
        e.preventDefault();
        draw.toggleListMenu();
        break;
    }
    softkeys.draw();
    debug.show(e.key);
  },
};

const softkeys = {
  softkeysArr: ["", "", ""],
  default: function () {
    this.softkeysArr[0] = "";
    this.softkeysArr[1] = localeData[0]["softCenter"];
    this.softkeysArr[2] = localeData[0]["softRight"];
  },
  get: function () {
    if (draw.sideMenuState) {
      this.softkeysArr[0] = "";
      this.softkeysArr[1] = "";
      this.softkeysArr[2] = localeData[0]["close"];
      return;
    }
    this.default();
    const col = controls["col"];
    const row = controls["row"];
    switch (col) {
      case 7:
        if (row === 1 && navigator.mozWifiManager) {
          this.softkeysArr[0] = localeData[0]["softLeftToggle"];
        }
        break;
      case 8:
        if(getInfoString("network-amount") === 0){
          return;
        }
        if (menu.networkToggleList.includes(controls.row)) {
          this.softkeysArr[0] = localeData[0]["softLeftToggle"];
        }
        break;
      case 9:
        if (row === 1 && getInfoString("bluetooth")) {
          this.softkeysArr[0] = localeData[0]["softLeftToggle"];
        }
        break;
    }
  },
  draw: function () {
    this.get();
    let softkeys = "";
    const softkeyContainer = document.getElementById("softkey");

    softkeys += `<label id="left">${this.softkeysArr[0]}</label>`;
    softkeys += `<label id="center">${this.softkeysArr[1]}</label>`;
    softkeys += `<label id="right">${this.softkeysArr[2]}</label>`;
    softkeyContainer.innerHTML = softkeys;
  },
};

const draw = {
  sideMenuState: false,
  updateProgressBar: function (value, maxValue, text) {
    document.getElementById("progress-bar-loading").max = maxValue;
    document.getElementById("progress-bar-loading").value = value;
    document.getElementById("loading-bar-text").innerText = text;
  },
  closeLoadingPage: function () {
    document.getElementById("loading").classList.add("hidden");
  },
  initSideMenu() {
    const menuElements = [
      localeData[0]["sidemenu-openlistmenu"],
      localeData[0]["sidemenu-togglerefresh"],
      localeData[0]["sidemenu-about"],
      [localeData[0]["sidemenu-exit"]],
    ];
    const element = document.getElementById("menu");
    let menuData = "";
    for (let i = 0; i < menuElements.length; i++) {
      menuData += `<div id="m${i + 1}" class="menuItem">${
        menuElements[i]
      }</div>`;
    }
    element.innerHTML = menuData;
    controls.rowMenuLimit = menuElements.length;
    controls.rowMenu = 1;
    menuHover(1, undefined, "m");
    debug.print("draw.initSideMenu - Side menu initialized");
  },
  toggleSideMenu() {
    this.sideMenuState = !this.sideMenuState;
    if (this.sideMenuState) {
      document.getElementById("menu").classList.remove("hidden");
    } else {
      document.getElementById("menu").classList.add("hidden");
    }
  },
  initListMenu() {
    const element = document.getElementById("menu-list");
    let menuData = "<ul>";
    for (let i = 1; i < localeData.length; i++) {
      menuData += `<li id="${i}" class="menuItem">${localeData[i]["index"]}</li>`;
    }
    menuData += "</ul>";
    element.innerHTML = menuData;
  },
  toggleListMenu() {
    this.listMenuState = !this.listMenuState;
    if (this.listMenuState) {
      menu.forceDisableRefresh = true;
      menu.splitAtRow = [];
      document.getElementById("menu-list").classList.remove("hidden");
      controls.colLimit = localeData.length - 1;
      controls.rowLimit = localeData.length - 1;
      controls.row = controls.col;
      document.getElementById("menu-container").innerHTML = "";
      menuHover(controls.col, undefined, "");
      scrollHide();
    } else {
      menu.forceDisableRefresh = false;
      menuHover(undefined, controls.col, "");
      document.getElementById("menu-list").classList.add("hidden");
      menu.draw();
      softkeys.draw();
    }
  },
  toggleDetails(){
    controls.rowDetailsLimit = 3;
    controls.rowDetails = 1;
    this.detailsState = !this.detailsState;
    debug.print(`draw.toggleDetails() - State is set to ${this.detailsState}`)
    if(this.detailsState){
      const element = document.getElementById("details");
      const description = `<div class="title">Description</div><div class="menuItem" id="details-1">${localeData[controls.col][controls.row+"-details-description"] || "No description available"}</div>`;
      const example = `<div class="title">Example</div><div class="menuItem" id="details-2" >${localeData[controls.col][controls.row+"-details-example"] || "No examples available"}</div>`;
      const source = `<div class="title">Source</div><div class="menuItem" id="details-3">${localeData[controls.col][controls.row+"-details-source"] || "No sources available"}</div>`;
      element.innerHTML = `<div class="container">${description + example + source}</div>`
      element.classList.remove("notactive");
      menuHover(controls.rowDetails,undefined,"details-")
      
    }
    else{
      const element = document.getElementById("details");
      element.classList.add("notactive");
      menuHover(undefined,controls.rowDetails,"details-")
    }
  }
};

const menu = {
  hideList: [],
  enableRefresh: false,
  forceDisableRefresh: false,
  timeoutID: undefined,
  splitAtRow: [],
  draw: function (col = controls.col) {
    controls.updateControls(col);
    controls.resetControls("row");
    const menuContainer = document.getElementById("menu-container");
    this.activeHideList = [];
    let menu = this.getMenuData(col);
    menuContainer.innerHTML = menu;
    this.updateNavbar();
    try {
      clearTimeout(this.timeoutID);
    } catch (e) {
      debug.print("menu.draw() - Refreshing menu for the first time");
    }
    document.getElementById("l" + controls.col).className = "hovered";
    document.getElementById(controls.row).className = "hovered";
    this.refreshMenu();
  },
  refreshMenu: function () {
    if (this.enableRefresh && !this.forceDisableRefresh) {
      debug.print("menu.refreshMenu - Refreshing menu");
      const data = this.getMenuData(controls.col, true);
      for (let i = 1; i < data.length + 1; i++) {
        document.getElementById(i).innerText = data[i - 1];
      }
      this.timeoutID = setTimeout(() => {
        this.refreshMenu();
      }, 1000);
    }
  },
  updateNavbar: function () {
    let navbarData = "";
    if (!this.navbarList) {
      this.navbarList = [];
      for (let i = 1; i < localeData.length; i++) {
        this.navbarList.push(
          `<span id="l${i}" class = "notactive">${localeData[i]["index"]}</span>`
        );
      }
    }
    const col = controls.col;
    for (let i = 0; i < col; i++) {
      navbarData += this.navbarList[i];
    }
    let i = 0;
    while (navbarData.length > 150) {
      navbarData = navbarData.substr(this.navbarList[i].length);
      i += 1;
    }
    for (i = col; i < this.navbarList.length; i++) {
      navbarData += this.navbarList[i];
    }
    document.getElementById("nav-bar").innerHTML = navbarData;
  },
  getMenuData: function (col, returnOnlyData = false) {
    let menu = "";
    let rowCount = 1;
    this.enableRefresh = false;
    switch (col) {
      case 1:
        menu = `<ul>
        <li id="1">${localeData[1]["1"]}: ${getInfoString("system-model")}</li>
        <li id="2">${localeData[1]["2"]}: ${getInfoString("system-os")}</li>
        <li id="3">${localeData[1]["3"]}: ${getInfoString(
          "system-firefox"
        )}</li>
        <li id="4">${localeData[1]["4"]}: ${getInfoString("system-ram")}</li>
        <li id="5">${localeData[1]["5"]}: ${getInfoString(
          "system-developer"
        )}</li>
        </ul>
    `;
        controls.rowLimit = 5;
        break;
      case 2:
        menu = `<ul>
        <li id="1">${localeData[2]["1"]}: ${getInfoString(
          "display-resolution"
        )}</li>
        <li id="2">${localeData[2]["2"]}: ${getInfoString("display-depth")}</li>
        <li id="3">${localeData[2]["3"]}: ${getInfoString(
          "display-aspect-ratio"
        )}</li>
        <li id="4">${localeData[2]["4"]}: ${getInfoString(
          "display-orientation"
        )}</li>
        </ul>`;
        controls.rowLimit = 4;
        break;
      case 3:
        menu = `<ul>
        <li id="1">${localeData[3]["1"]}: ${getInfoString("cpu-cores")}</li>
        <li id="2">${localeData[3]["2"]}: ${getInfoString("cpu-frequency")}</li>
        </ul>`;
        controls.rowLimit = 2;
        break;
      case 4:
        if (gpuData.initStatus) {
          menu = `<ul>
        <li id="1">${localeData[4]["1"]}: ${getInfoString("gpu")}</li>
        <li id="2">${localeData[4]["2"]}: ${getInfoString("gpu-man")}</li>
        </ul>`;
          controls.rowLimit = 2;
        } else {
          menu += `<ul><li id="${rowCount++}">${
            localeData[0]["errorOnApi"]
          }</li></ul>`;
          controls.rowLimit = 1;
        }
        break;
      case 5:
        menu = "<ul>";
        if (cameraData.initStatus) {
          const camerasAmount = cameraData.camerasList.length || 0;
          if (camerasAmount > 0) {
            for (let i = 0; i < camerasAmount; i++) {
              menu += `
              <li id="${rowCount++}">${localeData[5]["1"]}: ${getInfoString(
                "camera-id",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[5]["2"]}: ${getInfoString(
                "camera-name",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[5]["3"]}: ${getInfoString(
                "camera-photo-resolution",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[5]["4"]}: ${getInfoString(
                "camera-photo-focal",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[5]["5"]}: ${getInfoString(
                "camera-video-resolution",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[5]["6"]}: ${getInfoString(
                "camera-video-bitrate",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[5]["7"]}: ${getInfoString(
                "camera-video-framerate",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[5]["8"]}: ${getInfoString(
                "camera-video-codec",
                i
              )}</li>
              `;
            }
            menu += "</ul>";
            rowCount -= 1;
          } else {
            menu += `<li id="${rowCount++}">${
              localeData[0]["errorOnEmptyList"]
            }</li>`;
          }
        } else {
          if (returnOnlyData) {
            menu = [`${localeData[0]["errorOnApi"]}`];
          } else {
            menu += `<ul><li id="1">${localeData[0]["errorOnApi"]}</li></ul>`;
          }
          rowCount = 1;
        }
        controls.rowLimit = rowCount;
        break;
      case 6:
        if (batteryData.initStatus) {
          if (returnOnlyData) {
            menu = [
              `${localeData[6]["1"]}: ${getInfoString("battery-level")}`,
              `${localeData[6]["2"]}: ${getInfoString("battery-health")}`,
              `${localeData[6]["3"]}: ${getInfoString("battery-status")}`,
              `${localeData[6]["4"]}: ${getInfoString("battery-temperature")}`,
            ];
          } else {
            menu = `<ul>
        <li id="1">${localeData[6]["1"]}: ${getInfoString("battery-level")}</li>
        <li id="2">${localeData[6]["2"]}: ${getInfoString(
              "battery-health"
            )}</li>
        <li id="3">${localeData[6]["3"]}: ${getInfoString(
              "battery-status"
            )}</li>
        <li id="4">${localeData[6]["4"]}: ${getInfoString(
              "battery-temperature"
            )}</li>
        </ul>`;
          }
          controls.rowLimit = 4;
        } else {
          if (returnOnlyData) {
            menu = [`${localeData[0]["errorOnApi"]}`];
          } else {
            menu = `<ul><li id="${rowCount++}">${
              localeData[0]["errorOnEmptyList"]
            }</li></ul>`;
          }
          controls.rowLimit = 1;
        }
        this.enableRefresh = true;
        break;
      case 7:
        if (getInfoString("wifi")) {
          if (returnOnlyData) {
            menu = [
              `${localeData[controls.col]["1"]}: ${getInfoString("wifi-type")}`,
              `${localeData[controls.col]["2"]}: ${getInfoString("wifi-ssid")}`,
              `${localeData[controls.col]["3"]}: ${getInfoString(
                "wifi-speed"
              )}`,
              `${localeData[controls.col]["4"]}: ${getInfoString(
                "wifi-signal"
              )}`,
              `${localeData[controls.col]["5"]}: ${getInfoString("wifi-ip")}`,
              `${localeData[controls.col]["6"]}: ${getInfoString(
                "wifi-frequency"
              )}`,
              `${localeData[controls.col]["7"]}: ${getInfoString(
                "wifi-internet"
              )}`,
              `${localeData[controls.col]["8"]}: ${getInfoString(
                "wifi-hidden"
              )}`,
              `${localeData[controls.col]["9"]}: ${getInfoString("wifi-mac")}`,
            ];
          } else {
            menu = `<ul>
          <li id="1">${localeData[controls.col]["1"]}: ${getInfoString(
              "wifi-type"
            )}${this.hideList.includes(1) ? "  ↓" : "  ↑"}</li>
          <li id="2">${localeData[controls.col]["2"]}: ${getInfoString(
              "wifi-ssid"
            )}</li>
          <li id="3">${localeData[controls.col]["3"]}: ${getInfoString(
              "wifi-speed"
            )}</li>
          <li id="4">${localeData[controls.col]["4"]}: ${getInfoString(
              "wifi-signal"
            )}</li>
          <li id="5">${localeData[controls.col]["5"]}: ${getInfoString(
              "wifi-ip"
            )}</li>
          <li id="6">${localeData[controls.col]["6"]}: ${getInfoString(
              "wifi-frequency"
            )}</li>
          <li id="7">${localeData[controls.col]["7"]}: ${getInfoString(
              "wifi-internet"
            )}</li>
          <li id="8">${localeData[controls.col]["8"]}: ${getInfoString(
              "wifi-hidden"
            )}</li>
          <li id="9">${localeData[controls.col]["9"]}: ${getInfoString(
              "wifi-mac"
            )}</li>
          `;
          }
          rowCount = 10;
        } else {
          if (returnOnlyData) {
            menu = [`${localeData[0]["errorOnApi"]}`];
            rowCount += 1;
          } else {
            menu += `<ul><li id="${rowCount++}">${
              localeData[0]["errorOnApi"]
            }</li>`;
          }
        }
        if (!returnOnlyData) {
          menu += "</ul>";
        }
        rowCount--;
        controls.rowLimit = rowCount;
        this.enableRefresh = true;
        break;
      case 8:
        if (returnOnlyData) {
          menu = [];
        } else {
          menu = "<ul>";
        }
        if (getInfoString("network-amount") > 0) {
          this.networkToggleList = [];
          for (let i = 0; i < getInfoString("network-amount"); i++) {
            this.networkToggleList.push(rowCount);
            if (returnOnlyData) {
              menu.push(
                `${localeData[controls.col]["1"]}: ${getInfoString(
                  "network-type",
                  i
                )}`,
                `${localeData[controls.col]["2"]}: ${getInfoString(
                  "network-sim-provider",
                  i
                )}`,
                `${localeData[controls.col]["3"]}: ${getInfoString(
                  "network-sim-type",
                  i
                )}`,
                `${localeData[controls.col]["4"]}: ${getInfoString(
                  "network-sim-signal",
                  i
                )}`,
                `${localeData[controls.col]["5"]}: ${getInfoString(
                  "network-sim-roaming",
                  i
                )}`,
                `${localeData[controls.col]["6"]}: ${getInfoString(
                  "network-sim-state",
                  i
                )}`,
                `${localeData[controls.col]["7"]}: ${getInfoString(
                  "network-sim-iccid",
                  i
                )}`
              );
              rowCount += 7;
            } else {
              menu += `
              <li id="${rowCount++}">${
                localeData[controls.col]["1"]
              }: ${getInfoString("network-type", i)}</li>
              <li id="${rowCount++}">${
                localeData[controls.col]["2"]
              }: ${getInfoString("network-sim-provider", i)}</li>
              <li id="${rowCount++}">${
                localeData[controls.col]["3"]
              }: ${getInfoString("network-sim-type", i)}</li>
              <li id="${rowCount++}">${
                localeData[controls.col]["4"]
              }: ${getInfoString("network-sim-signal", i)}</li>
              <li id="${rowCount++}">${
                localeData[controls.col]["5"]
              }: ${getInfoString("network-sim-roaming", i)}</li>
              <li id="${rowCount++}">${
                localeData[controls.col]["6"]
              }: ${getInfoString("network-sim-state", i)}</li>
              <li id="${rowCount++}">${
                localeData[controls.col]["7"]
              }: ${getInfoString("network-sim-iccid", i)}</li>
              `;
            }
          }
        } else {
          if (returnOnlyData) {
            menu.push[`${localeData[0]["errorOnApi"]}`];
            rowCount += 1;
          } else {
            menu += `<li id="${rowCount++}">${
              localeData[0]["errorOnApi"]
            }</li>`;
          }
        }
        if (!returnOnlyData) {
          menu += "</ul>";
        }
        this.enableRefresh = true;
        controls.rowLimit = rowCount - 1;
        break;
      case 9:
        if (getInfoString("bluetooth")) {
          if (returnOnlyData) {
            menu = [];
            menu.push(
              `${localeData[controls.col]["1"]}: ${getInfoString(
                "bluetooth-status"
              )}`,
              `${localeData[controls.col]["2"]}: ${getInfoString(
                "bluetooth-name"
              )}`,
              `${localeData[controls.col]["3"]}: ${getInfoString(
                "bluetooth-address"
              )}`,
              `${localeData[controls.col]["4"]}: ${getInfoString(
                "bluetooth-discoverable"
              )}`,
              `${localeData[controls.col]["5"]}: ${getInfoString(
                "bluetooth-discovering"
              )}`
            );
          } else {
            menu += `<ul>
            <li id="1">${localeData[controls.col]["1"]}: ${getInfoString(
              "bluetooth-status"
            )}</li>
            <li id="2">${localeData[controls.col]["2"]}: ${getInfoString(
              "bluetooth-name"
            )}</li>
            <li id="3">${localeData[controls.col]["3"]}: ${getInfoString(
              "bluetooth-address"
            )}</li>
            <li id="4">${localeData[controls.col]["4"]}: ${getInfoString(
              "bluetooth-discoverable"
            )}</li>
            <li id="5">${localeData[controls.col]["5"]}: ${getInfoString(
              "bluetooth-discovering"
            )}</li>
            </ul> `;
          }
          controls.rowLimit = 5;
        } else {
          if (returnOnlyData) {
            menu = [`${localeData[0]["errorOnApi"]}`];
          } else {
            menu += `<ul><li id="1">${localeData[0]["errorOnApi"]}</li></ul>`;
          }
          controls.rowLimit = 1;
        }
        this.enableRefresh = true;
        break;
      case 10:
        if (returnOnlyData) {
          menu = [];
          for (let i = 0; i < storageData.deviceStorages.length; i++) {
            menu.push(
              `${localeData[controls.col]["1"]}: ${getInfoString(
                "storage-type",
                i
              )}`,
              `${localeData[controls.col]["2"]}: ${getInfoString(
                "storage-space-total",
                i
              )}`,
              `${localeData[controls.col]["3"]}: ${getInfoString(
                "storage-space-left",
                i
              )}`,
              `${localeData[controls.col]["4"]}: ${getInfoString(
                "storage-default",
                i
              )}`
            );
            rowCount += 4;
          }
          if (storageData.apiAccess === false) {
            menu = [`${localeData[0]["errorOnApi"]}`];
            rowCount = 2;
          }
        } else {
          menu = "<ul>";
          for (let i = 0; i < storageData.deviceStorages.length; i++) {
            menu += `
            <li id="${rowCount++}">${
              localeData[controls.col]["1"]
            }: ${getInfoString("storage-type", i)}</li>
            <li id="${rowCount++}">${
              localeData[controls.col]["2"]
            }: ${getInfoString("storage-space-total", i)}</li>
            <li id="${rowCount++}">${
              localeData[controls.col]["3"]
            }: ${getInfoString("storage-space-left", i)}</li>
            <li id="${rowCount++}">${
              localeData[controls.col]["4"]
            }: ${getInfoString("storage-default", i)}</li>
             `;
          }
          menu += "</ul>";
          if (storageData.apiAccess === false) {
            menu += `<ul><li id="1">${localeData[0]["errorOnApi"]}</li></ul>`;
            rowCount = 2;
          }
        }
        storageData.refresh();
        controls.rowLimit = rowCount - 1;
        this.enableRefresh = true;
        break;
      case 11:
        menu = `<ul>
        <li id = "1" style="height:80px;"><p style="font-size:20px; position:absolute; top:70px">
        KaiOS Info</p>
        <p style="top:100px;position:absolute;">${localeData[controls.col]["1"]} D3SXX</p>
        <img src="../assets/icons/KaiOS-Info_56.png" style="position:absolute; right:10px; top:85px">
        </li>
        <li id = "2">${localeData[controls.col]["2"]} ${buildInfo[0]}
        </li>
        <li id = "3">${localeData[controls.col]["3"]} ${buildInfo[1]}
        </li>
        </ul>`;
        controls.rowLimit = 3;
        break;
    }

    controls.colLimit = 11;
    if (returnOnlyData) return menu;
    return menu;
  },
};

function scrollHide() {
  let row = "row";
  let limit = 4;
  let obj = "";
  if (draw.listMenuState) {
    limit = 6;
  }
  if(draw.detailsState){
    limit = 1;
    row = row + "Details"
    obj = "details-"
  }
  const entriesAmount = controls[row + "Limit"];
  if (entriesAmount <= limit) {
    return;
  }
  const scrolls = Math.ceil(entriesAmount / limit);
  const currentScrollPos = Math.ceil(controls[row] / limit);
  let stopLimit = currentScrollPos * limit + 1;
  if (stopLimit > entriesAmount) {
    stopLimit = entriesAmount; // Prevent overflow
  }
  let startLimit = stopLimit - limit;
  debug.print(
    `scrollHide() - startLimit: ${startLimit} , endLimit: ${stopLimit}`
  );
  showElements(obj, startLimit, stopLimit);
  if (scrolls == currentScrollPos) {
    startLimit += 1; // Prevent overflow in the last scroll
  }
  hideElements(obj, 1, startLimit - 1, stopLimit);
}

function hideElement(id) {
  document.getElementById(id).style.display = "none";
}
function showElement(id) {
  document.getElementById(id).style.display = "flex";
}

function showElements(obj, start, end) {
  debug.print(`scrollHide() - showElements() - from ${start} upto ${end}`);
  for (let i = start; i <= end; i++) {
    showElement(obj + i);
  }
}
function hideElements(obj, startUp, endUp) {
  debug.print(`scrollHide() - hideElements() - from ${startUp} upto ${endUp}`);
  if (startUp != endUp || startUp == 1) {
    for (let i = startUp; i <= endUp; i++) {
      hideElement(obj + i);
    }
  }
}

function getInfoString(item, arg = undefined) {
  switch (item) {
    default:
      return "Unknown";
    case "system-model":
      return systemData.model;
    case "system-os":
      return systemData.osVersion;
    case "system-firefox":
      return systemData.firefoxVersion;
    case "system-ram":
      return `${systemData.ram} MB`;
    case "system-developer":
      return systemData.developerMode;
    case "display-resolution":
      return displayData.resolution;
    case "display-depth":
      return `${displayData.colorDepth}-bit color`;
    case "display-aspect-ratio":
      return displayData.aspectRatio;
    case "display-orientation":
      return displayData.screenOrientation;
    case "cpu-cores":
      return cpuData.coresAmount;
    case "cpu-frequency":
      return `~${cpuData.estimatedFrequency} GHz`;
    case "gpu":
      return gpuData.model;
    case "gpu-man":
      return gpuData.manufacturer;
    case "camera-name":
    case "camera-id":
    case "camera-photo-resolution":
    case "camera-photo-focal":
    case "camera-video-resolution":
    case "camera-video-bitrate":
    case "camera-video-framerate":
    case "camera-video-codec":
      return cameraData.get(item, arg);
    case "battery-level":
    case "battery-health":
    case "battery-status":
    case "battery-temperature":
      return batteryData.get(item.replace("battery-", ""));
    case "wifi":
    case "wifi-type":
    case "wifi-ssid":
    case "wifi-speed":
    case "wifi-signal":
    case "wifi-ip":
    case "wifi-frequency":
    case "wifi-internet":
    case "wifi-hidden":
    case "wifi-mac":
      return getWifiInfo(item);
    case "network-type":
    case "network-sim-provider":
    case "network-sim-type":
    case "network-sim-signal":
    case "network-sim-roaming":
    case "network-sim-state":
    case "network-sim-iccid":
      return getNetworkInfo(item, arg);
    case "network-amount":
      if (navigator.mozMobileConnections) {
        return navigator.mozMobileConnections.length;
      } else {
        return 0;
      }
    case "bluetooth-status":
    case "bluetooth-name":
    case "bluetooth-address":
    case "bluetooth-discoverable":
    case "bluetooth-discovering":
      return getBluetoothInfo(item);
    case "bluetooth":
      if (navigator.mozBluetooth === undefined) {
        return false;
      } else {
        return true;
      }
    case "storage-type":
      return storageData.storageName[arg] == "sdcard"
        ? `Internal (${storageData.storageName[arg]})`
        : `External (${storageData.storageName[arg]})`;
    case "storage-space-total":
      return `${(storageData.totalSpace[arg] * 1e-9).toFixed(2)} GB`;
    case "storage-space-left":
      return `${(storageData.usedSpace[arg] * 1e-9).toFixed(
        2
      )} GB (${Math.round(
        (storageData.usedSpace[arg] / storageData.totalSpace[arg]) * 100
      )} %)`;
    case "storage-default":
      return storageData.isDefault[arg];
  }
}

const storageData = {
  apiAccess: undefined,
  init: function (callback) {
    if (navigator.getDeviceStorages === undefined) {
      this.apiAccess = false;
      this.deviceStorages = [];
      if (typeof callback === "function") {
        callback("storage data (API Access failed)");
      }
      return;
    }
    this.apiAccess = true;
    this.deviceStorages = navigator.getDeviceStorages("sdcard") || [];
    if (this.deviceStorages.length > 0) {
      this.storageName = [];
      this.freeSpace = [];
      this.usedSpace = [];
      this.totalSpace = [];
      this.isDefault = [];
      for (let i = 0; i < this.deviceStorages.length; i++) {
        this.storageName.push(this.deviceStorages[i].storageName);
        this.isDefault.push(this.deviceStorages[i].default);
        const freeSpacePromise = this.deviceStorages[i].freeSpace();
        const usedSpacePromise = this.deviceStorages[i].usedSpace();
        Promise.all([freeSpacePromise, usedSpacePromise]).then((results) => {
          storageData.freeSpace.push(results[0]);
          storageData.usedSpace.push(results[1]);
          storageData.totalSpace.push(results[0] + results[1]);
          if (typeof callback === "function") {
            callback(
              `storage data (${
                this.storageName[storageData.freeSpace.length - 1]
              })`,
              storageData.freeSpace.length < storageData.deviceStorages.length
            );
          }
        });
      }
    }
  },
  refresh: function (callback = false) {
    if (this.apiAccess === false) {
      return;
    }
    if (this.onGoing && !callback) return;
    if (callback) {
      if (this.usedSpaceTmp.length != this.deviceStorages.length) return; // Will break if SD card was inserted/removed, requires better solution
      debug.print("storageData.refresh() - Refresh successful");
      this.storageName = this.storageNameTmp;
      this.freeSpace = this.freeSpaceTmp;
      this.usedSpace = this.usedSpaceTmp;
      this.totalSpace = this.totalSpaceTmp;
      this.isDefault = this.isDefaultTmp;
      this.onGoing = false;
      delete this.storageNameTmp;
      delete this.freeSpaceTmp;
      delete this.usedSpaceTmp;
      delete this.totalSpaceTmp;
      delete this.isDefaultTmp;
      delete this.processOngoing;
      return;
    }
    this.deviceStorages = navigator.getDeviceStorages("sdcard") || [];
    this.storageNameTmp = [];
    this.freeSpaceTmp = [];
    this.usedSpaceTmp = [];
    this.totalSpaceTmp = [];
    this.isDefaultTmp = [];
    this.onGoing = true;
    for (let i = 0; i < this.deviceStorages.length; i++) {
      this.storageNameTmp.push(this.deviceStorages[i].storageName);
      this.isDefaultTmp.push(this.deviceStorages[i].default);
      const freeSpacePromise = this.deviceStorages[i].freeSpace();
      const usedSpacePromise = this.deviceStorages[i].usedSpace();
      Promise.all([freeSpacePromise, usedSpacePromise]).then((results) => {
        storageData.freeSpaceTmp.push(results[0]);
        storageData.usedSpaceTmp.push(results[1]);
        storageData.totalSpaceTmp.push(results[0] + results[1]);
        storageData.refresh(true);
      });
    }
  },
};

const batteryData = {
  data: null,
  init: function (callback) {
    if (!navigator.getBattery) {
      if (typeof callback === "function") {
        callback("battery data (API Access failed)");
      }
      this.initStatus = false;
      return;
    }
    this.initStatus = true;
    navigator.getBattery().then(function (result) {
      batteryData.data = result;
      if (typeof callback === "function") {
        callback("battery data");
      }
    });
  },
  get: function (type) {
    if (!this.initStatus) {
      return false;
    }
    let returnString = this.data[type];
    if (type == "level") {
      returnString = `${Math.round(parseFloat(returnString) * 100)} %`;
    } else if (type == "temperature") {
      returnString += " °C";
    } else if (type == "status") {
      if (this.data.charging) {
        if (this.data.chargingTime == 0) {
          returnString = "Charged";
        } else {
          let remainingTime = "";
          if (this.data.chargingTime != Infinity) {
            let hours = this.data.chargingTime / 3600;
            const minutes = Math.ceil((hours - Math.floor(hours)) * 60);
            const additionalZero = minutes < 10 ? "0" : "";
            hours = Math.floor(hours);
            remainingTime = `(${hours}:${additionalZero}${minutes} left)`;
          }
          returnString = `Charging ${remainingTime}`;
        }
      } else {
        let remainingTime = "";
        if (this.data.dischargingTime != Infinity) {
          let hours = this.data.dischargingTime / 3600;
          const minutes = Math.ceil((hours - Math.floor(hours)) * 60);
          const additionalZero = minutes < 10 ? "0" : "";
          hours = Math.floor(hours);
          remainingTime = `(${hours}:${additionalZero}${minutes} left)`;
        }
        returnString = `Discharging ${remainingTime}`;
      }
    }
    return returnString;
  },
};

const systemData = {
  data: [],
  init: function (callback) {
    const userAgent = navigator.userAgent;
    let userAgentArr = [];
    let data = ""

    for(let i = 0; i<userAgent.length; i++){
      if(userAgent[i] === " "){
        userAgentArr.push(data);
        data = "";
      }
      else if (userAgent[i] === "(" || userAgent[i] === ")" || userAgent[i] === ";"){
        //pass
      }
      else if(userAgent[i] === "_" || userAgent[i] === "/"){
        data += " ";
      }
      else{
        data += userAgent[i]
      }
    }
    userAgentArr.push(data);
    if(userAgentArr.length < 6){
      userAgentArr.unshift("")
      userAgentArr[0] = userAgentArr[1];
      userAgentArr[1] = userAgentArr[2];
      userAgentArr[2] = "Unknown";
    }
    if(userAgentArr.length < 7){
      userAgentArr.push("Unknown")
    }
    this.model = userAgentArr[2];
    this.osVersion = userAgentArr[6].includes("KAIOS") ? `KaiOS ${userAgentArr[6].substring(6)}` : userAgentArr[6];
    this.firefoxVersion = userAgentArr[5].includes("Firefox") ? userAgentArr[5].substring(8) : userAgentArr[5];
    if (navigator.hasFeature) {
      const getMemoryPromise = navigator.getFeature("hardware.memory");
      const getDeveloperModePromise = navigator.getFeature(
        "dom.apps.developer_mode"
      );
      Promise.all([getMemoryPromise, getDeveloperModePromise]).then(
        (results) => {
          systemData.ram = results[0];
          systemData.developerMode = results[1];
          if (typeof callback === "function") {
            callback("system data");
          }
        }
      );
    } else {
      if (typeof callback === "function") {
        callback("system data (1/2 API Access failed)");
      }
    }
  },
};

const displayData = {
  init: function (callback) {
    this.screenOrientation =
      window.screen.mozOrientation || window.screen.orientation.type;
    if (this.screenOrientation.includes("portrait")) {
      this.screenOrientation = "Portrait";
      this.resolution = `${window.screen.height}x${window.screen.width}`;
    } else {
      this.screenOrientation = "Landscape";
      this.resolution = `${window.screen.width}x${window.screen.height}`;
    }
    this.colorDepth = window.screen.colorDepth;
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const commonDivisor = gcd(window.screen.width, window.screen.height);
    const ratioWidth = window.screen.width / commonDivisor;
    const ratioHeight = window.screen.height / commonDivisor;
    if (this.screenOrientation === "Portrait") {
      this.aspectRatio = `${ratioHeight}:${ratioWidth}`;
    } else {
      this.aspectRatio = `${ratioWidth}:${ratioHeight}`;
    }
    if (typeof callback === "function") {
      callback("display data");
    }
  },
};

const cpuData = {
  init: function (callback) {
    this.coresAmount = navigator.hardwareConcurrency;
    const runs = 150000000;
    const start = performance.now();
    for (let i = runs; i > 0; i--) {
      //pass
    }
    const end = performance.now();
    const ms = end - start;
    const cyclesPerRun = 2;
    this.estimatedFrequency = ((runs / ms / 1000000) * cyclesPerRun).toFixed(2);
    if (typeof callback === "function") {
      callback("CPU data");
    }
  },
};

function getBluetoothInfo(type) {
  const bluetoothData = navigator.mozBluetooth.defaultAdapter;
  switch (type) {
    case "bluetooth-status":
      return (
        bluetoothData.state[0].toUpperCase() + bluetoothData.state.slice(1)
      );
    case "bluetooth-name":
      return bluetoothData.name;
    case "bluetooth-address":
      return bluetoothData.address;
    case "bluetooth-discoverable":
      return bluetoothData.discoverable;
    case "bluetooth-discovering":
      return bluetoothData.discovering;
  }
}

function toggleBluetooth() {
  const bluetoothData = navigator.mozBluetooth;
  if (bluetoothData === undefined) {
    debug.print("toggleBluetooth() - No access to API");
    return false;
  }
  if (bluetoothData.defaultAdapter.state === "disabled") {
    bluetoothData.defaultAdapter.enable();
    debug.print("toggleBluetooth() - Bluetooth enabled");
    toast("Bluetooth enabled");
  } else {
    bluetoothData.defaultAdapter.disable();
    debug.print("toggleBluetooth() - Bluetooth disabled");
    toast("Bluetooth disabled");
  }
  return true;
}

function toggleNetwork(sim) {
  const NetworkData = navigator.mozMobileConnections[sim];
  if (NetworkData === undefined) {
    debug.print("toggleNetwork() - No access to API");
    return false;
  }
  if (NetworkData.radioState === "disabled") {
    NetworkData.setRadioEnabled(true);
    debug.print(`toggleNetwork() - SIm ${sim + 1} - Radio enabled`);
    toast(`SIM ${sim + 1} - Radio enabled`);
  } else if (NetworkData.radioState === "enabled") {
    NetworkData.setRadioEnabled(false);
    debug.print(`toggleNetwork() - SIM ${sim + 1} - Radio disabled`);
    toast(`SIM ${sim + 1} - Radio disabled`);
  } else {
    debug.print(
      `toggleNetwork() - SIM ${sim + 1} - Radio ${NetworkData.radioState}`
    );
    toast(`SIM ${sim + 1} - Radio ${NetworkData.radioState}`);
    return;
  }
  return true;
}

function toggleWifi() {
  const wifiData = navigator.mozWifiManager;
  if (wifiData === undefined) {
    debug.print("toggleWifi() - No access to API");
    return false;
  }
  if (wifiData.enabled == false) {
    wifiData.setWifiEnabled(true);
    debug.print("toggleWifi() - Wifi enabled");
    toast("Wifi enabled");
  } else {
    wifiData.setWifiEnabled(false);
    debug.print("toggleWifi() - Wifi disabled");
    toast("Wifi disabled");
  }
  return true;
}

function getWifiInfo(type) {
  const wifiData = navigator.mozWifiManager;
  if (wifiData === undefined) return false;
  else if (type === "wifi") return true;
  const wifiConnectionData = wifiData.connectionInformation;
  const wifiStatus = wifiData.enabled ? "Enabled" : "Disabled";
  switch (type) {
    case "wifi-type":
      return `Wi-Fi (${wifiStatus})`;
    case "wifi-mac":
      return wifiData.macAddress;
    case "wifi-ssid":
      return `${
        wifiData.connection.network
          ? wifiData.connection.network.ssid
          : wifiData.connection.status
      }`;
    case "wifi-speed":
      if (!wifiData.connection || !wifiConnectionData) {
        return wifiData.connection.status;
      }
      return `${wifiConnectionData.linkSpeed} Mbps (${wifiConnectionData.relSignalStrength} %)`;
    case "wifi-signal":
      if (!wifiConnectionData) {
        return wifiData.connection.status;
      }
      return `${wifiConnectionData.signalStrength} dBm`;
    case "wifi-ip":
      if (!wifiConnectionData) {
        return wifiData.connection.status;
      }
      return wifiConnectionData.ipAddress;
    case "wifi-frequency":
      if (!wifiConnectionData) {
        return wifiData.connection.status;
      }
      return `${wifiData.connection.network.frequency} MHz`;
    case "wifi-internet":
      return wifiData.hasInternet;
    case "wifi-hidden":
      if (!wifiConnectionData) {
        return wifiData.connection.status;
      }
      return wifiData.connection.network.hidden;
  }
}

function getNetworkInfo(type, sim) {
  if (navigator.mozMobileConnections === undefined) return false;
  const mobileData = navigator.mozMobileConnections[sim];
  let activeType = mobileData.data.type
    ? mobileData.data.type.toUpperCase()
    : undefined;
  let activeSignal =
    mobileData.signalStrength.lteSignalStrength === 99
      ? undefined
      : `${mobileData.signalStrength.lteRsrp} dBm`;
  switch (type) {
    case "network-type":
      return `Cell - SIM ${sim + 1} (${
        mobileData.radioState[0].toUpperCase() + mobileData.radioState.slice(1)
      })`;
    case "network-sim-provider":
      return `${mobileData.data.network.longName || "Disconnected"}`;
    case "network-sim-type":
      if (!activeType) {
        activeType =
          mobileData.data.network.state === "connected"
            ? "GSM"
            : "Disconnected"; // if connected assume that it is GSM
      }
      return activeType;
    case "network-sim-signal":
      // GSM Signal strength described in section 8.5 (ETSI TS 127 007 V6.8.0) https://www.etsi.org/deliver/etsi_ts/127000_127099/127007/06.08.00_60/ts_127007v060800p.pdf
      if(mobileData.radioState === "disabled"){
        return "Disconnected"
      }
      if (!activeSignal) {
        activeSignal =
          mobileData.signalStrength.gsmSignalStrength === 99
            ? "Unknown"
            : `${gsmSignalStrengthToDbm(
                mobileData.signalStrength.gsmSignalStrength
              )} dBm (${Math.round(
                (mobileData.signalStrength.gsmSignalStrength / 31) * 100
              )}%)`;
      }
      return activeSignal;
    case "network-sim-roaming":
      return mobileData.data.roaming;
    case "network-sim-state":
      return mobileData.voice.state || "Disconnected";
    case "network-sim-iccid":
      return mobileData.iccId;
  }
}

function gsmSignalStrengthToDbm(gsmSignalStrength) {
  if (gsmSignalStrength === 0) {
    return -113;
  } else if (gsmSignalStrength === 1) {
    return -111;
  } else if (gsmSignalStrength >= 2 && gsmSignalStrength <= 30) {
    let x1 = 2,
      y1 = -109;
    let x2 = 30,
      y2 = -53;
    return y1 + ((gsmSignalStrength - x1) * (y2 - y1)) / (x2 - x1);
  } else if (gsmSignalStrength === 31) {
    return -51;
  } else {
    return NaN;
  }
}

const cameraData = {
  cameraInfo: [],
  camerasList: undefined,
  init: function (callback) {
    if (typeof navigator.mozCameras !== "object") {
      if (typeof callback === "function") {
        callback("camera data (API Access failed)");
      }
      cameraData.initStatus = false;
      return;
    }
    try {
      this.camerasList = navigator.mozCameras.getListOfCameras();
    } catch (e) {
      if (typeof callback === "function") {
        callback("camera data (API Access failed)");
      }
      cameraData.initStatus = false;
      return;
    }
    cameraData.initStatus = true;
    if (this.camerasList.length > 0) {
      for (let i = 0; i < this.camerasList.length; i++) {
        navigator.mozCameras
          .getCamera(this.camerasList[i])
          .then(function (result) {
            cameraData.cameraInfo.push(result);
          });
      }
      if (typeof callback === "function") {
        callback("camera data");
      }
    }
  },
  get: function (type, currentCameras) {
    if (!this.initStatus) {
      return false;
    }
    const camera = this.cameraInfo[currentCameras];
    const currentRecorder =
      this.cameraInfo[currentCameras].configuration.recorderProfile;
    const recorder =
      this.cameraInfo[currentCameras].camera.capabilities.recorderProfiles[
        currentRecorder
      ];
    switch (type) {
      case "camera-name":
        return (
          this.camerasList[currentCameras][0].toUpperCase() +
          this.camerasList[currentCameras].slice(1)
        );
      case "camera-id":
        return camera.camera.id.slice(1).slice(0, -1);
      case "camera-photo-resolution":
        return `${(
          camera.camera.capabilities.pictureSizes[0].width *
          camera.camera.capabilities.pictureSizes[0].height *
          1e-6
        ).toFixed(2)} MP (${camera.camera.capabilities.pictureSizes[0].width}x${
          camera.camera.capabilities.pictureSizes[0].height
        })`;
      case "camera-photo-focal":
        return `${camera.camera.focalLength.toFixed(2)} mm`;
      case "camera-video-resolution":
        return `${recorder.name} (${recorder.video.width}x${recorder.video.height})`;
      case "camera-video-bitrate":
        return `${recorder.video.bitsPerSecond * 1e-6} Mbps`;
      case "camera-video-framerate":
        return recorder.video.framesPerSecond;
      case "camera-video-codec":
        return recorder.video.codec;
    }
  },
};

const gpuData = {
  init: function (callback) {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("experimental-webgl") || canvas.getContext("webgl"); // KaiOS 2.5 only supports Experimental-webgl, so start there
    if (gl) {
      this.model = this.getUnmaskedInfo(gl).renderer;
      this.manufacturer = this.getUnmaskedInfo(gl).vendor;
      this.initStatus = true;
      if (typeof callback === "function") {
        callback("GPU data");
      }
    } else {
      if (typeof callback === "function") {
        callback("GPU data (API Access failed)");
      }
      this.initStatus = false;
    }
  },
  getUnmaskedInfo: function (gl) {
    let unMaskedInfo = {
      renderer: "",
      vendor: "",
    };

    let dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbgRenderInfo != null) {
      unMaskedInfo.renderer = gl.getParameter(
        dbgRenderInfo.UNMASKED_RENDERER_WEBGL
      );
      unMaskedInfo.vendor = gl.getParameter(
        dbgRenderInfo.UNMASKED_VENDOR_WEBGL
      );
    } else {
      return "Unknown";
    }
    return unMaskedInfo;
  },
};

function menuHover(row = undefined, pastRow = undefined, obj = undefined) {
  debug.print(
    `menuHover() - Row ${obj}${row} - Hover, Row ${obj}${pastRow}: Unhover`
  );
  if (pastRow) {
    const pastElement = document.getElementById(obj + pastRow);
    if (pastElement) {
      pastElement.classList.remove("hovered");
    }
  }
  if (row) {
    const currentElement = document.getElementById(obj + row);
    if (currentElement) {
      currentElement.classList.add("hovered");
    }
  }
}

function toast(msg = null) {
  let toastElement = document.getElementById("toast");
  if (msg != null) {
    toastElement.classList.remove("notactive");
    toastElement.classList.add("active");
    toastElement.innerHTML = `<span>${msg}</span>`;
    debug.print("toast() - Toast activated");
    setTimeout(function () {
      toastElement.classList.remove("active");
      toastElement.classList.add("notactive");
      debug.print("toast() - Toast deactivated");
    }, 2 * 1000);
  }
}

document.activeElement.addEventListener("keydown", controls.handleKeydown);
