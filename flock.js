document.oncontextmenu = function() { return false; }

let flock, herd;

function setup() {
  createCanvas(1040, 480);
  createP("Click and drag the left mouse key to generate new bats.");
  createP("Click right mouse key to create blood pools.");
  herd = new Group();
  caves = new Group();
  caves.addBoid(new Cave(random(50, width -50), random(50, height - 50), 100, 100));
  
  flock = new Flock(herd, caves);
  // Add an initial set of boids into the system
  for (let i = 0; i < 1; i++) {
    let b = new Boid(width / 2,height / 2);    
    flock.addBoid(b);
  }
}

function draw() {
  background('tan');
  
  flock.run();
}

// Add a new boid into the System
function mouseDragged() {
  if (mouseButton == LEFT)
    flock.addBoid(new Boid(mouseX, mouseY));
}

function mousePressed(){
  if (mouseButton == RIGHT){
    if (mouseX > 0 && mouseX < width &&
        mouseY > 0 && mouseY < height)
      herd.addBoid(new Bait(mouseX, mouseY));
  }
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// class to prevent boiler plate
class Group{
  constructor() {
    // An array for all the baits
    this.boids = []; // Initialize the array
    this.ded_buffer = [] // Dead Buffer
  }

  addBoid(b) {
    this.boids.push(b);
  }

  removeBoid(i){
    if (i != -1)  
      this.boids.splice(i, 1);
  }

  run(boids) {
    for (let i = 0; i < this.boids.length; i++) {
      this.boids[i].run(boids);  // Passing the entire list of boids to each bait individually
      if (this.boids[i].isDead()){ // Check if eaten up
        this.ded_buffer.push(i);
      }
    }

    this.garbageCollect();
  }

  garbageCollect(){
    for (let i = 0; i < this.ded_buffer.length; i++) {
      this.removeBoid(this.ded_buffer[i]);
    }

    if (this.ded_buffer.length > 0) // clear the buffer
      this.ded_buffer.splice(0, this.ded_buffer.length); 
  }

}
// Bait Object
// Just sits there, waiting to be eaten.

const INITIAL_HEALTH = 5000;
const BAIT_RADIUS = 50;
class Bait {
  constructor(x, y){
    this.position = createVector(x, y);
    this.health = INITIAL_HEALTH;
    this.r = BAIT_RADIUS;
    this.sx = [];
    this.sy = [];
    this.sr = [];


    let n = floor(random(3));
    for (let i = 0; i < n; i++){
      this.sx.push(random(this.position.x - this.r, this.position.x + this.r));
      this.sy.push(random(this.position.y - this.r, this.position.y + this.r));
      this.sr.push(random(10, BAIT_RADIUS));
    }
  }

  run(boids) {
    this.update(boids);
    // this.borders();
    this.render();
  }

  isTouching(dist){
    return dist <= BAIT_RADIUS;
  }

  isDead(){
    return this.health <= 0;
  }

  render(){
    push();
    noStroke();
    fill('#C70039');
    for (let i = 0; i < this.sx.length; i++){
      circle(this.sx[i], this.sy[i], this.sr[i]);
    }
    circle(this.position.x, this.position.y, this.r);
    pop();
  }

  update(boids){
    for (let i = 0; i < boids.length; i++){
      let d = p5.Vector.dist(this.position, boids[i].position);
      if (this.isTouching(d)){
        this.health -= 1;
        this.r -= this.r/INITIAL_HEALTH;
        for (let i = 0; i < this.sr.length; i++){
          this.sr[i] -= this.sr[i]/INITIAL_HEALTH;
        }
        if (frameCount % 3 == 0) boids[i].hunger += 1;
      }
    }
  }
}

// Cave object (ITS A BAT HOUSE NOW)
// Kinda like the bait... but houses the bats. Is basically a queue

class Cave extends Group{
  constructor(x, y, w, h) {
    super();
    this.position = createVector(x, y); // Center
    this.w = w;
    this.h = h;
  }


  isTouching(boid){
    return (this.position.x -this.w/2) < boid.position.x && boid.position.x < (this.position.x + this.w/2) &&
            (this.position.y -this.h/2) < boid.position.y && boid.position.y < (this.position.y + this.h/2);
  }

  render() {
    push();
    noStroke();
    fill('#777777');
    
    let s = this.w/10;
    let sx = this.position.x - this.w/2;
    rect(this.position.x - this.w/2, this.position.y - this.h/2, this.w, this.h/2);
    fill('#999999');
    rect(this.position.x - this.w/2, this.position.y, this.w, this.h/2);
    
    
    stroke("#AAAAAA");
    for (let i = 0; i < 9; i++){
      sx += s;
      line(sx, this.position.y - this.h/2, sx, this.position.y + this.h/2);
    }
  



    pop();
  }

  run(boids) {
    for (let i = 0; i < boids.length; i++){ // AInt work... looks weird....
      //console.log(this.isTouching(boids[i]));
      if (this.isTouching(boids[i])){ 
        if (boids[i].isSleepy()){ // Go sleep if sleepy
          boids[i].isSleeping = true;
          boids[i].velocity.mult(0.1);
          //this.boids.push(boids[i]);
        } else {
          boids[i].isSleeping = false;
        }
      }
    }
  }
}

// Flock object
// Does very little, simply manages the array of all the boids

class Flock extends Group{
  constructor(herd, caves) {
    // An array for all the boids
    super();
    this.herd = herd;
    this.caves = caves;
  }

  run() {
    this.herd.run(this.boids);

    for (let c of this.caves.boids){
      c.run(this.boids);
    }
    
    for (let i = 0; i < this.boids.length; i++) {

      this.boids[i].run(this.boids, this.herd.boids, this.caves.boids);  // Passing the entire list of boids to each boid individually
      if (this.boids[i].isDead()){ // Check if dead
        this.ded_buffer.push(this.boids[i]);
      }
    }

    this.garbageCollect();
    
    for (let c of this.caves.boids){
      c.render(this.boids);
    }

  }
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) { // Bat
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 3.0;
  this.maxspeed = 15;    // Maximum speed
  this.maxforce = 0.1; // Maximum steering force
  this.flap = floor(random(0, 6));
  this.hunger = floor(random(60, 99));
  this.isSleeping = false;
}

Boid.prototype.isSleepy = function(){
  return this.hunger > 75;
}

// Boid.prototype.isHungry = function(){
//   return this.hunger < 55;
// }

Boid.prototype.isDead = function(){
  return this.hunger <= 0;
}

Boid.prototype.run = function(boids, baits, caves) {
  this.flock(boids, baits, caves); 
  this.render();

  this.update();
}

Boid.prototype.applyForce = function(force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids, baits, caves) {
  let sep = this.separate(boids);   // Separation
  let ali = this.align(boids);      // Alignment
  let coh = this.cohesion(boids);   // Cohesion
  let avo = this.avoidBorders(boids);      // Avoid walls
  let att = (this.isSleepy()) ? this.attraction(caves) : this.attraction(baits); // Full bats go back to roost in cave
  // Arbitrarily weight these forces
  sep.mult(12.0);
  ali.mult(2.0);
  coh.mult(3.0);
  avo.mult(1.0);
  att.mult(10);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
  this.applyForce(avo);
  this.applyForce(att);
}

// Method to update location
Boid.prototype.update = function() {
  
    //console.log(this.velocity)
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
  
  if (frameCount % 20 == 0) this.hunger -= 1; 
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
  let desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

let WINGSPAN = 32;
let LENGTH = WINGSPAN/2;

let BODY_WIDTH = WINGSPAN/8;
let WING_SEC = (WINGSPAN - BODY_WIDTH)/4

let top_y = [LENGTH*5/16, LENGTH*5/32, LENGTH/4]
let bot_y = [LENGTH*15/32, LENGTH*3/8, LENGTH*5/16]


let x = 0;
let y = 0; 
let cx = 0;
let cy = 0;
let s = -WINGSPAN/2;
function flight(p){
  fill(0);
  noStroke();
  beginShape();
  x = s;
  y = 0;
  for (let i = 0; i < 6; i++){
    if (i == 3) x += BODY_WIDTH;
    else if (i > 0) x += WING_SEC;

    if (i < 3) y = top_y[2-i];
    else y = top_y[i - 3];
    
    vertex(x, y)
    if (i == 2){
      vertex(x+BODY_WIDTH/6, top_y[2]);
      bezierVertex(x + BODY_WIDTH/3, y, x + BODY_WIDTH*2/3, y,x + BODY_WIDTH*5/6, LENGTH/4);
    }
  }
  x = s;
  bezierVertex(x+WINGSPAN - WING_SEC, top_y[0], x+WINGSPAN - 2*WING_SEC, top_y[0]*2, x+WINGSPAN - 2*WING_SEC, LENGTH*3/4)
  bezierVertex(x+WINGSPAN - 2*WING_SEC, top_y[0]*2, x+2*WING_SEC, top_y[0]*2, x+2*WING_SEC, LENGTH*3/4);
  bezierVertex(x+2*WING_SEC, top_y[0]*2, x+WING_SEC, top_y[0], x, top_y[2]);
  endShape(CLOSE);
}


function idle(p){
  fill(0);
  x = 2 * WING_SEC+s;
  y = top_y[0];
  
  noStroke();
  beginShape();

  // top
  if (p == 1) vertex(x - WING_SEC, top_y[0]/2);
  vertex(x, top_y[0]);
  vertex(x + BODY_WIDTH/6, LENGTH/4);
  bezierVertex(x + BODY_WIDTH/3, y, x + BODY_WIDTH*2/3, y,x + BODY_WIDTH*5/6, LENGTH/4);
  vertex(x+BODY_WIDTH, y);
  if (p == 1) vertex(x + BODY_WIDTH + WING_SEC, top_y[0]/2);

  // bottom
  y = LENGTH*3/4;
  vertex(x + BODY_WIDTH, y);
  bezierVertex(x + BODY_WIDTH, top_y[0]*2, x, top_y[0]*2, x, LENGTH*3/4)

  endShape(CLOSE);
}


let cycle = [idle, idle, flight];
Boid.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  let theta = this.velocity.heading() + radians(90);
  fill(127);
  stroke(200);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  if (!this.isSleeping){
    if (this.flap < cycle.length){
      cycle[this.flap](this.flap);
    } else {
      cycle[(cycle.length*2 - 1) - this.flap]((cycle.length*2 - 1) - this.flap);
    }
    this.flap = (this.flap + 1) % (cycle.length*2);
  }else {
    rotate(90);
    idle(0);
  }
  pop();

}

// Wraparound
Boid.prototype.borders = function() {
  if (this.position.x < -this.r)  this.position.x = width + this.r;
  if (this.position.y < -this.r)  this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
  let desiredseparation = WINGSPAN;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0,0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}

Boid.prototype.avoidBorders = function(boids) {
  let steer = createVector(0, 0);
  if (this.position.x <= 100) {
    steer.add(createVector(0.5, 0));
  }
  if (this.position.x >width -100) { // width of canvas
    steer.add(createVector(-0.5, 0));
  }
  if (this.position.y <= 100) {
    steer.add(createVector(0, 0.5));
  }
  if (this.position.y > height -100) { // height of canvas
    steer.add(createVector(0, -0.5));
  }

  return steer;
}

// Attraction
// Steer towards the nearest bait.
Boid.prototype.attraction = function(baits) {
  let neighbordist = (this.isSleepy()) ? width/2 : 200; // Go home if sleepy. Otherwise, hunt.
  let sum = createVector(0, 0);   // Start with empty vector to store nearest location
  let curr_d = width*2;
  for (let i = 0; i < baits.length; i++) {
    let d = p5.Vector.dist(this.position,baits[i].position);
    if ((d > 0) && (d < neighbordist) && (d < curr_d)) {
      sum = baits[i].position; // Add location
      curr_d = d;
    }
  }
  if (curr_d < width*2) {
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}
