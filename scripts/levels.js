// Levels
Levels = {
	currentLevel : 1,
};

Levels.manager = (function () {
	
	var current;
	
	function play(val) {
		// Reset the halt counter if set in teh last level
		Game.background.startBg();
		current = val;
		Game.loop.addToLoop(val, Levels[val].play);
	}
	
	function end() {
		Game.loop.removeFromLoop(current);
		Game.background.haltBg();
		Game.loop.addToLoop('endWalken', Game.walken.endWalken);
		$('#level-complete').animate({left : '40%'}, 1000, function () {
			setTimeout(moveToNextLevel, 3000);	
		});
	}
	
	function moveToNextLevel() {
		Game.manager.startLevel();
	
	}
	
	function nextLevel() {
		Levels.currentLevel++;	
		
		if (Levels.currentLevel > 4)
		{}
		
		
	}
	
	return {
		play : play,
		end : end,
		nextLevel : nextLevel
	}
	
})();

Levels.level1 = (function () {
	
	var MasterList = {
		100 : garbage,
		300 : garbage,
		600 : garbage,
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
		200 : garbage,
		225 : garbage,
		250 : garbage,
		275 : garbage,
		350 : end,
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
