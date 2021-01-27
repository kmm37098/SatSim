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
  
  let targetArea;
  let swath;
  let refPoint;
  let scanX;
  let scanY;
  displaySimulationResources(targetArea, swath, rollError, refPoint);

  let swathAngle;
  moveSwath(swathAngle, rollError);
  console.log(`RefPointX - ${refPointX} || SwathX - ${swathX}`)

  //---------------------------------------
  //	CALCULATE AREA
  //---------------------------------------

  if(refPointX == startScanX) {									//find top left and bottom left corner of area polygon
  	if(isFinite(swathAngle)) {	//if there is a roll error
  		let temp = ((100+yawError)/swathAngle)+pitchError + 540;
  		if(temp > 540) {
  			tlPoint += temp;
  		}
  		else {
  			tlPoint += 540;
  		}
  		temp = ((-100+yawError)/swathAngle)+pitchError+540;
  		if(temp > 540) {
  			blPoint += temp;
  		}
  		else {
  			blPoint += 540;
  		}
  		console.log(tlPoint);
  		console.log(blPoint);
  	}
  	else {		//if there is not a roll error
  		let temp = 540;
  		if(pitchError > 0) {
  			temp += pitchError;
  		}
  		tlPoint += temp;
  		blPoint += temp;
  		console.log(tlPoint);
  		console.log(blPoint);
  	}
  }
  if(refPointX == endScanX) {										//find top right and bottom right corner of area polygon
  	if(isFinite(swathAngle)) {	//if there is a roll error
  		let temp = ((100+yawError)/swathAngle)+pitchError + 740;
  		if(temp < 740) {
  			trPoint += temp;
  		}
  		else {
  			trPoint += 740;
  		}
  		temp = ((-100+yawError)/swathAngle)+pitchError+740;
  		if(temp < 740) {
  			brPoint += temp;
  		}
  		else {
  			brPoint += 740;
  		}
  		console.log(trPoint);
  		console.log(brPoint);
  	}
  	else {		//if there is not a roll error
  		let temp = 740;
  		if(pitchError < 0) {
  			temp += pitchError;
  		}
  		trPoint += temp;
  		brPoint += temp;
  		console.log(trPoint);
  		console.log(brPoint);
  	}
  }

  //todo is this correct use of this variable
  if(!isInSimulationRange) {
	  if(missedArea == 0 && (tlPoint > 540 || blPoint > 540)) {
	  	missedLeft = true;
	  	let base = Math.abs(tlPoint - blPoint);
	  	let lArea = .5 * base * 200;
	  	console.log(lArea/2);
	  	missedArea += (.5 * lArea);	//half of area to account for doubling of target area dimensions for visual ease
	  }
	  if((missedArea == 0 || missedLeft) && (trPoint < 740 || brPoint < 740)) {
	  	let base = Math.abs(trPoint - brPoint);
	  	let rArea = .5 * base * 200;
	  	//console.log(rArea/2);
	  	missedArea += (.5 * rArea);	
	  	missedLeft = false;
	  }
	  fill('white');
	  stroke('black');
	  text(missedArea, 1050, 30);		//display area
  }

  listenForKeyTypes();
}


function moveSwath(rollError) {
  if(isSimulating && isInSimulationRange) {
    swathX = swathX + VELOCITY;
    refPointX = swathX + SWATH_WIDTH
    //todo figure out this 592
    swathAngle = (592 * Math.cos(getDegrees(rollError)))/(592 * Math.sin(getDegrees(rollError)));
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
  //todo fix instability moves down to 0 right when simulation starts even tho sliders are set to have error
  if(instability && isSimulating) {
    let potentialRollError = rollError + randomGaussian(0, INSTABILITY_STD_DEV);
    //todo add constant/calculation for max rollError and use in roll slider as well
    //todo same for below values
    rollError = (Math.abs(potentialRollError) > .5) ? 0 : potentialRollError;
    let potentialPitchError = pitchError + randomGaussian(0, INSTABILITY_STD_DEV);
    pitchError = (Math.abs(potentialPitchError) > 3.4908) ? 0 : potentialPitchError;
    let potentialYawError = yawError + randomGaussian(0, INSTABILITY_STD_DEV);
    yawError = (Math.abs(potentialYawError) > 3.4908) ? 0 : potentialYawError;
    //console.log(`PitchError - ${pitchError} || RollError - ${rollError} || YawError - ${yawError}`)
  }
}

function displaySimulationResources(targetArea, swath, rollError, refPoint) {
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

  displayScanPositions(rollError);
}

function displayScanPositions(rollError) {
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
  console.log(instability)
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
