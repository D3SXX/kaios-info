"use strict";

//const getSdcards = navigator.b2g ? navigator.b2g.getDeviceStorages('sdcard') : navigator.getDeviceStorages('sdcard');

const buildInfo = ["0.0.3","13.01.2024"];
let localeData;

fetch("src/locale.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => initProgram(data));

function initProgram(data){
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
      }
      else{
        this[type] = 1;
       }
    debug.print(`controls.increase() - ${type}: ${this[type]}`);
  },
  decrease: function(type){
    let limit = type+"Limit";
        if(this[type] > 1){
          this[type]--;
          }
          else{
            this[type] = this[limit];
          }
          debug.print(`controls.decrease() - ${type}: ${this[type]}`);
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
  updateNavbar: function(navbarArr){    
    const navbarContainer = document.getElementById("nav-bar");
    navbarContainer.innerHTML = navbarArr;
  },
  getMenuData: function(col){
    let menu = "";
    let navbarEntries =
    `<span id="l1" class = "active">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span>`;
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
        `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="active">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span>`;
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
        `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="active">${localeData[3]["index"]}</span><span id="l4" class="notactive">${localeData[4]["index"]}</span>`;
        menu = `<ul>
        <li id="1">${localeData[3]["1"]}: ${getInfoString("cpu")}</li>
        <li id="2">${localeData[3]["2"]}: ${getInfoString("cpu-cores")}</li>
        <li id="3">${localeData[3]["3"]}: ${getInfoString("cpu-freq")}</li>
        </ul>`
        controls.rowLimit = 3;
        break;
      case 4:
        navbarEntries =
        `<span id="l1" class = "notactive">${localeData[1]["index"]}</span><span id="l2" class="notactive">${localeData[2]["index"]}</span><span id="l3" class="notactive">${localeData[3]["index"]}</span><span id="l4" class="active">${localeData[4]["index"]}</span>`;
        menu = `<ul>
        <li id="1">${localeData[4]["1"]}: ${getInfoString("gpu")}</li>
        <li id="2">${localeData[4]["2"]}: ${getInfoString("gpu-man")}</li>
        </ul>`
        controls.rowLimit = 2;
  
      }
  controls.colLimit = 4;
  return [menu,navbarEntries]
}
}

function getInfoString(item){
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
      return getGpuInfo(item)
      break;
    case "gpu-man":
      return getGpuInfo(item)
      break;
  }
  
  return info;
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


document.activeElement.addEventListener("keydown", controls.handleKeydown);