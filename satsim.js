var swathX = 300;
var swathY = 184; 
var tlPoint = 0;
var blPoint = 0;
var trPoint = 0;
var brPoint = 0;
var startScan = 540;
var endScan = 741;
var simulate = false;
var inRange = true;
var set = true;


var spareRandom = null;

var pSlider;
var pInput;
var rSlider;
var rInput;
var ySlider;
var yInput;

function setup() {
  createCanvas(1280, 960);
  textSize(15);

  pSlider = createSlider(-3.4908, 3.4908, 0, 0); //set up sliders and text boxes
  pSlider.position(20, 20);						 	
  pInput = createInput();
  pInput.position(280,20);
  pInput.size(50,17);
  rSlider = createSlider(-5, .5, 0, 0);
  rSlider.position(20, 50);
  rInput = createInput();
  rInput.position(280,50);
  rInput.size(50,17);
  ySlider = createSlider(-3.4908, 3.4908, 0, 0);
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

  fill('white');		//display pitch, roll, and yaw errors
  stroke('black');
  text("Pitch", 220, 30);
  text(pErr, 350, 30);
  text("Roll", 220, 60);
  text(rErr, 350, 60);
  text("Yaw", 220, 90);
  text(yErr, 350, 90);
  text("Instability", 50, 120);
  text("Press 's' to start simulation.", 1000, 900);
  text("Press 'r' to reset simulation.", 1000, 930);

  if(set) {
  	swathX = 300 + pErr;		//set orientation of swath (no instability accounted)
  	swathY = 184 + yErr;
  	startScan = 540 + pErr;		//set start and end scan position 
  	endScan = 740 + pErr;
  }
  
  fill('green');		//display target area
  stroke('green');
  let tArea = rect(540,360,200,200);

  fill('red');			//display swath w/ errors
  stroke('red');
  push();
  translate(swathX,swathY);
  rotate(rErr);
  let swath = rect(0,0,.52,592);
  pop();

  if(swathX >= startScan) {			//display initial swath scan position
  	fill('blue');
  	stroke('blue');
  	push();
  	translate(startScan,swathY);
  	rotate(rErr);
  	let scan1 = rect(0,0,.52,592);
  	stroke('red');
  	pop();
  }
  if(swathX >= endScan) {			//display final swath scan position
  	fill('blue');
  	stroke('blue');
  	push();
  	translate(endScan,swathY);
  	rotate(rErr);
  	let scan2 = rect(0,0,.52,592);
  	stroke('red');
  	pop();
  }
  if(swathX == startScan) {			//find top left and bottom left corner of area polygon
  	if(startScan > 540) {
  		tlPoint += swathX;
  		blPoint += swathX;
  	}
  	else {
  		tlPoint += 540;
  		blPoint += 540;
  	}
  	if(rErr != 0) {
  		let diff = (((296 * Math.cos(getDegrees(rErr))) - yErr) - 100) * Math.tan(getDegrees(rErr));
  		if(diff + tlPoint > 540) {
  			tlPoint += diff;
  		}
  	}
  }
  if(swathX >= endScan && swathX <= endScan + 3) {
  	trPoint += swathX;
  }
  //text(tlPoint, 500, 600);	//testing
  //rect(trPoint,500,50,50);	//testing

  if(swathX > 980) {			//check to end movement of swath
  	inRange = false;
  }
  if(simulate && inRange) {		//make swath move if simulating and in range
  	swathX = swathX + 3;
  }

  keyTyped();					//add listener for key typed
}

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

function getDegrees(rad) {
	return rad * Math.PI/180;
}
