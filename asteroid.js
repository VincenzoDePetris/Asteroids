const FPS = 30; //set the frame per seconds
const FRICTION = 0.7; //friction coef of space (0=no friction and 1= lots of friction)
const GAME_LIVES = 3; //starting number of lives
const LASER_DIST = 0.4; //max distance laser can travel as fraction of screen width
const LASER_EXPLODE_DUR = 0.1; //Duration of the lasers explosion in seconds
const LASER_MAX = 10; //max number of lasers on screen at once
const LASER_SPD = 500; //speed of lasers in pixels per second
const ROIDS_JAG = 0.4; // jaggedness of the asteroids (0 = none, 1 = a lot)
const ROIDS_PTS_LGE = 20; // Points scored for a large asteroid
const ROIDS_PTS_MED = 50; // Points scored for a medium asteroid
const ROIDS_PTS_SML = 100; // Points scored for a small asteroid
const ROIDS_NUM = 1; //starting number of asteroids
const ROIDS_SIZE = 200; //starting size of asteroids in pixels
const ROIDS_SPD = 40; //max starting speed of asteroids in pixels/seconds
const ROIDS_VERT = 10; //number of vertices on each asteroid
const SAVE_KEY_SCORE = "highscore"; //Save key for local storage of high score
const SHIP_BLINK_DUR = 0.1; //Duration of the ship's blink during invisibility in seconds
const SHIP_EXPLODE_DUR = 0.3; //Duration of the explosion
const SHIP_INV_DUR = 3; //Duration of the ship's invisibility in seconds
const Ship_size = 50; //ship size in pixels
const SHIP_THRUST = 5; //acceleration of the ship in pixels per seconds
const TURN_SPEED = 360; //turn speed in degrees per second
const SHOW_BOUNDING = false; //show or hide collision bounding
const TEXT_FADE_TIME = 2.5; //text fade time in seconds
const TEXT_SIZE = 40; //text font height in pixels

var canv = document.getElementById("gameCanvas");
var ctx = canv.getContext("2d");

//game parameters
var level, lives, roids, score, scoreHigh, ship, text, textAlpha;
newGame();

// set up event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
  roids = [];
  var x, y;
  for (var i = 0; i < ROIDS_NUM + level; i++) {
    do {
      x = Math.floor(Math.random() * canv.width);
      y = Math.floor(Math.random() * canv.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
  }
}

function destroyAsteroid(index) {
  var x = roids[index].x;
  var y = roids[index].y;
  var r = roids[index].r;

  //split the asteroid in two if necessary
  if (r == Math.ceil(ROIDS_SIZE / 2)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    score += ROIDS_PTS_LGE;
  } else if (r == Math.ceil(ROIDS_SIZE / 4)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    score += ROIDS_PTS_MED;
  } else {
    score += ROIDS_PTS_SML;
  }

  //check high score
  if (score > scoreHigh) {
    scoreHigh = score;
    localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
  }

  //destroy the asteroid
  roids.splice(index, 1);

  //new level when no more asteroids
  if (roids.length == 0) {
    level++;
    newLevel();
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, color = "white") {
  (ctx.strokeStyle = color), (ctx.lineWidth = Ship_size / 10);
  ctx.beginPath();
  ctx.moveTo(
    x + (4 / 3) * ship.r * Math.cos(a),
    y - (4 / 3) * ship.r * Math.sin(a)
  );
  ctx.lineTo(
    x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a))
  );
  ctx.lineTo(
    x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a))
  );
  ctx.closePath();

  ctx.stroke();
}

function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}

function gameOver() {
  ship.dead = true;
  text = "GAME OVER";
  textAlpha = 1.0;
}

function keyDown(/** @type {keyBoardEvent} */ ev) {
  if (ship.dead) {
    return;
  }

  switch (ev.keyCode) {
    case 32: //space bar (shoot laser)
      shootLaser();
      break;
    case 37: //left arrow
      ship.rot = ((TURN_SPEED / 180) * Math.PI) / FPS;
      break;
    case 38: //up arrow
      ship.thrusting = true;
      break;
    case 39: //right arrow
      ship.rot = ((-TURN_SPEED / 180) * Math.PI) / FPS;
      break;
  }
}

function keyUp(/** @type {keyBoardEvent} */ ev) {
  if (ship.dead) {
    return;
  }

  switch (ev.keyCode) {
    case 32: //space bar (allow shooting again)
      ship.canShoot = true;
      break;
    case 37: //left arrow stop rotate
      ship.rot = 0;
      break;
    case 38: //up arrow
      ship.thrusting = false;
      break;
    case 39: //right arrow
      ship.rot = 0;
      break;
  }
}

function newAsteroid(x, y, r) {
  var lvlMult = 1 + 0.1 * level;
  var roid = {
    x: x,
    y: y,
    xv:
      ((Math.random() * ROIDS_SPD * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1), //speed of asteroids
    yv:
      ((Math.random() * ROIDS_SPD * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2, // in radians
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
    offs: [],
  };

  //create the vertex offsets array
  for (var i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
  }
  return roid;
}

function newGame() {
  level = 0;
  lives = GAME_LIVES;
  score = 0;
  scoreHigh = localStorage.getItem(SAVE_KEY_SCORE);
  //ship position
  ship = newShip();

  //Get the high score from local storage
  var scoreStr = (scoreHigh = localStorage.getItem(SAVE_KEY_SCORE));
  if (scoreStr == null) {
    scoreHigh = 0;
  } else {
    scoreHigh = parseInt(scoreStr);
  }

  newLevel();
}

function newLevel() {
  text = "Level " + (level + 1);
  textAlpha = 1.0;
  createAsteroidBelt();
}

function newShip() {
  return {
    x: canv.width / 2,
    y: canv.height / 2,
    r: Ship_size / 2, //radius of the ship
    a: (90 / 180) * Math.PI, //angle of the ship convert in radians
    blinkNumber: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    canShoot: true,
    dead: false,
    explodeTime: 0,
    lasers: [],
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0,
    },
  };
}

function shootLaser() {
  //create the laser obj
  if (ship.canShoot && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      //from the nose og the ship
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
      yv: (-LASER_SPD * Math.sin(ship.a)) / FPS,
      dist: 0,
      explodeTime: 0,
    });
  }

  //create the prevent for the shooting
  ship.canShoot = false;
}

function update() {
  var blinkOn = ship.blinkNumber % 2 == 0;
  var exploding = ship.explodeTime > 0;
  //draw space
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canv.width, canv.height);

  //thrust the ship
  if (ship.thrusting && !ship.dead) {
    ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;

    //draw the thruster
    if (!exploding && blinkOn) {
      ctx.fillStyle = "red";
      (ctx.strokeStyle = "yellow"), (ctx.lineWidth = Ship_size / 10);
      ctx.beginPath();
      ctx.moveTo(
        //left side
        ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
      );
      ctx.lineTo(
        //center side behind the ship
        ship.x - ship.r * ((5 / 3) * Math.cos(ship.a)),
        ship.y + ship.r * ((5 / 3) * Math.sin(ship.a))
      );
      ctx.lineTo(
        ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
  }

  //draw triangular ship
  if (!exploding) {
    if (blinkOn && !ship.dead) {
      drawShip(ship.x, ship.y, ship.a);
    }

    //handle blinking
    if (ship.blinkNumber > 0) {
      //reduce the blink time
      ship.blinkTime--;

      //reduce the blink number
      if (ship.blinkTime == 0) {
        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
        ship.blinkNumber--;
      }
    }
  } else {
    //draw the explosion
    ctx.fillStyle = "darkred";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
    ctx.fill();
  }

  if (SHOW_BOUNDING) {
    ctx.strokeStyle = "lime";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
    ctx.stroke();
  }

  //Draw the asteroids

  var x, y, r, a, vert, offs;
  for (var i = 0; i < roids.length; i++) {
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = Ship_size / 20;
    //get the asteroid properties
    x = roids[i].x;
    y = roids[i].y;
    r = roids[i].r;
    a = roids[i].a;
    vert = roids[i].vert;
    offs = roids[i].offs;
    // draw a path
    ctx.beginPath();
    ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));

    //draw the polygon
    for (var j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
        y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert)
      );
    }
    ctx.closePath();
    ctx.stroke();

    if (SHOW_BOUNDING) {
      ctx.strokeStyle = "lime";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false);
      ctx.stroke();
    }
  }

  //draw the lasers
  for (var i = 0; i < ship.lasers.length; i++) {
    if (ship.lasers[i].explodeTime == 0) {
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[i].x,
        ship.lasers[i].y,
        Ship_size / 15,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
    } else {
      //draw the explosion
      ctx.fillStyle = "orangered";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[i].x,
        ship.lasers[i].y,
        ship.r * 0.75,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();

      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[i].x,
        ship.lasers[i].y,
        ship.r * 0.5,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();

      ctx.fillStyle = "pink";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[i].x,
        ship.lasers[i].y,
        ship.r * 0.25,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
    }
  }

  //draw the game  text
  if (textAlpha >= 0) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
    ctx.font = TEXT_SIZE + "px dejavu sans mono";
    ctx.fillText(text, canv.width / 2, canv.height * 0.75);
    textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
  } else if (ship.dead) {
    newGame();
  }

  //draw the lives
  var lifeColor;
  for (var i = 0; i < lives; i++) {
    lifeColor = exploding && i == lives - 1 ? "red" : "white";
    drawShip(
      Ship_size + i * Ship_size * 1.2,
      Ship_size,
      0.5 * Math.PI,
      lifeColor
    );
  }

  //draw the score

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = TEXT_SIZE + "px dejavu sans mono";
  ctx.fillText(score, canv.width - Ship_size / 2, Ship_size);

  //draw the high score

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = TEXT_SIZE + "px dejavu sans mono";
  ctx.fillText("BEST " + scoreHigh, canv.width / 2, Ship_size);

  //detect laser hits on asteroids
  var ax, ay, ar, lx, ly;
  for (var i = roids.length - 1; i >= 0; i--) {
    //grab the asteroid prop
    ax = roids[i].x;
    ay = roids[i].y;
    ar = roids[i].r;

    // loop over the lasers
    for (var j = ship.lasers.length - 1; j >= 0; j--) {
      //grab the laser prop
      (lx = ship.lasers[j].x), (ly = ship.lasers[j].y);

      //detect hits
      if (
        ship.lasers[j].explodeTime == 0 &&
        distBetweenPoints(ax, ay, lx, ly) < ar
      ) {
        //remove the laser

        //destroy the asteroid and activate the laser explosion
        destroyAsteroid(i);
        ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);

        break;
      }
    }
  }

  // check for asteroid collision
  if (!exploding) {
    if (ship.blinkNumber == 0 && !ship.dead) {
      for (var i = 0; i < roids.length; i++) {
        if (
          distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
          ship.r + roids[i].r
        ) {
          explodeShip();
          destroyAsteroid(i);
          break;
        }
      }
    }

    //rotate ship
    ship.a += ship.rot;

    //move ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  } else {
    ship.explodeTime--;

    if (ship.explodeTime == 0) {
      lives--;
      if (lives == 0) {
        gameOver();
      } else {
        ship = newShip();
      }
    }
  }

  // pacman effect
  if (ship.x < 0 - ship.r) {
    ship.x = canv.width + ship.r;
  } else if (ship.x > canv.width + ship.r) {
    ship.x = 0 - ship.r;
  } //x pacman effect

  if (ship.y < 0 - ship.r) {
    ship.y = canv.height + ship.r;
  } else if (ship.y > canv.height + ship.r) {
    ship.y = 0 - ship.r;
  } //y pacman effect

  //move the laser
  for (var i = ship.lasers.length - 1; i >= 0; i--) {
    //check distance travelled
    if (ship.lasers[i].dist > LASER_DIST * canv.width) {
      ship.lasers.splice(i, 1);
      continue;
    }

    //handle the explosion
    if (ship.lasers[i].explodeTime > 0) {
      ship.lasers[i].explodeTime--;

      //destroy the laser after the duration
      if (ship.lasers[i].explodeTime == 0) {
        ship.lasers.splice(i, 1);
        continue;
      }
    } else {
      //move the laser
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;

      //calculate the distance travelled
      ship.lasers[i].dist += Math.sqrt(
        Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)
      );
    }

    //handle edge of screen
    if (ship.lasers[i].x < 0) {
      ship.lasers[i].x = canv.width;
    } else if (ship.lasers[i].x > canv.width) {
      [(ship.lasers[i].x = 0)];
    }

    if (ship.lasers[i].y < 0) {
      ship.lasers[i].y = canv.height;
    } else if (ship.lasers[i].y > canv.height) {
      [(ship.lasers[i].y = 0)];
    }
  }

  //move the asteroid
  for (var i = 0; i < roids.length; i++) {
    roids[i].x += roids[i].xv;
    roids[i].y += roids[i].yv;

    //handle edge of screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canv.width + roids[i].r;
    } else if (roids[i].x > canv.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r;
    }

    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canv.height + roids[i].r;
    } else if (roids[i].y > canv.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r;
    }
  }

  //centre dot
  ctx.fillStyle = "red";
  //ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
}
