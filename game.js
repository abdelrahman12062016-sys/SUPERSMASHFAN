const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

canvas.width=innerWidth;
canvas.height=innerHeight;

let room="",id=Math.random().toString(36).substr(2,5);

let keys={};
let running=false;

let me,enemy;

let pStock=3,cStock=3;
let pPercent=0,cPercent=0;

let projectiles=[];

/* ---------------- CREATE FIGHTER ---------------- */
function create(type){
return {
x:100,y:200,vx:0,vy:0,
w:50,h:80,
type,
face:1,
onGround:false
};
}

/* ---------------- START ---------------- */
function start(type){
room=document.getElementById("room").value;
if(!room)return alert("Enter room code!");

me=create(type);

db.ref("rooms/"+room+"/p/"+id).set(me);

db.ref("rooms/"+room+"/p").on("value",snap=>{
let data=snap.val();
if(!data)return;

let list=Object.values(data);
enemy=list.find(p=>p!==me) || create("brawler");
});

document.getElementById("menu").style.display="none";
running=true;
}

/* ---------------- INPUT ---------------- */
function bind(id,k){
document.getElementById(id).ontouchstart=()=>keys[k]=true;
document.getElementById(id).ontouchend=()=>keys[k]=false;
}

bind("l","l");
bind("r","r");
bind("j","j");
bind("a","a");
bind("s","s");

/* ---------------- COMBAT ---------------- */
function hit(a,b){
let dist=Math.abs(a.x-b.x);
if(dist<70){

let dmg=10;
if(a.type==="brawler")dmg=15;
if(a.type==="sword")dmg=12;
if(a.type==="gunner")dmg=8;

b.vx+=(a.x<b.x?1:-1)*(6+dmg/3);
b.vy-=5;

return dmg;
}
return 0;
}

function shoot(){
projectiles.push({
x:me.x,
y:me.y,
vx:me.face*10
});
}

/* ---------------- UPDATE ---------------- */
function update(){
if(!running)return;

/* move */
if(keys.l)me.x-=5,me.face=-1;
if(keys.r)me.x+=5,me.face=1;

if(keys.j && me.y>400)me.vy=-15;

/* attack */
if(keys.a){
pPercent+=hit(me,enemy);
keys.a=false;
}

/* special */
if(keys.s){
if(me.type==="gunner")shoot();
if(me.type==="sword")me.x+=me.face*10;
if(me.type==="brawler")pPercent+=hit(me,enemy);
keys.s=false;
}

/* physics */
me.vy+=0.8;
me.x+=me.vx;
me.y+=me.vy;
me.vx*=0.85;

/* ground */
if(me.y>450){me.y=450;me.vy=0;}

/* projectiles */
projectiles.forEach(p=>{
p.x+=p.vx;
if(enemy && Math.abs(p.x-enemy.x)<40){
cStock--;
}
});

/* reset */
if(me.y>700)pStock--;
if(enemy && enemy.y>700)cStock--;

/* sync */
db.ref("rooms/"+room+"/p/"+id).set(me);

/* hud */
hud.innerText=
`YOU ${Math.floor(pPercent)}% | ENEMY ${Math.floor(cPercent)}% | STOCK ${pStock}-${cStock}`;

/* reset match */
if(pStock<=0||cStock<=0){
pStock=3;cStock=3;
pPercent=0;cPercent=0;
}
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

ctx.fillStyle="yellow";
projectiles.forEach(p=>{
ctx.fillRect(p.x,p.y,10,5);
});
}

/* ---------------- LOOP ---------------- */
function loop(){
update();
draw();
requestAnimationFrame(loop);
}

loop();
