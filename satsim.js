//rect = left/right coordinate from left, up/down from top, width, height

//--------------------------
//----Vars related to view--
//--------------------------
//used to adjust actual dimensions (1 km = 1px) to be human viewable
//todo decide which variables get multiplied by this - specifically errors may be missing it at this point
const VIEW_MULTIPLIER = 4;
//canvas is offset by 20 when drawn (help to get full screen with no scrolling)
const VIEW_ADJ = 20;


//------------------------------
//----Constants for simulation 
//-----------------------------
//dimensions of simulation components (in km)
const TARGET_WIDTH = 50;
const SWATH_WIDTH = .13;
const SWATH_HEIGHT = 98;

//used for instability calculation
const INSTABILITY_STD_DEV = .03333;


//--------------------------------
//----Vars for simulation control
//--------------------------------
let instability = false;

//-----------------------------------
//----Vars to track simulation status
//-----------------------------------
let isSimulate = false; 
let isInSimulationRange = true;


//todo variables from here down need to be assessed

var swathX = 300.52;	
var swathY = 184;	
var pRefX = 300.52; //front of swath
var pRefY = 480;  //middle of swath

var slope;	//slope of swath

var missedLeft = false;
var missedArea = 0;

var tlPoint = 0;	//area coordinates
var blPoint = 0;
var trPoint = 0;
var brPoint = 0;

var startScan = 540.52;	//point at which the scan starts
var endScan = 741.52;		//point at which the scan ends			

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

  //==============================================
  //--------------SETUP------------------------
  //================================================

  let pitchError = pitchSlider.value();
  let rollError = rollSlider.value();
  let yawError = yawSlider.value();

  //todo this, along with every other display that changes should probably be at the bottom (or top)
  //so that they are showing the most up to date values for each tick
  displayDynamicText(pitchError, rollError, yawError);

  //add listener for input boxes
  pitchInput.changed(changePitchInput);
  rollInput.changed(changeRollInput);
  yawInput.changed(changeYawInput);

  //add randomness if instable and swath moving
  //todo update this to change the errors instead of the slider values
  if(instability && isSimulate) {
  	rollSlider.value(rollSlider.value() + randomGaussian(0, INSTABILITY_STD_DEV));
  	pitchSlider.value(pitchSlider.value() + randomGaussian(0, INSTABILITY_STD_DEV));
  	yawSlider.value(yawSlider.value() + randomGaussian(0, INSTABILITY_STD_DEV));
  }

  //todo decide on if isInSimulationRange is required here
  if(isSimulate && isInSimulationRange) { 
	 slope = (592 * Math.cos(getDegrees(rollError)))/(592 * Math.sin(getDegrees(rollError)));
  }

  //------------------------------------------------------------------------------------------------------------------
  //      Display target area. Set position of swath, reference point, startScan, and endScan according to errors
  //------------------------------------------------------------------------------------------------------------------

  if(!isSimulate) {
  	swathX = 300.52 + pitchError;		//set orientation of swath (no instability accounted)
  	swathY = 184 + yawError;
  	pRefX = 300.52 + pitchError;		//set point of reference
  	pRefY = 480 + yawError;
  	startScan = 540.52 + pitchError;		//set start and end scan position 
  	endScan = 741.52 + pitchError;
  }
  
  fill('green');		//display target area
  stroke('green');
  let tArea = rect(540.42,360,TARGET_WIDTH * VIEW_MULTIPLIER, TARGET_WIDTH * VIEW_MULTIPLIER);

  fill('red');			//display swath w/ errors
  stroke('red');
  push();
  translate(swathX+.52,swathY+296);
  rotate(rollError);
  let swath = rect(-(SWATH_WIDTH * VIEW_MULTIPLIER), -((SWATH_HEIGHT * VIEW_MULTIPLIER)/2), 
    SWATH_WIDTH * VIEW_MULTIPLIER, SWATH_HEIGHT * VIEW_MULTIPLIER);

  fill('white');		//display point of reference
  stroke('white');
  pRef = ellipse(0, 0, 2, 2);
  pop();

  //-------------------------------------------------
  //     Display initial and final scan positions
  //-------------------------------------------------

  if(pRefX >= startScan) {			//display initial swath scan position
  	fill('blue');
  	stroke('blue');
  	push();
  	translate(startScan+.52,swathY+296);	//point of reference is in the middle of the front of the swath
  	rotate(rollError);
  	let scan1 = rect(-.52,-296,.52,592);
  	stroke('red');
  	pop();
  }
  if(pRefX >= endScan) {			//display final swath scan position
  	fill('blue');
  	stroke('blue');
  	push();
  	translate(endScan-1,swathY+296);		//-1 to accomadate for endScan having to be divisible by 3
  	rotate(rollError);
  	let scan2 = rect(-.52,-296,.52,592);
  	stroke('red');
  	pop();
  }

  //---------------------------------------
  //	CALCULATE AREA
  //---------------------------------------


  if(pRefX == startScan) {									//find top left and bottom left corner of area polygon
  	if(isFinite(slope)) {	//if there is a roll error
  		let temp = ((100+yawError)/slope)+pitchError + 540;
  		if(temp > 540) {
  			tlPoint += temp;
  		}
  		else {
  			tlPoint += 540;
  		}
  		temp = ((-100+yawError)/slope)+pitchError+540;
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
  if(pRefX == endScan) {										//find top right and bottom right corner of area polygon
  	if(isFinite(slope)) {	//if there is a roll error
  		let temp = ((100+yawError)/slope)+pitchError + 740;
  		if(temp < 740) {
  			trPoint += temp;
  		}
  		else {
  			trPoint += 740;
  		}
  		temp = ((-100+yawError)/slope)+pitchError+740;
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
	  	console.log(rArea/2);
	  	missedArea += (.5 * rArea);	
	  	missedLeft = false;
	  }
	  fill('white');
	  stroke('black');
	  text(missedArea, 1050, 30);		//display area
  }

  //---------------------------------------
  //	Conditions for swath movement
  //---------------------------------------

  if(pRefX > 980) {			//check to end movement of swath
  	isInSimulationRange = false;
  }
  if(isSimulate && isInSimulationRange) {		//make swath move if simulating and in range
  	swathX = swathX + 3;
  	pRefX = pRefX + 3;
  }

  keyTyped();					//add listener for key typed
}


//-----------------------------------------
//-----------------------------------------
//			Helper functions
//-----------------------------------------	
//-----------------------------------------

function keyTyped() {			//if start, no longer in setup, simulating, and in range
	if (key === 's') {
		isSimulate = true;
		isInSimulationRange = true;
	}
	if (key === 'r') {			//if reset, no longer simulating, reset swath position
		isSimulate = false;
		swathX = 300;
		swathY = 184;
		pRefX = 300.52;
		pRefY = 480;
		tlPoint = 0;
		blPoint = 0;
		trPoint = 0;
		brPoint = 0;
	}
}

function setupUserInput() {
  //todo -3.4908 should be -3.4906?
  pitchSlider = createSlider(-3.4908, 3.4908, 0, 0).position(20, 20);
  pitchInput = createInput().position(280,20).size(50,17);

  rollSlider = createSlider(-5.5, 5.5, 0, 0).position(20, 50);
  rollInput = createInput().position(280,50).size(50,17);

  yawSlider = createSlider(-10.4908, 10.4908, 0, 0).position(20, 80);
  yawInput = createInput().position(280,80).size(50,17);

  iCheckbox = createCheckbox('', false).position(20, 110);
}

function displayDynamicText(pitchError, rollError, yawError) {
  fill('white');    //display pitch, roll, and yaw errors
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

function changePitchInput() {       //change slider value to input field 
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
  }
}

function getDegrees(rad) {		//get degrees from radians for trig functions
	return rad * Math.PI/180;
}
