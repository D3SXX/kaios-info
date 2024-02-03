"use strict";

const buildInfo = ["0.0.22", "03.02.2024"];
let localeData;

fetch("src/locale.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => initProgram(data));

function initProgram(data) {
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
    if(!skipCount){
    completedCount++;
    }
    draw.updateProgressBar(completedCount,initFunctions.length, "Initialized " + description);
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
      this.applySkip("increase");
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
      this.applySkip("decrease");
    } else {
      this[type] = this[limit];
    }
    debug.print(`controls.decrease() - ${type}: ${this[type]}`);
    scrollHide();
  },
  applySkip: function (type) {
    if (menu.hideList.length == 0) return;
    let startAt = menu.getHideListBoundaries("start");
    let endAt = menu.getHideListBoundaries("end");
    if (!startAt || !endAt) {
      return false;
    }
    let skip = [];
    for (let i = 0; i < startAt.length; i++) {
      if (menu.hideList.includes(startAt[i])) {
        skip.push(startAt[i]);
        skip.push(endAt[i]);
      }
    }
    for (let i = 0; i < skip.length; i += 2) {
      if (controls.row > skip[i] && controls.row <= skip[i + 1]) {
        console.log(skip[i], skip[i + 1], controls.row);
        switch (type) {
          case "increase":
            controls.row = skip[i + 1] + 1;
            return true;
          case "decrease":
            controls.row = skip[i];
            return true;
        }
      }
    }
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
    if(draw.sideMenuState){
      switch(controls.rowMenu){
        case 1:
          draw.toggleListMenu();
          break;
        case 2:
          menu.forceDisableRefresh = !menu.forceDisableRefresh;
          debug.print(`controls.handleEnter() - forceDisableRefresh is set to ${menu.forceDisableRefresh}`)
          break;
        case 3:
          break;
        case 4:
          window.close();
      }
      draw.toggleSideMenu();
    }
    switch (this.col) {
      case 7:
        menu.toggleList();
        break;
    }
  },
  handleSoftLeft: function(){
    switch (this.col) {
      case 8:
        toggleBluetooth();
        menu.refreshMenu();
        break;
    }
  },
  handleKeydown: function (e) {
    debug.print(`${e.key} triggered`);
    let rowType = "row"
    let hoverArg = "";
    if(draw.sideMenuState){
      rowType = rowType + "Menu";
      hoverArg = "m";
      if(e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "SoftLeft"){
        return;
      }
    }
    if(draw.listMenuState){
        hoverArg = "";
        let pastCol = controls.col;
        switch(e.key){
          case "ArrowRight":
          case "ArrowDown":
            controls.increase("col");
            controls.row = controls.col;
            menuHover(controls.col, pastCol, hoverArg);
            scrollHide();
            return;
          case "ArrowLeft":
          case "ArrowUp":
            controls.decrease("col");
            controls.row = controls.col;
            menuHover(controls.col, pastCol, hoverArg);
            scrollHide()
            return;
          case "Enter":
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
        controls.decrease(rowType);
        menuHover(controls[rowType], pastRow, hoverArg);
        break;
      case "ArrowDown":
        controls.increase(rowType);
        menuHover(controls[rowType], pastRow, hoverArg);
        break;
      case "ArrowRight":
        controls.increase("col");
        menu.draw();
        break;
      case "ArrowLeft":
        controls.decrease("col");
        menu.draw();
        break;
      case "Enter":
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
  softkeysArr: ["","",""],
  default: function(){
    this.softkeysArr[0] = "";
    this.softkeysArr[1] = localeData[0]["softCenter"];
    this.softkeysArr[2] = localeData[0]["softRight"];
  },
  get: function(){
    if(draw.sideMenuState){
      this.softkeysArr[0] = "";
      this.softkeysArr[1] = "";
      this.softkeysArr[2] = localeData[0]["close"];
      return;
    }
    this.default();
    const col = controls["col"];
    const row = controls["row"];
    switch(col){
      case 8:
        if (row === 1 && getInfoString("bluetooth")){
          this.softkeysArr[0] = localeData[0]["softLeftToggle"]; 
        }
    }
  },
  draw: function(){
    this.get();
    let softkeys = "";
    const softkeyContainer = document.getElementById("softkey");
  
    softkeys += `<label id="left">${this.softkeysArr[0]}</label>`
    softkeys += `<label id="center">${this.softkeysArr[1]}</label>`
    softkeys += `<label id="right">${this.softkeysArr[2]}</label>`
    softkeyContainer.innerHTML = softkeys;
  }
}

const draw = {
  sideMenuState: false,
  updateProgressBar: function(value,maxValue, text){
    document.getElementById("progress-bar-loading").max = maxValue
    document.getElementById("progress-bar-loading").value = value
    document.getElementById("loading-bar-text").innerText = text;
  },
  closeLoadingPage: function(){
    document.getElementById("loading").classList.add('hidden');
  },
  initSideMenu(){
    const menuElements = [localeData[0]["sidemenu-openlistmenu"],localeData[0]["sidemenu-togglerefresh"],localeData[0]["sidemenu-about"],[localeData[0]["sidemenu-exit"]]];
    const element = document.getElementById("menu");
    let menuData = "";
    for (let i = 0; i<menuElements.length; i++){
      menuData += `<div id="m${i+1}" class="menuItem">${menuElements[i]}</div>`;
    }
    element.innerHTML = menuData;
    controls.rowMenuLimit = menuElements.length;
    controls.rowMenu = 1;
    menuHover(1,undefined,"m");
    debug.print("draw.initSideMenu - Side menu initialized")
  },
  toggleSideMenu(){
    this.sideMenuState = !this.sideMenuState;
    if(this.sideMenuState){
      document.getElementById("menu").classList.remove("hidden");
    }
    else{
      document.getElementById("menu").classList.add("hidden");
    }
  },
  initListMenu(){
    const element = document.getElementById("menu-list");
    let menuData = "<ul>";
    for(let i = 1; i<localeData.length; i++){
      menuData += `<li id="${i}" class="menuItem">${localeData[i]["index"]}</li>`;
    }
    menuData += "</ul>"
    element.innerHTML = menuData;
  },
  toggleListMenu(){
    this.listMenuState = !this.listMenuState;
    if (this.listMenuState){
      menu.forceDisableRefresh = true;
      menu.splitAtRow = [];
      document.getElementById("menu-list").classList.remove("hidden");
      controls.colLimit = localeData.length - 1;
      controls.rowLimit = localeData.length - 1;
      controls.row = controls.col;
      document.getElementById("menu-container").innerHTML = "";
      menuHover(controls.col, undefined,"");
      scrollHide();
    }
    else{
      menu.forceDisableRefresh = false;
      menuHover(undefined,controls.col,"")
      document.getElementById("menu-list").classList.add("hidden");
      menu.draw();
      softkeys.draw();
    }

  }
}

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
    let data;
    data = this.getMenuData(col);
    menuContainer.innerHTML = data[0];
    this.updateNavbar(data[1]);
    try {
      clearTimeout(this.timeoutID);
    } catch (e) {
      debug.print("menu.draw() - Refreshing menu for the first time");
    }
    document.getElementById("l" + controls.col).className = "hovered";
    document.getElementById(controls.row).className = "hovered";
    this.refreshMenu();
  },
  getHideListBoundaries: function (type) {
    if (this.splitAtRow.length > 0) {
      let startAt = [],
        endAt = [];
      for (let i = 0; i < this.splitAtRow.length; i += 2) {
        startAt.push(this.splitAtRow[i]);
        endAt.push(this.splitAtRow[i + 1]);
      }
      switch (type) {
        case "start":
          return startAt;
        case "end":
          return endAt;
        default:
          return false;
      }
    } else {
      return false;
    }
  },
  toggleList: function (forceHide = undefined) {
    let startAt = this.getHideListBoundaries("start");
    let endAt = this.getHideListBoundaries("end");
    if (!startAt || !endAt) {
      return;
    }
    if (startAt.includes(controls.row)) {
      endAt = endAt[startAt.indexOf(controls.row)];
      startAt = startAt[startAt.indexOf(controls.row)];
      if (
        (document.getElementById(controls.row + 1).style.display === "none") &
        (forceHide != "hide")
      ) {
        debug.print(
          `toggleList() - Showing elements from ${startAt} to ${endAt}`
        );
        showElements("", startAt + 1, endAt);
        this.hideList = this.hideList.filter(function (element) {
          return element !== controls.row;
        });
        const oldText = removeAllElementsInString(
          document.getElementById(startAt).innerHTML,
          "  ↓"
        );
        document.getElementById(startAt).innerHTML = `${oldText}  &#8593;`;
      } else {
        debug.print(
          `toggleList() - hiding elements from ${startAt} to ${endAt}`
        );
        hideElements("", startAt + 1, endAt);
        this.hideList.push(controls.row);
        let oldText = removeAllElementsInString(
          document.getElementById(startAt).innerHTML,
          "  ↑"
        );
        document.getElementById(startAt).innerHTML = `${oldText}  &#8595;`;
      }
    } else {
      return;
    }
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
  updateNavbar: function (navbarArr) {
    const navbarContainer = document.getElementById("nav-bar");
    navbarContainer.innerHTML = navbarArr;
  },
  getMenuData: function (col, returnOnlyData = false) {
    let menu = "";
    let rowCount = 1;
    this.enableRefresh = false;
    this.splitAtRow = [];
    let navbarEntries = `<span id="l1" class = "active">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
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
        navbarEntries = `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="active">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
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
        navbarEntries = `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="active">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
        menu = `<ul>
        <li id="1">${localeData[3]["1"]}: ${getInfoString("cpu")}</li>
        <li id="2">${localeData[3]["2"]}: ${getInfoString("cpu-cores")}</li>
        <li id="3">${localeData[3]["3"]}: ${getInfoString("cpu-frequency")}</li>
        </ul>`;
        controls.rowLimit = 3;
        break;
      case 4:
        navbarEntries = `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="active">${localeData[4]["index"]}</span></span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
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
        navbarEntries = `<span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="active">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
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
        navbarEntries = `<span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="active">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
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
        this.hideList = [];
        navbarEntries = `<span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="active">${localeData[7]["index"]}</span><span id="l8" class="notactive">${localeData[8]["index"]}</span>`;
        if (getInfoString("network-wifi")) {
          if (returnOnlyData) {
            menu = [
              `${localeData[7]["1"]}: ${getInfoString("network-wifi-type")}${
                this.hideList.includes(1) ? "  ↓" : "  ↑"
              }`,
              `${localeData[7]["2"]}: ${getInfoString("network-wifi-ssid")}`,
              `${localeData[7]["3"]}: ${getInfoString("network-wifi-speed")}`,
              `${localeData[7]["4"]}: ${getInfoString("network-wifi-signal")}`,
              `${localeData[7]["5"]}: ${getInfoString("network-wifi-ip")}`,
              `${localeData[7]["6"]}: ${getInfoString(
                "network-wifi-frequency"
              )}`,
              `${localeData[7]["7"]}: ${getInfoString(
                "network-wifi-internet"
              )}`,
              `${localeData[7]["8"]}: ${getInfoString("network-wifi-hidden")}`,
              `${localeData[7]["9"]}: ${getInfoString("network-wifi-mac")}`,
            ];
          } else {
            menu = `<ul>
          <li id="1">${localeData[7]["1"]}: ${getInfoString(
              "network-wifi-type"
            )}${this.hideList.includes(1) ? "  ↓" : "  ↑"}</li>
          <li id="2">${localeData[7]["2"]}: ${getInfoString(
              "network-wifi-ssid"
            )}</li>
          <li id="3">${localeData[7]["3"]}: ${getInfoString(
              "network-wifi-speed"
            )}</li>
          <li id="4">${localeData[7]["4"]}: ${getInfoString(
              "network-wifi-signal"
            )}</li>
          <li id="5">${localeData[7]["5"]}: ${getInfoString(
              "network-wifi-ip"
            )}</li>
          <li id="6">${localeData[7]["6"]}: ${getInfoString(
              "network-wifi-frequency"
            )}</li>
          <li id="7">${localeData[7]["7"]}: ${getInfoString(
              "network-wifi-internet"
            )}</li>
          <li id="8">${localeData[7]["8"]}: ${getInfoString(
              "network-wifi-hidden"
            )}</li>
          <li id="9">${localeData[7]["9"]}: ${getInfoString(
              "network-wifi-mac"
            )}</li>
          `;
          }
          this.splitAtRow.push(1, 9);
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

        if (getInfoString("network-telephony-amount") > 0) {
          for (let i = 0; i < getInfoString("network-telephony-amount"); i++) {
            if (returnOnlyData) {
              menu.push(
                `${localeData[7]["10"]}: ${getInfoString(
                  "network-telephony-type",
                  i
                )}`,
                `${localeData[7]["11"]}: ${getInfoString(
                  "network-telephony-sim-provider",
                  i
                )}`,
                `${localeData[7]["12"]}: ${getInfoString(
                  "network-telephony-sim-type",
                  i
                )}`,
                `${localeData[7]["13"]}: ${getInfoString(
                  "network-telephony-sim-signal",
                  i
                )}`,
                `${localeData[7]["14"]}: ${getInfoString(
                  "network-telephony-sim-roaming",
                  i
                )}`,
                `${localeData[7]["15"]}: ${getInfoString(
                  "network-telephony-sim-state",
                  i
                )}`,
                `${localeData[7]["16"]}: ${getInfoString(
                  "network-telephony-sim-iccid",
                  i
                )}`
              );
              rowCount += 7;
              this.splitAtRow.push(rowCount - 7, rowCount - 1);
            } else {
              menu += `
              <li id="${rowCount++}">${localeData[7]["10"]}: ${getInfoString(
                "network-telephony-type",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[7]["11"]}: ${getInfoString(
                "network-telephony-sim-provider",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[7]["12"]}: ${getInfoString(
                "network-telephony-sim-type",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[7]["13"]}: ${getInfoString(
                "network-telephony-sim-signal",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[7]["14"]}: ${getInfoString(
                "network-telephony-sim-roaming",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[7]["15"]}: ${getInfoString(
                "network-telephony-sim-state",
                i
              )}</li>
              <li id="${rowCount++}">${localeData[7]["16"]}: ${getInfoString(
                "network-telephony-sim-iccid",
                i
              )}</li>
              `;
              this.splitAtRow.push(rowCount - 7, rowCount - 1);
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
        rowCount--;
        controls.rowLimit = rowCount;
        this.enableRefresh = true;
        break;
      case 8:
        navbarEntries = `<span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span><span id="l8" class="active">${localeData[8]["index"]}</span><span id="l9" class="notactive">${localeData[9]["index"]}</span>`;
        if (getInfoString("bluetooth")) {
          if (returnOnlyData) {
            menu = [];
            menu.push(
              `${localeData[8]["1"]}: ${getInfoString("bluetooth-status")}`,
              `${localeData[8]["2"]}: ${getInfoString("bluetooth-name")}`,
              `${localeData[8]["3"]}: ${getInfoString("bluetooth-address")}`,
              `${localeData[8]["4"]}: ${getInfoString(
                "bluetooth-discoverable"
              )}`,
              `${localeData[8]["5"]}: ${getInfoString("bluetooth-discovering")}`
            );
          } else {
            menu += `<ul>
            <li id="1">${localeData[8]["1"]}: ${getInfoString(
              "bluetooth-status"
            )}</li>
            <li id="2">${localeData[8]["2"]}: ${getInfoString(
              "bluetooth-name"
            )}</li>
            <li id="3">${localeData[8]["3"]}: ${getInfoString(
              "bluetooth-address"
            )}</li>
            <li id="4">${localeData[8]["4"]}: ${getInfoString(
              "bluetooth-discoverable"
            )}</li>
            <li id="5">${localeData[8]["5"]}: ${getInfoString(
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
      case 9:
        navbarEntries = `<span id="l7" class="notactive">${localeData[7]["index"]}</span><span id="l8" class="notactive">${localeData[8]["index"]}</span><span id="l9" class="active">${localeData[9]["index"]}</span>`;

        if (returnOnlyData) {
          menu = [];
          for (let i = 0; i < storageData.deviceStorages.length; i++) {
            menu.push(
              `${localeData[9]["1"]}: ${getInfoString("storage-type", i)}`,
              `${localeData[9]["2"]}: ${getInfoString(
                "storage-space-total",
                i
              )}`,
              `${localeData[9]["3"]}: ${getInfoString(
                "storage-space-left",
                i
              )}`,
              `${localeData[9]["4"]}: ${getInfoString("storage-default", i)}`
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
            <li id="${rowCount++}">${localeData[9]["1"]}: ${getInfoString(
              "storage-type",
              i
            )}</li>
            <li id="${rowCount++}">${localeData[9]["2"]}: ${getInfoString(
              "storage-space-total",
              i
            )}</li>
            <li id="${rowCount++}">${localeData[9]["3"]}: ${getInfoString(
              "storage-space-left",
              i
            )}</li>
            <li id="${rowCount++}">${localeData[9]["4"]}: ${getInfoString(
              "storage-default",
              i
            )}</li>
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
    }

    controls.colLimit = 9;
    if (returnOnlyData) return menu;
    return [menu, navbarEntries];
  },
};

function scrollHide() {
  let limit = 4;
  if(draw.listMenuState){
    limit = 5;
  }
  const entriesAmount = controls.rowLimit;
  if (entriesAmount <= limit) {
    return;
  }
  const scrolls = Math.ceil(entriesAmount / limit);
  const currentScrollPos = Math.ceil(controls.row / limit);
  let stopLimit = currentScrollPos * limit + 1;
  if (stopLimit > entriesAmount) {
    stopLimit = entriesAmount; // Prevent overflow
  }
  let startLimit = stopLimit - limit;
  if (
    menu.getHideListBoundaries("end")[0] >= startLimit &&
    menu.hideList.includes(menu.getHideListBoundaries("start")[0])
  ) {
    debug.print("scrollHide() - startLimit < hideList end position, returning");
    return;
  }
  debug.print(
    `scrollHide() - startLimit: ${startLimit} , endLimit: ${stopLimit}`
  );
  showElements("", startLimit, stopLimit);
  if (scrolls == currentScrollPos) {
    startLimit += 1; // Prevent overflow in the last scroll
  }
  hideElements("", 1, startLimit - 1, stopLimit);
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
      return displayData.colorDepth;
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
    case "network-wifi":
    case "network-wifi-type":
    case "network-wifi-ssid":
    case "network-wifi-speed":
    case "network-wifi-signal":
    case "network-wifi-ip":
    case "network-wifi-frequency":
    case "network-wifi-internet":
    case "network-wifi-hidden":
    case "network-wifi-mac":
    case "network-telephony-type":
    case "network-telephony-sim-provider":
    case "network-telephony-sim-type":
    case "network-telephony-sim-signal":
    case "network-telephony-sim-roaming":
    case "network-telephony-sim-state":
    case "network-telephony-sim-iccid":
      return getNetworkInfo(item, arg);
    case "network-telephony-amount":
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
              `storage data (${this.storageName[storageData.freeSpace.length - 1]})`,
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
      returnString = `${parseFloat(returnString) * 100}%`;
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
    const nameString = userAgent.substring(userAgent.search(";") + 1);
    this.model = nameString
      .substring(0, nameString.search(";"))
      .split("_")
      .join(" ");
    this.osVersion =
      "KaiOS " +
      userAgent.substring(userAgent.toUpperCase().search("KAIOS") + 6);
    const firefoxString = userAgent.substring(userAgent.search("Firefox") + 8);
    this.firefoxVersion = firefoxString.substring(0, firefoxString.search(" "));
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
    this.screenOrientation = window.screen.mozOrientation || window.screen.orientation.type;
    if(this.screenOrientation.includes("portrait")){
      this.screenOrientation = "Portrait"
      this.resolution = `${window.screen.height}x${window.screen.width}`;
    }
    else{
      this.screenOrientation = "Landscape"
      this.resolution = `${window.screen.width}x${window.screen.height}`;
    }
    this.colorDepth = window.screen.colorDepth;
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const commonDivisor = gcd(window.screen.width, window.screen.height);
    const ratioWidth = window.screen.width / commonDivisor;
    const ratioHeight = window.screen.height / commonDivisor;
    if(this.screenOrientation === "Portrait"){
      this.aspectRatio = `${ratioHeight}:${ratioWidth}`;
    }
    else{
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
  } else {
    bluetoothData.defaultAdapter.disable();
    debug.print("toggleBluetooth() - Bluetooth disabled");
  }
  return true;
}

function getNetworkInfo(type, sim) {
  if (type.includes("wifi")) {
    const wifiData = navigator.mozWifiManager;
    if (wifiData === undefined) return false;
    else if (type === "network-wifi") return true;
    const wifiConnectionData = wifiData.connectionInformation;
    const wifiStatus = wifiData.enabled ? "Enabled" : "Disabled";

    if (wifiStatus == "Enabled") {
      switch (type) {
        case "network-wifi-type":
          return `Wi-Fi (${wifiStatus})`;
        case "network-wifi-ssid":
          return `${wifiData.connection.network.ssid}`;
        case "network-wifi-speed":
          return `${wifiConnectionData.linkSpeed} Mbps`;
        case "network-wifi-signal":
          return `${wifiConnectionData.signalStrength} dBm`;
        case "network-wifi-ip":
          return wifiConnectionData.ipAddress;
        case "network-wifi-frequency":
          return `${wifiData.connection.network.frequency} MHz`;
        case "network-wifi-internet":
          return wifiData.hasInternet;
        case "network-wifi-hidden":
          return wifiData.connection.network.hidden;
        case "network-wifi-mac":
          return wifiData.macAddress;
      }
    } else {
      return "Disabled";
    }
  } else {
    if (navigator.mozMobileConnections === undefined) return false;
    const mobileData = navigator.mozMobileConnections[sim];
    const mobileStatus = mobileData.radioState ? "Enabled" : "Disabled";
    if (mobileStatus == "Enabled") {
      let activeType = mobileData.data.type
        ? mobileData.data.type.toUpperCase()
        : undefined;
      let activeSignal =
        mobileData.signalStrength.lteSignalStrength === 99
          ? undefined
          : `${mobileData.signalStrength.lteSignalStrength} dBm`;
      switch (type) {
        case "network-telephony-type":
          return `Cell - SIM ${sim + 1} (${
            mobileData.radioState ? "Enabled" : "Disabled"
          })`;
        case "network-telephony-sim-provider":
          return `${mobileData.data.network.longName || "Disconnected"}`;
        case "network-telephony-sim-type":
          if (!activeType) {
            activeType =
              mobileData.data.network.state === "connected"
                ? "GSM"
                : "Disconnected"; // if connected assume that it is GSM
          }
          return activeType;
        case "network-telephony-sim-signal":
          // GSM Signal strength described in section 8.5 (ETSI TS 127 007 V6.8.0) https://www.etsi.org/deliver/etsi_ts/127000_127099/127007/06.08.00_60/ts_127007v060800p.pdf
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
        case "network-telephony-sim-roaming":
          return mobileData.data.roaming;
        case "network-telephony-sim-state":
          return mobileData.voice.state;
        case "network-telephony-sim-iccid":
          return mobileData.iccId;
      }
    } else {
      return "Disabled";
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
    try{
      this.camerasList = navigator.mozCameras.getListOfCameras();
    }
    catch(e){
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
        return camera.camera.id;
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

function removeAllElementsInString(string, element) {
  // No support for replaceAll before firefox 77
  let newString = string;
  while (newString.indexOf(element) > -1) {
    newString = newString.replace(element, "");
  }
  return newString;
}

document.activeElement.addEventListener("keydown", controls.handleKeydown);
