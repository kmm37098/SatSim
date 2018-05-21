var swathX = 300;
var swathY = 184; 
var simulate = false;
var reset = false;
var set = true;

function setup() {
  createCanvas(1280, 960);
  textSize(15);

  pSlider = createSlider(-3.4908, 3.4908, 0, 0);
  pSlider.position(20, 20);
  rSlider = createSlider(-.5, .5, 0, 0);
  rSlider.position(20, 50);
  ySlider = createSlider(-3.4908, 3.4908, 0, 0);
  ySlider.position(20, 80);

  fill('white');
  stroke('black');
  iCheckbox = createCheckbox('', false);
  iCheckbox.position(20, 110);

  angleMode(DEGREES);
}

function draw() {
  background(51);

  var inRange = true;

  let instability = false;
  if(iCheckbox.checked()) 
  	instability = true;


  let rErr = rSlider.value();
  let pErr = pSlider.value();
  let yErr = ySlider.value();

  if(set) {
  	swathX = 300 + pErr;
  	swathY = 184 + yErr;
  }


  fill('white');
  stroke('black');
  text("Pitch", 220, 30);
  text(pErr, 280, 30);
  text("Roll", 220, 60);
  text(rErr, 280, 60);
  text("Yaw", 220, 90);
  text(yErr, 280, 90);
  text("Instability", 50, 120);
  text("Press 's' to start simulation.", 1000, 900);
  text("Press 'r' to reset simulation.", 1000, 930);
  
  fill('green');
  stroke('green');
  let tArea = rect(540,360,200,200);

  fill('red');
  stroke('red');
  translate(swathX,swathY);
  rotate(rErr);
  let swath = rect(0,0,.52,592);
  rotate(-rErr);

  if(swathX > 980) {
  	inRange = false;
  }
  if(simulate && inRange) {
  	swathX = swathX + 3;
  }
  keyTyped();
}

function keyTyped() {
	if (key === 's') {
		set = false;
		reset = false;
		simulate = true;
	}
	if (key === 'r') {
		simulate = false;
		swathX = 300;
		swathY = 184;
	}
}