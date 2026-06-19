const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

let keys = {};
let room = "";
let id = Math.random().toString(36).substr(2, 6);

let me, enemy;

let running = false;

/* ---------------- PLAYER ---------------- */
function create(type){
return {
x:100,y:200,vx:0,vy:0,
w:50,h:80,
type,
face:1,
hp:0
};
}

/* ---------------- START ---------------- */
function start(type){

room = document.getElementById("room").value;
if(!room) return alert("Enter room code!");

me = create(type);

/* join room */
db.ref("rooms/"+room+"/players/"+id).set(me);

db.ref("rooms/"+room+"/players").on("value", snap=>{
let data = snap.val();
if(!data) return;

let list = Object.values(data);

enemy = list.find(p => p !== me) || create("brawler");
});

document.getElementById("menu").style.display="none";
running = true;
}

/* ---------------- INPUT FIX (IMPORTANT) ---------------- */
function bind(id,key){
const btn = document.getElementById(id);

btn.addEventListener("pointerdown",(e)=>{
e.preventDefault();
keys[key]=true;
});

btn.addEventListener("pointerup",(e)=>{
e.preventDefault();
keys[key]=false;
});

btn.addEventListener("pointercancel",()=>{
keys[key]=false;
});
}

bind("l","l");
bind("r","r");
bind("j","j");
bind("a","a");
bind("s","s");

/* ---------------- ATTACK ---------------- */
function hit(a,b){
if(!b) return 0;

let dist = Math.abs(a.x - b.x);

if(dist < 70){
let dmg = 10;

if(a.type==="brawler") dmg=15;
if(a.type==="sword") dmg=12;
if(a.type==="gunner") dmg=8;

b.vx += (a.x < b.x ? 1 : -1) * (5 + dmg/3);
b.vy -= 5;

return dmg;
}
return 0;
}

/* ---------------- LOOP ---------------- */
function update(){

if(!running) return;

/* movement */
if(keys.l){me.x -= 5; me.face=-1;}
if(keys.r){me.x += 5; me.face=1;}

if(keys.j && me.y>400) me.vy = -14;

/* attack */
if(keys.a){
hit(me,enemy);
keys.a=false;
}

/* special */
if(keys.s){
if(me.type==="gunner"){
// simple projectile
enemy.hp += 5;
}
if(me.type==="sword"){
me.x += me.face * 10;
}
if(me.type==="brawler"){
hit(me,enemy);
}
keys.s=false;
}

/* physics */
me.vy += 0.8;
me.x += me.vx;
me.y += me.vy;
me.vx *= 0.85;

/* ground */
if(me.y > 450){
me.y = 450;
me.vy = 0;
}

/* sync */
db.ref("rooms/"+room+"/players/"+id).set(me);

/* HUD SAFE */
let ehp = enemy ? enemy.hp : 0;

hud.innerText =
`YOU: ${Math.floor(me.hp||0)} | ENEMY: ${Math.floor(ehp)}`;
}

/* ---------------- DRAW ---------------- */
function draw(){

ctx.fillStyle="#05051a";
ctx.fillRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="cyan";
ctx.fillRect(me.x,me.y,50,80);

if(enemy){
ctx.fillStyle="red";
ctx.fillRect(enemy.x,enemy.y,50,80);
}
}

/* ---------------- LOOP ---------------- */
function loop(){
update();
draw();
requestAnimationFrame(loop);
}

loop();
