/* ELEMENTS */

const bgLayer = document.getElementById("bgLayer");
const bgOverlay = document.getElementById("bgOverlay");

const goalScreen = document.getElementById("goalScreen");
const goalInput = document.getElementById("goalInput");
const goalBtn = document.getElementById("goalBtn");

const app = document.getElementById("app");
const goalText = document.getElementById("goalText");

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

const focusInput = document.getElementById("focusInput");
const breakInput = document.getElementById("breakInput");
const blocksInput = document.getElementById("blocksInput");
const volumeInput = document.getElementById("volumeInput");
const blurInput = document.getElementById("blurInput");

const autoToggle = document.getElementById("autoToggle");
const fxToggle = document.getElementById("fxToggle");
const musicToggle = document.getElementById("musicToggle");

const resetStatsBtn = document.getElementById("resetStatsBtn");

const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");

const timerEl = document.getElementById("timer");
const cycleDisplay = document.getElementById("cycleDisplay");
const blockProgress = document.getElementById("blockProgress");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const skipBtn = document.getElementById("skipBtn");
const resetBtn = document.getElementById("resetBtn");

const bgBtn = document.getElementById("bgBtn");

const sessionFill = document.getElementById("sessionFill");
const minuteFill = document.getElementById("minuteFill");
const sessionCount = document.getElementById("sessionCount");
const minuteCount = document.getElementById("minuteCount");

const bgMusic = document.getElementById("bgMusic");
const blockSound = document.getElementById("blockSound");
const finalSound = document.getElementById("finalSound");

/* STATE */

let focusMinutes = 25;
let breakMinutes = 5;
let blocks = 4;

let autoAdvance = true;
let fxEnabled = true;
let musicEnabled = true;

let sessionsDone = 0;
let minutesFocused = 0;

let plan = [];
let currentBlock = 0;
let timeLeft = 0;
let timer = null;
let running = false;

let unlocked = false;
let appStarted = false;

/* BACKGROUNDS */

const backgrounds = [
"resources/bg-1.png",
"resources/bg-2.png",
"resources/bg-3.png",
"resources/bg-4.png",
"resources/bg-5.png",
"resources/bg-6.png",
"resources/bg-7.png"
];

let bgIndex = Math.floor(Math.random() * backgrounds.length);

function setBg(){
bgLayer.style.backgroundImage = `url('${backgrounds[bgIndex]}')`;
}

function nextBg(){
bgIndex++;
if(bgIndex >= backgrounds.length) bgIndex = 0;
setBg();
}

setBg();
bgBtn.onclick = nextBg;

/* MUSIC */

bgMusic.volume = 0.22;

function unlockAudio(){
if(!unlocked && musicEnabled){
bgMusic.play().catch(()=>{});
unlocked = true;
}
}

document.addEventListener("click", unlockAudio);
document.addEventListener("keydown", unlockAudio);
document.addEventListener("touchstart", unlockAudio);

musicToggle.onclick = ()=>{
musicEnabled = !musicEnabled;
paintToggle(musicToggle, musicEnabled);

if(musicEnabled){
bgMusic.play().catch(()=>{});
}else{
bgMusic.pause();
}
};

/* TOGGLES */

function paintToggle(el, state){
el.classList.toggle("on", state);
el.textContent = state ? "ON" : "OFF";
}

autoToggle.onclick = ()=>{
autoAdvance = !autoAdvance;
paintToggle(autoToggle, autoAdvance);
};

fxToggle.onclick = ()=>{
fxEnabled = !fxEnabled;
paintToggle(fxToggle, fxEnabled);
};

/* SETTINGS PANEL */

settingsBtn.onclick = ()=>{
settingsPanel.classList.toggle("hidden-panel");
};

document.addEventListener("click", e=>{
if(!settingsPanel.contains(e.target) &&
!settingsBtn.contains(e.target)){
settingsPanel.classList.add("hidden-panel");
}
});

/* GOAL */

goalBtn.onclick = enterApp;

goalInput.addEventListener("keydown", e=>{
if(!appStarted) return;
if(e.key === "Enter") enterApp();
});

function enterApp(){

appStarted = true;

let goal = goalInput.value.trim();
if(goal === "") goal = "General Focus Session";

goalText.textContent = goal;
localStorage.setItem("vibeodoro_goal", goal);

goalScreen.classList.add("hide");

setTimeout(()=>{
app.classList.remove("hidden");
setControlsDisabled(false);
},250);

}

/* SAVE SETTINGS */

saveBtn.onclick = ()=>{

focusMinutes = Number(focusInput.value);
breakMinutes = Number(breakInput.value);
blocks = Number(blocksInput.value);

bgMusic.volume = Number(volumeInput.value);

bgOverlay.style.backdropFilter =
`blur(${blurInput.value}px)`;

buildPlan();
resetTimer();

localStorage.setItem("vibeodoro_v2", JSON.stringify({
focusMinutes,
breakMinutes,
blocks,
autoAdvance,
fxEnabled,
musicEnabled,
volume:bgMusic.volume,
blur:blurInput.value
}));

showToast();
settingsPanel.classList.add("hidden-panel");
};

function showToast(){
toast.classList.add("show");
setTimeout(()=>{
toast.classList.remove("show");
},1400);
}

/* LOAD SETTINGS */

const saved = localStorage.getItem("vibeodoro_v2");

if(saved){

const data = JSON.parse(saved);

focusMinutes = data.focusMinutes;
breakMinutes = data.breakMinutes;
blocks = data.blocks;

autoAdvance = data.autoAdvance;
fxEnabled = data.fxEnabled;
musicEnabled = data.musicEnabled;

focusInput.value = focusMinutes;
breakInput.value = breakMinutes;
blocksInput.value = blocks;

volumeInput.value = data.volume;
bgMusic.volume = data.volume;

blurInput.value = data.blur;
bgOverlay.style.backdropFilter =
`blur(${data.blur}px)`;

paintToggle(autoToggle, autoAdvance);
paintToggle(fxToggle, fxEnabled);
paintToggle(musicToggle, musicEnabled);
}

/* GOAL LOAD */

const savedGoal = localStorage.getItem("vibeodoro_goal");
if(savedGoal) goalInput.value = savedGoal;

/* PLAN */

function buildPlan(){

plan = [];

for(let i=0;i<blocks;i++){

if(i % 2 === 0){
plan.push({
type:"focus",
mins:focusMinutes
});
}else{
plan.push({
type:"break",
mins:breakMinutes
});
}

}

currentBlock = 0;
timeLeft = plan[0].mins * 60;

renderCycle();
updateTimer();
updateProgress();
}

function renderCycle(){

cycleDisplay.innerHTML = "";

plan.forEach((item,index)=>{

const span = document.createElement("span");
span.textContent = item.mins;

if(index === currentBlock){
span.classList.add("active");
}

cycleDisplay.appendChild(span);

if(index < plan.length - 1){
const arrow = document.createElement("span");
arrow.textContent = "→";
cycleDisplay.appendChild(arrow);
}

});

}

function updateProgress(){
blockProgress.textContent =
`Block ${currentBlock + 1} of ${blocks}`;
}

/* TIMER */

function updateTimer(){

const m = Math.floor(timeLeft / 60);
const s = timeLeft % 60;

timerEl.textContent =
`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function startTimer(){
if(!appStarted) return;
if(running) return;

running = true;

timer = setInterval(()=>{

timeLeft--;
updateTimer();

if(timeLeft <= 0){
clearInterval(timer);
running = false;
completeBlock();
}

},1000);
}

function pauseTimer(){
if(!appStarted) return;
clearInterval(timer);
running = false;
}

function resetTimer(){
if(!appStarted) return;
clearInterval(timer);
running = false;

skipBtn.disabled = false;
skipBtn.style.opacity = "1";
skipBtn.style.cursor = "pointer";

buildPlan();
}

function skipBlock(){
if(!appStarted) return;

/* If already finished, do nothing */
if(currentBlock >= plan.length) return;

if(timerEl.textContent === "DONE") return;

clearInterval(timer);
running = false;
completeBlock();
}

function completeBlock(){

const current = plan[currentBlock];

if(current.type === "focus"){
minutesFocused += focusMinutes;
updateStats();
}

if(currentBlock < plan.length - 1){

if(fxEnabled){
blockSound.currentTime = 0;
blockSound.play();
}

currentBlock++;
timeLeft = plan[currentBlock].mins * 60;

renderCycle();
updateTimer();
updateProgress();
nextBg();

if(autoAdvance) startTimer();

}else{

sessionsDone++;
updateStats();

if(fxEnabled){
finalSound.currentTime = 0;
finalSound.play();
}

timerEl.textContent = "DONE";
blockProgress.textContent = "Session Complete";

/* Disable skip button */
skipBtn.disabled = true;
skipBtn.style.opacity = ".45";
skipBtn.style.cursor = "not-allowed";
}
}

/* STATS */

function updateStats(){

sessionCount.textContent = sessionsDone;
minuteCount.textContent = minutesFocused;

sessionFill.style.width =
`${Math.min(sessionsDone * 20,100)}%`;

minuteFill.style.width =
`${Math.min(minutesFocused / 2,100)}%`;

localStorage.setItem("vibeodoro_stats", JSON.stringify({
sessionsDone,
minutesFocused
}));
}

const statSave = localStorage.getItem("vibeodoro_stats");

if(statSave){
const data = JSON.parse(statSave);
sessionsDone = data.sessionsDone;
minutesFocused = data.minutesFocused;
}

/* CONTROLS */
resetStatsBtn.onclick = () => {

const sure = confirm(
"Reset all stats?\nThis will erase completed sessions and focused minutes."
);

if(!sure) return;

sessionsDone = 0;
minutesFocused = 0;

updateStats();

showToast();
toast.textContent = "Stats Reset ✓";

setTimeout(()=>{
toast.textContent = "Saved ✓";
},1400);

};

startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
skipBtn.onclick = skipBlock;
resetBtn.onclick = resetTimer;

/* SHORTCUTS */

document.addEventListener("keydown", e=>{

if(e.code === "Space"){
e.preventDefault();
running ? pauseTimer() : startTimer();
}

if(e.key.toLowerCase() === "r") resetTimer();
if(e.key.toLowerCase() === "m") musicToggle.click();
if(e.key.toLowerCase() === "s") skipBlock();

if(e.key === "Escape"){
settingsPanel.classList.add("hidden-panel");
}

});

function setControlsDisabled(state){

startBtn.disabled = state;
pauseBtn.disabled = state;
skipBtn.disabled = state;
resetBtn.disabled = state;
bgBtn.disabled = state;
musicToggle.disabled = state;

const buttons = [
startBtn,
pauseBtn,
skipBtn,
resetBtn,
bgBtn,
musicToggle
];

buttons.forEach(btn=>{
btn.style.opacity = state ? ".45" : "1";
btn.style.cursor = state ? "not-allowed" : "pointer";
});

}

/* INIT */

buildPlan();
updateStats();
paintToggle(autoToggle, autoAdvance);
paintToggle(fxToggle, fxEnabled);
paintToggle(musicToggle, musicEnabled);
setControlsDisabled(true);

window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = "";
});