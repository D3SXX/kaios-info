"use strict";

//const getSdcards = navigator.b2g ? navigator.b2g.getDeviceStorages('sdcard') : navigator.getDeviceStorages('sdcard');

const buildInfo = ["0.0.12","23.01.2024"];
let localeData;

fetch("src/locale.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => initProgram(data));

function initProgram(data){
  batteryData.init();
  const userLocale = navigator.language;
  localeData = data[userLocale];
  if(!localeData){
    localeData = data["en-US"];
  }
  console.log(`KaiOS Info ver. ${buildInfo[0]} initialized`)
  menu.draw(1)
}

const debug = {
  enableDebug: false,
  toggle: function(){
    this.enableDebug = !this.enableDebug;
    this.print("Debug output activated");
    const debugElement = document.getElementById("debug");
    if(this.enableDebug){
      debugElement.innerHTML = 'Debug output activated';
    }
    else{
      debugElement.innerHTML = '';
    }
  },
  print: function(msg,flag = null) {
    if(this.enableDebug){
      switch(flag){
        case "error":
          console.error(msg);
          break;
        case "warning":
          console.warn(msg)
          break;
        default:
          console.log(msg);
          break;
      }
    }
  },
  show: function() {
    if (this.enableDebug) {
      const debugElement = document.getElementById("debug");
      debugElement.innerHTML = `nav: ${key} row: ${controls.row} (${controls.rowLimit}) col: ${controls.col}`;
    }
  }
}


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
  resetControls: function (type = "", extra = ""){
    let col = `col${extra}`
    let row = `row${extra}`
    switch (type){
      case "col":
        this[col] = 1;
        break;
      case "row":
        this[row] = 1;
        break;
      default:
        this[col] = 1
        this[row] = 1;
        break;
    }
    debug.print(`controls.resetControls() - ${type + extra} - reset`);
  },
  increase: function (type){
    let limit = type+"Limit";
      if(this[type] < this[limit]){
        this[type]++;
        this.applySkip("increase");
      }
      else{
        this[type] = 1;
       }
      debug.print(`controls.increase() - ${type}: ${this[type]}`);
      scrollHide();
    
  },
  decrease: function(type){
    let limit = type+"Limit";
        if(this[type] > 1){
          this[type]--;
          this.applySkip("decrease");
          }
          else{
            this[type] = this[limit];
          }
          debug.print(`controls.decrease() - ${type}: ${this[type]}`);
          scrollHide();
  },
  applySkip: function(type){
    if (menu.hideList.length == 0) return;
    let startAt = menu.getHideListBoundaries("start");
    let endAt = menu.getHideListBoundaries("end");
    if (!startAt || !endAt){
      return false;
    }
    let skip = [];
    for(let i = 0; i<startAt.length; i++){
      if (menu.hideList.includes(startAt[i])){
        skip.push(startAt[i]);
        skip.push(endAt[i])
      }
    } 
    if (controls.row > skip[0] && controls.row <= skip[1]){
      switch (type){
        case "increase":
          controls.row = skip[1] + 1;
          return true;
        case "decrease":
          controls.row = skip[0];
          return true;
      }
    }
  },
  updateLimits: function(col = this.colLimit,row = this.rowLimit, type = ""){
    let colLimit = `col${type}Limit`;
    let rowLimit = `row${type}Limit`;
    this[colLimit] = col;
    this[rowLimit] = row;
    debug.print(`controls.updateLimits() - New limits for col and row are set to ${col} and ${row}`);
  },
  updateControls: function(col = this.col, row = this.row){
    this.col = col;
    this.row = row;
    debug.print(`controls.updateControls() - col: ${this.col} row: ${this.row}`);
  },
  handleKeydown: function(e) {
    debug.print(`${e.key} triggered`);
    let pastRow = controls.row;
    switch (e.key) {
      case "ArrowUp":
        controls.decrease("row");
        menuHover(controls.row,pastRow,"")
        break;
      case "ArrowDown":
        controls.increase("row");
        menuHover(controls.row,pastRow,"")
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
        menu.toggleList();
        break;
      case "SoftRight":
        nav('softright');
        break;
      case "SoftLeft":
        nav('softleft');
        break;
      case "#":
        debug.toggle()
        break;
      case "Backspace":
        if(closeMenus()){
          e.preventDefault();
        }
        break;
    }
  }
}

const menu = {
  hideList: [],
  draw: function(col = controls.col){
    controls.updateControls(col);
    controls.resetControls("row");
    const menuContainer = document.getElementById("menu-container");
    let data;
    data = this.getMenuData(col);
    menuContainer.innerHTML = data[0];
    this.updateNavbar(data[1])
    document.getElementById("l" + controls.col).className = "hovered";
    document.getElementById(controls.row).className = "hovered"
  },
  getHideListBoundaries: function(type){
    const splitAtRow = localeData[controls.col]["splitAtRow"];
    if (typeof splitAtRow === 'object'){
      let startAt = [], endAt = [];
      for(let i = 0; i<splitAtRow.length; i+=2){
        startAt.push(splitAtRow[i]);
        endAt.push(splitAtRow[i+1]);
      }
      switch (type){
        case "start":
          return startAt;
        case "end":
          return endAt;
        default:
          return false;
      }
  }
  else{
    return false;
  }
},
  toggleList: function(forceHide = undefined){
      let startAt = this.getHideListBoundaries("start");
      let endAt = this.getHideListBoundaries("end");
      if (!startAt || !endAt){
        return;
      }
      if (startAt.includes(controls.row)){
        endAt = endAt[startAt.indexOf(controls.row)];
        startAt = startAt[startAt.indexOf(controls.row)]
        if(document.getElementById(2).style.display === "none" & forceHide != "hide"){
          debug.print(`toggleList() - Showing elements from ${startAt} to ${endAt}`);
          showElements("",startAt+1, endAt);
          this.hideList = this.hideList.filter(function(element) {
            return element !== controls.row;
          });
          const oldText = removeAllElementsInString(document.getElementById(startAt).innerHTML,"  ↓");
          document.getElementById(startAt).innerHTML = `${oldText}  &#8593;`
        }
        else{
          debug.print(`toggleList() - hiding elements from ${startAt} to ${endAt}`);
          hideElements("",startAt+1, endAt);
          menu.hideList.push(controls.row);
          let oldText = removeAllElementsInString(document.getElementById(startAt).innerHTML,"  ↑");
          document.getElementById(startAt).innerHTML = `${oldText}  &#8595;`
        }
      }
    else{
      return;
    }
  },
  updateNavbar: function(navbarArr){    
    const navbarContainer = document.getElementById("nav-bar");
    navbarContainer.innerHTML = navbarArr;
  },
  getMenuData: function(col){
    let menu = "";
    let navbarEntries =
    `<span id="l1" class = "active">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
    switch (col) {
      case 1:
        menu = `<ul>
        <li id="1">${localeData[1]["1"]}: ${getInfoString("model")}</li>
        <li id="2">${localeData[1]["2"]}: KaiOS ${getInfoString("os")}</li>
        <li id="3">${localeData[1]["3"]}: ${getInfoString("firefox")}</li>
        </ul>
    `
      controls.rowLimit = 3;
    break;
      case 2:
        navbarEntries =
        `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="active">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
        menu = `<ul>
        <li id="1">${localeData[2]["1"]}: ${getInfoString("resolution")}</li>
        <li id="2">${localeData[2]["2"]}: ${getInfoString("depth")}</li>
        <li id="3">${localeData[2]["3"]}: ${getInfoString("aspectratio")}</li>
        <li id="4">${localeData[2]["4"]}: ${getInfoString("orientation")}</li>
        </ul>`
        controls.rowLimit = 4;
        break;
      case 3:
        navbarEntries =
        `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="active">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
        menu = `<ul>
        <li id="1">${localeData[3]["1"]}: ${getInfoString("cpu")}</li>
        <li id="2">${localeData[3]["2"]}: ${getInfoString("cpu-cores")}</li>
        <li id="3">${localeData[3]["3"]}: ${getInfoString("cpu-freq")}</li>
        </ul>`
        controls.rowLimit = 3;
        break;
      case 4:
        navbarEntries =
        `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="active">${localeData[4]["index"]}</span></span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
        menu = `<ul>
        <li id="1">${localeData[4]["1"]}: ${getInfoString("gpu")}</li>
        <li id="2">${localeData[4]["2"]}: ${getInfoString("gpu-man")}</li>
        </ul>`
        controls.rowLimit = 2;
        break;
      case 5:
        navbarEntries =
        `<span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="active">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
        menu = `<ul>
        <li id="1">${localeData[5]["1"]}: ${getInfoString("camera")}</li>
        <li id="2">${localeData[5]["2"]}: ${getInfoString("camera-resolution")}</li>
        </ul>`
        controls.rowLimit = 2;
        break;
      case 6:
        navbarEntries =
        `<span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="active">${localeData[6]["index"]}</span><span id="l7" class="notactive">${localeData[7]["index"]}</span>`;
        menu = `<ul>
        <li id="1">${localeData[6]["1"]}: ${getInfoString("battery-level")}</li>
        <li id="2">${localeData[6]["2"]}: ${getInfoString("battery-health")}</li>
        <li id="3">${localeData[6]["3"]}: ${getInfoString("battery-status")}</li>
        <li id="4">${localeData[6]["4"]}: ${getInfoString("battery-temperature")}</li>
        </ul>`
        controls.rowLimit = 4;
        break;
      case 7:
          this.hideList = []
          navbarEntries =
          `<span id="l4" class="notactive">${localeData[4]["index"]}</span><span id="l5" class="notactive">${localeData[5]["index"]}</span><span id="l6" class="notactive">${localeData[6]["index"]}</span><span id="l7" class="active">${localeData[7]["index"]}</span>`;
          menu = `<ul>
          <li id="1">${localeData[7]["1"]}: ${getInfoString("network-wifi-type")}${this.hideList.includes(1) ? "  ↓" : "  ↑"}</li>
          <li id="2">${localeData[7]["2"]}: ${getInfoString("network-wifi-ssid")}</li>
          <li id="3">${localeData[7]["3"]}: ${getInfoString("network-wifi-speed")}</li>
          <li id="4">${localeData[7]["4"]}: ${getInfoString("network-wifi-signal")}</li>
          <li id="5">${localeData[7]["5"]}: ${getInfoString("network-wifi-ip")}</li>
          <li id="6">${localeData[7]["6"]}: ${getInfoString("network-wifi-frequency")}</li>
          <li id="7">${localeData[7]["7"]}: ${getInfoString("network-wifi-internet")}</li>
          <li id="8">${localeData[7]["8"]}: ${getInfoString("network-wifi-hidden")}</li>
          <li id="9">${localeData[7]["9"]}: ${getInfoString("network-wifi-mac")}</li>
          `
          let rowCount = 10;
          if (getInfoString("network-telephony-amount") > 0){
            for(let i = 0; i < getInfoString("network-telephony-amount"); i++){
              menu += `
              <li id="${rowCount++}">${localeData[7]["10"]}: ${getInfoString("network-telephony-type",i)}</li>
              <li id="${rowCount++}">${localeData[7]["11"]}: ${getInfoString("network-telephony-sim-provider",i)}</li>
              <li id="${rowCount++}">${localeData[7]["12"]}: ${getInfoString("network-telephony-sim-type",i)}</li>
              <li id="${rowCount++}">${localeData[7]["13"]}: ${getInfoString("network-telephony-sim-signal",i)}</li>
              <li id="${rowCount++}">${localeData[7]["14"]}: ${getInfoString("network-telephony-sim-roaming",i)}</li>
              <li id="${rowCount++}">${localeData[7]["15"]}: ${getInfoString("network-telephony-sim-state",i)}</li>
              <li id="${rowCount++}">${localeData[7]["16"]}: ${getInfoString("network-telephony-sim-iccid",i)}</li>
              `;
            }
            menu+="</ul>"
            
          }
          rowCount--;
          controls.rowLimit = rowCount;
          break;  
      }



  controls.colLimit = 7;
  return [menu,navbarEntries]
}
}

function scrollHide(){
      const limit = 4;
      const entriesAmount = controls.rowLimit;
      if(entriesAmount <= limit){
        return;
      }
      const scrolls = Math.ceil(entriesAmount / limit);
      const currentScrollPos = Math.ceil(controls.row / limit);
      let stopLimit = currentScrollPos * limit + 1;
      if(stopLimit > entriesAmount){
        stopLimit = entriesAmount; // Prevent overflow
      }
      let startLimit = stopLimit - limit;
      if(menu.getHideListBoundaries("end")[0] >= startLimit && menu.hideList.includes(menu.getHideListBoundaries("start")[0])){
        debug.print("scrollHide() - startLimit < hideList end position, returning");
        return;
      }
      debug.print(`scrollHide() - startLimit: ${startLimit} , endLimit: ${stopLimit}`) 
      showElements("", startLimit, stopLimit);
      if(scrolls == currentScrollPos){
        startLimit += 1; // Prevent overflow in the last scroll
      }
      hideElements("", 1, startLimit-1, stopLimit);
  }

function hideElement(id) {
    document.getElementById(id).style.display = "none";
  }
function showElement(id) {
    document.getElementById(id).style.display = "flex";
  }

  function showElements(obj, start, end) {
    debug.print(`scrollHide() - showElements() - from ${start} upto ${end}`)
    for (let i = start; i <= end; i++) {
      showElement(obj + i);
    }
  }
  function hideElements(obj, startUp, endUp) {
    debug.print(`scrollHide() - hideElements() - from ${startUp} upto ${endUp}`);
    if(startUp != endUp){
    for (let i = startUp; i <= endUp; i++) {
      hideElement(obj + i);
    }
  }
}

function getInfoString(item, arg = undefined){
  let info,position;
  switch(item){
    default:
      return "Unknown"
    case "model":
      info = navigator.userAgent;
      position = info.search(";") + 1;
      info = info.substring(position);
      info = info.substring(0,info.search(";")).split("_").join(" ");
      break;
    case "os":
      info = navigator.userAgent;
      position = info.search("KAIOS") + "KAIOS ".length;
      info = info.substring(position);
      break;
    case "firefox":
      info = navigator.userAgent;
      position = info.search("Firefox") + "Firefox ".length;
      info = info.substring(position);
      info = info.substring(0,info.search(" "));
      break;
    case "resolution":
      info = `${window.screen.height}x${window.screen.width}`
      break;
    case "depth":
      info = window.screen.colorDepth;
      break;
    case "aspectratio":
      let height = window.screen.height;
      let width = window.screen.width;
      let ratio = width/height;
      info = 0;
      let k = 0;
      do{
        k++;
        info += ratio;
      } while (info < height && info % 1 != 0)
      info = `${k}:${info}`;
      break;
    case "orientation":
      info = window.screen.mozOrientation;
      break;
    case "cpu-cores":
      info = navigator.hardwareConcurrency;
      break;
    case "cpu-freq":
      const runs = 150000000;
      const start = performance.now();
      for (let i = runs; i>0; i--) {}
      const end = performance.now();
      const ms = end - start;
      const cyclesPerRun = 2;
      const speed = (runs / ms / 1000000) * cyclesPerRun;
      info = `~${speed.toFixed(2)} GHz`;
      break;
    case "gpu":
      return getGpuInfo(item);
    case "gpu-man":
      return getGpuInfo(item);
    case "camera":
      return getCameraInfo();
    case "camera-resolution":
      return getResolutionInfo();
    case "battery-level":
    case "battery-health":
    case "battery-status":
    case "battery-temperature":
      return batteryData.get(item.replace("battery-",""));
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
      return navigator.mozMobileConnections.length || 0;
  }
  
  return info;
}

const batteryData = {
  data: null,
  init: function(){
    navigator.getBattery().then(function(result){
      batteryData.data = result;
    });
  },
  get: function(type){
    let returnString = this.data[type];
    if (type == "level"){
      returnString = `${parseFloat(returnString)*100}%`;
    }
    else if (type == "temperature"){
      returnString += " °C";
    }
    else if (type == "status"){
      if (this.data.charging){
        if (this.data.chargingTime == 0){
          returnString = "Charged"
        }
        else{
          let remainingTime = ""
          if (this.data.chargingTime != Infinity){
            let hours = this.data.chargingTime / 3600;
            const minutes = Math.ceil((hours - Math.floor(hours)) * 60);
            const additionalZero = minutes < 10 ? "0" : "";
            hours = Math.floor(hours);
            remainingTime = `(${hours}:${additionalZero}${minutes} left)`
          }
          returnString = `Charging ${remainingTime}`
        }
      }
      else{
        let remainingTime = ""
        if (this.data.dischargingTime != Infinity){
          let hours = this.data.dischargingTime / 3600;
          const minutes = Math.ceil((hours - Math.floor(hours)) * 60);
          const additionalZero = minutes < 10 ? "0" : "";
          hours = Math.floor(hours);
          remainingTime = `(${hours}:${additionalZero}${minutes} left)`
        }
        returnString = `Discharging ${remainingTime}`
      }
    }
    return returnString;  
  }  

}

function getNetworkInfo(type, sim){
    const wifiData = navigator.mozWifiManager;
    const wifiConnectionData = wifiData.connectionInformation;
    const wifiStatus = wifiData.enabled ? "Enabled" : "Disabled";

  if (wifiStatus == "Enabled"){
    switch (type){
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
  }
  else{
    return "Disabled"
  }
  const mobileData = navigator.mozMobileConnections[sim];
  const mobileStatus = mobileData.radioState ? "Enabled" : "Disabled";
  if (mobileStatus == "Enabled"){
    switch (type){
    case "network-telephony-type":
      return `Cell - SIM ${sim+1} (${mobileData.radioState ? "Enabled" : "Disabled"})`;
    case "network-telephony-sim-provider":
      return `${mobileData.data.network.longName || "Disconnected"}`
    case "network-telephony-sim-type":
      return mobileData.data.type ? mobileData.data.type.toUpperCase() : "Disconnected";
    case "network-telephony-sim-signal":
      return mobileData.signalStrength[mobileData.data.type] ? `${mobileData.signalStrength[mobileData.data.type+"SignalStrength"]} dBm` : "Unknown";
    case "network-telephony-sim-roaming":
      return mobileData.data.roaming;
    case "network-telephony-sim-state":
      return mobileData.voice.state;
    case "network-telephony-sim-iccid":
      return mobileData.iccId;
    }
  }
  else{
    return "Disabled"
  }

}

function getCameraInfo(){
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        cameras.forEach(camera => {
          console.log(camera.label )
          return camera.label || "Unknown";
        });
      })
      .catch(err => {
        console.error('Error enumerating devices:', err);
      });
  } else {
    return "Unknown"
  }
}

function getResolutionInfo(){
  let constraints = { 
    audio: true, 
    video: { 
        width: { ideal: 1920 }, 
        height: { ideal: 1080 } 
    }
};
  navigator.mediaDevices.getUserMedia(constraints)
  .then(stream => {
    console.log(stream)
      const settings = stream.getVideoTracks();
      console.log(settings)
      console.log('Estimated Camera Resolution:');
      console.log('Width:', settings.width || 'Not available');
      console.log('Height:', settings.height || 'Not available');

      // Stop the stream when you're done with it
      stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('Error accessing camera:', error);
  });
}

function getGpuInfo(type){
  let canvas = document.createElement('canvas');
  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl){
    return "unknown"
  }
  else{
    if (type == "gpu"){
      return getUnmaskedInfo(gl).renderer
    }
    else{
      return getUnmaskedInfo(gl).vendor
    }
  }
}

function getUnmaskedInfo(gl) {
  var unMaskedInfo = {
    renderer: '',
    vendor: ''
  };

  var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (dbgRenderInfo != null) {
    unMaskedInfo.renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
    unMaskedInfo.vendor = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
  }

  return unMaskedInfo;
}

function menuHover(row = undefined, pastRow = undefined, obj = undefined){
  debug.print(`menuHover() - Row ${obj}${row} - Hover, Row ${obj}${pastRow}: Unhover`)
  if(pastRow){
    const pastElement = document.getElementById(obj + pastRow);
  if(pastElement){
    pastElement.classList.remove("hovered");
  }
  }
  if(row){
    const currentElement = document.getElementById(obj + row);
    if(currentElement){
      currentElement.classList.add("hovered");
    }
  }
}

function removeAllElementsInString(string,element){ // No support for replaceAll before firefox 77
  let newString = string;
  while (newString.indexOf(element) > -1){
    newString = newString.replace(element, "");
  }
  return newString;
}


document.activeElement.addEventListener("keydown", controls.handleKeydown);