import $ from 'jquery';

//Game class constructor, this is the main object that holds and manages the game
function Game() {
  this.userHeroList = [];
  this.userItemList = [];
  this.inventory = null;
  this.gameTime = 0;
  this.elapsedTime = 0;
  this.state = "battle";
  this.battle = null;
}
//This method is responsible for requesting the user's Heros from the server, atm it just provides default heros
Game.prototype.loadUserData = function() {
  //placeholder code for retrieveing player characters
  this.userHeroList.push(new Fighter("robbie"));
  let knight = new Knight("sammy");
  this.userHeroList.push(knight);

  this.inventory = new Inventory();
  this.inventory.load();
  this.userItemList = this.inventory.itemList;
}
//This method is responsible for creating an instance of a Battle
Game.prototype.startBattle = function () {
  this.state = "battle";
  this.battle = new Battle(0);
  let partyHeros = [];
  let battleItems = [];
  for(let i = 0;i < this.userHeroList.length;i++) {
    if(this.userHeroList[i].isInParty) {
      this.userHeroList[i].setPosition(100, 130+40*i);
      partyHeros.push(this.userHeroList[i]);
    }
  }
  for(i = 0 ; i < this.userItemList.length; i++) {
    if(this.userItemList[i].isBattleItem && this.userItemList[i].quantity != 0) {
      battleItems.push(this.userItemList[i]);
    }
  }
  this.battle.loadBattle(partyHeros, battleItems);
}
//This is the game's main Update function it is responsible for determining gameTime and elapsedTime before calling the update functions of the appropriate managers
Game.prototype.update = function() {
  let currentDate = new Date();
  let currentTime = currentDate.getTime();
  this.elapsedTime = currentTime - this.gameTime;
  this.gameTime = currentTime;

  if(this.state=="battle") {
    this.battle.update(this.gameTime, this.elapsedTime);
  }
}
//This is the game's main draw function
Game.prototype.draw = function(ctx) {
  switch(this.state) {
    case "battle":
      this.battle.draw(ctx);
      break;
  }
}

function Inventory() {
  this.itemList = [];
}
Inventory.prototype.load = function(){
  this.itemList = [];
  let minorHealthPotion = new MinorHealthPotion();
  minorHealthPotion.quantity = 1;
  this.itemList.push(minorHealthPotion);
}

//This class is responsible for managing the game while in the manorExploration phase
function ManorExplore() {
  this.heroList = [];
}

//This class is responsible for managing the game while in the battle phase
function Battle(battleID) {
  this.battleState = "waiting for input";
  this.battleID = battleID;
  this.battleStartTime = new Date();
  this.battleSurManager = null;
}
//This is hte Battle's main load method
Battle.prototype.loadBattle = function(partyHeros, battleItems) {
  this.battleSurManager = new BattleSurManager();
  this.battleSurManager.load(partyHeros, battleItems, this.battleID);
}
//This is the Battle's main update method, responsible for calling the surManager's update function and determining the battleState
Battle.prototype.update = function(gameTime, elapsedTime) {
  this.battleSurManager.update(gameTime, elapsedTime);
  switch(this.battleState){
    case "waiting for input":
      let pass = true;
      for(let i =0;i< this.battleSurManager.heroManager.assetList.length;i++){
        if(!this.battleSurManager.heroManager.assetList[i].isActionConfirmed) {
          pass = false;
        }
      }
      if(pass){
        this.battleState = "turn in progress";
      }
      break;
      case "turn in progress":
      break;
    default:
      console.log("battleState error, not an acceptable value for battleState!");
      break;
  }
}
//This is battle's main draw function
Battle.prototype.draw = function(ctx) {
  this.battleSurManager.draw(ctx);
}

//This is the surManager's constructor function, the surManager holds and manages all the other managers
function SurManager() {
  this.heroManager = null;
  this.monsterManager = null;
  this.logManager = null;
  this.environmentManager = null;
  //this.menuManager = null;
  this.lastMouseX = 0;
  this.lastMouseY = 0;
  this.mousex = 0;
  this.mousey = 0;
}
SurManager.prototype.enableHandPointer = function() {
  $("#gameArea").addClass("handPointer");
}
SurManager.prototype.disableHandPointer = function() {
  $("#gameArea").removeClass("handPointer");
}
SurManager.prototype.setMouseDetails = function(x, y) {
  this.lastMouseY = this.mousey;
  this.lastMouseX = this.mousex;
  this.mousex = x;
  this.mousey = y;
}
//This is surManager's main load function
SurManager.prototype.load = function() {

}
//This is surManager's main update function, responsible for calling all the managers individual update functions
SurManager.prototype.update = function(gameTime, elapsedTime){
  this.heroManager.update(gameTime, elapsedTime);
  this.monsterManager.update(gameTime, elapsedTime);
  this.logManager.update(gameTime, elapsedTime);
  this.environmentManager.update(gameTime, elapsedTime);
  //this.menuManager.update(gameTime, elapsedTime);
}
//This is surManager's main draw function
SurManager.prototype.draw = function(ctx) {
  this.environmentManager.draw(ctx);
  this.heroManager.draw(ctx);
  this.monsterManager.draw(ctx);
  this.logManager.draw(ctx);
  //this.menuManager.draw(ctx);
}

//This is the constructorfunction for the BattleSurManager class, this class is responsible for all the subManagers in a battleScene and has special duties such as passing the currently selected partyHeros to the heroManager
function BattleSurManager(){
  SurManager.call(this);
  this.battleState = "waiting for input";
  this.battleMenuManager = null;
  this.combat = null;
  this.initiativeDisplay = new InitiativeDisplay(this);
}
BattleSurManager.prototype = Object.create(SurManager.prototype);
BattleSurManager.prototype.constructor = BattleSurManager;
//This is the battleSurManager's main load function
BattleSurManager.prototype.load = function(partyHeros, battleItems, battleID) {
  this.heroManager = new HeroManager();
  this.heroManager.setSurManager(this);
  this.heroManager.load(partyHeros);
  this.battleItems = battleItems;
  this.monsterManager = new MonsterManager();
  this.monsterManager.setSurManager(this);
  this.monsterManager.load(battleID);
  this.logManager = new LogManager();
  this.logManager.setSurManager(this);
  this.logManager.load();
  this.environmentManager = new EnvironmentManager();
  this.environmentManager.setSurManager(this);
  this.environmentManager.load(battleID);
  this.battleMenuManager = new BattleMenuManager();
  this.battleMenuManager.setSurManager(this);
  this.battleMenuManager.load();
}
BattleSurManager.prototype.update = function(gameTime, elapsedTime) {
  SurManager.prototype.update.call(this, gameTime, elapsedTime);
  this.initiativeDisplay.update(gameTime, elapsedTime);
  if(this.battleState == "waiting for input") {
    this.battleMenuManager.update(gameTime, elapsedTime);
  }
  else if(this.battleState == "combat") {
    this.combat.update(gameTime, elapsedTime);
    if(this.combat.isCombatOver){
      this.battleState = "waiting for input";
      this.battleMenuManager.newRound();
      this.heroManager.newRound();
      this.monsterManager.newRound();
    }
  }
  else if(this.battleState == "victory") {
    console.log("victory");
  }
  else if(this.battleState == "defeat") {
    console.log("defeat");
  }
}
BattleSurManager.prototype.draw = function(ctx) {
  SurManager.prototype.draw.call(this, ctx);
  this.battleMenuManager.draw(ctx);
  this.initiativeDisplay.draw(ctx);
  if(this.combat != null) {
    if(this.combat.isVictory) {
      ctx.font = "40px serif";
      ctx.fillStyle = "rgb(200, 0, 0)";
      ctx.fillText("VICTORY!", 200, 100);
    }
    else if (this.combat.isDefeat) {
      ctx.font = "40px serif";
      ctx.fillStyle = "rgb(0, 200, 0)";
      ctx.fillText("Defeat!", 200, 100);
    }
  }
}

function Combat(surManager) {
  this.surManager = surManager;
  this.combatStartTime = null
  this.isCombatOver = false;
  this.isVictory = false;
  this.isDefeat = false;
  this.turnOrder = [];
  this.currentTurn = 0;
  this.isCurrentTurnTargeted = false;
  this.isCurrentTurnAttacked = false;
  let applicableHeros = [];
  let i = 0;
  for(i = 0 ; i < this.surManager.heroManager.assetList.length; i++) {
    let currentHero = this.surManager.heroManager.assetList[i];
    if(currentHero.isAlive) {
      applicableHeros.push(currentHero);
    }
  }
  let applicableMonsters = [];
  for(i = 0 ; i < this.surManager.monsterManager.assetList.length; i++) {
    let currentMonster = this.surManager.monsterManager.assetList[i];
    if(currentMonster.isAlive) {
      applicableMonsters.push(currentMonster);
    }
  }
  this.applicableHeros = applicableHeros;
  this.applicableMonsters = applicableMonsters;
}
Combat.prototype.victoryCheck = function() {
  this.isVictory = true;
  for(let i = 0 ; i < this.surManager.monsterManager.assetList.length ; i++) {
    if(this.surManager.monsterManager.assetList[i].isAlive) {
      this.isVictory = false;
    }
  }
  if(this.isCombatOver) {
    if(this.isVictory) {
      this.isCombatOver = true;
      this.surManager.battleState = "victory";
    }
  }
}
Combat.prototype.defeatCheck = function() {
  this.isDefeat = true;
  for(let i = 0 ; i < this.surManager.heroManager.assetList.length ; i++) {
    if(this.surManager.heroManager.assetList[i].isAlive) {
      this.isDefeat = false;
    }
  }
  if(this.isCombatOver) {
    if(this.isDefeat) {
      this.isCombatOver = true;
      this.surManager.battleState = "defeat";
    }
  }
}
Combat.prototype.update = function(gameTime, elapsedTime) {
  if (this.combatStartTime == null) {
    this.combatStartTime = gameTime;
    this.arbTime = gameTime;
    this.surManager.disableHandPointer();
    console.log("combat started@ combatstarttime: " + this.combatStartTime);
    this.setMonsterActions();
    this.setTurnOrder();
    this.turnOrder[0].combatStance.isCurrentTurn = true;
  }
  else if (this.currentTurn < this.turnOrder.length) {
    if(this.turnOrder[this.currentTurn].combatStance.isCurrentTurn) {
      switch(this.turnOrder[this.currentTurn].combatStance.currentStance) {
        case "slain":
          this.turnOrder[this.currentTurn].combatStance.isCurrentTurn  = false;
          break;
        case "passive":
          break;
        case "targeting":
          if(!this.isCurrentTurnTargeted){
            this.isCurrentTurnTargeted = true;
            this.checkTarget();
          }
          break;
        case "attacking":
          if(!this.isCurrentTurnAttacked) {
            this.isCurrentTurnAttacked = true;
            switch(this.turnOrder[this.currentTurn].currentlySelectedAction){
              case "Attack":
                this.turnOrder[this.currentTurn].attack(this.turnOrder[this.currentTurn].currentlySelectedTarget);
                break;
              case "Special":
                this.turnOrder[this.currentTurn].currentlySelectedSpecialOrItem.useMove(this.turnOrder[this.currentTurn], this.turnOrder[this.currentTurn].currentlySelectedTarget);
                break;
              case "Item":
this.turnOrder[this.currentTurn].currentlySelectedSpecialOrItem.effect(this.turnOrder[this.currentTurn].currentlySelectedTarget)
                break;
              default:
                console.log("currentlySelectedeAction Error combat.update()\ncurrentlySelectedAction: " + this.turnOrder[this.currentTurn].currentlySelectedAction);
                break;
            }
          }
          break;
        default:
          console.log("battlestanceError (combat)");
          break;
      }
    }
    else {
      this.victoryCheck();
      this.defeatCheck();
      if(this.isCombatOver) {

      }
      else {
        let test = true;
        while (test) {
          this.currentTurn++;
          console.log("currentTurn now = " + this.currentTurn);
          if(this.applicableHeros.length+this.applicableMonsters.length==this.currentTurn) {
            test = false;
            this.isCombatOver = true;
          }
          else {
            this.turnOrder[this.currentTurn].deathCheck();
            if(this.turnOrder[this.currentTurn].isAlive) {
              test = false;
              this.turnOrder[this.currentTurn].combatStance.isCurrentTurn = true;
              this.isCurrentTurnTargeted = false;
              this.isCurrentTurnAttacked = false;
            }
          }
        }
      }
    }
  }
  else {
    this.isCombatOver = true;
    console.log("Combat is over!");
  }
}
//This method checks to see if the current unit has been blocked this combat, if so it replaces its target with a random blocker
Combat.prototype.blockCheck = function(i) {
  if(this.turnOrder[i].isAfflictedWith("Blocked")) {
    let blockedBy = [];
    let isBlocked = false;
    for(let j = 0 ; j < this.turnOrder[i].statusEffectList.length ; j++) {
      if(this.turnOrder[i].statusEffectList[j].name == "Blocked") {
        if(this.turnOrder[i].statusEffectList[j].blocker.isAlive) {
          blockedBy.push(this.turnOrder[i].statusEffectList[j].blocker);
          isBlocked = true;
        }
      }
    }
    if(isBlocked) {
      let rando = 0;
      rando = Math.floor(Math.random() * blockedBy.length);
      this.turnOrder[i].currentlySelectedTarget = blockedBy[rando];
    }
  }
}
Combat.prototype.guardCheck = function(i) {
  if(this.turnOrder[i].currentlySelectedTarget.isAfflictedWith("Guarded")) {
    let guardedBy = [];
    let isGuarded = false;
    for(let j = 0 ; j < this.turnOrder[i].currentlySelectedTarget.statusEffectList.length ; j++) {
      if(this.turnOrder[i].currentlySelectedTarget.statusEffectList[j].name == "Guarded"){
        if(this.turnOrder[i].currentlySelectedTarget.statusEffectList[j].guardian.isAlive) {
          guardedBy.push(this.turnOrder[i].currentlySelectedTarget.statusEffectList[j].guardian);
          isGuarded = true;
        }
      }
    }
    if(isGuarded) {
      let rando = Math.floor(Math.random()*guardedBy.length);
      this.turnOrder[i].currentlySelectedTarget = guardedBy[rando];
    }
  }
}
Combat.prototype.checkTarget = function() {
  let isUsedOnDead = false;
  if(this.turnOrder[this.currentTurn].currentlySelectedSpecialOrItem != null) {
    isUsedOnDead = this.turnOrder[this.currentTurn].currentlySelectedSpecialOrItem.isUsedOnDead;
    if(!this.turnOrder[this.currentTurn].currentlySelectedSpecialOrItem.isUsedOnOpponent) {

    }
    else {
      this.guardCheck(this.currentTurn);
      this.blockCheck(this.currentTurn);
    }
  }
  else {
    console.log("no special or item detected, performing guard/blockCheck");
    this.guardCheck(this.currentTurn);
    this.blockCheck(this.currentTurn);
  }
  let currentTarget = this.turnOrder[this.currentTurn].currentlySelectedTarget;
  if(!currentTarget.isAlive){
    //skip to next random target of same type (heros/monsters);
    if(currentTarget.role == "monster") {
      let potentialTargetsNum = 0;
      let newlyApplicableMonsters = [];
      for(let i = 0 ; i < this.applicableMonsters.length ; i++) {
        if(this.applicableMonsters[i].isAlive) {
          newlyApplicableMonsters.push(this.applicableMonsters[i]);
          potentialTargetsNum++;
        }
      }
      let rando = Math.floor(Math.random() * potentialTargetsNum);
      this.turnOrder[this.currentTurn].currentlySelectedTarget = newlyApplicableMonsters[rando];
    }
    else {
      let potentialTargetsNum = 0;
      let newlyApplicableHeros = [];
      for(let i = 0 ; i < this.applicableHeros.length ; i++) {
        if(this.applicableHeros[i].isAlive) {
          newlyApplicableHeros.push(this.applicableHeros[i]);
          potentialTargetsNum++;
        }
      }
      let rando = Math.floor(Math.random() * potentialTargetsNum);
      this.turnOrder[this.currentTurn].currentlySelectedTarget = newlyApplicableHeros[rando];
    }
  }
}
Combat.prototype.setMonsterActions = function() {
  for(let i = 0 ; i < this.applicableMonsters.length ; i++) {
    let currentMonster = this.applicableMonsters[i];
    currentMonster.isActionSelected = true;
    currentMonster.currentlySelectedAction = "Attack";
    currentMonster.currentlySelectedTarget = this.applicableHeros[Math.floor(Math.random() * this.applicableHeros.length)];
  }
}
Combat.prototype.setTurnOrder = function(){
  this.turnOrder = [];
  let maxSpeed = 0;

  for (i = 0 ; i < this.applicableMonsters.length ; i++) {
    if(this.applicableMonsters[i].combatStats.speed > maxSpeed) {
      maxSpeed = this.applicableMonsters[i].baseStats.speed;
    }
  }
  for (i = 0 ; i < this.applicableHeros.length ; i++) {
    if(this.applicableHeros[i].combatStats.speed > maxSpeed) {
      maxSpeed = this.applicableHeros[i].combatStats.speed;
    }
  }

  let allAssigned = false;

  while (!allAssigned) {
    if(Math.random()>0.5) {
      for (i = 0 ; i < this.applicableHeros.length ; i++) {
        if (this.applicableHeros[i].combatStats.speed == maxSpeed) {
          this.turnOrder.push(this.applicableHeros[i]);
        }
      }
      for (i = 0 ; i < this.applicableMonsters.length ; i++) {
        if (this.applicableMonsters[i].combatStats.speed == maxSpeed) {
          this.turnOrder.push(this.applicableMonsters[i]);
        }
      }
    }
    else {
      for (i = 0 ; i < this.applicableMonsters.length ; i++) {
        if (this.applicableMonsters[i].combatStats.speed == maxSpeed) {
          this.turnOrder.push(this.applicableMonsters[i]);
        }
      }
      for (i = 0 ; i < this.applicableHeros.length ; i++) {
        if (this.applicableHeros[i].combatStats.speed == maxSpeed) {
          this.turnOrder.push(this.applicableHeros[i]);
        }
      }
    }
    maxSpeed--;
    if(this.turnOrder.length == this.applicableHeros.length + this.applicableMonsters.length) {
      allAssigned = true;
    }
  }
}
Combat.prototype.resetUnits = function() {
  let i = 0;
  for(i = 0 ; i < this.surManager.heroManager.assetList.length ; i++) {
    this.surManager.heroManager.assetList[i].combatReset();
  }
  for(i = 0 ; i < this.surManager.monsterManager.assetList.length ; i++) {
    this.surManager.monsterManager.assetList[i].combatReset();
  }
}

function CombatStance() {

  this.currentStance = "passive";
  this.stanceStartTime = 0;
  this.isCurrentTurn = false;
}
CombatStance.prototype.update = function(gameTime, elapsedTime) {
  if(!this.isCurrentTurn) {

  }
  else {
    switch(this.currentStance) {
      case "passive":
        this.currentStance = "targeting";
        this.stanceStartTime = gameTime;
        break;
      case "targeting":

        if(gameTime > this.stanceStartTime+500) {
          this.currentStance = "attacking";
          this.stanceStartTime = gameTime;
        }
        break;

      case "attacking":
        if(gameTime > this.stanceStartTime+500) {
          this.currentStance = "passive";
          this.isCurrentTurn = false;
          this.stanceStartTime = gameTime;
        }
        break;
      default:
        console.log("battleStance error");
        break;
    }
  }
}

function DamageDisplay(damageDealt, position) {
  this.damageDealt = damageDealt;
  this.color = "rgb(200, 200, 200)"
  this.hasBounced = false;
  if(damageDealt < 0) {
    this.damageDealt *= -1;
    this.color = "rgb(46, 172, 32)";
  }
  this.unitPosition = position;
  //given position will refer to the units poition so the text needs to be centered properly
  this.position = {x: position.x + 16, y: position.y};
  console.log(position);
  this.velocity = -100;
  this.acceleration = 100;
  this.landingTime = null;
  this.hasLanded = false;
  this.isExpired = false;
}
DamageDisplay.prototype.update = function(gameTime, elapsedTime) {
  if(!this.hasLanded) {
    this.position.y += this.velocity*elapsedTime;
    this.velocity += this.acceleration*elapsedTime;
    //console.log(elapsedTime);
    if((this.position.y <= this.unitPosition.y) && (!this.hasBounced)) {
      this.position.y = this.unitPosition.y;
      this.velocity *= -0.5;
      this.hasBounced = true;
    }
    else if(this.position.y <= this.unitPosition.y && this.hasBounced){
      this.position.y = this.unitPosition.y;
      this.velocity = 0;
      this.acceleration = 0;
      this.landingTime = gameTime;
      this.hasLanaded = true;
    }
  }
  else {
    if(gameTime > this.landingTime + 1) {
      this.isExpired = true;
    }
  }
  //console.log("hasLanded: " + this.hasLanded);
}
DamageDisplay.prototype.draw = function(ctx) {
  ctx.fillStyle = this.color
  //ctx.fillText("I am here", this.position.x, this.position.y);
  //console.log("damage display drawing..." + this.position.x + " " + this.position.y);
}

function InitiativeDisplay(surManager) {
  this.surManager = surManager;
  this.currentState = "passive";
  this.currentTurnOrder = [];
}
InitiativeDisplay.prototype.update = function(gameTime, elapsedTime) {
  switch(this.currentState) {
    case "passive" :
      this.refresh();
      break;
  }
}
InitiativeDisplay.prototype.refresh = function() {
  let unitList = [];
  this.currentTurnOrder = [];
  let i = 0;
  for(i=0; i<this.surManager.heroManager.assetList.length; i++) {
    if( this.surManager.heroManager.assetList[i].isAlive) {
      unitList.push(this.surManager.heroManager.assetList[i]);
    }
  }
  for(i = 0 ; i<this.surManager.monsterManager.assetList.length ; i++) {
    if(this.surManager.monsterManager.assetList[i].isAlive) {
      unitList.push(this.surManager.monsterManager.assetList[i]);
    }
  }
  let topSpeed = 0;
  for(i=0;i<unitList.length;i++){
    if(unitList[i].combatStats.speed>topSpeed) {
      topSpeed = unitList[i].combatStats.speed;
    }
  }
  i=0;
  let k = topSpeed;
  while(i<unitList.length) {
    let unitsAtThisSpeed = [];
    for(let j = 0 ; j < unitList.length ; j++) {
      if(unitList[j].combatStats.speed == k) {
        unitsAtThisSpeed.push(unitList[j]);
        i++;
      }
    }
    if(unitsAtThisSpeed.length != 0) {
      this.currentTurnOrder.push(unitsAtThisSpeed);
    }
    k--;
  }
}
InitiativeDisplay.prototype.draw = function(ctx) {
  ctx.fillStyle = "rgb(200, 0, 200)";
  for(let i = 0 ; i < this.currentTurnOrder.length ; i++) {
    let currentx = 40*i;
    let currenty = 0;
    for(let j = 0 ; j < this.currentTurnOrder[i].length ; j++) {
      currenty = 40*j;
      ctx.fillRect(currentx, currenty, 40, 40);
      ctx.drawImage(this.currentTurnOrder[i][j].image, currentx + 4, currenty + 4);
    }
  }
}

//This is the constructor function for the Manager class, this class is the parent for all manager classes and is responsible fore grouping together and managing different game assets (ie: HeroManager, MonsterManager, ParticleManager);
function Manager() {
  this.assetList = [];
}
//This method is resposible for populating the surManager property with the instance of the surManager, enabling the managers to be able to talk to each other via the surmanager
Manager.prototype.setSurManager = function(surManager) {
  this.surManager = surManager;
}
//This is the Manager's main load method
Manager.prototype.load = function() {

}
//This is the Manager's main update method, it is responsible for calling the update method for each of its assigned assets
Manager.prototype.update = function(gameTime, elapsedTime) {
  for(let i=0;i<this.assetList.length;i++) {
    this.assetList[i].update(gameTime, elapsedTime);
  }
}
//This is the Manager's main draw method
Manager.prototype.draw = function(ctx) {
  for(let i = 0 ; i< this.assetList.length; i++) {
    this.assetList[i].draw(ctx);
  }
}

//This is the constructor function for the HeroManager class, this class is responsible for managing lists of Heros in either the ManorExplore or the Battle scenes
function HeroManager() {
  Manager.call(this);
}
HeroManager.prototype = Object.create(Manager.prototype)
HeroManager.prototype.constructor = HeroManager;
//This is the HeroManager's main load method, it is responsible for assigning the partyHero's to the manager's assetList
HeroManager.prototype.load = function(partyHeros) {
  this.assetList = partyHeros;
  for(let i = 0; i < partyHeros.length ; i++) {
    partyHeros[i].setSurManager(this.surManager);
  }
}
HeroManager.prototype.newRound = function() {
  for(let i = 0 ; i < this.assetList.length ; i++) {
    this.assetList[i].combatReset();
  }
}

//This is the constructor function for the MonsterManager class, this class is responsible for listing Monsters in a manorExplore(bestiary) or a battle(active enemies) scene
function MonsterManager() {
  Manager.call(this);
}
MonsterManager.prototype = Object.create(Manager.prototype);
MonsterManager.prototype.constructor = MonsterManager;
//This is the MonsterManager's main load method, eventually it will accept a list of monsters loaded by from the battle of battlesurmanager class to use, atm though it uses a default set of enemies
//This monster laoder will rename monsters if they have the same name(wolf 1 wolf 2 etc.)
MonsterManager.prototype.load = function(battleID) {
  this.assetList.push(new Wolf());
  this.assetList.push(new Wolf());

  //this code numbers similarly named enemies
  let k = 1;
  for(let i = 0; i<this.assetList.length;i++){
    this.assetList[i].setSurManager(this.surManager);
    this.assetList[i].setPosition(500, 130+40*i);
    let name = this.assetList[i].name;
    let match = false;
    for(let j = 0 ; j<this.assetList.length;j++) {
      if (i!=j) {
        if(name == this.assetList[j].name) {
          k++;
          match = true;
          this.assetList[j].name += " " + k;
        }
      }
    }
    if(match) {
      this.assetList[i].name += " " + 1;
    }
    match = false;
  }
}
MonsterManager.prototype.newRound = function() {
  for(let i = 0 ; i < this.assetList.length ; i++) {
    this.assetList[i].combatReset();
  }
}

//This is the constructor function for the LogManager class, this class is resposible for handling the text log that will describe the events that occur in game
function LogManager() {
  Manager.call(this);
}
LogManager.prototype = Object.create(Manager.prototype);
LogManager.prototype.constructor = LogManager;
//This is the logManager's main update method
LogManager.prototype.update = function(gameTime, elapsedTime) {

}
//This is the LogManager's main draw method
LogManager.prototype.draw = function(ctx) {

}

//This is the constructor function for the EnvironmentManager class, this class is responsible for managing the background
function EnvironmentManager() {
  Manager.call(this);
}
EnvironmentManager.prototype = Object.create(Manager.prototype);
EnvironmentManager.prototype.constructor = EnvironmentManager;
EnvironmentManager.prototype.load = function(battleID) {
  this.backgroundImageSource = "https://raw.githubusercontent.com/Jerbil90/Rpg-Game/master/RPG%20game2/bin/Debug/GrasslandBattle.png";
  this.backgroundImage = new Image();
  this.backgroundImage.src = this.backgroundImageSource;
}
EnvironmentManager.prototype.update = function(gameTime, elapsedTime) {

}
EnvironmentManager.prototype.draw = function(ctx) {
  ctx.drawImage(this.backgroundImage, 0, 0);
}

//This si the constructor function for the Menu Manager class, this clas sis responsible for managing the various menus that the user will use to interact with the game
function BattleMenuManager() {
  Manager.call(this);
  this.currentlySelectedHero = -1;
  this.currentlySelectedAction = "none";
  this.currentlySelectedSpecialOrItem = "none";
  this.currentlySelectedTarget = null;
  this.combat = null;
}
BattleMenuManager.prototype = Object.create(Manager.prototype);
BattleMenuManager.prototype.constructor = BattleMenuManager;
BattleMenuManager.prototype.load = function(){
  let heroSelectionMenu = new HeroSelectionMenu();
  heroSelectionMenu.setSurManager(this.surManager);
  heroSelectionMenu.setPosition(0, 240);
  heroSelectionMenu.load(this.surManager.heroManager.assetList);
  this.assetList.push(heroSelectionMenu);
  let actionMenu = new ActionMenu();
  actionMenu.setSurManager(this.surManager);
  actionMenu.load();
  this.assetList.push(actionMenu);
  let specialMenu = new SpecialMenu();
  specialMenu.setSurManager(this.surManager);
  specialMenu.load();
  this.assetList.push(specialMenu);
  let itemMenu = new ItemMenu();
  itemMenu.setSurManager(this.surManager);
  itemMenu.load();
  this.assetList.push(itemMenu);
  let monsterTargetMenu = new MonsterTargetMenu();
  monsterTargetMenu.setSurManager(this.surManager);
  monsterTargetMenu.load();
  this.assetList.push(monsterTargetMenu);
  let heroTargetMenu = new HeroTargetMenu();
  heroTargetMenu.setSurManager(this.surManager);
  heroTargetMenu.load();
  this.assetList.push(heroTargetMenu);
  let confirmTurnButton = new TurnConfirmButton();
  confirmTurnButton.setSurManager(this.surManager);
  confirmTurnButton.load();
  this.assetList.push(confirmTurnButton);
}
BattleMenuManager.prototype.update = function(gameTime, elapsedTime) {
  for(let i=0;i<this.assetList.length;i++) {
    this.assetList[i].update(gameTime, elapsedTime);
  }
  this.cursorHoverCheck();
}
BattleMenuManager.prototype.cursorHoverCheck = function() {
  let cursorHover = false;
  for(let i = 0; i<this.assetList.length; i++) {
    this.assetList[i].hoverCheck();
    if (this.assetList[i].cursorHover) {
      cursorHover = true;
    }
  }
  if(cursorHover) {
    this.surManager.enableHandPointer();
  }
  else {
    this.surManager.disableHandPointer();
  }
}
BattleMenuManager.prototype.handleClick = function(){
  //heroSelectionMenu (i=0); ActionMenu(i=1); Special Move Menu (i=2); Item  Menu(i=3); MonsterTargetMenu (i=4); HeroTargetMenu(i=5); ConfirmTurn Button (i=6);
  for(let i =0 ; i< this.assetList.length; i++) {

    for(let j = 0 ; j< this.assetList[i].menuButtonList.length; j++) {
      if(this.assetList[i].menuButtonList[j].cursorHover) {
        this.assetList[i].select(j);
        //If a different or new Hero is chosen from the the heroSelectionMenu, activate the action Menu, and set this.currentlySelectedHero, find the targets and currentlySelectedAction from the hero if they exist
        //console.log("currentlySelectedAction: "  + this.currentlySelectedAction + "\tlabel: " + this.assetList[1].menuButtonList[j].label);
        if(i==0 && this.currentlySelectedHero != j) {
          console.log("Different or new Hero selected, assigning...");
          this.currentlySelectedHero = j;
          this.assetList[1].isVisible = true;
          this.assetList[1].isActive = true;
          this.assetList[1].resetMenu();
          this.assetList[2].resetMenu();
          this.assetList[3].resetMenu();
          this.assetList[4].resetMenu();
          this.assetList[5].resetMenu();
          this.currentlySelectedAction = this.surManager.heroManager.assetList[j].currentlySelectedAction;
          this.currentlySelectedSpecialOrItem = this.surManager.heroManager.assetList[j].currentlySelectedSpecialOrItem;
          this.currentlySelectedTarget = this.surManager.heroManager.assetList[j].currentlySelectedTarget;
          if(this.currentlySelectedAction == "none") {
            this.assetList[2].isVisible = false;
            this.assetList[2].isActive = false;
            this.assetList[3].isVisible = false;
            this.assetList[3].isActive = false;
            this.assetList[4].isVisible = false;
            this.assetList[4].isActive = false;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
          }
          else if(this.currentlySelectedAction == "Attack") {
            this.assetList[1].setSelectionByIndex(0);
            this.assetList[2].isVisible = false;
            this.assetList[2].isActive = false;
            this.assetList[3].isVisible = false;
            this.assetList[3].isActive = false;
            this.assetList[4].isVisible = true;
            this.assetList[4].isActive = true;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
            if(this.surManager.heroManager.assetList[this.currentlySelectedHero].isTargetSelected) {
              this.assetList[4].setSelection(this.surManager.heroManager.assetList[this.currentlySelectedHero].currentlySelectedTarget);
              this.currentlySelectedTarget = this.surManager.heroManager.assetList[this.currentlySelectedHero].currentlySelectedTarget;
            }
          }
          else if(this.currentlySelectedAction == "Special"){
            this.assetList[2].setOptions(this.surManager.heroManager.assetList[this.currentlySelectedHero].specialMoveList);
            this.assetList[1].isVisible = false;
            this.assetList[1].isActive = false;
            this.assetList[2].isVisible = true;
            this.assetList[2].isActive = true;
            this.assetList[3].isVisible = false;
            this.assetList[3].isActive = false;
            this.assetList[4].isVisible = false;
            this.assetList[4].isActive = false;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
            if(this.currentlySelectedSpecialOrItem == null) {
              this.currentlySelectedTarget = null;
            }
            else {
              this.assetList[2].setSelectionByString(this.currentlySelectedSpecialOrItem.name);
              if(this.currentlySelectedSpecialOrItem.isUsedOnOpponent) {
                this.assetList[4].isVisible = true;
                this.assetList[4].isActive = true;
                this.assetList[4].setSelection(this.currentlySelectedTarget);
              }
              else {
                this.assetList[5].isVisible = true;
                this.assetList[5].isActive = ture;
                this.assetList[5].setSelection = (this.currentlySelectedTarget);
              }
            }
          }
          else if(this.currentlySelectedAction == "Item"){
            this.assetList[1].isVisible - false;
            this.assetList[1].isActive = false;
            this.assetList[2].isVisible = false;
            this.assetList[2].isActive = false;
            this.assetList[3].checkRemainingItems(j);
            this.assetList[3].isVisible = true;
            this.assetList[3].isActive = true;
            this.assetList[4].isVisible = false;
            this.assetList[4].isActive = false;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
            if(this.currentlySelectedSpecialOrItem == null) {
              this.currentlySelectedTarget = null;

            }
            else {
              this.assetList[3].setSelection(this.currentlySelectedSpecialOrItem);
              if(this.currentlySelectedSpecialOrItem.isUsedOnOpponent) {
                this.assetList[4].isVisible = true;
                this.assetList[4].isActive = true;
                this.assetList[4].setSelection(this.currentlySelectedTarget);
              }
              else {
                this.assetList[5].isVisible = true;
                this.assetList[5].isActive = true;
                this.assetList[5].setSelection(this.currentlySelectedTarget);
              }
            }
          }
          else if(this.currentlySelectedAction == "Retreat") {
            this.assetList[1].setSelectionByIndex(3);
            this.assetList[2].isVisible = false;
            this.assetList[2].isActive = false;
            this.assetList[3].isVisible = false;
            this.assetList[3].isActive = false;
            this.assetList[4].isVisible = false;
            this.assetList[4].isActive = false;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
          }

        }
        else if(i==0 && this.currentlySelectedHero == j){
          console.log("Same Hero selected, unassigning...");
          this.currentlySelectedHero = -1;
          this.assetList[1].resetMenu();
          this.assetList[2].resetMenu();
          this.assetList[3].resetMenu();
          this.assetList[4].resetMenu();
          this.assetList[5].resetMenu();
          this.assetList[1].isVisible = false;
          this.assetList[1].isActive = false;
          this.assetList[2].isVisible = false;
          this.assetList[2].isActive = false;
          this.assetList[3].isVisible = false;
          this.assetList[3].isActive = false;
          this.assetList[4].isVisible = false;
          this.assetList[4].isActive = false;
          this.assetList[5].isVisible = false;
          this.assetList[5].isActive = false;
          this.currentlySelectedAction = "none";
          this.currentlySelectedSpecialOrItem = null;
          this.currentlySelectedTarget = null;
        }
        else if(i==1 && this.currentlySelectedAction != this.assetList[1].menuButtonList[j].label) {
          console.log("New or different action selected, assigning...");
          this.assetList[2].resetMenu();
          this.assetList[3].resetMenu();
          this.assetList[4].resetMenu();
          this.assetList[5].resetMenu();
          this.assetList[2].isActive = false;
          this.assetList[2].isVisible = false;
          this.assetList[3].isActive = false;
          this.assetList[3].isVisible = false;
          this.assetList[4].isActive = false;
          this.assetList[4].isVisible = false;
          this.assetList[5].isActive = false;
          this.assetList[5].isVisible = false;
          this.assetList[6].isActive = false;
          this.assetList[6].isVisible = false;
          this.currentlySelectedAction = this.assetList[1].menuButtonList[j].label;
          this.currentlySelectedTarget = null;
          this.currentlySelectedSpecialOrItem = null;
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          currentHero.currentlySelectedAction = this.assetList[1].menuButtonList[j].label;
          currentHero.isActionSelected = true;
          currentHero.isTargetSelected = false;
          currentHero.currentlySelectedTarget = null;
          currentHero.isSpecialOrItemSelected = false;
          currentHero.currentlySelectedSpecialOrItem = null;

          if(currentHero.currentlySelectedAction == "Attack" || currentHero.currentlySelectedAction == "Retreat") {
            //No specific item or move needs to be selected
            currentHero.isSpecialOrItemSelected = true;
            this.currentlySelectedSpecialOrItem = null;
            //Set a hidden target, if hero is to attempt a retreat
            if (currentHero.currentlySelectedAction == "Retreat") {
              currentHero.currentlySelectedTarget = {name: "RetreatTarget"};
              this.currentlySelectedTarget = currentHero.currentlySelectedTarget;
              currentHero.isTargetSelected = true;
            }
            if(currentHero.currentlySelectedAction == "Attack") {
              this.assetList[4].isVisible = true;
              this.assetList[4].isActive = true;
            }
          }
          else {
            this.assetList[1].isVisible = false;
            this.assetList[1].isActive = false;
            this.assetList[1].resetMenu();
            //Activate Special Move menu
            if(currentHero.currentlySelectedAction == "Special") {
              this.assetList[2].setOptions(currentHero.specialMoveList);
              this.assetList[2].isVisible = true;
              this.assetList[2].isActive = true;
            }
            //Activate Item Menu
            else if(currentHero.currentlySelectedAction == "Item") {
              this.assetList[3].checkRemainingItems(this.currentlySelectedHero);
              this.assetList[3].isVisible = true;
              this.assetList[3].isActive = true;
            }
          }
          if(this.areAllHerosReady()){
            this.assetList[6].isActive = true;
            this.assetList[6].isVisible = true;
          }
        }
        else if(i==1 && this.currentlySelectedAction == this.assetList[1].menuButtonList[j].label) {
          console.log("Same action selected, unassigning...");
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          this.currentlySelectedAction = "none";
          this.currentlySelectedTarget = null;
          this.currentlySelectedSpecialOrItem = null;
          currentHero.currentlySelectedAction = "none";
          currentHero.isActionSelected = false;
          currentHero.isSpecialOrItemSelected = false;
          currentHero.currentlySelectedSpecialOrItem = null;
          currentHero.currentlySelectedTarget = null;
          currentHero.isTargetSelected = false;
          this.assetList[4].isVisible = false;
          this.assetList[4].isActive = false;
          this.assetList[5].isVisible = false;
          this.assetList[5].isActive = false;
          this.assetList[6].isActive = false;
          this.assetList[6].isVisible = false;
          ///////
          this.assetList[1].resetMenu();
          ///////
          this.assetList[2].resetMenu();
          this.assetList[3].resetMenu();
          this.assetList[4].resetMenu();
          this.assetList[5].resetMenu();
        }
        else if(i==2 && this.surManager.heroManager.assetList[this.currentlySelectedHero].currentlySelectedSpecialOrItem != this.assetList[2].menuButtonList[j].target) {
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          if(j==0) {
            console.log("Back (special) button hit...");
            this.currentlySelectedAction = "none";
            this.currentlySelectedTarget = null;
            this.currentlySelectedSpecialOrItem = null;
            currentHero.isTargetSlected = false;
            currentHero.currentlySelectedTarget = null;
            currentHero.currentlySelectedAction = "none";
            currentHero.currentlySelectedSpecialOrItem = null;
            this.assetList[1].isVisible = true;
            this.assetList[1].isActive = true;
            this.assetList[2].isVisible = false;
            this.assetList[2].isActive = false;
            this.assetList[3].isActive = false;
            this.assetList[3].isVisible = false;
            this.assetList[4].isVisible = false;
            this.assetList[4].isActive = false;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
            this.assetList[6].isActive = false;
            this.assetList[6].isVisible = false;
            this.assetList[1].resetMenu();
            this.assetList[2].resetMenu();
            this.assetList[3].resetMenu();
            this.assetList[4].resetMenu();
            this.assetList[5].resetMenu();
          }
          else {
            console.log("New Special selected, assigning...");
            this.currentlySelectedSpecialOrItem = this.assetList[2].menuButtonList[j].target;
            currentHero.currentlySelectedSpecialOrItem = this.currentlySelectedSpecialOrItem;
            currentHero.isSpecialOrItemSelected = true;
            this.currentlySelectedTarget = null
            this.assetList[4].resetMenu();
            this.assetList[5].resetMenu();
            currentHero.currentlySelectedTarget = null;
            currentHero.isTargetSelected = false;
            this.assetList[4].isVisible = false;
            this.assetList[4].isActive = false;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
            this.assetList[6].isActive = false;
            this.assetList[6].isVisible = false;

            if(currentHero.currentlySelectedSpecialOrItem.isUsedOnOpponent) {
              this.assetList[4].isVisible = true;
              this.assetList[4].isActive = true;
            }
            else {
              this.assetList[5].isVisible = true;
              this.assetList[5].isActive = true;
            }
          }
        }
        else if (i==2 && this.surManager.heroManager.assetList[this.currentlySelectedHero].currentlySelectedSpecialOrItem == this.assetList[2].menuButtonList[j].target) {
          console.log("Same Special selected, unassigning...");
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          currentHero.isSpecialorItemSelected = false;
          currentHero.currentlySelectedSpecialOrItem = null;
          currentHero.currentlySelectedTarget = null;
          currentHero.isTargetSelected = false;
          this.currentlySelectedSpecialOrItem = null;
          this.currentlySelectedTarget = null;
          this.assetList[4].isVisible = false;
          this.assetList[4].isActive = false;
          this.assetList[5].isVisible = false;
          this.assetList[5].isActive = false;
          this.assetList[6].isActive = false;
          this.assetList[6].isVisible = false;
        }
        else if(i==3 && this.surManager.heroManager.assetList[this.currentlySelectedHero].currentlySelectedSpecialOrItem != this.assetList[3].menuButtonList[j].target) {
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          if(j==0) {
            console.log("Back (item) button hit...");
            this.currentlySelectedAction = "none";
            this.currentlySelectedTarget = null;
            this.currentlySelectedSpecialOrItem = null;
            currentHero.isTargetSelected = false;
            currentHero.currentlySelectedTarget = null;
            currentHero.currentlySelectedAction = "none";
            currentHero.currentlySelectedSpecialOrItem = null;
            this.assetList[1].isVisible = true;
            this.assetList[1].isActive = true;
            this.assetList[2].isVisible = false;
            this.assetList[2].isActive = false;
            this.assetList[3].isActive = false;
            this.assetList[3].isVisible = false;
            this.assetList[4].isVisible = false;
            this.assetList[4].isActive = false;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
            this.assetList[6].isActive = false;
            this.assetList[6].isVisible = false;
            this.assetList[1].resetMenu();
            this.assetList[2].resetMenu();
            this.assetList[3].resetMenu();
            this.assetList[4].resetMenu();
            this.assetList[5].resetMenu();
          }
          else {
            console.log("New Item selected, assigning...");
            this.currentlySelectedSpecialOrItem = this.assetList[3].menuButtonList[j].target;
            currentHero.currentlySelectedSpecialOrItem = this.currentlySelectedSpecialOrItem;
            currentHero.isSpecialOrItemSelected = true;
            this.currentlySelectedTarget = null
            currentHero.currentlySelectedTarget = null;
            currentHero.isTargetSelected = false;
            this.assetList[4].isVisible = false;
            this.assetList[4].isActive = false;
            this.assetList[5].isVisible = false;
            this.assetList[5].isActive = false;
            this.assetList[6].isActive = false;
            this.assetList[6].isVisible = false;
            if(currentHero.currentlySelectedSpecialOrItem.isUsedOnOpponent) {
              this.assetList[4].isVisible = true;
              this.assetList[4].isActive = true;
            }
            else {
              this.assetList[5].isVisible = true;
              this.assetList[5].isActive = true;
            }
          }
        }
        else if (i==3 && this.surManager.heroManager.assetList[this.currentlySelectedHero].currentlySelectedSpecialOrItem == this.assetList[3].menuButtonList[j].target) {
          console.log("Same Item selected, unassigning...");
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          currentHero.isSpecialorItemSelected = false;
          currentHero.currentlySelectedSpecialOrItem = null;
          currentHero.currentlySelectedTarget = null;
          currentHero.isTargetSelected = false;
          this.currentlySelectedSpecialOrItem = null;
          this.currentlySelectedTarget = null;
          this.assetList[4].isVisible = false;
          this.assetList[4].isActive = false;
          this.assetList[5].isVisible = false;
          this.assetList[5].isActive = false;
          this.assetList[6].isActive = false;
          this.assetList[6].isVisible = false;
        }
        else if(i==4 && this.currentlySelectedTarget != this.assetList[4].menuButtonList[j].target) {
          console.log("new monster target selected, assigning...");

          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          currentHero.isTargetSelected = true;
          currentHero.currentlySelectedTarget = this.assetList[4].menuButtonList[j].target;
          this.currentlySelectedTarget = this.assetList[4].menuButtonList[j].target;
          if(this.areAllHerosReady()){
            this.assetList[6].isActive = true;
            this.assetList[6].isVisible = true;
          }
        }
        else if(i==4 && this.currentlySelectedTarget == this.assetList[4].menuButtonList[j].target) {
          console.log("same monster target selected, unassigning...");
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          currentHero.isTargetSelected = false;
          currentHero.currentlySelectedTarget = null;
          this.currentlySelectedTarget = null;
          this.assetList[6].isActive = false;
          this.assetList[6].isVisible = false;
        }
        else if(i==5 && this.currentlySelectedTarget != this.assetList[5].menuButtonList[j].target) {
          console.log("new hero target selected, assigning...");
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          currentHero.isTargetSelected = true;
          currentHero.currentlySelectedTarget = this.assetList[5].menuButtonList[j].target;
          this.currentlySelectedTarget = this.assetList[5].menuButtonList[j].target;
          if(this.areAllHerosReady()){
            this.assetList[6].isActive = true;
            this.assetList[6].isVisible = true;
          }
        }
        else if(i==5 && this.currentlySelectedTarget == this.assetList[5].menuButtonList[j].target) {
          console.log("same hero target selected, unassigning...");
          let currentHero = this.surManager.heroManager.assetList[this.currentlySelectedHero];
          currentHero.isTargetSelected = false;
          currentHero.currentlySelectedTarget = null;
          this.currentlySelectedTarget = null;
          this.assetList[6].isActive = false;
          this.assetList[6].isVisible = false;
        }
        else if(i==6) {
          console.log("all actions selected, starting combat...");
          this.assetList[0].isVisible = false;
          this.assetList[0].isActive = false;
          this.assetList[1].isVisible = false;
          this.assetList[1].isActive = false;
          this.assetList[2].isVisible = false;
          this.assetList[2].isActive = false;
          this.assetList[3].isVisible = false;
          this.assetList[3].isActive = false;
          this.assetList[4].isVisible = false;
          this.assetList[4].isActive = false;
          this.assetList[5].isVisible = false;
          this.assetList[5].isActive = false;
          this.assetList[6].isVisible = false;
          this.assetList[6].isActive = false;
          this.surManager.battleState = "combat";
          this.surManager.combat = new Combat(this.surManager);
        }
      } // end of if(this.assetList[i].menuButtonList[j].cursorHover)
    }// end of for(let j = 0 ; j< this.assetList[i].menuButtonList.length; j++)
  }// end of for(let i =0 ; i< this.assetList.length; i++)
}
BattleMenuManager.prototype.areAllHerosReady = function() {
  let test = true;
  for(let i = 0 ; i < this.surManager.heroManager.assetList.length ; i++) {
    if(!this.surManager.heroManager.assetList[i].isTargetSelected && this.surManager.heroManager.assetList[i].isAlive) {
      test = false;
    }
  }
  return test;
}
BattleMenuManager.prototype.newRound = function() {
  for(let i = 0 ; i< this.assetList.length; i++) {
    this.assetList[i].resetMenu();
    this.assetList[i].verifyApplicability();
  }
  this.assetList[0].isVisible = true;
  this.assetList[0].isActive = true;
  this.currentlySelectedHero = -1;
  this.currentlySelectedAction = "none";
  this.currentlySelectedItemOrSpecial = null;
  this.currentlySelectedTarget = null;
}

//MENU CLASS/////////////////////////

//This is the constructor function for the Menu class, this class is the parent of all menus that the user will use throughout the game
function Menu() {
  this.counter = 0;
  this.isVisible = true;
  this.isActive = true;
  this.position = {x:0,y:0};
  this.cursorHover = false;
  this.menuClicked = false;
  this.menuColor = "rgb(200, 0, 0)";
  this.target = -1;
  this.targetAcquired = false;
  //this holds references to the actual instances of objects that are refered to by the menu
  this.optionList = [];
  //this holds the menuButtons that will make up the basis for the user interface
  this.menuButtonList = [];
}
//This method is reposible for setting a reference to the surmanager, this allows the menu to talk to the managers to request lists of items/heros/enemies etc
Menu.prototype.setSurManager = function(surManager) {
  this.surManager = surManager;
}
//This method is for setting the position of the menu, it is used by the child menus for setting position based on what type of menu it is
Menu.prototype.setPosition = function(x, y) {
  this.position.x = x;
  this.position.y = y;
}
//This method is used to set the options that the menu will be providing to the user
Menu.prototype.setOptions = function(options) {
  this.optionList = options;
  this.compileMenu();
}
//This method is called after a new options list is set, it is responsible for completing the menuButtonsList and giving them the proper location
Menu.prototype.compileMenu = function(){
  this.menuButtonList = [];
  for(let i = 0;i<this.optionList.length;i++) {
    let menuButton = new MenuButton(this.optionList[i]);
    menuButton.setPosition(this.position.x+5, this.position.y+5 + (25*i));
    menuButton.setSurManager(this.surManager);
    this.menuButtonList.push(menuButton);
  }
}
Menu.prototype.select = function(i) {
  if(this.target!=i) {
    this.target = i;
    this.targetAcquired = true;
    this.menuButtonList[i].isClicked = true;
    for(let j = 0; j<this.menuButtonList.length;j++) {
      if(i!=j) {
        this.menuButtonList[j].isClicked = false;
      }
    }
  }
  else {
    this.target = -1;
    this.targetAcquired = false;
    this.menuButtonList[i].isClicked = false;
  }
}
Menu.prototype.update = function(gameTime, elapsedTime) {
  this.verifyApplicability();
  if(this.isActive) {
    for(let i = 0 ; i < this.menuButtonList.length;i++) {
      this.menuButtonList[i].update(gameTime, elapsedTime);
    }

  }
  else {
    this.resetMenu();
  }
}
Menu.prototype.verifyApplicability = function() {
  for(let i = 0 ; i < this.menuButtonList.length;i++) {
    this.menuButtonList[i].verifyApplicability();
  }
}
Menu.prototype.hoverCheck = function(){
  this.cursorHover = false;
  if(this.isActive) {
    for(let i =0; i < this.menuButtonList.length; i++) {
      this.menuButtonList[i].hoverCheck();
      if (this.menuButtonList[i].cursorHover){
        this.cursorHover = true;
      }
    }
  }
}
Menu.prototype.clickCheck = function () {
  this.menuClicked = false;
  if(this.isActive) {
    for(let i = 0 ; i<this.menuButtonList.length; i++) {
      if(this.menuButtonList[i].isClicked) {
        this.menuClicked = true;
      }
    }
  }
}
//This method clears the user selection without changing the menu
Menu.prototype.resetMenu = function() {
  this.menuClicked = false;
  this.target = -1;
  for(let i = 0 ; i<this.menuButtonList.length; i++) {
    this.menuButtonList[i].isClicked = false;
    this.menuButtonList[i].cursorHover = false;
  }
}
//This method allows the menuManager to set the menu to be clicked on a particular target
Menu.prototype.setSelection = function(target) {
  for(let i = 0 ; i<this.menuButtonList.length; i++) {
    if(this.menuButtonList[i].target == target) {
      this.menuButtonList[i].isClicked = true;
    }
  }
  this.menuClicked = true;
}
//This method allows the menuManager to set the menu to be clickewd via index
Menu.prototype.setSelectionByIndex = function (i) {
  this.menuButtonList[i].isClicked = true;
}
Menu.prototype.setSelectionByString = function(label) {
  for(let i = 0 ; i<this.menuButtonList.length; i++) {
    if(this.menuButtonList[i].label == label) {
      this.menuButtonList[i].isClicked = true;
    }
  }
}
//This is the menu's main draw method
Menu.prototype.draw = function(ctx) {
  if(this.isVisible) {
    ctx.fillStyle = this.menuColor;
    ctx.fillRect(this.position.x, this.position.y, 160, 240);
    for(let i = 0 ; i<this.menuButtonList.length; i++) {
      this.menuButtonList[i].draw(ctx);
    }
  }
}

function HeroSelectionMenu() {
  Menu.call(this);
}
HeroSelectionMenu.prototype = Object.create(Menu.prototype);
HeroSelectionMenu.prototype.constructor = HeroSelectionMenu;
HeroSelectionMenu.prototype.load = function(HeroList) {
  this.setOptions(HeroList);
}

function ActionMenu() {
  Menu.call(this);
}
ActionMenu.prototype = Object.create(Menu.prototype);
ActionMenu.prototype.constructor = ActionMenu;
ActionMenu.prototype.load = function() {
  this.isVisible = false;
  this.isActive = false;
  this.setPosition(160, 240);
  this.menuColor = "rgb(255, 231, 97)";
  let label1 = {name: "Attack", applicableTarget: true};
  let label2 = {name: "Special", applicableTarget: true};
  let label3 = {name: "Item", applicableTarget: true};
  let label4 = {name: "Retreat", applicableTarget: true};
  let buttonList = [label1, label2, label3, label4];
  this.setOptions(buttonList);
}

function SpecialMenu() {
  Menu.call(this);
}
SpecialMenu.prototype = Object.create(Menu.prototype);
SpecialMenu.prototype.constructor = SpecialMenu
SpecialMenu.prototype.load = function() {
  this.isActive = false;
  this.isVisible = false;
  this.setPosition(160, 240);
}
SpecialMenu.prototype.setOptions = function(options) {
  let optionListPlus = [];
  optionListPlus.push({name: "Back", applicableTarget: true});
  for(let i = 0 ; i < options.length ; i++) {
    optionListPlus.push(options[i]);
  }
  this.optionList = optionListPlus;
  this.compileMenu();
}

function ItemMenu() {
  Menu.call(this);
}
ItemMenu.prototype = Object.create(Menu.prototype);
ItemMenu.prototype.constructor = ItemMenu;
ItemMenu.prototype.load = function () {
  this.isActive = false;
  this.isVisible = false;
  this.setPosition(160, 240);
  this.setOptions(this.surManager.battleItems);
}
ItemMenu.prototype.setOptions = function(options) {
  options.unshift({name: "Back", applicableTarget: true});
  this.optionList = options;
  this.compileMenu();
}
ItemMenu.prototype.checkRemainingItems = function(currentHero){
  for(let i = 1 ; i < this.optionList.length ; i++) {
    this.menuButtonList[i].target.checkApplicability(this.surManager.heroManager.assetList, currentHero);
  }
  this.verifyApplicability();
}

function MonsterTargetMenu() {
  Menu.call(this);
}
MonsterTargetMenu.prototype = Object.create(Menu.prototype);
MonsterTargetMenu.constructor = MonsterTargetMenu;
MonsterTargetMenu.prototype.load = function() {
  this.isActive = false;
  this.isVisible = false;
  this.setPosition(320, 240);
  this.setOptions(this.surManager.monsterManager.assetList);
}

function HeroTargetMenu() {
  Menu.call(this);
}
HeroTargetMenu.prototype = Object.create(Menu.prototype);
HeroTargetMenu.prototype.constructor = HeroTargetMenu;
HeroTargetMenu.prototype.load = function() {
  this.isActive = false;
  this.isVisible = false;
  this.setPosition(320, 240);
  this.setOptions(this.surManager.heroManager.assetList);
}

function TurnConfirmButton() {
  Menu.call(this);
  this.isVisible = false
  this.isActive = false;
}
TurnConfirmButton.prototype = Object.create(new Menu());
TurnConfirmButton.prototype.constructor = TurnConfirmButton;
TurnConfirmButton.prototype.load = function() {
  this.setPosition(480, 240);
  let label = [{name: "Confirm Turn", applicableTarget: true}];
  this.setOptions(label);
}


//This is the constructor for the MenuButton class, this class is responsible for describing a button that represents a selection on a menu
function MenuButton(target) {
  this.position = {x:0,y:0};
  this.rectangle = {x:0,y:0,l:150,h:22};
  this.target = target;
  this.label = target.name;
  this.isVisible = true;
  this.isActive = true;
  this.color = "rgb(0,0,200)";
  this.cursorHover = false;
  this.isClicked = false;
}
//This method is used by the Menu class to assign a position to the menu button
MenuButton.prototype.setPosition = function(x, y) {
  this.rectangle.x = x;
  this.rectangle.y = y;
}
MenuButton.prototype.verifyApplicability = function() {
  if(this.target.applicableTarget) {
    this.isActive = true;
  }
  else{
    this.isActive = false;
  }
}
MenuButton.prototype.setSurManager = function(surManager) {
  this.surManager = surManager;
}
MenuButton.prototype.hoverCheck = function() {
  this.cursorHover = false;
  if(this.isActive){
    let mousex = this.surManager.mousex;
    let mousey = this.surManager.mousey;
    //check for collision and set cursorHover
    if(mousex>this.rectangle.x && mousex<this.rectangle.x+this.rectangle.l && mousey>this.rectangle.y && mousey<this.rectangle.y+this.rectangle.h) {
      this.cursorHover = true;
    }
  }
  else {
    this.cursorHover = false;
  }
  if(!this.isVisible) {
    this.cursorHover = false;
  }
}
MenuButton.prototype.update = function(gameTime, elapsedTime) {
  if(this.isActive){
    if(this.cursorHover) {
      this.color = "rgb(100, 0, 100)";
    }
    else {
      this.color = "rgb(0,0,200)";
    }
  }
  else {
    this.color = "rgb(0, 0, 200)";
  }
  if(this.isClicked){
    this.color = "rgb(0, 150, 150)";
    if(this.cursorHover){
      this.color = "rgb(0, 210, 210)";
    }
    if(!this.isActive) {
      this.color = "rgb(0, 0, 200)";
    }
  }
}
MenuButton.prototype.draw = function(ctx) {
  if(this.isVisible){
    ctx.fillStyle = this.color;
    ctx.fillRect(this.rectangle.x, this.rectangle.y, this.rectangle.l, this.rectangle.h);
    ctx.font = "20px serif";
    ctx.fillStyle = "rgb(200,200,200)";

    ctx.fillText(this.label, this.rectangle.x+3, this.rectangle.y+17);
    if(!this.isActive){
      ctx.beginPath();
      ctx.strokeStyle = "rgb(200, 200, 200)";
      ctx.lineWidth = 2;
      ctx.moveTo(this.rectangle.x, this.rectangle.y + 12);
      ctx.lineTo(this.rectangle.x + 150, this.rectangle.y +12);
      ctx.stroke();
    }
  }
}

///////ITEM CLASS/////////////////

function Item() {
  this.isBattleItem = false;
  this.applicableTarget = false;
  this.name = "unnamedItem";
  this.quantity = 0;
  this.isUsedOnOpponent = false;
}
Item.prototype.consume = function() {
  this.quantity -= 1;
}
Item.prototype.checkApplicability = function(heroList, currentHero) {

}

function BattleItem() {
  Item.call(this);
  this.name = "unnamedBattleItem";
  this.isBattleItem = true;
  this.isUsedOnDead = false;
  this.role = "item";
  console.log("loading stats for item " + this.name);
  this.specialOrItemStats = new Stats(this);
}
BattleItem.prototype = Object.create(Item.prototype);
BattleItem.prototype.constructor = BattleItem;
BattleItem.prototype.effect = function(target){

}
BattleItem.prototype.checkApplicability = function(heroList, currentHero) {
  this.applicableTarget = true;
  if(this.quantity <= 0) {
    this.applicableTarget = false;
  }
  else {
    let toBeUsedThisTurn = 0;
    for(let i = 0 ; i < heroList.length; i++) {
      if(heroList[i].currentlySelectedSpecialOrItem != null) {
        if(heroList[i].currentlySelectedSpecialOrItem.name == this.name) {
          toBeUsedThisTurn++;
        }
      }
    }
    if(heroList[currentHero].currentlySelectedSpecialOrItem != null) {
      if(heroList[currentHero].currentlySelectedSpecialOrItem.name == this.name) {
        toBeUsedThisTurn--;
      }
    }
    if(this.quantity == toBeUsedThisTurn) {
      this.applicableTarget = false;
    }
  }
}

function MinorHealthPotion() {
  BattleItem.call(this);
  this.name = "Minor Health Potion";
  this.healingPower = 10;
}
MinorHealthPotion.prototype = Object.create(BattleItem.prototype);
MinorHealthPotion.prototype.constructor = MinorHealthPotion;
MinorHealthPotion.prototype.effect = function(target) {
  target.remainingHP += this.healingPower;
  target.damageDisplay = new DamageDisplay(-1*this.healingPower, target.position);
  target.capHP();
  this.consume();
  console.log(target.name + " healed 10 points by health potion");
  ////
}

/////SPECIAL MOVE CLASS/////////////////////////////

function SpecialMove() {
  this.name = "unnamedSpecialMove";
  this.role = "special";
  this.isUsedOnOpponent = true;
  this.specialOrItemStats = null;
  this.isUsedOnDead = false;
}
SpecialMove.prototype.loadStats = function() {
  console.log("loading stats for special move " + this.name);
  this.specialOrItemStats = new Stats(this);
}
SpecialMove.prototype.useMove = function(owner, target) {
  console.log("performing specialMove, target: " + target + "\t name: " + this.name);
  target.remainingHP -= (owner.combatStats.strength-target.combatStats.toughness);
  target.damageDisplay = new DamageDisplay(owner.combatStats.strength-target.combatStats.toughness, target.position);
}


function PowerStrike() {
  SpecialMove.call(this);
  this.name = "Power Strike";
  this.loadStats();
}
PowerStrike.prototype = Object.create(SpecialMove.prototype);
PowerStrike.prototype.constructor = PowerStrike;

function WindSlash() {
  SpecialMove.call(this);
  this.name = "Wind Slash";
  this.loadStats();
}
WindSlash.prototype = Object.create(SpecialMove.prototype);
WindSlash.prototype.constructor = WindSlash;
function BlockOpponent() {
  SpecialMove.call(this);
  this.name = "Block Opponent";
  this.loadStats();
}
BlockOpponent.prototype = Object.create(SpecialMove.prototype);
BlockOpponent.prototype.constructor = BlockOpponent;
BlockOpponent.prototype.useMove = function(owner, target) {
  console.log(owner.name + " is blocking opponent " + target.name);
  target.statusEffectList.push(new Blocked(target, owner));
}

function GuardAlly() {
  SpecialMove.call(this);
  this.name = "Guard Ally";
  this.isUsedOnOpponent = false;
  this.loadStats();
}
GuardAlly.prototype = Object.create(SpecialMove.prototype);
GuardAlly.prototype.constructor = GuardAlly;
GuardAlly.prototype.useMove = function(owner, target) {
  console.log(owner.name + " is guarding ally " + target.name);
  target.statusEffectList.push(new Guarded(target, owner))
}

function StatusEffect(owner) {
  this.owner = owner;
  this.name = "unnamed status effect";
  this.effectStrength = 0;
  this.duration = 0;

}
StatusEffect.prototype.applyEffect = function() {

}

function Guarded(owner, guardian) {
  StatusEffect.call(this, owner);
  this.name = "Guarded";
  this.duration = 1;
  this.effectStrength = 1;
  this.guardian = guardian;
}
Guarded.prototype = Object.create(StatusEffect.prototype);
Guarded.prototype.constructor = Guarded;

function Blocked(owner, blocker) {
  StatusEffect.call(this, owner);
  this.name = "Blocked";
  this.duration = 1;
  this.effectStrength = 1;
  this.blocker = blocker;
}

function Stats(owner) {
  this.owner = owner
  this.strength = 0;
  this.toughness = 0;
  this.vigor = 0;
  this.dexterity = 0;
  this.cunning = 0;
  this.spirit = 0;
  this.will = 0;
  this.speed = 0;
  this.load(owner.role);
}
Stats.prototype.empty = function() {
  this.strength = 0;
  this.toughness = 0;
  this.vigor = 0;
  this.dexterity = 0;
  this.cunning = 0;
  this.spirit = 0;
  this.will = 0;
  this.speed = 0;
}
Stats.prototype.combineStats = function(stats1, stats2) {
  this.strength = stats1.strength + stats2.strength;
  this.toughness = stats1.toughness + stats2.toughness;
  this.vigor = stats1.vigor + stats2.vigor;
  this.dexterity = stats1.dexterity + stats2.dexteriety;
  this.cunning = stats1.cunning + stats2.cunning;
  this.spirit = stats1.spirit + stats2.spirit;
  this.will = stats1.will + stats2.will;
  this.speed = stats1.speed + stats2.speed;
}
Stats.prototype.load = function(role) {
  switch(role) {
    case "fighter":
      this.strength = 8;
      this.toughness = 3;
      this.vigor = 4;
      this.dexterity = 0;
      this.cunning = 0;
      this.spirit = 0;
      this.will = 0;
      this.speed = 4;
      break;
    case "knight":
      this.strength = 5;
      this.toughness = 4;
      this.vigor = 5;
      this.dexterity = 0;
      this.cunning = 0;
      this.spirit = 0;
      this.will = 0;
      this.speed = 3;
      break;
    case "monster":
      this.loadMonster(this.owner.name);
      break;
    case "equipment":
      this.loadEquipment(this.owner.name);
      break;
    case "special":
      this.loadSpecial(this.owner.name);
      break;
    case "item":
      this.strength = 0;
      this.toughness = 0;
      this.vigor = 0;
      this.dexterity = 0;
      this.cunning = 0;
      this.spirit = 0;
      this.will = 0;
      this.speed = 5;
      break;
    default:
      console.log("error, could not load stats for role: " + role);
      break;
  }
}
Stats.prototype.loadMonster = function(monster) {
  switch(monster) {
    case "Wolf":
      this.strength = 8;
      this.toughness = 3;
      this.vigor = 2;
      this.dexterity = 0;
      this.cunning = 0;
      this.spirit = 0;
      this.will = 0;
      this.speed = 5;
  }
}
Stats.loadEquipment = function(name) {
  switch(name) {
      case "Iron Sword":
        this.strength = 2;
        this.toughness = 0;
        this.vigor = 0;
        this.dexterity = 0;
        this.cunning = 0;
        this.spirit = 0;
        this.will = 0;
        this.speed = 0;
      break;
    case "Steel Sword":
        this.strength = 4;
        this.toughness = 0;
        this.vigor = 0;
        this.dexterity = 0;
        this.cunning = 0;
        this.spirit = 0;
        this.will = 0;
        this.speed = 0;
      break;
    default:
      console.log("loadEquipment error, invalid name");
      break;
  }
}
Stats.prototype.loadSpecial = function(name) {
  switch(name) {
    case "Power Strike":
      this.strength = 3;
      this.toughness = 0;
      this.vigor = 0;
      this.dexterity = 0;
      this.cunning = 0;
      this.spirit = 0;
      this.will = 0;
      this.speed = 0;
      break;
    case "Wind Slash":
      this.strength = 1;
      this.toughness = 0;
      this.vigor = 0;
      this.dexterity = 0;
      this.cunning = 0;
      this.spirit = 0;
      this.will = 0;
      this.speed = 3;
      break;
    case "Guard Ally":
      this.strength = 0;
      this.toughness = 2;
      this.vigor = 0;
      this.dexterity = 0;
      this.cunning = 0;
      this.spirit = 0;
      this.will = 0;
      this.speed = 5;
      break;
    case "Block Opponent":
      this.strength = 0;
      this.toughness = 2;
      this.vigor = 0;
      this.dexterity = 0;
      this.cunning = 0;
      this.spirit = 0;
      this.will = 0;
      this.speed = 5;
      break;
    default:
      console.log("loadPower error, invalid name");
      break;
  }
}

function CombatStats(owner) {
  Stats.call(this, owner);
  this.empty();
}
CombatStats.prototype = Object.create(Stats.prototype);
CombatStats.prototype.constructor = CombatStats;

function EquippedStats(owner) {
  Stats.call(this, owner);
  this.empty();
}
EquippedStats.prototype = Object.create(Stats.prototype);
EquippedStats.prototype.constructor = EquippedStats;

//This is the constructor function for the Unit class, this class is the parent for each unit (hero/monster) and contains the parent properties and methods required by each Unit such as load, draw, update
function Unit(name){
  this.position = {x:0, y:0};
  this.image = null;
  this.maxHP = 0;
  this.isAlive = true;
  this.remainingHP = this.maxHP;
  this.baseStats = null;
  this.equippedStats = null;
  this.equipment = [];
  this.combatStats = null;
  this.specialStats = null;
  this.combatStance = new CombatStance();
  this.statusEffectList = [];
  this.name = name;
  this.role = "unassigned";
  this.specialMoveList = [];
  this.isInParty = true;
  this.applicableTarget = true;
  this.isActionSelected = false;
  this.isSpecialOrItemSelected = false;
  this.currentlySelectedAction = "none";
  this.currentylSelectedSpecialOrItem = null;
  this.isTargetSelected = false;
  this.currentlySelectedTarget = null;
  this.isActionConfirmed = false;
  this.damageDisplay = null;
}
Unit.prototype.setSurManager = function(surManager) {
  this.surManager = surManager;
}
Unit.prototype.isAfflictedWith = function(statusName) {
  for(let i = 0 ; i < this.statusEffectList.length ; i ++) {
    if(this.statusEffectList[i].name == statusName) {
      return true;
    }
  }
  return false;
}
Unit.prototype.calculateCombatStats = function() {
  this.combatStats.empty();
  this.equippedStats.empty();
  for(let i = 0 ; i < this.equipment.length ; i++) {
    this.equippedStats.combineStats(this.equippedStats, this.equipment[i].stats);
  }
  this.combatStats.combineStats(this.baseStats, this.equippedStats);
  if((this.currentlySelectedAction == "Special" || this.currentlySelectedAction == "Item") && this.currentlySelectedSpecialOrItem != null){
    let specialStats = this.currentlySelectedSpecialOrItem.specialOrItemStats;
    this.combatStats.combineStats(this.baseStats, this.equippedStats);
    this.combatStats.combineStats(this.combatStats, specialStats);
  }

}
Unit.prototype.combatReset = function() {
  this.isActionSelected = false;
  this.currentlySelectedAction = "none";
  this.isTargetSelected = false;
  this.currentlySelectedSpecialOrItem = null;
  this.currentlySelectedTarget = null;
  this.isActionConfirmed = false;
}
//This method sets the units max hp at the start of battle based on vigor and vigor bonuses
Unit.prototype.setMaxHP = function() {
  this.maxHP = 5 * this.baseStats.vigor;
  this.remainingHP = this.maxHP;
}
//This method is called after the unit heals to ensure th remaining HP does not exceed thier maximum hp;
Unit.prototype.capHP = function() {
  if(this.remainingHP>this.maxHP) {
    this.remainingHP=this.maxHP;
  }
}
//This method is called when a unit performs a basic attack on another unit
Unit.prototype.attack = function(target){
  console.log(this.role + " " + this.name + " attacks " + target.name + " with " + this.combatStats.strength +" strength!");
  target.remainingHP -= (this.combatStats.strength-target.combatStats.toughness);
  target.damageDisplay = new DamageDisplay(this.combatStats.strength-target.combatStats.toughness, target.position);
  target.deathCheck();
  console.log("Net damage: " + (this.combatStats.strength-target.combatStats.toughness) + "\nremainingHP: " + target.remainingHP);
  if(!target.isAlive){
    console.log(target.role + " " + target.name + " has been slain!");
  }
}
//This method is responsible for checking remainingHP and updating the isAlive boolean propertiy appropriately
Unit.prototype.deathCheck = function() {
  if(this.remainingHP<=0) {
    this.isAlive = false;
    this.applicableTarget = false;
  }
  else {
    this.isAlive = true;
  }
}
Unit.prototype.moveApplicabilityCheck = function() {
  for(let i = 0 ; i < this.specialMoveList.length ; i++) {
    this.specialMoveList[i].applicableTarget = true;
  }
}
Unit.prototype.update = function(gameTime, elapsedTime) {
  this.healthBar.update(gameTime, elapsedTime);
  this.combatStance.update(gameTime, elapsedTime);
  this.calculateCombatStats();
  this.deathCheck();
  if(this.damageDisplay != null) {
    this.damageDisplay.update(gameTime, elapsedTime);
    if(this.damageDisplay.isExpired) {
      this.damageDisplay = null;
    }
  }
}
//This is the units main draw function
Unit.prototype.draw = function(ctx) {
  if (this.image != null) {
    ctx.drawImage(this.image, this.position.x, this.position.y);
    this.healthBar.draw(ctx);
  }
  else {
    console.log("image failed: " + this.name);
  }
  if(this.damageDisplay != null) {
    this.damageDisplay.draw(ctx);
  }
}
Unit.prototype.load = function() {
  //this.loadImage(); // already loaded in hero/monster constructor
  this.loadStats();
  this.setMaxHP();
  this.healthBar = new HealthBar(this);
}
Unit.prototype.loadImage = function() {
  this.image = new Image();
  let imgsrc = "";
  switch(this.role) {
    case "fighter" :
      imgsrc = "https://raw.githubusercontent.com/Jerbil90/Rpg-Game/master/myFighterSymbol.png";
      break;
    case "knight" :
      imgsrc = "https://raw.githubusercontent.com/Jerbil90/Rpg-Game/master/myKnightSymbol.png";
      break;
    case "monster" :
      imgsrc = "https://raw.githubusercontent.com/Jerbil90/Rpg-Game/master/myMonsterSymbol.png";
      break;
    default:
      console.log("load image error, undetermined role");
      break;
  }
  this.image.src = imgsrc;
}
Unit.prototype.setPosition = function (x, y) {
  this.position.x = x;
  this.position.y = y;
}
Unit.prototype.loadStats = function() {
  this.baseStats = new Stats(this);
  this.equippedStats = new EquippedStats(this);
  this.combatStats = new CombatStats(this);
}

//This is the constructor function for the Hero class, this class is responsible for describing the User's playable characters
function Hero(name, role){
  Unit.call(this, name);
  this.role = role;
  this.isInParty = true;
  this.loadImage();
}
Hero.prototype = Object.create(Unit.prototype);
Hero.prototype.constructor = Hero;

//This is the constructor function for the Fighter class, this class is responsible for describing the Hero's of the role fighter
//Fighters are balanced heros, strong attacks make them useful damage dealers and they possess moderate defensive abilities
function Fighter(name){
  Hero.call(this, name, "fighter");
  this.load();
  this.specialMoveList.push(new PowerStrike());
  this.specialMoveList.push(new WindSlash());
  this.moveApplicabilityCheck();
}
Fighter.prototype = Object.create(Hero.prototype);
Fighter.prototype.constructor = Fighter;
Fighter.prototype.laodImage = function() {
  this.image = new Image();
  this.image.src = "https://raw.githubusercontent.com/Jerbil90/Rpg-Game/master/myFighterSymbol.png";
}

function Knight(name){
  Hero.call(this, name, "knight");
  this.load();
  this.specialMoveList.push(new GuardAlly());
  this.specialMoveList.push(new BlockOpponent());
  this.moveApplicabilityCheck();
}
Knight.prototype = Object.create(Hero.prototype);
Knight.prototype.constructor = Knight;
Knight.prototype.laodImage = function() {
  this.image = new Image();
  this.image.src = "https://raw.githubusercontent.com/Jerbil90/Rpg-Game/master/myKnightSymbol.png";
}

//This is the constructor function for the Monster class, this class is responsible for describing the enemy monsters that the player will encounter throughout the game
function Monster(name) {
  Unit.call(this, name);
  this.role = "monster";
  this.load();
  this.loadImage();
}
Monster.prototype = Object.create(Unit.prototype);
Monster.prototype.constructor = Monster;
Monster.prototype.laodImage = function() {
  this.image = new Image();
  this.image.src = "https://raw.githubusercontent.com/Jerbil90/Rpg-Game/master/myMonsterSymbol.png";
}
//This is the constructor for the wolf class, this class is responsible for describing an enemy wolf that may be encountered
function Wolf(){
  Monster.call(this, "Wolf");
  this.baseStats = new Stats(this);
}
Wolf.prototype = Object.create(Monster.prototype);
Wolf.prototype.constructor = Wolf;

function Equipment(name) {
  this.name = name;
  this.role = "equipment";
  this.load();
}
Equipment.prototype.load = function() {
  switch(this.name){
    case "Iron Sword":
      this.type = "sword";
      this.stats = new Stats(this);
      break;
    default:
      console.log("equipment load error, invalid name");
      break;
  }
}

function HealthBar(owner) {
  this.owner = owner;
  this.maxHP = owner.maxHP;
  this.remainingHP = owner.remainingHP;
  this.length = 40;
  this.height = 10;
  this.borderWidth = 4;
  this.potentialDamageLength = 0;
  this.remainingHPLength = this.legnth;
  this.position = {x: 0, y:0};
  this.isPotentiallyFullySlain = false;
  this.isPotentiallyFullyHealed = false;
}
HealthBar.prototype.calculateRemainingHPLength = function() {
  this.remainingHPLength = (this.remainingHP / this.maxHP) * this.length;
  if(this.remainingHPLength < 0) {
    this.remainingHPLength = 0;
  }
}
HealthBar.prototype.calculatePotentialDamage = function() {
  let owner = this.owner;
  let heroList = owner.surManager.heroManager.assetList;
  let potentialDamage = 0;
  this.isPotentiallyFullySlain = false;
  this.isPotentiallyFullyHealed = false;
  for(let i = 0 ; i < heroList.length ; i++) {
    if(heroList[i].currentlySelectedTarget == owner) {
      switch(heroList[i].currentlySelectedAction) {
        case "Attack":
          potentialDamage += heroList[i].combatStats.strength - owner.combatStats.toughness;
          break;
        case "Special":
        case "Item":
          if(heroList[i].currentlySelectedSpecialOrItem.isUsedOnOpponent) {
            potentialDamage += heroList[i].combatStats.strength-owner.combatStats.toughness;
          }
          else {
            if(heroList[i].currentlySelectedSpecialOrItem.healingPower != null) {
              potentialDamage -= heroList[i].currentlySelectedSpecialOrItem.healingPower;
            }
          }
          break;
        default:
          console.log("calculatePotentialDamage error, hero with unknown action detected");
          break;
      }
    }
  }
  //console.log(potentialDamage - this.remainingHP);
  if(potentialDamage>=this.remainingHP) {
    this.potentialDamageLength = this.remainingHPLength;
    this.isPotentiallyFullySlain = true;
    console.log("potentially fuly slain");
  }
  else if(this.remainingHP-potentialDamage>=this.maxHP && potentialDamage!=0){
    this.potentialDamageLength = -1*(this.length - this.remainingHPLength);
    this.isPotentiallyFullyHealed = true;
    console.log("potentially fully healed");
  }
  else {
    this.potentialDamageLength = (potentialDamage/this.maxHP) * this.length;
  }
}
HealthBar.prototype.update = function(gameTime, elapsedTime) {
  this.position = {x: this.owner.position.x, y: this.owner.position.y-this.height - 2*this.borderWidth};
  this.maxHP = this.owner.maxHP;
  this.remainingHP = this.owner.remainingHP;
  this.calculateRemainingHPLength();
  if(this.owner.surManager.battleState != null) {
    if(this.owner.surManager.battleState == "waiting for input") {
      this.calculatePotentialDamage();
    }
    else {
      this.potentialDamageLength = 0;
    }
  }
}
HealthBar.prototype.draw = function(ctx) {
  //first draw the background rect
  if(this.isPotentiallyFullyHealed) {
    ctx.fillStyle = "rgb(100, 200, 50)";
  }
  else if (this.isPotentiallyFullySlain) {
    ctx.fillStyle = "rgb(200, 50, 50)";
  }
  else {
    ctx.fillStyle = "rgb(139, 69, 19)";
  }

  ctx.fillRect(this.position.x, this.position.y, this.length + 2 * this.borderWidth, this.height + 2 * this.borderWidth);
  //then draw the empty HP bar
  ctx.fillStyle = "rgb(2164, 8, 8)";
  ctx.fillRect(this.position.x + this.borderWidth, this.position.y + this.borderWidth, this.length, this.height);
  //next draw the remaining hp
  ctx.fillStyle = "rgb(0, 200, 50)";
  ctx.fillRect(this.position.x + this.borderWidth, this.position.y + this.borderWidth, this.remainingHPLength, this.height);
  //ctx.fillRect(500, 400, 20, 20);
  //finally draw the indicated potential damage
  ctx.fillStyle = "rgb(244, 250, 0)";
  ctx.fillRect(this.position.x + this.borderWidth + this.remainingHPLength - this.potentialDamageLength, this.position.y+ this.borderWidth, this.potentialDamageLength, this.height);
  //ctx.fillRect(this.position.x + this.borderWidth + this.remainingHPLength - this.potentialDamageLength, this.position.y + this.borderLength, this.potentialDamageLength, this.height);
}

$(document).ready(function() {
  var game = new Game();
  game.loadUserData();
  game.startBattle();
  var canvas = document.getElementById('gameArea');
  canvas.addEventListener("mousemove", function(event) {
    var rect = canvas.getBoundingClientRect();
    let mousex = event.clientX - rect.left;
    let mousey = event.clientY - rect.top;
    game.battle.battleSurManager.setMouseDetails(mousex, mousey);
  });
  canvas.addEventListener("click", function(event) {
    game.battle.battleSurManager.battleMenuManager.handleClick();
  });

  var intervalFunction = setInterval(function() {
    game.update();

    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      game.draw(ctx);
    }
  }, 16.67);

});
