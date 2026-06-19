const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

let room = "";
let id = Math.random().toString(36).substr(2,5);

let keys = {};
let me = {x:100,y:200,hp:0,type:"sword"};
let enemy = {x:300,y:200,hp:0};

let running = false;

/* JOIN ROOM */
function join(type){
room = document.getElementById("room").value;
if(!room) return alert("Enter room code!");

me.type = type;

db.ref("rooms/"+room+"/players/"+id).set(me);

db.ref("rooms/"+room+"/players").on("value",snap=>{
let data = snap.val();
if(!data) return;

let players = Object.values(data);

if(players.length > 1){
enemy = players.find(p=>p !== me) || enemy;
}
});

document.getElementById("menu").style.display="none";
running = true;
}

/* INPUT */
function bind(id,key){
document.getElementById(id).ontouchstart=()=>keys[key]=true;
document.getElementById(id).ontouchend=()=>keys[key]=false;
}

bind("l","l");
bind("r","r");
bind("j","j");
bind("a","a");

/* UPDATE FIREBASE */
function sync(){
db.ref("rooms/"+room+"/players/"+id).set(me);
}

/* ATTACK */
function attack(){
let dist = Math.abs(me.x - enemy.x);

if(dist < 70){
enemy.hp += 10;
enemy.x += (me.x < enemy.x ? 20 : -20);
}
}

/* LOOP */
function loop(){

if(!running){
requestAnimationFrame(loop);
return;
}

/* MOVE */
if(keys.l) me.x -= 5;
if(keys.r) me.x += 5;
if(keys.j) me.y -= 5;

/* ATTACK */
if(keys.a){
attack();
keys.a = false;
}

/* DRAW */
ctx.fillStyle="#050518";
ctx.fillRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="cyan";
ctx.fillRect(me.x,me.y,50,80);

ctx.fillStyle="red";
ctx.fillRect(enemy.x,enemy.y,50,80);

/* SYNC */
sync();

requestAnimationFrame(loop);
}

loop();
