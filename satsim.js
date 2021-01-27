//rect = left/right coordinate from left, up/down from top, width, height

//--------------------------
//----Vars related to view--
//--------------------------
//used to adjust actual dimensions (1 km = 1px) to be human viewable
const VIEW_MULTIPLIER = 3;
//canvas is offset by 20 when drawn (help to get full screen with no scrolling)
const VIEW_ADJ = 20;


//------------------------------
//----Constants for simulation 
//-----------------------------
//dimensions of simulation components (in km)

//minimum width = 50
const TARGET_WIDTH = 50 * VIEW_MULTIPLIER;
const TARGET_LEFT_X = 605 - (TARGET_WIDTH/2);
const TARGET_RIGHT_X = TARGET_LEFT_X + TARGET_WIDTH;
const TARGET_Y = 300;

const SWATH_WIDTH = .13 * VIEW_MULTIPLIER;
const SWATH_HEIGHT = 98 * VIEW_MULTIPLIER;
const SWATH_START_X = TARGET_LEFT_X - TARGET_WIDTH;
const SWATH_START_Y = (TARGET_Y + (TARGET_WIDTH/2)) - (SWATH_HEIGHT/2);
const SWATH_END_X = TARGET_RIGHT_X + TARGET_WIDTH;

const VELOCITY = 3;

//todo should be a function
const MAX_PITCH_ERROR = 3.4908;
const MAX_YAW_ERROR = MAX_PITCH_ERROR;
const MAX_ROLL_ERROR = .5;

//used for instability calculation
const INSTABILITY_STD_DEV = .03333;

//--------------------------------
//----Vars for simulation control
//--------------------------------
let instability = false;

//-----------------------------------
//----Vars to track simulation status
//-----------------------------------
let isSimulating = false; 
let isInSimulationRange = true;
let inSetup = true;

let startScanX = TARGET_LEFT_X;
let endScanX = TARGET_RIGHT_X;

let swathX = SWATH_START_X;
let swathY = SWATH_START_Y;

let pitchError = 0;
let rollError = 0;
let yawError = 0;

let refPointX = swathX + SWATH_WIDTH;
let refPointY = SWATH_START_Y + (SWATH_HEIGHT/2);


//todo variables from here down need to be assessed

var missedLeft = false;
var missedArea = 0;

var tlPoint = 0;	//area coordinates
var blPoint = 0;
var trPoint = 0;
var brPoint = 0;	

function setup() {
  createCanvas(windowWidth-VIEW_ADJ, windowHeight-VIEW_ADJ);
  textSize(15);

  setupUserInput();

  fill('white');
  stroke('black');

  angleMode(DEGREES);
}


function draw() {
  background(51);

  if(inSetup) {
    pitchError = pitchSlider.value();
    rollError = rollSlider.value();
    yawError = yawSlider.value();
  }

  displayDynamicText();

  //add listener for inputs
  pitchInput.changed(changePitchInput);
  rollInput.changed(changeRollInput);
  yawInput.changed(changeYawInput);
  iCheckbox.changed(setInstability);

  addInstability();
  adjustForErrors();
  
  let targetArea, swath, refPoint, scanX, scanY;
  displaySimulationResources(targetArea, swath, refPoint);

  let swathAngle;
  moveSwath(swathAngle);
  
  calculateArea();

  listenForKeyTypes();
}

function calculateArea() {
  //find x position of vertices of scanned area
  if(refPointX == startScanX) {
    if(rollError) {
      tlPoint
    } else {
      tlPoint, blPoint = refPointX;
    }
  }
  if(refPointX == endScanX) {
    if(rollError) {

    } else {
      trPoint, brPoint = refPointX;
    }
  }
}

function moveSwath(swathAngle) {
  if(isSimulating && isInSimulationRange) {
    swathX = swathX + VELOCITY;
    refPointX = swathX + SWATH_WIDTH
    //todo am I calculating this correctly?
    swathAngle = (592 * Math.cos(getDegrees(rollError)))/(592 * Math.sin(getDegrees(rollError)));
    console.log(swathAngle)
  }
  //check to end movement of swath
  if(refPointX > SWATH_END_X) {     
    isInSimulationRange = false;
    instability = false;
  }
}

function adjustForErrors() {
  if(!isSimulating && inSetup) {
    swathX = SWATH_START_X + pitchError;   
    swathY = SWATH_START_Y + yawError;
    refPointX = swathX + SWATH_WIDTH;   
    refPointY = swathY + (SWATH_HEIGHT/2); 
    startScanX = TARGET_LEFT_X + pitchError;   
    endScanX = TARGET_RIGHT_X + pitchError;
  }
}

function addInstability() {
  if(instability && isSimulating) {
    let potentialRollError = rollError + randomGaussian(0, INSTABILITY_STD_DEV);
    rollError = (Math.abs(potentialRollError) > MAX_ROLL_ERROR) ? 0 : potentialRollError;

    let potentialPitchError = pitchError + randomGaussian(0, INSTABILITY_STD_DEV);
    pitchError = (Math.abs(potentialPitchError) > MAX_PITCH_ERROR) ? 0 : potentialPitchError;

    let potentialYawError = yawError + randomGaussian(0, INSTABILITY_STD_DEV);
    yawError = (Math.abs(potentialYawError) > MAX_YAW_ERROR) ? 0 : potentialYawError;
    //console.log(`PitchError - ${pitchError} || RollError - ${rollError} || YawError - ${yawError}`)
  }
}

function displaySimulationResources(targetArea, swath, refPoint) {
  fill('green');    
  stroke('green');
  targetArea = rect(TARGET_LEFT_X,TARGET_Y,TARGET_WIDTH, TARGET_WIDTH);

  fill('red');
  stroke('red');
  push();
  translate(swathX,swathY);
  rotate(rollError);
  swath = rect(0, 0, SWATH_WIDTH, SWATH_HEIGHT);

  fill('white');
  stroke('white');
  refPoint = ellipse(SWATH_WIDTH, SWATH_HEIGHT/2, 2, 2);
  pop();

  displayScanPositions();
}

function displayScanPositions() {
  //display initial swath scan position
  if(refPointX >= startScanX) {     
    fill('blue');
    stroke('blue');
    push();
    //point of reference is in the middle of the front of the swath
    translate(startScanX,swathY); 
    rotate(rollError);
    scan1 = rect(0,0,SWATH_WIDTH,SWATH_HEIGHT);
    stroke('red');
    pop();
  }
  //display final swath scan position
  if((refPointX + SWATH_WIDTH) >= endScanX) {     
    fill('blue');
    stroke('blue');
    push();
    //todo what do I mean by this?
    //-1 to accomadate for endScan having to be divisible by 3
    translate(endScanX,swathY);   
    rotate(rollError);
    scan2 = rect(0,0,SWATH_WIDTH,SWATH_HEIGHT);
    stroke('red');
    pop();
  }
}

function listenForKeyTypes() {
  if (key === 's') {
    isSimulating = true;
    isInSimulationRange = true;
    inSetup = false;
  }
  if (key === 'r') {
    isSimulating = false;
    inSetup = true;
    isInSimulationRange = false;
    setInstability();
    adjustForErrors();

    tlPoint = 0;
    blPoint = 0;
    trPoint = 0;
    brPoint = 0;
  }
}

function setupUserInput() {
  pitchSlider = createSlider(-3.4908, 3.4908, 0, 0).position(20, 20);
  pitchInput = createInput().position(280,20).size(50,17);

  rollSlider = createSlider(-5.5, 5.5, 0, 0).position(20, 50);
  rollInput = createInput().position(280,50).size(50,17);

  yawSlider = createSlider(-10.4908, 10.4908, 0, 0).position(20, 80);
  yawInput = createInput().position(280,80).size(50,17);

  iCheckbox = createCheckbox('', false).position(20, 110);
}

function displayDynamicText() {
  fill('white');
  stroke('black');
  text("Pitch Error", 190, 30);
  text(pitchError, 350, 30);
  text("Roll Error", 190, 60);
  text(rollError, 350, 60);
  text("Yaw Error", 190, 90);
  text(yawError, 350, 90);
  text("Instability", 50, 120);
  text("Missed Area: ", 900, 30);
  text(missedArea, 1050, 30);
  //todo fix this location
  text("Press 's' to start simulation.", 1000, 900);
  text("Press 'r' to reset simulation.", 1000, 930);
}

function changePitchInput() {
  pitchSlider.value(pitchInput.value());
}
function changeRollInput() {
  rollSlider.value(rollInput.value());
}
function changeYawInput() {
  yawSlider.value(yawInput.value());
}

function setInstability() {
  if(iCheckbox.checked()) {
    instability = true;
  } else {
    instability = false;
  }
}

function getDegrees(rad) {
	return rad * Math.PI/180;
}
