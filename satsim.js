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
	
var simulate = false;	
var inRange = true;
var set = true;			


var spareRandom = null;		//used for generating random

var pSlider;	//user input
var pInput;
var rSlider;
var rInput;
var ySlider;
var yInput;

function setup() {
  createCanvas(1280, 960);
  textSize(15);

  //setting up sliders and checkboxes

  pSlider = createSlider(-3.4908, 24.09, 0, 0); //set up sliders and text boxes 3.4908 = yp .5 = r
  pSlider.position(20, 20);						 	
  pInput = createInput();
  pInput.position(280,20);
  pInput.size(50,17);
  rSlider = createSlider(-5.5, 5.5, 0, 0);
  rSlider.position(20, 50);
  rInput = createInput();
  rInput.position(280,50);
  rInput.size(50,17);
  ySlider = createSlider(-10.4908, 10.4908, 0, 0);
  ySlider.position(20, 80);
  yInput = createInput();
  yInput.position(280,80);
  yInput.size(50,17);

  fill('white');
  stroke('black');
  iCheckbox = createCheckbox('', false);	//checkbox for instability
  iCheckbox.position(20, 110);

  angleMode(DEGREES);
}

function draw() {
  background(51);

  //--------------------------------------------------------------------------
  //     Grab and display values for pitch, roll, yaw, and set instability
  //--------------------------------------------------------------------------


  let instability = false;			//instability yes or no?
  let instabilityVal = 0;
  if(iCheckbox.checked()) {
  	instability = true;
  }

  if(instability && !set && inRange) {			//add randomness if instable and swath moving
  	instabilityVal = normalRandomScaled(0, 0.03333);
  	rSlider.value(rSlider.value() + instabilityVal);
  	instabilityVal = normalRandomScaled(0, 0.03333);
  	pSlider.value(pSlider.value() + instabilityVal);
  	instabilityVal = normalRandomScaled(0, 0.03333);
  	ySlider.value(ySlider.value() + instabilityVal);
  }

  let rErr = rSlider.value();	//get errors based on instability and slider value
  let pErr = pSlider.value();
  let yErr = ySlider.value();

  pInput.changed(pInputChange);		//add controller for input boxes
  rInput.changed(rInputChange);
  yInput.changed(yInputChange);

  if(simulate && inRange) { 
	slope = (592 * Math.cos(getDegrees(rErr)))/(592 * Math.sin(getDegrees(rErr)));
  }

  fill('white');		//display pitch, roll, and yaw errors
  stroke('black');
  text("Pitch", 220, 30);
  text(pErr, 350, 30);
  text("Roll", 220, 60);
  text(rErr, 350, 60);
  text("Yaw", 220, 90);
  text(yErr, 350, 90);
  text("Instability", 50, 120);
  text("Missed Area: ", 900, 30);
  text("Press 's' to start simulation.", 1000, 900);
  text("Press 'r' to reset simulation.", 1000, 930);

  //------------------------------------------------------------------------------------------------------------------
  //      Display target area. Set position of swath, reference point, startScan, and endScan according to errors
  //------------------------------------------------------------------------------------------------------------------

  if(set) {
  	swathX = 300.52 + pErr;		//set orientation of swath (no instability accounted)
  	swathY = 184 + yErr;
  	pRefX = 300.52 + pErr;		//set point of reference
  	pRefY = 480 + yErr;
  	startScan = 540.52 + pErr;		//set start and end scan position 
  	endScan = 741.52 + pErr;
  }
  
  fill('green');		//display target area
  stroke('green');
  let tArea = rect(540.52,360,200,200);

  fill('red');			//display swath w/ errors
  stroke('red');
  push();
  translate(swathX+.52,swathY+296);
  rotate(rErr);
  let swath = rect(-.52,-296,.52,592);

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
  	rotate(rErr);
  	let scan1 = rect(-.52,-296,.52,592);
  	stroke('red');
  	pop();
  }
  if(pRefX >= endScan) {			//display final swath scan position
  	fill('blue');
  	stroke('blue');
  	push();
  	translate(endScan-1,swathY+296);		//-1 to accomadate for endScan having to be divisible by 3
  	rotate(rErr);
  	let scan2 = rect(-.52,-296,.52,592);
  	stroke('red');
  	pop();
  }

  //---------------------------------------
  //	CALCULATE AREA
  //---------------------------------------


  if(pRefX == startScan) {									//find top left and bottom left corner of area polygon
  	if(isFinite(slope)) {	//if there is a roll error
  		let temp = ((100+yErr)/slope)+pErr + 540;
  		if(temp > 540) {
  			tlPoint += temp;
  		}
  		else {
  			tlPoint += 540;
  		}
  		temp = ((-100+yErr)/slope)+pErr+540;
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
  		if(pErr > 0) {
  			temp += pErr;
  		}
  		tlPoint += temp;
  		blPoint += temp;
  		console.log(tlPoint);
  		console.log(blPoint);
  	}
  }
  if(pRefX == endScan) {										//find top right and bottom right corner of area polygon
  	if(isFinite(slope)) {	//if there is a roll error
  		let temp = ((100+yErr)/slope)+pErr + 740;
  		if(temp < 740) {
  			trPoint += temp;
  		}
  		else {
  			trPoint += 740;
  		}
  		temp = ((-100+yErr)/slope)+pErr+740;
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
  		if(pErr < 0) {
  			temp += pErr;
  		}
  		trPoint += temp;
  		brPoint += temp;
  		console.log(trPoint);
  		console.log(brPoint);
  	}
  }

  if(!inRange) {
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
  	inRange = false;
  }
  if(simulate && inRange) {		//make swath move if simulating and in range
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
		set = false;
		simulate = true;
		inRange = true;
	}
	if (key === 'r') {			//if reset, no longer simulating, reset swath position
		simulate = false;
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

function pInputChange() {				//change slider value to input field 
	pSlider.value(pInput.value());
}
function rInputChange() {
	rSlider.value(rInput.value());
}
function yInputChange() {
	ySlider.value(yInput.value());
}

function normalRandom()				//gaussian random function
{
	var val, u, v, s, mul;

	if(spareRandom !== null)
	{
		val = spareRandom;
		spareRandom = null;
	}
	else
	{
		do
		{
			u = Math.random()*2-1;
			v = Math.random()*2-1;

			s = u*u+v*v;
		} while(s === 0 || s >= 1);

		mul = Math.sqrt(-2 * Math.log(s) / s);

		val = u * mul;
		spareRandom = v * mul;
	}
	
	return val / 14;	// 7 standard deviations on either side
}

function normalRandomScaled(mean, stddev)		//gaussian random function with stddev and mean
{
	var r = normalRandom();

	r = r * stddev + mean;

	return r;
}

function getDegrees(rad) {		//get degrees from radians for trig functions
	return rad * Math.PI/180;
}
