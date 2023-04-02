warn("loading the triggers file");

///////////////////////
// Trigger listeners //
///////////////////////


var unitTargetClass = "Unit+!Ship+!Animal";
var siegeTargetClass = "Structure";

var triggerPointsAnimalPen = "A";
var triggerPointsShipSpawn = "J";



var unitFormations = [
	"special/formations/box"
	/*"special/formations/battle_line",
	"special/formations/line_closed",
	"special/formations/column_closed"*/
];


var disabledTemplatesCCs = (civ) => [

	
	// Expansions
	"structures/" + civ + "/civil_centre",
	"structures/" + civ + "/military_colony",

	// Shoreline
	"structures/brit/crannog"
];

var disabledTemplatesDocksCCs = (civ) => [

	
	// Expansions
	"structures/" + civ + "/civil_centre",
	"structures/" + civ + "/military_colony",

	// Shoreline
	"structures/" + civ + "/dock",
	"structures/brit/crannog",
	"structures/cart/super_dock",
	"structures/ptol/lighthouse"
];


var disabledTemplates = (civ) => [
	// Economic structures
	"structures/" + civ + "/corral",
	"structures/" + civ + "/farmstead",
	"structures/" + civ + "/field",
	"structures/" + civ + "/storehouse",
	"structures/" + civ + "/rotarymill",
	"structures/" + civ + "/market",
	"structures/" + civ + "/house",
	
	//military
	"structures/" + civ + "/barracks",
	"structures/" + civ + "/apartment",
	"structures/" + civ + "/defense_tower",
	"structures/" + civ + "/tower_bolt",
	"structures/" + civ + "/tower_artilery",
	"structures/" + civ + "/elephant_stable",
	"structures/" + civ + "/forge",
	"structures/" + civ + "/arsenal",
	"structures/" + civ + "/fortress",
	"structures/" + civ + "/range",
	"structures/" + civ + "/stable",
	"structures/" + civ + "/temple",
	"structures/" + civ + "/outpost",
	
	// Expansions
	"structures/" + civ + "/civil_centre",
	"structures/" + civ + "/military_colony",

	// Walls
	"structures/" + civ + "/wallset_stone",
	"structures/rome_wallset_siege",
	"other/wallset_palisade",

	// Shoreline
	"structures/" + civ + "/dock",
	"structures/brit/crannog",
	"structures/cart/super_dock",
	"structures/ptol/lighthouse",
	
	//villagers
	"units/" + civ + "/support_female_citizen",
	
	//embasies
	"structures/cart/embassy_celtic",
	"structures/cart/embassy_italic",
	"structures/cart/embassy_iberian"
];



Trigger.prototype.WalkAndFightRandomtTarget = function(attacker,target_player,target_class)
{
	let target = this.FindRandomTarget(attacker,target_player,target_class);
	if (!target)
	{
		target = this.FindRandomTarget(attacker,target_player,siegeTargetClass);
	}
	
	
	if (target)
	{
		// get target position
		var cmpTargetPosition = Engine.QueryInterface(target, IID_Position).GetPosition2D();
		
		
		let cmpUnitAI = Engine.QueryInterface(attacker, IID_UnitAI);
		cmpUnitAI.SwitchToStance("violent");
		cmpUnitAI.WalkAndFight(cmpTargetPosition.x,cmpTargetPosition.y,null);
	}
	else //find a structure
	{
		
		
		warn("[ERROR] Could not find closest target to fight: "+attacker+" and "+target_player+" and "+target_class);
	}
	
}

Trigger.prototype.WalkAndFightClosestTarget = function(attacker,target_player,target_class)
{
	let target = this.FindClosestTarget(attacker,target_player,target_class);
	if (!target)
	{
		target = this.FindClosestTarget(attacker,target_player,siegeTargetClass);
	}
	
	
	if (target)
	{
		// get target position
		var cmpTargetPosition = Engine.QueryInterface(target, IID_Position).GetPosition2D();
		
		
		let cmpUnitAI = Engine.QueryInterface(attacker, IID_UnitAI);
		cmpUnitAI.SwitchToStance("violent");
		cmpUnitAI.WalkAndFight(cmpTargetPosition.x,cmpTargetPosition.y,null);
	}
	else //find a structure
	{
		
		
		warn("[ERROR] Could not find closest target to fight: "+attacker+" and "+target_player+" and "+target_class);
	}
	
}


Trigger.prototype.FindRandomTarget = function(attacker,target_player,target_class)
{
	let targets = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(target_player), target_class).filter(TriggerHelper.IsInWorld);
	
	if (targets.length < 1)
	{
		//no targets, check if any unit is there
		targets = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(target_player), "Unit").filter(TriggerHelper.IsInWorld);
	
	}
	
	//if still no targets return null
	if (targets.length < 1)
	{
		warn("[ERROR] Could not find target!");
		return null;
	}
	
	return pickRandom(targets);
}


Trigger.prototype.FindClosestTarget = function(attacker,target_player,target_class)
{
	
	//let targets = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(target_player), unitTargetClass);
	
	let targets = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(target_player), target_class).filter(TriggerHelper.IsInWorld);
	
	if (targets.length < 1)
	{
		//no targets, check if any unit is there
		targets = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(target_player), "Unit").filter(TriggerHelper.IsInWorld);
	
	}
	
	//if still no targets return null
	if (targets.length < 1)
	{
		warn("[ERROR] Could not find target!");
		return null;
	}
	
	let closestTarget;
	let minDistance = Infinity;
	
	for (let target of targets)
	{
		if (!TriggerHelper.IsInWorld(target))
			continue;

		let targetDistance = PositionHelper.DistanceBetweenEntities(attacker, target);
		if (targetDistance < minDistance)
		{
			closestTarget = target;
			minDistance = targetDistance;
		}
	}
	
	return closestTarget;
}

Trigger.prototype.SpawnAttackSquad = function(data)
{
	
	let p = data.p;
	let site = data.site;
	let templates = data.templates;
	let size = data.size; 
	let target_class = data.target_class;
	let target_player = data.target_player;
	let target_pos = data.target_pos;
	let use_formation = data.use_formation;
	
	
	//spawn the units
	let attackers = [];	
	for (let i = 0; i < size; i++)
	{
		let unit_i = TriggerHelper.SpawnUnits(site,pickRandom(templates),1,p);
		attackers.push(unit_i[0]);
	}
	
	//set formation
	if (use_formation == undefined || use_formation == true)
	{
		TriggerHelper.SetUnitFormation(p, attackers, pickRandom(unitFormations));
	}

	//make them attack
	let target = this.FindClosestTarget(attackers[0],target_player,target_class);
	
	//if (target_pos == undefined)
	
	target_pos = TriggerHelper.GetEntityPosition2D(target);
	
	ProcessCommand(p, {
		"type": "attack-walk",
		"entities": attackers,
		"x": target_pos.x,
		"z": target_pos.y,
		"queued": true,
		"targetClasses": {
			"attack": unitTargetClass
		},
		"allowCapture": false
	});
}


//scenario indendent functions
Trigger.prototype.PatrolOrderList = function(units,p,patrolTargets)
{
	
	if (units.length <= 0)
		return;
		

	for (let patrolTarget of patrolTargets)
	{
		let targetPos = TriggerHelper.GetEntityPosition2D(patrolTarget);
		ProcessCommand(p, {
			"type": "patrol",
			"entities": units,
			"x": targetPos.x,
			"z": targetPos.y,
			"targetClasses": {
				"attack": unitTargetClass
			},
			"queued": true,
			"allowCapture": false
		});
	}
}


Trigger.prototype.ShowText = function(text,option_a,option_b)
{
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"type": "dialog",
		"players": [1,2,3,4,5,6,7,8],
		"dialogName": "yes-no",
		"data": {
			"text": {
				"caption": {
					"message": markForTranslation(text),
					"translateMessage": true,
				},
			},
			"button1": {
				"caption": {
					"message": markForTranslation(option_a),
					"translateMessage": true,
				},
				"tooltip": {
					"message": markForTranslation(option_a),
					"translateMessage": true,
				},
			},
			"button2": {
				"caption": {
					"message": markForTranslation(option_b),
					"translateMessage": true,
				},
				"tooltip": {
					"message": markForTranslation(option_b),
					"translateMessage": true,
				},
			},
		},
	});
	
}


Trigger.prototype.CorralCheck = function(data)
{
	let p = 1;
	//warn("corrral check");
	let corrals = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Corral").filter(TriggerHelper.IsInWorld);

	for (let c of corrals)
	{
		let animals = ["gaia/fauna_cattle_cow_trainable","gaia/fauna_sheep_trainable",
		"gaia/fauna_sheep_trainable","gaia/fauna_goat_trainable","gaia/fauna_goat_trainable","gaia/fauna_goat_trainable"];
		
		//spawn one there
		let animals_c = TriggerHelper.SpawnUnits(c, pickRandom(animals),1,p);
		
		//walk over to trigger point
		let pen_site = pickRandom(this.GetTriggerPoints("A"));
		
		var cmpTargetPosition = Engine.QueryInterface(pen_site, IID_Position).GetPosition2D();

		let cmpUnitAI = Engine.QueryInterface(animals_c[0], IID_UnitAI);
		
		cmpUnitAI.Walk(cmpTargetPosition.x,cmpTargetPosition.y,false,true);
	}
	
	this.DoAfterDelay(5 * 1000,"CorralCheck",null);

}


Trigger.prototype.StructureDecayCheck = function(data)
{
	//warn("structure decay check");
	for (let p of [1,4])
	{
		let structs = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Structure").filter(TriggerHelper.IsInWorld);

		for (let s of structs)
		{
			var cmpCapt = Engine.QueryInterface(s, IID_Capturable);
			if (cmpCapt)
			{
				let c_points = cmpCapt.GetCapturePoints();
				
				//if coral or forge, check if player 1 is trying to capture
				if (p == 4)
				{
					
					let id = Engine.QueryInterface(s, IID_Identity);
					
					//warn(uneval(id));
					//warn(uneval(c_points));
					if (id && (id.visibleClassesList.indexOf("Corral") >= 0 || id.visibleClassesList.indexOf("Forge") > 0))
					{
						if (c_points[1] > 0) //player 1 has made an attempt, flip ownership
						{
							var cmpOwnership = Engine.QueryInterface(s, IID_Ownership);
							cmpOwnership.SetOwner(1);
						}
					}
				}
				
				
				if (c_points[0] > 0)
				{
					c_points[p] += c_points[0];
					c_points[0] = 0;
					cmpCapt.SetCapturePoints(c_points);
				}
			}
		}
	}
}



Trigger.prototype.MonitorCrazedHeroesQuest = function(data)
{
	if (this.crazedHeroesInProgress == true)
	{
		let p = 6;
		let units = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Hero").filter(TriggerHelper.IsInWorld);
		
		let nomad_temple = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(8),"Temple").filter(TriggerHelper.IsInWorld)[0];
				
		//make them attack
		for (let u of units)
		{
			let cmpUnitAI = Engine.QueryInterface(u, IID_UnitAI);
			if (cmpUnitAI)
			{
				if (cmpUnitAI.IsIdle())
				{
					this.WalkAndFightClosestTarget(u,1,"Hero");
				}
			}
			
			//check if any of them are close to the gaia temple
			let d = DistanceBetweenEntities(u, nomad_temple);

			if (d < 35)
			{
				this.QuestCrazedHeroesComplete();
				return;
			}
		}
		
		this.DoAfterDelay(5 * 1000,"MonitorCrazedHeroesQuest",null);	
	}
}


Trigger.prototype.MonitorRiverBanditsQuestQuest = function(data)
{
	
}

Trigger.prototype.MonitorBarracksCaptivesQuest = function(data)
{
	//for barracks captives quest
	if (this.barracksCaptivesQuestStarted == true && this.barracksCaptivesQuestDone == false)
	{
		let p = 6;
		let units = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Soldier").filter(TriggerHelper.IsInWorld);
		
		if (units.length == 0)
		{
			//quest is done, give reward
			this.QuestBarracksCaptivesComplete();
		}
		else 
		{
			//make them attack
			for (let u of units)
			{
				let cmpUnitAI = Engine.QueryInterface(u, IID_UnitAI);
				if (cmpUnitAI)
				{
					if (cmpUnitAI.IsIdle())
					{
							this.WalkAndFightClosestTarget(u,1,"Hero");
					}
				}
			}	
			
			
			this.DoAfterDelay(5 * 1000,"MonitorBarracksCaptivesQuest",null);
		}
	}
	
}




Trigger.prototype.IdleUnitCheck = function(data)
{
	this.idleCheckCounter += 1;
	//warn("idle init check counter = "+uneval(this.idleCheckCounter));
	
	if (	this.idleCheckCounter >= 100)
	{
		this.ShowText("We have taken too long! There is now no hope!","Bummer","Let's try again!");
		this.DoAfterDelay(2 * 1000,"LoseGame",null);
		
	}
	
	for (let p of [4])
	{
		//find all idle units
		let units = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Soldier").filter(TriggerHelper.IsInWorld);
		
		let idle_units = [];
		for (let u of units)
		{
			let cmpUnitAI = Engine.QueryInterface(u, IID_UnitAI);
			if (cmpUnitAI)
			{
				if (cmpUnitAI.IsIdle()){
					//warn("found idle unit");
					
					//randomly assign to guard a corral if available
					let corrals = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Corral").filter(TriggerHelper.IsInWorld);
					
					if (corrals.length > 0)
					{
						cmpUnitAI.Guard(pickRandom(corrals),false,true);
						
					}
				}
			}
		}
		
	}
	
	//check patrols
	for (let p of [6])
	{
		//find all idle units
		let units = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Soldier").filter(TriggerHelper.IsInWorld);
		
		let idle_units = [];
		for (let u of units)
		{
			let cmpUnitAI = Engine.QueryInterface(u, IID_UnitAI);
			if (cmpUnitAI)
			{
				if (cmpUnitAI.IsIdle()){
					//warn("found idle unit of player 6");
					
					
					let patrol_sites = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(2),"Structure").filter(TriggerHelper.IsInWorld);
					
					if (patrol_sites.length > 4)
					{
						//pick patrol sites
						let sites = [pickRandom(patrol_sites),pickRandom(patrol_sites),pickRandom(patrol_sites),pickRandom(patrol_sites)];
							
						this.PatrolOrderList([u],p,sites);
					}
				}
			}
		}
	}
	
	//check warriors
	for (let p of [5])
	{
		//find all idle units
		let units = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Soldier").filter(TriggerHelper.IsInWorld);
		
		let attackers = [];
		for (let u of units)
		{
			let cmpUnitAI = Engine.QueryInterface(u, IID_UnitAI);
			if (cmpUnitAI)
			{
				if (cmpUnitAI.IsIdle()){
					//warn("found idle unit of player 6");
					//TODO
					attackers.push(u);
				}
			}
		}
		
		//make them attack
		if (attackers.length > 0)
		{
			let target = this.FindClosestTarget(attackers[0],1,"CivilCentre");
		
			//if (target_pos == undefined)
			
			let target_pos = TriggerHelper.GetEntityPosition2D(target);
			
			ProcessCommand(p, {
				"type": "attack-walk",
				"entities": attackers,
				"x": target_pos.x,
				"z": target_pos.y,
				"queued": true,
				"targetClasses": {
					"attack": unitTargetClass
				},
				"allowCapture": false
			});
		}
	}
	
	//check whether to start dorian attacks
	if (this.dorianAttacksStarted == false)
	{
		let corrals = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1),"Corral").filter(TriggerHelper.IsInWorld);
		
		if (corrals.length > 0 && Math.random() < 0.25)
		{
			this.dorianAttacksStarted = true;
			warn("starting land attacks");
			this.DoAfterDelay(120 * 1000,"SpawnDorianAttack",null);
		}
	}
	
	//check whether to start ship attacks
	if (this.dorianShipAttacksStarted == false &&  Math.random() < 0.25)
	{
		let corrals = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1),"Corral").filter(TriggerHelper.IsInWorld);
		
		if (corrals.length > 1)
		{
			warn("starting ship attacks");
			this.dorianShipAttacksStarted = true;
			this.DoAfterDelay(this.shipAttackInterval * 1000,"SpawnNavalAttack",null);
		}
	}
	
	
	
	
	//resource trickle for player 2
	let cmpPlayer = QueryPlayerIDInterface(2);
	cmpPlayer.AddResource("metal",50);
	cmpPlayer.AddResource("food",100);
	cmpPlayer.AddResource("stone",50);
	cmpPlayer.AddResource("wood",100);
	
	//debug
	cmpPlayer = QueryPlayerIDInterface(4);
	cmpPlayer.SetEnemy(1);
	
	//minoans (3) and dorian warrior should have been enemies
	cmpPlayer = QueryPlayerIDInterface(3);
	cmpPlayer.SetEnemy(5);
	cmpPlayer = QueryPlayerIDInterface(5);
	cmpPlayer.SetEnemy(3);
	
	//check if player 1 has captured forge
	if (this.forgeCaptured == null || this.forgeCaptured == false)
	{
		//check for forge
		let forges = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1),"Forge").filter(TriggerHelper.IsInWorld);
		
		warn("found "+forges.length+ " forges");
		
		if (forges.length > 0)
		{
			this.forgeCaptured = true;
			
		
			this.DoAfterDelay(2* 1000,"SpawnDorianForgeAttack",null);
		}
		
	}
}


//garison AI entities with archers
Trigger.prototype.GarrisonEntities = function(data)
{

	//gaia
	for (let p of [0])
	{
		let towers = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(p),"StoneTower").filter(TriggerHelper.IsInWorld);
		
		for (let c of towers)
		{
			//spawn the garrison inside the tower
			let archers_e = TriggerHelper.SpawnUnits(c, "units/gau/infantry_slinger_e",5,p);
			
			for (let a of archers_e)
			{
				let cmpUnitAI = Engine.QueryInterface(a, IID_UnitAI);
				cmpUnitAI.Garrison(c,true);
			}
		}
	}
	
	//fortress
	for (let p of [2])
	{
		let troop_owner = 3;
		
		//5 person towers
		let towers = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(p),"StoneTower").filter(TriggerHelper.IsInWorld);
	
		
		for (let c of towers)
		{
			//spawn the garrison inside the tower
			let archers_e = TriggerHelper.SpawnUnits(c, "units/pers/infantry_archer_e",5,troop_owner);
			
			for (let a of archers_e)
			{
				let cmpUnitAI = Engine.QueryInterface(a, IID_UnitAI);
				cmpUnitAI.Garrison(c,true);
			}
		}
		
		let stowers = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(p),"SentryTower").filter(TriggerHelper.IsInWorld);
	
		for (let c of stowers)
		{
			//spawn the garrison inside the tower
			let archers_e = TriggerHelper.SpawnUnits(c, "units/pers/infantry_archer_e",3,troop_owner);
			
			for (let a of archers_e)
			{
				let cmpUnitAI = Engine.QueryInterface(a, IID_UnitAI);
				cmpUnitAI.Garrison(c,true);
			}
		}
		
		
		let forts = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(p),"Fortress").filter(TriggerHelper.IsInWorld);
		
		for (let c of forts)
		{
			//spawn the garrison inside the tower
			let archers_e = TriggerHelper.SpawnUnits(c, "units/pers/infantry_archer_e",20,troop_owner);
			
			for (let a of archers_e)
			{
				let cmpUnitAI = Engine.QueryInterface(a, IID_UnitAI);
				cmpUnitAI.Garrison(c,true);
			}
		}
	}
}	


 
Trigger.prototype.VictoryCheck = function(data)
{

	//check to see that player 2 has no units
	let ccs_2 = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(2),"CivilCentre").filter(TriggerHelper.IsInWorld);
	let ccs_3 = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(3),"CivilCentre").filter(TriggerHelper.IsInWorld);
	let ccs_5 = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(5),"CivilCentre").filter(TriggerHelper.IsInWorld);
	
	//warn(ccs_2.length +" "+ccs_3.length + " " + ccs_5.length);
	
	if (ccs_2.length <= 0 && ccs_3.length <= 0 && ccs_5.length <= 0)
	{
		TriggerHelper.SetPlayerWon(1,this.VictoryTextFn,this.VictoryTextFn);	
	}
	else
	{
		this.DoAfterDelay(15 * 1000,"VictoryCheck",null);
	}
}


Trigger.prototype.OwnershipChangedAction = function(data)
{
	//check if player 2 has captured a corral from player 1 and flip it to original owner
	if (data.from == 1 && data.to == 2)
	{
		//check if arsenal
		let id = Engine.QueryInterface(data.entity, IID_Identity);
		if (id && id.visibleClassesList.indexOf("Corral") >= 0)
		{
			var cmpOwnership = Engine.QueryInterface(data.entity, IID_Ownership);
			cmpOwnership.SetOwner(4);
		}
	}
	
	//check if player 3 has captured a corral from player 2 and flip it to 1
	if (data.from == 2 && data.to == 3)
	{
		//check if arsenal
		let id = Engine.QueryInterface(data.entity, IID_Identity);
		if (id && id.visibleClassesList.indexOf("Corral") >= 0)
		{
			var cmpOwnership = Engine.QueryInterface(data.entity, IID_Ownership);
			cmpOwnership.SetOwner(1);
		}
	}

}


Trigger.prototype.EventWarAssyria = function(data)
{
	this.ShowText("We have just received some alarming news: the local Assyrian governor has heard of your exploits and has decided that he willl have none of it! We are now officially at war with his settlement to the south. We should defeat them as quickly as possible before reinforcements arrive","Oh my!","No way!");

	for (let p of [3,5])
	{
		let cmpPlayer = QueryPlayerIDInterface(p);
		cmpPlayer.SetPopulationBonuses(300);
		cmpPlayer.SetMaxPopulation(300);
		
		//cmpPlayer.AddResource("food",2000);
		//cmpPlayer.AddResource("wood",2000);
		//cmpPlayer.AddResource("metal",2000);
		//cmpPlayer.AddResource("stone",2000);
		
		let ccs = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p), "CivilCentre").filter(TriggerHelper.IsInWorld);
		
		
		
		//change diplomacy
		cmpPlayer.SetEnemy(1);
		
		let cmpPlayer_1 = QueryPlayerIDInterface(1);
		cmpPlayer_1.SetEnemy(p);

		if (ccs.length > 0)
		{
			let site = ccs[0];
			let units1= TriggerHelper.SpawnUnits(site,"units/pers_infantry_archer_b",10,p);
			let units2= TriggerHelper.SpawnUnits(site,"units/pers_infantry_spearman_b",10,p);
		}
	}
	
}

Trigger.prototype.ResearchTechs = function(data)
{

	
	for (let p of [2])
	{
		let cmpPlayer = QueryPlayerIDInterface(p);
		let cmpTechnologyManager = Engine.QueryInterface(cmpPlayer.entity, IID_TechnologyManager);
		
		cmpTechnologyManager.ResearchTechnology("tower_range");
		cmpTechnologyManager.ResearchTechnology("tower_watch");
		cmpTechnologyManager.ResearchTechnology("tower_murderholes");
		cmpTechnologyManager.ResearchTechnology("tower_crenellations");
	}
	
}

Trigger.prototype.VictoryTextFnEnemy = function(n)
{
	return markForPluralTranslation(
          "You have lost too many troops! %(lastPlayer)s has won (game mode).",
         "%(players)s and %(lastPlayer)s have won (game mode).",
          n);
}

Trigger.prototype.VictoryTextFn = function(n)
{
	return markForPluralTranslation(
          "You have collected all the animals we need. Now let's get out of here!\n%(lastPlayer)s has won (game mode).",
         "%(players)s and %(lastPlayer)s have won (game mode).",
          n);
}


Trigger.prototype.AssyrianAttack = function(data)
{
	let owner = 4;
	let soldiers = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(owner),"Unit").filter(TriggerHelper.IsInWorld);
	
	let rand_threshold = pickRandom([0.2,0.2,0.3,0.5]);
		
	//attack
	for (let u of soldiers)
	{
		if (Math.random() < rand_threshold)
		{
			let cmpUnitAI = Engine.QueryInterface(u, IID_UnitAI);
			if (cmpUnitAI)
			{
				this.WalkAndFightRandomtTarget(u,1,"Structure");
			}
		}
	}
	
}

Trigger.prototype.IntervalAttackCheck = function(data)
{
	//check if player 1 has structures
	let structs = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1),"Structure").filter(TriggerHelper.IsInWorld);
	
	warn("interval check for attacks, probs = "+this.watchAttackProbBaseCurrent+"\t"+this.elitesAttackProbBaseCurrent);
	
	if (Math.random() < this.watchAttackProbBaseCurrent && structs.length > 0) //attack happens
	{
		let owner = 4;
		
		this.DoAfterDelay(10 * 1000,"AssyrianAttack",null);
		warn("attack");
		
		//spawn some siege
		let forts = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(2),"Arsenal").filter(TriggerHelper.IsInWorld);
		
		if (forts.length > 0)
		{
			let siege_size = pickRandom([2,3,3,5,7]);
			for (let i = 0; i < siege_size; i ++)
			{
				let unit_i = TriggerHelper.SpawnUnits(pickRandom(forts),"units/pers/siege_ram",1,owner);
				let cmpUnitAI = Engine.QueryInterface(unit_i[0], IID_UnitAI);
				if (cmpUnitAI)
				{
					this.WalkAndFightRandomtTarget(unit_i[0],1,"Structure");
				}	
			}
		}
		
		//set probability to default level
		this.watchAttackProbBaseCurrent = this.watchAttackProbBase;
	}
	else {
		//increment probability for next time
		this.watchAttackProbBaseCurrent += this.probIncrement;
	}
	
	//also possible to have some squads
	if (Math.random() < this.elitesAttackProbBaseCurrent)
	{
		this.DoAfterDelay(5 * 1000,"SpawnCavalryAttack",null);
		
		this.elitesAttackProbBaseCurrent = this.elitesAttackProbBase;
	}
	else {
		
		this.elitesAttackProbBaseCurrent += this.probIncrement;
	}
	
	//schedule again
	this.DoAfterDelay(60 * 1000,"IntervalAttackCheck",null);
	
}

Trigger.prototype.IntervalSpawnGuards = function(data)
{
	for (let p of [2])
	{
		let owner = 6;
		let soldiers = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(owner),"Soldier").filter(TriggerHelper.IsInWorld);
		warn("found "+ soldiers.length + " soldiers");
	
		let pop_cap = 150;
		
	
		//warn("pop cap = "+pop_cap);
		if (soldiers.length < pop_cap)
		{
		
			let size = 1;
			
			
			let cmpPlayer_v = QueryPlayerIDInterface(owner);
			if (cmpPlayer_v.GetState() != "active")
				return; //we are dead
		
			//check if player 2 has structures
			let patrol_sites = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Structure").filter(TriggerHelper.IsInWorld);
			
			if (patrol_sites.length < 4)
				return;
				
			for (let i = 0; i < size; i ++)
			{
				let inf_templates = ["units/merc_black_cloak","units/merc_thorakites","units/merc_thureophoros"];
			
				//pick patrol sites
				let sites = [pickRandom(patrol_sites),pickRandom(patrol_sites),pickRandom(patrol_sites),pickRandom(patrol_sites)];
							
				//spawn the unit
				let unit_i = TriggerHelper.SpawnUnits(sites[0],pickRandom(inf_templates),1,owner);
								
				this.PatrolOrderList(unit_i,owner,sites);
				
			}
		}
		

		this.DoAfterDelay(15 * 1000,"IntervalSpawnGuards",null);
	}
	
	
	
}


Trigger.prototype.StatusCheck = function(data)
{
	this.statusCheckCounter ++;
	warn("status check counter = "+this.statusCheckCounter);
	
	if (this.statusCheckCounter == 18)
	{
		this.watchAttackProbBase = 0.075;
		this.elitesAttackProbBase = 0.1;
		
		this.watchAttackProbBaseCurrent = this.watchAttackProbBase;
		this.elitesAttackProbBaseCurrent = this.elitesAttackProbBase;
		this.probIncrement = 0.025;
		
		
		this.DoAfterDelay(30 * 1000,"IntervalAttackCheck",null);
	}
	
	
	this.DoAfterDelay(30 * 1000,"StatusCheck",null);
}


Trigger.prototype.CheckForCC = function(data)
{
	//check if player 1 has built structure
	let structures = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1), "Structure").filter(TriggerHelper.IsInWorld);
	
	//warn("Found "+structures.length+" structures");
	
	if (structures.length >= 3) //start after at least 5 structures
	{
		warn("starting status check");
		
		this.statusCheckCounter = 0;
		this.DoAfterDelay(30 * 1000,"StatusCheck",null);
		
	}
	else 
	{
		this.DoAfterDelay(15 * 1000,"CheckForCC",null);
	}
}


Trigger.prototype.QuestPegasusComplete = function(data)
{
	let data_spawn = {};
	
	data_spawn.site = this.GetTriggerPoints(triggerPointsSpawnTrireme)[0];
	data_spawn.template = "units/cart_ship_trireme"
	data_spawn.owner = 1;
	data_spawn.size = 1;
	
	this.SpawnUnit(data_spawn);
			
}



Trigger.prototype.SpawnAnimalHunters = function(data)
{
	let p = 5;
	
	let cmpPlayer_v = QueryPlayerIDInterface(p);
	if (cmpPlayer_v.GetState() != "active")
		return; //player is dead
	
	let target_player = 1;
	let targets = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(target_player),"Animal").filter(TriggerHelper.IsInWorld);
	
	let spawn_sites = this.GetTriggerPoints("K");
	
	let templates = ["units/spart/cavalry_javelineer_a","units/spart/cavalry_javelineer_b","units/spart/cavalry_spearman_a"];
	warn("found "+targets.length + " animals.");
	
	if (targets.length > 60)
	{
		let size = pickRandom([1,1,1,2,2,3,4]);
	
		warn("spawning "+size+" hunters.");
		
		for (let i = 0; i < size; i ++)
		{
			let spawn_site = pickRandom(spawn_sites);
			let unit_i = TriggerHelper.SpawnUnits(spawn_site,pickRandom(templates),1,p);
			
			let target = -1;
			
			if (Math.random() < 0.5)
				target = this.FindClosestTarget(unit_i[0],target_player,"Animal");
			else
				target = pickRandom(targets);
	
			let target_pos = TriggerHelper.GetEntityPosition2D(target);
	
			ProcessCommand(p, {
				"type": "attack-walk",
				"entities": unit_i,
				"x": target_pos.x,
				"z": target_pos.y,
				"queued": true,
				"targetClasses": {
					"attack": "Animal"
				},
				"allowCapture": false
			});
			
		}	
	}
	
	let delay = 100 + pickRandom([0,10,20,30]);
	
	this.DoAfterDelay(delay * 1000,"SpawnAnimalHunters",null);

}
	


Trigger.prototype.SpawnNavalAttack = function(data)
{
	//check if player is still alive
	let p = 5;
	let camps = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"MercenaryCamp").filter(TriggerHelper.IsInWorld);
	
	if (camps.length <  1)
		return;
		
	//find spawn site
	let site = pickRandom(this.GetTriggerPoints(triggerPointsShipSpawn));
	
	let player_ships = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1),"Warship").filter(TriggerHelper.IsInWorld);
	
	
	//decide on template, size, etc
	let templates = ["units/spart/ship_bireme","units/spart/ship_bireme","units/spart/ship_trireme"];
	let sizes = [1,1,1,2,player_ships.length-1,player_ships.length];
	let garrison_sizes = [4,6,10];
	

	
	
	let num_ships = pickRandom(sizes);
	let attacker_ships = [];
	
	warn("spawning "+num_ships+" attack ships");
	
	for (let i = 0; i < num_ships; i ++)
	{
		let garrison_size = pickRandom(garrison_sizes);
		let template = pickRandom(templates);
		
		let ship_spawned = TriggerHelper.SpawnUnits(site,template,1,p);
		
		//spawn the garrison inside the ship
		TriggerHelper.SpawnGarrisonedUnits(ship_spawned[0],"units/spart/infantry_spearman_a",garrison_size,p);
			
		//make sure the unit has no orders, for some reason after garissoning, the order queue is full of pick up orders
		let cmpUnitAI = Engine.QueryInterface(ship_spawned[0], IID_UnitAI);
		cmpUnitAI.orderQueue = [];
		cmpUnitAI.order = undefined;
		cmpUnitAI.isIdle = true;
		
		attacker_ships.push(ship_spawned[0]);
	}
	
	let targets_dock = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1),"Dock").filter(TriggerHelper.IsInWorld);
	
	let targets_ship = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1),"Ship").filter(TriggerHelper.IsInWorld);
	
	
	if (targets_dock.length >= 1) //player one must have dock
	{
		let target = targets_dock[0];
		
		if (Math.random() < 0.7 && targets_ship.length > 0)
		{
			warn("targeting ship");
			target = pickRandom(targets_ship);
		}
		
		for (let attacker of attacker_ships)
		{
			let cmpUnitAI = Engine.QueryInterface(attacker, IID_UnitAI);
			cmpUnitAI.Attack(target);
		}	
	} 
	
	this.shipAttackInterval = Math.round(this.shipAttackInterval * this.shipAttackIntervalDecay);
	this.DoAfterDelay(this.shipAttackInterval * 1000,"SpawnNavalAttack",null);
	
}


Trigger.prototype.SpawnDorianForgeAttack = function(data)
{
	//we spawn cavalry attack in response
	let p = 5;
	
	//check if targets exist
	let target_player = 1;
	let targets = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(target_player),"Forge").filter(TriggerHelper.IsInWorld);
	
	//spawn site
	let spawn_sites = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"MercenaryCamp").filter(TriggerHelper.IsInWorld);
	
	if (targets.length > 0 && spawn_sites.length > 0)
	{
		warn("dorian florge attack");
		let num_squads = 3;
		let squad_size = 10
		
		for (let i = 0; i < num_squads; i ++)
		{
			
			let templates = ["units/mace/champion_cavalry","units/athen/cavalry_swordsman_e","units/athen/cavalry_swordsman_a","units/spart/cavalry_spearman_e","units/spart/cavalry_javelineer_e"];
			
			
			//decide how many
			let size = squad_size;
			
			let data = {};
			
			let spawn_site = spawn_sites[0];

			data.p = p;
			data.templates = templates;
			data.size = size;
			data.target_class = "Forge";
			data.target_player = 1;
			data.site = spawn_site;
			
			this.DoAfterDelay((i+1) * 3 * 1000,"SpawnAttackSquad",data);
		}
		
	
	}
	
	
}

Trigger.prototype.SpawnDorianAttack = function(data)
{
	let p = 5;
	
	//check if targets exist
	let target_player = 1;
	let targets = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(target_player),"CivilCentre").filter(TriggerHelper.IsInWorld);
	
	//spawn site
	let spawn_sites = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"MercenaryCamp").filter(TriggerHelper.IsInWorld);
	
	let corrals = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1),"Corral").filter(TriggerHelper.IsInWorld);
		
	if (targets.length > 0 && spawn_sites.length > 0)
	{
		warn("dorian attack");
		let num_squads = this.dorianNumSquads+pickRandom([0,1,1,2,corrals.length]);
		let squad_size = this.dorianSquadSize+pickRandom([2,3,3,4,4,5,corrals.length]);
		
		for (let i = 0; i < num_squads; i ++)
		{
			
			let templates = ["units/spart/infantry_javelineer_b","units/spart/infantry_javelineer_a","units/spart/infantry_javelineer_a","units/spart/infantry_javelineer_e","units/spart/infantry_spearman_a","units/spart/infantry_spearman_a","units/spart/infantry_spearman_e","units/spart/champion_infantry_swordsman","units/spart/champion_infantry_spear","units/spart/siege_ram"];
			
			
			//decide how many
			let size = squad_size;
			
			let data = {};
			
			let spawn_site = spawn_sites[0];

			data.p = p;
			data.templates = templates;
			data.size = size;
			data.target_class = "CivilCentre";
			data.target_player = 1;
			data.site = spawn_site;
			
			this.DoAfterDelay((i+1) * 4 * 1000,"SpawnAttackSquad",data);
		}
		
		if (Math.random() < 0.95)
		{
			this.dorianSquadSize += 1;
		}
		
		if (Math.random() < 0.25)
		{
			this.dorianNumSquads += 1;
		}
	}
	
	this.DoAfterDelay(290 * 1000,"SpawnDorianAttack",null);
}



Trigger.prototype.IntervalActionTraders = function(data)
{
	warn("interval traders");

	for (let p of [2])
	{
		//make list of land traders
		let traders_e = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(p), "Trader+!Ship").filter(TriggerHelper.IsInWorld);
	
		if (traders_e.length < 12)
		{
	
			//make list of own markets
			let markets_e = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(p), "Trade").filter(TriggerHelper.IsInWorld);
		
			//make list of possible other markets
			let markets_others = TriggerHelper.MatchEntitiesByClass( TriggerHelper.GetEntitiesByPlayer(4), "Trade").filter(TriggerHelper.IsInWorld);
		
			if (markets_e.length  > 0 && markets_others.length > 0)
			{
		
				//spawn
				let site = pickRandom(markets_e);
				let trader_i = TriggerHelper.SpawnUnits(site,"units/brit/support_trader",1,p);
				
				//make trade
				let cmpUnitAI = Engine.QueryInterface(trader_i[0], IID_UnitAI);
				if (cmpUnitAI) {

					//warn("updating trade orders");
					cmpUnitAI.UpdateWorkOrders("Trade");
					cmpUnitAI.SetupTradeRoute(pickRandom(markets_others),pickRandom(markets_e),null,true);
				}
			}
		}
	}
}

Trigger.prototype.SpawnUnit = function(data)
{
	let site = data.site; 
	let template = data.template;
	let owner = data.owner;
	let num = data.size;
	
	//warn("spawning unit: "+uneval(data));
	
	let unit_i = TriggerHelper.SpawnUnits(site,template,num,owner);
		
}


Trigger.prototype.PlayerCommandAction = function(data)
{
	
	//warn(uneval(data));
	if (data.cmd.type == "dialog-answer")
	{
		//warn("The OnPlayerCommand event happened with the following data:");
		//warn(uneval(data));
		//warn("dialog state = "+this.dialogState);
		
		if (this.dialogState == "archers")
		{
			if (data.cmd.answer == "button1")
			{
				//pay
				let cmpPlayer = QueryPlayerIDInterface(1);
				cmpPlayer.AddResource("metal",-500);
				
				//get tech
				let cmpTechnologyManager = Engine.QueryInterface(cmpPlayer.entity, IID_TechnologyManager);
				cmpTechnologyManager.ResearchTechnology("persians/special_archery_tradition");
		
				this.archersTrained = true;
			}
			else {
				this.DoAfterDelay(30 * 1000,"ToggleArcherTraining",null);		
			}
		}
		else if (this.dialogState == "barracksCaptives")
		{
				if (data.cmd.answer == "button1")
				{
					this.barracksCaptivesQuestStarted = true;
					
					//start attack
					let site = this.GetTriggerPoints(triggerPointsBarracksCaptives)[0];
	
					let templates = ["units/pers_infantry_archer_e","units/pers_infantry_spearman_e","units/pers_champion_infantry","units/pers_kardakes_hoplite","units/pers_kardakes_skirmisher"];
		
					//warn(uneval(id.classesList));
					
					let data_attack = {};
					data_attack.p = 6;
					data_attack.site = site;
					data_attack.templates = templates;
					data_attack.size = 10;
					//data_attack.size = 1;
					data_attack.target_class = "Hero";
					data_attack.target_player = 1;
					data_attack.use_formation = false;
					
					this.DoAfterDelay(2 * 1000,"SpawnAttackSquad",data_attack);
					data_attack.size = 12;
					//data_attack.size = 2;
					this.DoAfterDelay(14 * 1000,"SpawnAttackSquad",data_attack);
					this.DoAfterDelay(16 * 1000,"MonitorBarracksCaptivesQuest",null);
				}
				else 
				{
					//do nothing
				}
				
				this.dialogState  = "none";
		}
	}
};


Trigger.prototype.RangeActionAnimalPen = function(data)
{
	for (let e of data.currentCollection)
	{
		let id = Engine.QueryInterface(e, IID_Identity);
		if (id.classesList.indexOf("Animal") >= 0)
		{
			this.animalCounter += 1;
			
			if (this.animalCounter % 10 == 0)
			{
				warn("We have collected "+this.animalCounter+" animals.");
				
				if (this.animalCounter >= 650)
				{
					TriggerHelper.SetPlayerWon(1,this.VictoryTextFn,this.VictoryTextFn);	
					
				}
				
			}
		
			//ddestroy animal
			Engine.DestroyEntity(e);
		}
	}
	
}



Trigger.prototype.SpawnAssyrianGuards = function(data)
{
	for (let p of [2])
	{
		let size = 200;
		let owner = 4;
		
		for (let i = 0; i < size; i ++)
		{
			
			//find patrol/spawn sites
			let patrol_sites = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p),"Structure").filter(TriggerHelper.IsInWorld);
			
			let inf_templates = ["units/pers/champion_infantry","units/pers/arstibara","units/pers/infantry_javelineer_e","units/pers/infantry_archer_e","units/pers/infantry_spearman_e","units/pers/kardakes_hoplite","units/pers/kardakes_skirmisher"];
			
			//pick patrol sites
			let sites = [pickRandom(patrol_sites),pickRandom(patrol_sites),pickRandom(patrol_sites),pickRandom(patrol_sites)];
					
			//spawn the unit
			let unit_i = TriggerHelper.SpawnUnits(pickRandom(sites),pickRandom(inf_templates),1,owner);
						
			this.PatrolOrderList(unit_i,owner,sites);
		}
	}
	
}


Trigger.prototype.LoseGame = function(data)
{
	TriggerHelper.SetPlayerWon(2,this.VictoryTextFn,this.VictoryTextFn);	
		
	
}


Trigger.prototype.FlipOutpostOwnership = function(data)
{
	let outposts = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(1), "Outpost").filter(TriggerHelper.IsInWorld);
	
	for (let u of outposts)
	{
		var cmpOwnership = Engine.QueryInterface(u, IID_Ownership);
		cmpOwnership.SetOwner(0);
	}
}


Trigger.prototype.SpawnCorralGuards = function(data)
{
	let p = 4;
	let corrals = TriggerHelper.MatchEntitiesByClass(TriggerHelper.GetEntitiesByPlayer(p), "Corral").filter(TriggerHelper.IsInWorld);
	
	let size = 10 + pickRandom([3,5,7,9]);
	
	for (let c of corrals)
	{
		let templates = ["units/spart/infantry_javelineer_b","units/spart/infantry_javelineer_a","units/spart/infantry_javelineer_a","units/spart/infantry_javelineer_e","units/spart/infantry_spearman_a","units/spart/infantry_spearman_e","units/spart/champion_infantry_swordsman","units/spart/champion_infantry_spear"];
		
		for (let i = 0; i < size; i++)
		{
			let unit_i = TriggerHelper.SpawnUnits(c,pickRandom(templates),1,p);
		
			//make guard
			let cmpUnitAI = Engine.QueryInterface(unit_i[0], IID_UnitAI);
			
			cmpUnitAI.Guard(c,false,true);
		}
	}
	
	
	
}

/* Quests:
 * 
 *  1. encounter with elephant ambusher's cave; need to lead elephants past walled in archers
 * 	reward: rescue 1 or 2 heros DONE
 * 
 *  2. encountaer with barracks that holds captives, gets assaulted then gets 2 heros DONE, heros lose about 550 hp total, mostly for melee units
 * 
 *  3. up in the mountain you discover 2 heros, however, they have gone sick from eating wild mushrooms and attack, need to lead them to a temple and then they regain their condition DONE
 * 
 *  - the closest village is willing to provide information about one of your companions, in exchange need to destroy a bandit base; turns out they have found him and were healing him DONE
 * 	get about 4400 loot, mostly food wood metal with some stone, lost very few hit points with clever strategy, took about 9 minutes to destroy main camp
 * 
 *  -  capture catapults from gaia DONE
 * 
 *  - destroy gate over river passage DONE get about 3500 food and 3500 wood and 4000 metal, a bit of stone
 * 
 *  - when reaching the greek colony, takes over and prepares for an assault
 * 
 * AIs:
 * 
 * 	- initial traders (2 ships per village), DONE, make about 850 per 5 minutes (170 per min)
 * 




 */ 
 
 


{
	
	
	let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);

	
	//some state variables
	cmpTrigger.animalCounter = 0;
	cmpTrigger.dorianSquadSize = 16;
	cmpTrigger.dorianNumSquads = 3;
	cmpTrigger.dorianAttacksStarted = false;
	cmpTrigger.dorianShipAttacksStarted  = false;
	cmpTrigger.shipAttackInterval = 250;
	cmpTrigger.shipAttackIntervalDecay = 0.97;
	cmpTrigger.idleCheckCounter = 0;

	//start techs
	cmpTrigger.DoAfterDelay(2 * 1000,"ResearchTechs",null);
	
	//corral check
	cmpTrigger.DoAfterDelay(2 * 1000,"CorralCheck",null);
	
	//corral guards
	cmpTrigger.DoAfterDelay(10 * 1000,"SpawnCorralGuards",null);
	
	//dorian patrols
	cmpTrigger.DoAfterDelay(15 * 1000,"IntervalSpawnGuards",null);
	
	//hunters of our animals
	cmpTrigger.DoAfterDelay(60 * 1000,"SpawnAnimalHunters",null);
	
	
	//debug
	//cmpTrigger.DoAfterDelay(60 * 1000,"SpawnDorianAttack",null);
	//cmpTrigger.DoAfterDelay(60 * 1000,"SpawnAnimalHunters",null);
	//cmpTrigger.DoAfterDelay(60 * 1000,"SpawnAnimalHunters",null);
	//cmpTrigger.DoAfterDelay(5 * 1000,"SpawnNavalAttack",null);
	
	//garrisons
	//cmpTrigger.DoAfterDelay(4 * 1000,"GarrisonEntities",null);
	
	//patrols
	//cmpTrigger.DoAfterDelay(10 * 1000,"IntervalSpawnAssyrianGuards",null);
	//cmpTrigger.DoAfterDelay(8 * 1000,"SpawnAssyrianGuards",null);

	
	//disable templates
	for (let p of [1,2,3,4,5,6])
	{
		let cmpPlayer = QueryPlayerIDInterface(p);
		let disTemplates = disabledTemplates(cmpPlayer.GetCiv());
		let disTemplatesCC = disabledTemplatesCCs(cmpPlayer.GetCiv());
		
		if (p == 1 || p == 4 || p == 6 || p == 5)	
			cmpPlayer.SetDisabledTemplates(disTemplates);
		else
			cmpPlayer.SetDisabledTemplates(disTemplatesCC);
		
		//add some tech
		let cmpTechnologyManager = Engine.QueryInterface(cmpPlayer.entity, IID_TechnologyManager);
	
		cmpTechnologyManager.ResearchTechnology("phase_town_generic");
		
		if (p == 1)
			cmpTechnologyManager.ResearchTechnology("phase_city_generic");
	
		//no pop limit
		if (p == 1)
		{
			cmpTechnologyManager.ResearchTechnology("unlock_shared_los");
			cmpPlayer.SetPopulationBonuses(300);
			
			//set some specific disabled templates, e.g., no embassies or super ports yet, also no civil centre
			//let dis_templates_human = ["];
			//	cmpPlayer.SetDisabledTemplates(dis_templates_human);
		}

	}
	
	//diplomacy
	
	//dorian herders are neutral to minoans and player 1 and vise versa
	for (let p of [3])
	{
		let cmpPlayer = QueryPlayerIDInterface(p);
		for (let p_other of [4,1])
		{
			
			cmpPlayer.SetNeutral(p_other);
			
			let cmpPlayer_other = QueryPlayerIDInterface(p_other);
			cmpPlayer_other.SetNeutral(p);
			
			if (p_other == 1)
			{
				cmpPlayer.SetAlly(p_other);
				cmpPlayer_other.SetAlly(p)
			}
		}
	}
	
	//triggers
	let data = { "enabled": true };
	
	//every so often, check for idle traders
	cmpTrigger.RegisterTrigger("OnInterval", "IntervalActionTraders", {
		"enabled": true,
		"delay": 5 * 1000,
		"interval": 45 * 1000,
	});
	
	cmpTrigger.RegisterTrigger("OnRange", "RangeActionAnimalPen", {
		"entities": cmpTrigger.GetTriggerPoints("A"), // central points to calculate the range circles
		"players": [1], // only count entities of player 1
		"maxRange": 10,
		"requiredComponent": IID_UnitAI, // only count units in range
		"enabled": true
	});
	
	
	
	cmpTrigger.RegisterTrigger("OnOwnershipChanged", "OwnershipChangedAction", data);
	//cmpTrigger.RegisterTrigger("OnStructureBuilt", "StructureBuiltAction", data);
	//cmpTrigger.RegisterTrigger("OnPlayerCommand", "PlayerCommandAction", data);

	
	cmpTrigger.RegisterTrigger("OnInterval", "IdleUnitCheck", {
		"enabled": true,
		"delay": 30 * 1000,
		"interval": 30 * 1000,
	});
	
	
	cmpTrigger.RegisterTrigger("OnInterval", "StructureDecayCheck", {
		"enabled": true,
		"delay": 2 * 1000,
		"interval": 2 * 1000,
	});
}




