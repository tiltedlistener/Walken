
// Animation controller for different browsers
window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
})();


// Main game object. 
Game = {
	canvas : {
		c : document.getElementById('c'),
		width : document.getElementById('c').width,
		height : document.getElementById('c').height,
		ctx : document.getElementById('c').getContext("2d"),
	},
	common : {
		walken : new Image(),
		bg : new Image(),
		deadWalken : new Image(),
	},
	bg : {	
		floor : new Image(),
		floor2 : new Image(),
		rear : new Image(),
	}, 
	enemies : {
		garbage : new Image(),	
		airplane : new Image(),
		bottle : new Image(),
		boss : new Image(),
		pant : new Image(),
	},
	presentEnemies : {},
	presentEnemiesCount : 0,
	currentProgress : 0,
};

Game.bootstrap = (function () {		
	
	function pull() {
		
			// Bootstrap other functions
			Sounds.play.bootstrap();	
			Map.bootstrap.pull();	
		
			// Boot all the ingame functions
			for (module in Game) {
				if (module != '_proto_' && module != 'interface') {
					if (typeof Game[module] != 'undefined') {
						
						// Get all of our Init Functions
						if (typeof Game[module].init != 'undefined') 	
							Game[module].init();
					}
				}
			}
	}
	
	return {
		pull : pull	
	}
	
})();

Game.manager = (function() {
	
	function startLevel() {
		// Reset Virtual Counts
		Game.presentEnemiesCount = 0;
		Game.currentProgress = 0;
		Game.walken.resetX();
		Player.state.resetP();
		Title.countdown.reseT();
								
		// Add Background and Player
		Game.loop.addToLoop('00drawBg',Game.background.drawBg);		
		Game.loop.addToLoop('88drawWalken',Game.walken.drawWalken);
		Game.loop.loop();		
				
		// Update levels
		Levels.manager.play('level' + Levels.currentLevel);
		
		// Add Controls
		Game.input.applyGameInput();
		
		// Begin playing countdown
		$('#player').fadeIn(500, Title.countdown.pulseCountdown);
	}
	
	function runLevel() {
		Game.loop.allowTick(); 
		Game.loop.tick();
	}
	
	function endLevel() {
		Map.display.backToMap();
		Game.loop.stopTick();
		setTimeout(function () { 
			$('#player').hide();
			$('#level-complete').css('left', '-2000px');
			Game.loop.clear();
			Game.loop.clearAll();
			Game.loop.allowTick();
			Game.loop.tick();
			Map.display.run();
			Map.display.reveal(); }, 1000);
	}
	
	return {
		startLevel : startLevel,
		runLevel : runLevel,
		endLevel : endLevel,
	}
	
})();

Game.loop = (function () {
	
	// Modules
	var Constants,
		Canvas;
	
	var timeNow,
		lastTime = 0,
		elapsedTime,
		stopAnim = 0,
		LoopFunctions = {},
		fnLoopList = [],
		tempAdd = [],
		tempRemove = [],
		tickCount = 0,
		i = 0,
		haltTick = 0;
	
	function init() {
		Constants = Game.constants;
		Canvas = Game.canvas;	
	}
	
	// Animation Functions
	function animate() {
		timeNow = new Date().getTime();
		if (lastTime != 0) {
			elapsed = timeNow - lastTime;		
		}
		lastTime = timeNow;
	}	
    function tick() {
		if (haltTick == 0) {
			requestAnimFrame(tick);
			animate();
			loop();
		}
	}
	
	function clear() {
		Canvas.ctx.clearRect(0, 0, Canvas.width, Canvas.height);		
	}
	
	function loop() {		
		i = 0;						// Reset counter
		clear();					// Clear canvas
		assembleQueue();
				
		if (stopAnim == 0) {			
			for (;i<tickCount;i++) {
				LoopFunctions[fnLoopList[i]](); 
			}
		} else {
			Game.walken.drawDeadWalken();	
		}
	}
	
	function assembleQueue() {
		var tempSize = tempAdd.length;
		for(var i=0;i<tempSize;i++) {
			addToLoopProper(tempAdd[i].properName, tempAdd[i].functionName);
		}
		tempAdd = [];
		tempSize = tempRemove.length;
		for(var i=0;i<tempSize;i++) {
			removeFromLoopProper(tempRemove[i]);
		}
		tempRemove= [];
	}
	
	function addToLoopProper(name, fn) {		
		LoopFunctions[name] = fn;
		fnLoopList = Object.getOwnPropertyNames(LoopFunctions).sort();
		tickCount++;
	}
	
	function removeFromLoopProper(name) {
		if (typeof LoopFunctions[name] != 'undefined') {	
			delete LoopFunctions[name];
			fnLoopList = Object.getOwnPropertyNames(LoopFunctions).sort();
			tickCount--;
		}
	}
	
	function addToLoop(name, fn) {
		tempAdd.push({properName : name, functionName : fn});
	}
	
	function removeFromLoop(name) {
		tempRemove.push(name);	
	}	
	
	
	function stopGame() {
		stopAnim = 1;
	}
	
	function stopTick() {
		haltTick = 1;
	}
	
	function allowTick() {
		haltTick = 0;	
	}
	
	function clearAll() {
		i = 0;
		for (;i<tickCount;i++) {
			var current = fnLoopList[i];
			delete LoopFunctions[current]; 
		}
		tickCount = 0;
		fnLoopList = [];
	}
	
	return {
		init : init,
		addToLoop : addToLoop,
		removeFromLoop : removeFromLoop,
		tick : tick,
		loop : loop,
		clear : clear,
		stopGame : stopGame,
		stopTick : stopTick,
		allowTick : allowTick,
		clearAll : clearAll
	}
	
})();

Game.walken = (function() {
	
	// Modules
	var Canvas,
		Common,
		Position;
		
	// Locals
	var totalFrames = 7,
		currentFrame = 0,
		currentDeadFrame = 0,
		width = 130,
		deadWidth = 50,
		tickerLimit = 3,
		deadTickerLimit = 8,
		tickX = 0,
		tickDeadX = 0,
		heightPosStart = 310,
		heightPos = heightPosStart,
		jumpHeight = 110;
		directionY = -1,
		canJump = 0,
		maxSpeed = 5,
		speed = maxSpeed,
		speedTime = 0,
		xOffSet = 0,
		xOffSetLimit = 200,
		processingCollision = 0,
		bumpCounter = 0;
	
	function init() {
		
		Canvas = Game.canvas;
		Common = Game.common;
		Position = Game.enemy.getXPos;
		
		// Load Walken
		Common.walken.src = 'images/walken.png';
		Common.deadWalken.src = 'images/dead-walken.png';
	}
	
	function drawWalken() {
		Canvas.ctx.drawImage(Common.walken, setAnimX(), 0, 120, 106, 20 + offSetX(), getHeightPos(), 120, 106);	
		checkCollision();
	}
	
	function drawDeadWalken() {
		Canvas.ctx.drawImage(Common.deadWalken, setDeadAnimX(), 0, 50, 100, 50, 220, 50, 100);	
	}
	
	function offSetX() {
		return xOffSet;
	}
	
	function jumpForward() {	
		if (xOffSet < xOffSetLimit)
			xOffSet+=10;	
		else 
			Game.loop.removeFromLoop('jumpForward');
	}
	
	function retroGradeXoffSet() {
		if (xOffSet <= 0) {
			Game.loop.removeFromLoop('retroGradeXoffSet');
			xOffSet = 0;
		}
		else 
			xOffSet -=5;
	}
	
	function setAnimX() {	
		if (tickX > tickerLimit) {
			tickX = 0;
			currentFrame++;
			
			if (currentFrame > totalFrames)
				currentFrame = 0;	
		} else 
			tickX++;
		
		return currentFrame * width;
	}
	
	function setDeadAnimX() {	
		if (tickDeadX > deadTickerLimit) {
			Sounds.play.splash();
			
			tickDeadX = 0;
			currentDeadFrame++;
			
			if (currentDeadFrame > 6)
				currentDeadFrame = 0;	
				
		} else 
			tickDeadX++;
		
		return currentDeadFrame * deadWidth;
	}
	
	function jump() {		
		if (canJump == 0) {
			canJump = 1;
			Sounds.play.jump();
			Game.loop.removeFromLoop('retroGradeXoffSet');
			Game.loop.addToLoop('jumpCycle', jumpCycle);
			Game.loop.addToLoop('jumpForward', jumpForward);			
		}	
	}
	
	function jumpCycle() {
		// CalculateSpeed
	 	speedTime++;
		speed += directionY  * (9.8*Math.pow(speedTime/60, 2));
		
		heightPos += directionY * speed;
		
		// See if we've dropped below the starting point
		if (heightPos >= heightPosStart) {
			Game.loop.removeFromLoop('jumpCycle');
			Game.loop.addToLoop('retroGradeXoffSet', retroGradeXoffSet);
			heightPos = heightPosStart;
			directionY = -1;
			canJump = 0;
			speedTime = 0;
			speed = maxSpeed;
		} else if (heightPos < (heightPosStart - jumpHeight)){
			directionY = 1;
			speedTime = 0;
		}
	
	}
	
	function getHeightPos() {
		return heightPos;	
	}
	
	function checkCollision () {
		for(var enem in Game.presentEnemies) {	
			if (enem != '_proto_') {
				var current = Game.presentEnemies[enem],
					enemyXPos = current.getXPos(),
					enemyYPos = current.getYPos(),
					enemyHeight = current.getHeight();
																
				if (current.processingCollision == 0 && processingCollision == 0) {
					if ((xOffSet + 85) > enemyXPos && ((20 + xOffSet) < enemyXPos)) {
						if (getHeightPos() < (enemyYPos-10)) {
							current.processingCollision = processingCollision = 1;
							current.hit();
						} else if (getHeightPos() < (enemyYPos + enemyHeight) && getHeightPos() > enemyYPos) { 
							current.processingCollision = processingCollision = 1;
							bump();
						}
					}
				}
			}
		}
	}
	
	function bump() {
		Player.state.bump();
		Sounds.play.bump();
		Game.currentProgress -= 100;
		Game.loop.addToLoop('bump', bumpProcess);
	}
	
	function bumpProcess() {		
		for(var enem in Game.presentEnemies) {	
			if (enem != '_proto_') {
				var current = Game.presentEnemies[enem];
				current.bumpSetXPos();
			}
		}

		Game.background.bumpSetFloorXPos(20);
		bumpCounter++;
		if (bumpCounter >= 20) {
			Game.loop.removeFromLoop('bump');
			resetCollision();
			bumpCounter = 0;
			
			for(var enem in Game.presentEnemies) {	
				if (enem != '_proto_') {
					var current = Game.presentEnemies[enem];
					current.processingCollision = 0;
				}
			}
			
		}
	}
	
	function resetCollision() {
		processingCollision = 0;
	}
	
	function endWalken() {
		xOffSet+=20;
		
		if (xOffSet > 1000) {
			Game.loop.removeFromLoop('endWalken');
			Levels.manager.nextLevel();	
		}
	}
	
	function resetX() {
		xOffSet = 0;	
		currentFrame = 0;
		tickX = 0;
	}
	
	return {
		init : init,
		jump : jump,
		drawWalken : drawWalken,
		drawDeadWalken : drawDeadWalken,
		resetCollision : resetCollision,
		endWalken : endWalken,
		resetX : resetX,
		resetCollision : resetCollision,
	}
	
})();

Game.background = (function() {
	
	// Modules
	var Canvas,
		Bg;
	
	// Local
	var xPos = 900,
		xPosBg = 900,
		floorXCount = 0,
		floorXPos = 0,
		floorXLimit = 900,
		whichImage = true,
		stopBg = 0;
			
	function init() {
		Canvas = Game.canvas;
		Bg = Game.bg;
		Game.bg.rear.src = 'images/table-bg.png';
		Game.bg.floor.src = 'images/carpet.png';
		Game.bg.floor2.src = 'images/carpet2.png';
	}
	
	function setAnimXBg() {
		if (stopBg == 0) {
			xPosBg -=1;
			Game.currentProgress++;
			if (xPosBg < -900) 
				xPosBg = 900;
		}
		return xPosBg;	
	}
	
	function drawBg() {	
		setAnimCarpetX();
		Canvas.ctx.drawImage(Bg.rear, setAnimXBg(), 10);
		Canvas.ctx.drawImage(Bg.floor, floorXPos, 370);
		Canvas.ctx.drawImage(Bg.floor2, floorXPos + 900, 370);	
	}
	
	function setAnimCarpetX() {
		if (stopBg == 0) {
			floorXPos -=6;
			if (floorXPos <= -floorXLimit) {
				floorXPos = 0;
				carpetImageSource();
			}
		}
	}
	
	function carpetImageSource() {
		var temp = Bg.floor;
		Bg.floor = Bg.floor2;
		Bg.floor2 = temp;
	}
	
	// For Bumps
	function bumpSetFloorXPos (val) {
		floorXPos += val;
		xPosBg += 1;
	}
	
	// Ending levels
	function haltBg() {
		stopBg = 1;	
	}
	
	function startBg() {
		stopBg = 0;	
	}
		
	return {
		init : init,
		drawBg : drawBg,
		bumpSetFloorXPos : bumpSetFloorXPos,
		haltBg : haltBg,
		startBg : startBg,
	}
	
})();

Game.enemy = (function () {
	
	// Modules
	var Canvas,
		Enemies;
		
	// Locals
	var xPos = 900,
		status = true,
		hitPathCount = 0,
		yPos = 300,
		initialOffset = 0,
		hitPathCount = 0;
	
	function init() {
		
		// Localize
		Canvas = Game.canvas;
		Enemies = Game.enemies;
		
		// Initialize
		Game.enemies.garbage.src = 'images/can.png';
		Game.enemies.airplane.src = 'images/airplane.png';	
		Game.enemies.bottle.src = 'images/bottle.png';
		Game.enemies.boss.src = 'images/boss.png';
		Game.enemies.pant.src = 'images/pants.png';
	}
	
	function createEnemy(enem) {
		Game.presentEnemiesCount++;
		var current = new Enemy(Game.enemies[enem]);
		current.init();		
	}

	function createAirplane() {
		Game.presentEnemiesCount++;
		var current = new Airplane();
		current.init();		
	}
	
	function createBottle() {
		Game.presentEnemiesCount++;
		var current = new Bottle();
		current.init();		
	}

	function createBoss() {
		Game.presentEnemiesCount++;
		var current = new Boss();
		current.init();		
	}


	return {
		init : init,
		createEnemy : createEnemy,
		createAirplane : createAirplane,
		createBottle : createBottle,
		createBoss : createBoss
	}
	
})();

// An actual enemy Object

/** 

	Couple Thoughts:
	- Enemies always start on the far side of the screen
	- Timestamp creates their unique function identity
	- Assume enemies will always be in front of everything.
	
	Format:
	- Pass the object your image reference

**/
function Enemy(image) {
		
	var self = this;
	
	this.id = new Date().getTime();
	this.xPos = 900,
	this.status = true,
	this.hitPathCount = 0,
	this.yPos = 300,
	this.initialOffset = 0;
	this.hitPathCount = 0;
	this.height;
	
	// This is a sub variable from the Walken Module
	this.processingCollision = 0;
	
	// This sets
	this.image = image; 
	
	// Methods
	this.init = function () {
		this.height = this.image.height;
		Game.presentEnemies[this.id] = self;
		Game.loop.addToLoop(this.id,this.draw);
	}
	
	this.draw = function () {	
		Game.canvas.ctx.drawImage(self.image, self.setXPos(), self.getYPos());	
	}
	
	this.setXPos = function () {
		this.xPos -=6;
		
		if (this.xPos < -100) 
 			this.endExplosion();
		
		return this.xPos;	
	}
	
	this.getXPos = function () {
		return this.xPos;	
	}
	
	this.getYPos = function () {
		return this.yPos;	
	}
	
	this.hit = function () {	
		Sounds.play.hit();
		this.initialOffset = this.hitPathCount = this.getXPos();
		Game.food.createFood(this.initialOffset, this.getYPos());
		Game.loop.addToLoop('explosion-'+this.id, this.createExplosion);
		Game.walken.resetCollision();
	}
	
	this.createExplosion = function () {
		self.yPos = self.createHitPath();
		self.xPos += 15;
		
		if (self.yPos <= -100)
			self.endExplosion();
	}
	
	this.endExplosion = function () {
		Game.loop.removeFromLoop('explosion-'+this.id); 
		Game.loop.removeFromLoop(this.id);
		delete Game.presentEnemies[this.id];
		Game.presentEnemiesCount--;
	}
	
	this.createHitPath = function () {
		var num = Math.ceil(0.25 * -Math.pow((this.hitPathCount - this.initialOffset), 2)) + 330;
		this.hitPathCount++;
		return num;
	}
	
	this.accelerateExplosion = function () {
		return this.hitPathCount;	
	}
	
	// For Bumps
	this.bumpSetXPos  = function() {
		this.xPos += 20;
	}	
	
	this.getHeight = function () {
		return this.height;	
	}
	
};


function Airplane() {
		
	var self = this;
	
	this.id = new Date().getTime();
	this.xPos = 900,
	this.status = true,
	this.hitPathCount = 0,
	this.yPos = 270,
	this.initialOffset = 0;
	this.hitPathCount = 0;
	this.height;
	
	// This is a sub variable from the Walken Module
	this.processingCollision = 0;
	
	// This sets
	this.image = Game.enemies.airplane;
	
	// Methods
	this.init = function () {		
		this.height = this.image.height;
		Game.presentEnemies[this.id] = self;
		Game.loop.addToLoop(this.id,this.draw);
	}
	
	this.draw = function () {	
		Game.canvas.ctx.drawImage(self.image, self.setXPos(), self.getYPos());	
	}
	
	this.setXPos = function () {
		this.xPos -= 18;
		
		if (this.xPos < -100) 
 			this.endExplosion();
		
		return this.xPos;	
	}
	
	this.getXPos = function () {
		return this.xPos;	
	}
	
	this.getYPos = function () {			
		return this.yPos;	
	}
	
	this.hit = function () {	
		Sounds.play.hit();
		this.initialOffset = this.hitPathCount = this.getXPos();
		Game.loop.addToLoop('explosion-'+this.id, this.createExplosion);
		Game.walken.resetCollision();
	}
	
	this.createExplosion = function () {
		self.yPos = self.yPos + 10;
		self.xPox += 18;
		
		if (self.yPos >=550)
			self.endExplosion();
	}
	
	this.endExplosion = function () {
		Game.loop.removeFromLoop('explosion-'+this.id); 
		Game.loop.removeFromLoop(this.id);
		delete Game.presentEnemies[this.id];
		Game.presentEnemiesCount--;
	}
	
	this.createHitPath = function () {
		var num = Math.ceil(0.25 * -Math.pow((this.hitPathCount - this.initialOffset), 2)) + 330;
		this.hitPathCount++;
		return num;
	}
	
	this.accelerateExplosion = function () {
		return this.hitPathCount;	
	}
	
	// For Bumps
	this.bumpSetXPos = function() {
		this.yPos -= 40;
	}	
	
	this.getHeight = function () {
		return this.height;	
	}
	
};

function Bottle() {
		
	var self = this;
	
	this.id = new Date().getTime();
	this.xPos = 900,
	this.status = true,
	this.hitPathCount = 0,
	this.yPos = -200,
	this.initialOffset = 0;
	this.hitPathCount = 0;
	this.height;
	
	// This is a sub variable from the Walken Module
	this.processingCollision = 0;
	
	// This sets
	this.image = Game.enemies.bottle;
	
	// Methods
	this.init = function () {
		this.height = this.image.height;
		Game.presentEnemies[this.id] = self;
		Game.loop.addToLoop(this.id,this.draw);
		Game.loop.addToLoop('99bottleDescend', this.bottleDescend);
	}
	
	this.draw = function () {	
		Game.canvas.ctx.drawImage(self.image, self.setXPos(), self.getYPos());	
	}
	
	this.setXPos = function () {
		this.xPos -=6;
		
		if (this.xPos < -100) 
 			this.endExplosion();
		
		return this.xPos;	
	}
	
	this.getXPos = function () {
		return this.xPos;	
	}
	
	this.bottleDescend = function ()  {
				
		if (self.yPos >= 300) {
			self.yPos = 300;
			Game.loop.removeFromLoop('99bottleDescend');
		}
		else {
			self.yPos+=30;
		}
		
	}
	
	this.getYPos = function () {
		return this.yPos;	
	}
	
	this.hit = function () {	
		Sounds.play.hit();
		this.initialOffset = this.hitPathCount = this.getXPos();
		Game.loop.addToLoop('explosion-'+this.id, this.createExplosion);
		Game.walken.resetCollision();
	}
	
	this.createExplosion = function () {
		self.yPos = self.createHitPath();
		self.xPos += 15;
		
		if (self.yPos <= -100)
			self.endExplosion();
	}
	
	this.endExplosion = function () {
		Game.loop.removeFromLoop('explosion-'+this.id); 
		Game.loop.removeFromLoop(this.id);
		delete Game.presentEnemies[this.id];
		Game.presentEnemiesCount--;
	}
	
	this.createHitPath = function () {
		var num = Math.ceil(0.25 * -Math.pow((this.hitPathCount - this.initialOffset), 2)) + 330;
		this.hitPathCount++;
		return num;
	}
	
	this.accelerateExplosion = function () {
		return this.hitPathCount;	
	}
	
	// For Bumps
	this.bumpSetXPos  = function() {
		this.xPos += 20;
	}	
	
	this.getHeight = function () {
		return this.height;	
	}
	
};

function Boss() {
		
	var self = this;
	
	this.hitPoints = 4;
	
	this.frame = 0;
	this.frameCount = 0;
	this.frameCountLimit = 7;
	this.totalFrames = 6;
	
	this.heightArray = [120, 191, 248, 240, 200, 154, 133];
	this.heightDifference = [0, 71, 128, 120, 80, 34, 13];
	
	this.id = new Date().getTime();
	this.xPos = 900,
	this.status = true,
	this.hitPathCount = 0,
	this.yPos = 300,
	this.initialOffset = 0;
	this.hitPathCount = 0;
	this.height;
	
	this.direction = -1;
	
	// Cloud Position
	this.cloudXPos = 100;
	
	// This is a sub variable from the Walken Module
	this.processingCollision = 0;
	
	// This sets
	this.image = Game.enemies.boss; 
	
	// Methods
	this.init = function () {
		this.height = this.image.height;
		Game.presentEnemies[this.id] = self;
		Game.loop.addToLoop(this.id,this.draw);
	}
	
	this.draw = function () {	
		Game.canvas.ctx.drawImage(self.image, self.setFrame() * 340, 0, 320, 248, self.setXPos(), self.getYPos(), 320, 248);
		Game.canvas.ctx.drawImage(Game.enemies.pant, self.setXPos(), -90);
	}
		
	this.setFrame = function () {
		
		self.frameCount++;
		
		if (self.frameCount > self.frameCountLimit) {
			self.frame++;
			self.frameCount = 0;
			
			if (self.frame > self.totalFrames)
				self.frame = 0;	
		}
		
		// Set the height appropriately
		self.height = self.heightArray[self.frame];
		
		return self.frame;
	}
	
	this.setXPos = function () {
		
		if (this.xPos < 100)
			this.direction = 1;
		
		if (this.xPos > 600)
			this.direction = -1;
		
		this.xPos += this.direction * 6;

		
		if (this.xPos < -100) 
 			this.endExplosion();
		
		return this.xPos;	
	}
	
	this.getXPos = function () {
		return this.xPos;	
	}
	
	this.getYPos = function () {
		var current = this.heightDifference[this.frame];
		return this.yPos - current;	
	}
	
	this.hit = function () {	
		Sounds.play.hit();
		this.hitPoints--;		
		Game.clouds.initCloud(this.getXPos(), 300);	
		setTimeout(function() { self.processingCollision = 0; Game.walken.resetCollision(); }, 500);
		
		if (this.hitPoints == 0) {
			this.initialOffset = this.hitPathCount = this.getXPos();
			Game.loop.addToLoop('explosion-'+this.id, this.createExplosion);
		}
	}
	
	this.createExplosion = function () {
		self.yPos = self.createHitPath();
		self.xPos += 15;
		
		if (self.yPos <= -100)
			self.endExplosion();
	}
	
	this.endExplosion = function () {
		Game.loop.removeFromLoop('explosion-'+this.id); 
		Game.loop.removeFromLoop(this.id);
		delete Game.presentEnemies[this.id];
		Game.presentEnemiesCount--;
	}
	
	this.createHitPath = function () {
		var num = Math.ceil(0.25 * -Math.pow((this.hitPathCount - this.initialOffset), 2)) + 330;
		this.hitPathCount++;
		return num;
	}
	
	this.accelerateExplosion = function () {
		return this.hitPathCount;	
	}
	
	// For Bumps
	this.bumpSetXPos  = function() {
		this.xPos += 40;
	}	
	
	this.getHeight = function () {
		return this.height;	
	}
	
};

Game.clouds = (function () {
	
	function initCloud(x, y) {
		var current = new Cloud(x,y);
		current.init();
	}
	
	return {
		initCloud : initCloud,	
	}

})();

function Cloud (x,y) {
	
	var self = this;

	this.alpha = 1.0;
	this.yPos = y;
	this.xPos = x;
	this.image = Game.food.clouds;
	this.id = new Date().getTime();

	this.init = function () {
		Game.loop.addToLoop('cloud-' + this.id,this.draw);
	}

	this.draw = function () {
		Game.canvas.ctx.drawImage(Game.foods.clouds, self.setXPos(), self.yPos);
		self.setFadeOut();
	}
	
	this.setXPos = function () {
		self.xPos += 2;
		return self.xPos;
	}
	
	this.setFadeOut = function () {
		if (self.alpha <= 0) {
			self.alpha = 0.0;
			self.destroy();
		}
		else 
			self.alpha -=0.2;
	}
	
	this.destroy = function () {
		Game.loop.removeFromLoop('cloud-'+self.id); 
	}
}


Game.foods = {
	pizza : new Image(),
	yogurt : new Image(),
	chips : new Image(),
	clouds : new Image(),
}

Game.presentFood = {};
Game.presentFoodIdList = [];
Game.presentFoodCount = 0;

Game.food = (function () {
	
	function init() {
		Game.foods.clouds.src = 'images/clouds.png';
		Game.foods.pizza.src = 'images/pizza.png';
		Game.foods.yogurt.src = 'images/yogurt.png';
		Game.foods.chips.src = 'images/chips.png';	
	}
	
	function createFood(x, y) {
	
		// Randomize the food creation
		var whichFood;
		switch (Math.floor(Math.random() * 3 + 1)) {
			case 1: 
				whichFood = Game.foods.pizza;
				break;
			case 2: 
				whichFood = Game.foods.yogurt;
				break;
			case 3: 
				whichFood = Game.foods.chips;
				break;
		}
		
		var current = new Food(whichFood, x, y);
		current.init();			
		
		// Update Counts
		Game.presentFood[current.id] = current;
		Game.presentFoodIdList = Object.getOwnPropertyNames(Game.presentFood);
		Game.presentFoodCount = Game.presentFoodIdList.length;
	}
	
	function removeFood(id) {
		delete Game.presentFood[id];
		Game.presentFoodIdList = Object.getOwnPropertyNames(Game.presentFood);
		Game.presentFoodCount = Game.presentFoodIdList.length;
	}
	
	function checkForClick(x,y) {
		
		for(var i=0;i<Game.presentFoodCount;i++) {
			var current = Game.presentFood[Game.presentFoodIdList[i]],
				box = current.getBox();
			if (box.x1 <=  x && box.y1 <= y && box.x2 >= x && box.y2 >= y) {
				current.clicked();
			}
		}
	}
	
	return {
		init : init,
		createFood : createFood,	
		removeFood : removeFood,
		checkForClick : checkForClick,
	}
	
})();


function Food(image, x, y) {

	var self = this;
	this.image = image;
	this.id = new Date().getTime() + '-food';	
	this.xPos = x;
	this.yPos = y;
	this.intendToDestroy = 0;
	this.alpha = 1.0;
	
	// Image attr
	this.height;
	this.width;
	
	// Set up the content
	this.init = function () {		
		this.height = this.image.height;
		this.width = this.image.width;
		Game.presentFood[this.id] = self;
		Game.loop.addToLoop(this.id,this.draw);
	}
	
	this.draw = function () {	
		if (self.intendToDestroy == 1){
			Game.canvas.ctx.save();
			Game.canvas.ctx.globalAlpha = self.alpha;
			Game.canvas.ctx.drawImage(self.image, self.setXPos(), self.setYPos());
			Game.canvas.ctx.restore();
			self.alpha -= 0.05;
			
			// Fade out
			if (self.alpha <= 0) {
				self.alpha = 0.0;
				self.destroy();
			}
		} else
			Game.canvas.ctx.drawImage(self.image, self.setXPos(), self.setYPos());	
	}	
	
	this.setXPos = function () {
		self.xPos+=5;
		return self.xPos;
	}
	
	this.setYPos = function () {
		if ( self.intendToDestroy == 0) {
			self.yPos-=3;
			
			if (self.yPos < -100) {
				self.intendToDestroy = 1;
				self.destroy();
			}
		}
	
		return self.yPos;
	}
	
	this.destroy = function () {
		Game.loop.removeFromLoop(self.id);
		Game.food.removeFood(self.id);
	}
	
	this.getBox = function() {
		var increase = 10;
		var obj = { x1 : (self.xPos - increase), x2 : (self.xPos + self.width + increase), y1: (self.yPos - increase), y2: (self.yPos + self.height + increase)};
		return obj;
	}
	
	this.clicked = function () {
		if (self.intendToDestroy == 0) {
			self.intendToDestroy = 1;
			self.image = Game.foods.clouds;
			Player.state.addPoint();
		}
	}
	
}


/// SOUNDS
Sounds = {
	list : {
		music : 'sounds/music.wav',
		splash : 'sounds/splash.mp3',
		jump : 'sounds/jump.mp3',
		bump : 'sounds/bump.mp3',
		hit : 'sounds/good-hit.mp3',
		boss : 'sounds/boss.mp3',
		map : 'sounds/map-background.mp3',
	}
}

Sounds.play = (function () {
	
	//
	var splash,
		jump,
		hit,
		bump,
		boss,
		map,
		mainTheme;
	
	function bootstrap() {
		
		mainTheme = document.getElementById('mainTheme');
		mainTheme.volume=0.3;
		mainTheme.play();
		
		splash = document.createElement('audio');
		jump = document.createElement('audio');
		hit = document.createElement('audio');
		bump = document.createElement('audio');
		boss = document.createElement('audio');
		map = document.createElement('audio');
		
		splash.setAttribute('src', Sounds.list.splash);
		jump.setAttribute('src', Sounds.list.jump);
		hit.setAttribute('src', Sounds.list.hit);
		bump.setAttribute('src', Sounds.list.bump);
		boss.setAttribute('src', Sounds.list.boss);
		map.setAttribute('src', Sounds.list.map);
		
		splash.load();
		jump.load();
		hit.load();
		bump.load();
		boss.load();
		map.load();
	}
	
	function splash() {
		splash.curretTime = 0;
		splash.play();
	}
	
	function jump() {
		jump.play();	
	}
	
	function hit() {
		hit.currentTime=0;
		hit.play();	
	}
	
	function bump() {
		bump.play();	
	}
	
	function boss() {
		boss.play();	
	}
	
	function map() {
		map.play();
	}
	
	function pauseMap() {
		map.pause();	
		map.currentTime = 0;	
	}
	
	function stopTheme() {
		mainTheme.pause();
		mainTheme.currentTime = 0;	
	}
	
	return {
		bootstrap : bootstrap,
		splash : splash,
		jump : jump,
		hit : hit,
		bump : bump,
		stopTheme : stopTheme,
		boss : boss,
		map : map,
		pauseMap : pauseMap,
	}
	
})();


Game.input = (function () {
		
	function applyGameInput() {
		$(Game.canvas.c).click(getCoords);
		$(document).keydown(makeJump);
	}
	
	function makeJump(e) {
		if (e.keyCode == 32) 
			Game.walken.jump();
	}
		
	function removeGameInput() {
		$(Game.canvas.c).unbind('click', getCoords);
		$(document).unbind('keydown', makeJump);
	}
	
	function getCoords(e) {
		Game.food.checkForClick(e.offsetX, e.offsetY);
	}
	
	return {
		applyGameInput : applyGameInput,
		removeGameInput : removeGameInput,
	}
	
})();

// Player functions
Player = {
	life : 6,
	points : 0,	
	meter : null,
	meterPos : {
		6 : '-5px',
		5 : '-105px',
		4 : '-203px',
		3 : '-303px',
		2 : '-404px',
		1 : '-508px',
		0 : '-611px'
	},
	counter : null,
}

Player.bootstrap = (function () {
	
	function pull() {
		Player.meter = $('#life');
		Player.counter = $('#food-counter-counter');
	}
	
	return {
		pull : pull	
	}
	
})();

Player.state = (function () {
	
	function bump() {
		Player.life -= 1;
		
		if (Player.life == 0)
			gameOver();
		
		Player.meter.css('background-position-x', Player.meterPos[Player.life]);
	}
	
	function addPoint() {
		Player.points++;
		Player.counter.html(Player.points);
	}
	
	function resetPoints() {
		Player.points = 0;	
	}
	
	function gameOver() {
		$('#gameover').show();
		Sounds.play.stopTheme();
		Game.loop.stopGame();
		
	}
	
	function resetP() {
		Player.life = 6;	
		Player.meter.css('background-position-x', Player.meterPos[Player.life]);
	}
	
	return {
		bump : bump,
		resetP : resetP,
		addPoint : addPoint,
		resetPoints : resetPoints,
	}
	
})();

// Title functions idiot
Title = {
	common : {
		wrapper : null,
		title : null,
		story : null,
		controls : null,
		start : null,
		countdown : null,
	},
	countPos : {
		3 : '0px',
		2 : '-216px',
		1 : '-432px',
		0 : '-648px',	
	}
}

Title.bootstrap = (function () {
		
	function pull() {
		Title.common.wrapper = $('#title-wrapper');
		Title.common.title = $('#title-main');
		Title.common.controls = $('#controls');
		Title.common.start = $('#start');
		Title.common.countdown = $('#countdown');
		Title.common.story = $('#story');	
	
		// Startup all the game functions
		Game.bootstrap.pull();
		Player.bootstrap.pull();
				
		// Click events
		Title.common.controls.click(startGame);
		Title.common.story.click(clearStory);
	}
	
	function startGame() {
		Game.loop.tick();
		Map.display.run();
		Title.common.title.animate({left : '-900px'}, 800, function () {
			Title.common.wrapper.hide();	
		});
	}
	
	function clearStory() {
		Title.common.story.animate({left : '-900px'}, 800);
	}

	return {
		pull : pull,
	}

})();

Title.countdown = (function () {
			
	function pulseCountdown() {
			Title.common.countdown.show();
			setTimeout( function () { Title.common.countdown.css('background-position-y', Title.countPos['2'] );}, 1000);
			setTimeout( function () { Title.common.countdown.css('background-position-y', Title.countPos['1'] ); }, 2000);
			setTimeout( function () { Title.common.countdown.css('background-position-y', Title.countPos['0'] ); }, 3000);
			setTimeout( function () { Title.common.countdown.fadeOut('fast'); Game.manager.runLevel(); }, 4000);
	}
	
	function reseT() {
		Title.common.countdown.css('background-position-y',  Title.countPos['3']);
	}
	
	return {
		pulseCountdown : pulseCountdown,
		reseT : reseT
	}
	
})();

// Levels
Levels = {
	currentLevel : 1,
};

Levels.manager = (function () {
	
	var current;
	
	function play(val) {
		// Reset the halt counter if set in the last level
		Game.background.startBg();
		current = val;
		Game.loop.addToLoop(val, Levels[val].play);
	}
	
	function end() {
		Game.loop.removeFromLoop(current);
		Game.background.haltBg();
		Game.input.removeGameInput();
		Game.loop.addToLoop('endWalken', Game.walken.endWalken);
		$('#level-complete').animate({left : '28%'}, 1000, function () { setTimeout(Game.manager.endLevel, 2000)});
	}

	function endGame() {
		document.getElementById("victory").style.top = '40px';
	}
		
	function nextLevel() {
		Levels.currentLevel++;	
		
		if (Levels.currentLevel > 4)
		{}
	}
	
	return {
		play : play,
		end : end,
		nextLevel : nextLevel,
		endGame: endGame
	}
	
})();

Levels.level3 = (function () {
	
	var MasterList = {
		100 : garbage,
		200 : garbage,
		250 : garbage,
		400 : garbage,
		800 : end,
	},
		List = MasterList,
		current = 100;
	
	function play() {
		if (Game.currentProgress >= current)
		{
			List[current]();
			delete List[current];
			for (var prop in List) {
				current = prop;
				break;
			}
		}
			
	}
		
	function garbage() {
		Game.enemy.createEnemy('garbage');
	}
	function airplane() {
		Game.enemy.createAirplane();
	}
	function bottle() {
		Game.enemy.createBottle();
	}
	function boss() {
		Game.enemy.createBoss();
	}
	
	function end() {
		Levels.manager.end();
	}
	
	function rebuild() {
		List = MasterList;
	}
	
	return {
		play : play
	} 
	
})();



Levels.level2 = (function () {
	
	var MasterList = {
		100 : garbage,
		150 : garbage,
		200 : airplane,
		225 : garbage,
		275 : garbage,
		500 : end,
	},
		List = MasterList,
		current = 100;
	
	function play() {
		if (Game.currentProgress >= current)
		{
			List[current]();
			delete List[current];
			for (var prop in List) {
				current = prop;
				break;
			}
		}
			
	}
		
	function garbage() {
		Game.enemy.createEnemy('garbage');
	}
	function airplane() {
		Game.enemy.createAirplane();
	}
	
	function end() {
		Levels.manager.end();
	}
	
	function rebuild() {
		List = MasterList;
	}
	
	return {
		play : play
	} 
	
})();

Levels.level1 = (function () {
	
	var MasterList = {
		150 : boss,
		1000 : end,
	},
	List = MasterList,
	current = 150;
	
	function play() {
		if (Game.currentProgress >= current)
		{
			List[current]();
			delete List[current];
			for (var prop in List) {
				current = prop;
				break;
			}
		}
	}
		
	function boss() {
		Game.enemy.createBoss();
	}
	
	function end() {
		// Levels.manager.end();
		setTimeout( function () { Levels.manager.endGame() }, 1000);
	}
	
	function rebuild() {
		List = MasterList;
	}
	
	return {
		play : play
	} 
	
})();



Map = {
	map : new Image(),
	smallWalken : new Image(),
	x : new Image(),
	date : new Image(), 
	lock : new Image(),
	jason : new Image(),
	datePos : {
		1 : 0,
		2 : 145,
		3 : 300,	
	},
	controls : document.getElementById('levels'),
	level1 : document.getElementById('level-1'),
	level2 : document.getElementById('level-2'),
	cover : document.getElementById('fill'),
	currentPos : 'desk',
}

Map.bootstrap = (function () {
	
	function pull() {
		Map.map.src = 'images/map.png';
		Map.smallWalken.src ='images/halfwalken.png';
		Map.x.src = 'images/x.png';
		Map.lock.src = 'images/lock.png';
		Map.date.src = 'images/dates.png';
		Map.cover.src = 'images/water-fill.png';
		Map.jason.src = 'images/jason.png';
	}
	
	return {
		pull : pull
	}	
	
})();

Map.display = (function () {
	
	// Locals
	var tickX = 0,
		tickerLimit = 1,
		currentFrame = 0,
		totalFrames = 19,
		width = 65,
		xPos = 70,
		yPos = 90,
		direction = 1,
		coverPos = 450,
		mapRunning = 0;
	
	function run() {
		$(Map.controls).show();
		Game.loop.addToLoop('01showMap',showMap);		
		Game.loop.addToLoop('02showDate',showDate);		
		Game.loop.addToLoop('04showWalken',showWalken);	
		Game.loop.addToLoop('03showX',showX);		
		Map.input.applyClicks();
		mapRunning = 1;
	}
	
	function showMap() {
		Game.canvas.ctx.drawImage(Map.map, 0, 0);	
	}
	
	function showDate() {
		Game.canvas.ctx.drawImage(Map.date, 0, setDatePos(), 123, 127, 750, 0, 123, 127);	
	}
	
	function setDatePos() {
		if (Levels.currentLevel == 1)
			return 0;
		else if (Levels.currentLevel == 2)
			return 140;
		else if (Levels.currentLevel == 3)
			return 300;
	}
	
	function showWalken() {
		Game.canvas.ctx.drawImage(Map.smallWalken, setAnimX(), 0, 65, 56, getXPos(), getYPos(), 65, 56);	
	}
	
	function getXPos() {
		return xPos;
	}
	
	function getYPos() {
		return yPos;	
	}
	
	function setAnimX() {
		if (tickX > tickerLimit) {
			tickX = 0;
			currentFrame++;
			
			if (currentFrame > totalFrames)
				currentFrame = 0;	
		} else 
			tickX++;
		
		return currentFrame * width;
	}
	
	function showX() {	
	
		if (Levels.currentLevel == 1)
			Game.canvas.ctx.drawImage(Map.lock, 640, 290);
	
		if (Levels.currentLevel == 2)
			Game.canvas.ctx.drawImage(Map.x, 70, 90);	
		
		if (Levels.currentLevel == 3) {
			Game.canvas.ctx.drawImage(Map.x, 640, 290);
			Game.canvas.ctx.drawImage(Map.jason, 70, 90);	
		}
			
	}
	
	function end() {
		$(Map.controls).hide();
		Game.loop.removeFromLoop('01showMap');
		Game.loop.removeFromLoop('02showDate');
		Game.loop.removeFromLoop('04showWalken');
		Game.loop.removeFromLoop('03showX');
	}
	
	// For animating the map Walken
	function setPositions() {			
		xPos += direction*4;
		yPos = (20/57) * xPos + 70;
		
	
		if (direction == 1) {
			if (xPos >= 640)
				resetMapAfterMove();
		}
		else {
			if (xPos <= 70) 
				resetMapAfterMove();
		}
	}
	
	function setDirection (val) {
		direction = val;	
		Game.loop.addToLoop('99setPositions-map', setPositions);
	}
	
	function resetMapAfterMove() {
		Game.loop.removeFromLoop('99setPositions-map');
		Map.input.applyClicks();
	}
	
	function coverAndRemove() {		
		$('#fill-wrapper').show();
		$(Map.cover).animate({marginTop: '0px'}, 600, function () {
			end();	
			Game.loop.stopTick();
			Game.loop.clear();
			Game.manager.startLevel();
			reveal();		
		});
	}
	
	function backToMap() {
		$('#fill-wrapper').show();
		$(Map.cover).animate({marginTop: '0px'}, 600);
	}
	
	function reveal() {	
		$(Map.cover).animate({marginTop: '-450px'}, 600, function () {
			$('#fill-wrapper').hide();
			$(Map.cover).css('margin-top', '450px');			
		});
	}
	
	return {
		run : run,
		end : end,
		setDirection : setDirection,
		coverAndRemove : coverAndRemove,
		backToMap : backToMap,
		reveal : reveal
	}
	
})();

Map.input = (function () {
	
	function applyClicks() {
		$(Map.level1).click(gotoLevelDesk);
		$(Map.level2).click(gotoLevelKitchen);
	}
	
	function removeClicks() {
		$(Map.level1).unbind('click');
		$(Map.level2).unbind('click');
	}
	
	function gotoLevelDesk() {		
	
		if (Map.currentPos == 'desk' && (Levels.currentLevel == 1 || Levels.currentLevel == 3))
		{
			// Start the level	
			Map.input.removeClicks();
			Map.display.coverAndRemove();
		}
		else {
			Map.currentPos = 'desk';
			Map.input.removeClicks();
			
			// Move to desk
			Map.display.setDirection(-1);
		}
	}
	
	function gotoLevelKitchen() {
		if (Map.currentPos == 'kitchen' && Levels.currentLevel == 2)
		{
			// Start the kitchen
			Map.input.removeClicks();
			Map.display.coverAndRemove();
		}
		else {
			Map.currentPos = 'kitchen';
			Map.input.removeClicks();
			
			// Move to kitchen
			Map.display.setDirection(1);
		}
	}
	
	return {
		applyClicks : applyClicks,
		removeClicks : removeClicks,	
	}
	
})();




window.onload = Title.bootstrap.pull;