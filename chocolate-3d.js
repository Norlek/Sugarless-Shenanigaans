/* SUGARLESS SHENANIGANS — LIQUID GLASS CHOCOLATE (three.js 0.160)
   Replaces your inline <script type="module"> 3D block.
   Keep the importmap. Add:  <script type="module" src="chocolate-3d.js"></script> */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function mulberry32(a){return()=>{a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const rng = mulberry32(20260519);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const elastic=x=>x<=0?0:x>=1?1:Math.pow(2,-9*x)*Math.sin((x*9-0.75)*(2*Math.PI/3))+1;

/* ---------- scene / renderer ---------- */
const canvas = document.getElementById('chocolate');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(31,1,0.1,100);
const DEFAULT_CAM = new THREE.Vector3(4.7,4.4,7.6);
camera.position.copy(DEFAULT_CAM);
const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room,0.03).texture;
scene.environmentIntensity = 1.0;
room.dispose(); pmrem.dispose();

const controls = new OrbitControls(camera,canvas);
controls.enableDamping=true; controls.dampingFactor=0.055; controls.enablePan=false;
controls.minDistance=4.6; controls.maxDistance=12.5; controls.autoRotate=true; controls.autoRotateSpeed=0.5;
controls.target.set(0,-0.05,0);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0xffe9cc,0x180703,1.4));
const key = new THREE.DirectionalLight(0xffd7a8,3.8);
key.position.set(4.5,8.2,5.8); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{near:1,far:25,left:-7.5,right:7.5,top:7.5,bottom:-7.5});
key.shadow.bias=-0.0004; key.shadow.normalBias=0.025; scene.add(key);
const rim = new THREE.DirectionalLight(0xff9a52,2.5); rim.position.set(-6.5,3.8,3.2); scene.add(rim);
const back = new THREE.DirectionalLight(0xffe2be,4.2); back.position.set(0.8,4.5,-7.2); scene.add(back);
const fill = new THREE.PointLight(0xffd5a6,26,20,1.6); fill.position.set(0.5,2.4,6.8); scene.add(fill);
const cursorLight = new THREE.PointLight(0xffb36b,0,6,1.8); scene.add(cursorLight);

/* ---------- procedural PBR maps ---------- */
function makeMaps(){
  const S=1024, mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')]};
  const [cc,c]=mk(S,S); const g=c.createLinearGradient(0,0,S,S);
  g.addColorStop(0,'#492214');g.addColorStop(.5,'#3b190e');g.addColorStop(1,'#4d2516'); c.fillStyle=g;c.fillRect(0,0,S,S);
  for(let i=0;i<160;i++){c.save();c.translate(rng()*S,rng()*S);c.rotate((rng()-.5)*.45);
    c.fillStyle=rng()>.5?'rgba(138,76,42,.035)':'rgba(15,5,2,.045)';c.beginPath();c.ellipse(0,0,90+rng()*260,14+rng()*42,0,0,6.283);c.fill();c.restore();}
  for(let i=0;i<48000;i++){c.fillStyle=rng()>.52?'rgba(218,158,102,.028)':'rgba(10,3,1,.045)';const r=.4+rng()*1.9;c.fillRect(rng()*S,rng()*S,r,r);}
  const [rc,r]=mk(S,S); r.fillStyle='rgb(52,52,52)';r.fillRect(0,0,S,S);
  for(let i=0;i<36000;i++){const v=34+rng()*48|0;r.fillStyle=`rgb(${v},${v},${v})`;const s=.8+rng()*2.8;r.fillRect(rng()*S,rng()*S,s,s);}
  const [bc,b]=mk(512,512); b.fillStyle='rgb(128,128,128)';b.fillRect(0,0,512,512);
  for(let i=0;i<32000;i++){const v=106+rng()*46|0;b.fillStyle=`rgb(${v},${v},${v})`;const s=.6+rng()*2;b.fillRect(rng()*512,rng()*512,s,s);}
  const an=renderer.capabilities.getMaxAnisotropy();
  const T=(cv,srgb)=>{const t=new THREE.CanvasTexture(cv);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.anisotropy=an;return t};
  return{colorMap:T(cc,true),roughnessMap:T(rc),bumpMap:T(bc)};
}
const {colorMap,roughnessMap,bumpMap}=makeMaps();

/* ---------- liquid vertex shaders ---------- */
const U={uTime:{value:0}};
const ripples=[0,1,2,3].map(()=>new THREE.Vector4(0,0,0,-99));   // x, strength, z, startTime
const R={value:ripples};
let rIdx=0;
function addRipple(p,s=1){ripples[rIdx].set(p.x,s,p.z,U.uTime.value);rIdx=(rIdx+1)%4;}

/* wet-chocolate surface: pointer ripples + slow liquid sway */
function liquify(mat,amp){
  mat.customProgramCacheKey=()=>'liq'+amp;
  mat.onBeforeCompile=sh=>{
    sh.uniforms.uTime=U.uTime; sh.uniforms.uR=R;
    sh.vertexShader='uniform float uTime;uniform vec4 uR[4];\n'+sh.vertexShader.replace('#include <begin_vertex>',`
      vec3 transformed=vec3(position);
      vec3 wp=(modelMatrix*vec4(position,1.)).xyz;
      for(int i=0;i<4;i++){
        float age=uTime-uR[i].w;
        if(age>0.&&age<4.){
          float d=distance(wp.xz,uR[i].xz);
          float w=sin(d*8.-age*9.)*exp(-age*1.5)*exp(-d*.9)*uR[i].y;
          transformed+=normal*w*.07; transformed.y+=w*.05;
        }
      }
      transformed.y+=sin(wp.x*1.7+uTime*1.3)*cos(wp.z*1.9+uTime)*.012*${amp.toFixed(2)};`);
  };
}

/* morphing liquid-glass blob: analytic normal keeps highlights smooth */
function morph(mat,amp){
  mat.customProgramCacheKey=()=>'morph'+amp;
  mat.onBeforeCompile=sh=>{
    sh.uniforms.uTime=U.uTime;
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader
    .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
      float t=uTime*.9; vec3 q=position*4.;
      vec3 gr=vec3(cos(q.x*1.1+t)*1.1+cos(q.y*2.1-t*1.3)*.5, cos(q.y*1.3+t*1.2)*1.3+cos(q.z*1.7+t)*.5, cos(q.z*1.2-t)*1.2+cos(q.x*2.3+t*.8)*.5);
      objectNormal=normalize(objectNormal-${amp.toFixed(2)}*(gr-dot(gr,objectNormal)*objectNormal));`)
    .replace('#include <begin_vertex>',`vec3 transformed=position+normal*${amp.toFixed(2)}*(sin(q.x*1.1+t)+sin(q.y*1.3+t*1.2)+sin(q.z*1.2-t)+.5*sin(q.x*2.3+t*.8+q.y*2.1));`);
  };
}

/* ---------- materials ---------- */
const chocShared={map:colorMap,roughnessMap,bumpMap,metalness:0};
const squareMat=new THREE.MeshPhysicalMaterial({...chocShared,color:0x4b2214,bumpScale:.014,roughness:.2,clearcoat:1,clearcoatRoughness:.05,sheen:.6,sheenColor:new THREE.Color(0xc98a52),sheenRoughness:.4,envMapIntensity:1.5});
const baseMat=new THREE.MeshPhysicalMaterial({...chocShared,color:0x33140b,bumpScale:.016,roughness:.26,clearcoat:.9,clearcoatRoughness:.1,envMapIntensity:1.2});
const liquidMat=new THREE.MeshPhysicalMaterial({color:0x3c180c,roughness:.08,clearcoat:1,clearcoatRoughness:.03,ior:1.52,envMapIntensity:1.7});
const glassMat=new THREE.MeshPhysicalMaterial({color:0xffe0b0,transmission:1,thickness:1.6,ior:1.46,roughness:.03,metalness:0,
  clearcoat:1,clearcoatRoughness:.02,iridescence:1,iridescenceIOR:1.35,iridescenceThicknessRange:[120,520],
  attenuationColor:new THREE.Color(0xc4682a),attenuationDistance:1.4,envMapIntensity:1.8,specularIntensity:1});
liquify(squareMat,1); liquify(baseMat,.6); morph(glassMat,.11);

/* ---------- bar ---------- */
const bar=new THREE.Group(); scene.add(bar);
const slab=new THREE.Mesh(new RoundedBoxGeometry(5.42,.36,3.72,10,.14),baseMat);
slab.position.y=-.14; slab.castShadow=slab.receiveShadow=true; bar.add(slab);
const bed=new THREE.Mesh(new RoundedBoxGeometry(5.16,.08,3.46,6,.03),new THREE.MeshStandardMaterial({color:0x220c06,roughness:.4}));
bed.position.y=.04; bar.add(bed);

function pillow(w,h,d){
  const g=new RoundedBoxGeometry(w,h,d,12,.095),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    if(y>.02){const nx=Math.min(1,Math.abs(x)/(w/2)),nz=Math.min(1,Math.abs(z)/(d/2));p.setY(i,y+Math.max(0,1-(nx*nx*.55+nz*nz*.55))*.055);}}
  g.computeVertexNormals(); return g;
}
const sqGeom=pillow(1.16,.32,1.01);
function markTex(txt){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  x.textAlign='center';x.textBaseline='middle';x.font='600 84px "Playfair Display",Georgia,serif';
  x.fillStyle='rgba(14,4,2,.65)';x.fillText(txt,130,132);x.fillStyle='rgba(235,194,136,.45)';x.fillText(txt,128,128);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const markMat=new THREE.MeshBasicMaterial({map:markTex('SS'),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});

const squares=[],decals=[];
for(let ix=0;ix<4;ix++)for(let iz=0;iz<3;iz++){
  const px=(ix-1.5)*1.27,pz=(iz-1)*1.12;
  const sq=new THREE.Mesh(sqGeom,squareMat);
  sq.position.set(px,.21,pz); sq.castShadow=sq.receiveShadow=true;
  sq.userData={px,pz,idx:squares.length,delay:(ix+iz*.8)*.09,phase:ix*.7+iz*1.1,pop:0,popV:0};
  bar.add(sq); squares.push(sq);
  if((ix===1||ix===2)&&iz===1){
    const d=new THREE.Mesh(new THREE.PlaneGeometry(.46,.46),markMat);
    d.rotation.x=-Math.PI/2; d.position.set(px,.426,pz); d.userData.sq=sq; bar.add(d); decals.push(d);
  }
}
const collar=new THREE.Mesh(new RoundedBoxGeometry(5.46,.11,3.76,8,.055),liquidMat);
collar.position.y=-.27; collar.castShadow=true; bar.add(collar);

/* ---------- melting droplets (glass-clear amber + chocolate) ---------- */
const dropG=new THREE.LatheGeometry([[.001,.14],[.032,.08],[.068,.01],[.076,-.05],[.052,-.12],[.001,-.17]].map(a=>new THREE.Vector2(...a)),28);
const drops=[];
for(let i=0;i<18;i++){
  const m=new THREE.Mesh(dropG,i%4===3?glassMat:liquidMat); m.castShadow=true;
  const front=i<12;
  m.userData={x:front?-2.4+((i*.47)%4.8):(i%2?2.71:-2.71),z:front?1.85+(rng()-.5)*.06:-1.35+((i*.54)%2.7),
    topY:-.28,speed:.26+rng()*.2,phase:rng(),base:.72+rng()*.45,landed:false};
  bar.add(m); drops.push(m);
}

/* ---------- melt pool + landing rings ---------- */
const pool=new THREE.Mesh(new THREE.CircleGeometry(3.3,96),new THREE.MeshPhysicalMaterial({color:0x2a0f07,roughness:.05,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1.6}));
pool.rotation.x=-Math.PI/2; pool.position.y=-2.13; pool.scale.set(1.15,.8,1); pool.receiveShadow=true; scene.add(pool);

/* ---------- liquid glass blobs + chocolate shards ---------- */
const floaters=new THREE.Group(); scene.add(floaters);
const cfg=[[-3.35,.85,1.35,.34,1],[3.25,.65,1.15,.3,1],[-2.85,-.95,1.85,.24,1],[2.95,-.82,-1.45,.32,1],[-3.65,-.25,-1.2,.26,1],
 [2.15,1.45,-1.95,.22,0],[-1.45,1.55,-2.25,.2,0],[3.65,.05,-.15,.19,1],[-1.95,-1.35,2.25,.17,0],[1.35,-1.42,2.35,.2,1]];
const shardG=r=>{const g=new THREE.DodecahedronGeometry(r,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const n=1+(rng()-.5)*.5;p.setXYZ(i,p.getX(i)*n,p.getY(i)*n*.85,p.getZ(i)*n);}g.computeVertexNormals();return g};
cfg.forEach((c,i)=>{
  const glass=c[4]===1;
  const m=new THREE.Mesh(glass?new THREE.IcosahedronGeometry(c[3],5):shardG(c[3]),glass?glassMat:squareMat);
  m.position.set(c[0],c[1],c[2]); m.castShadow=!glass;
  m.userData={y:c[1],bx:c[0],bz:c[2],rs:[(rng()-.5)*.012,(rng()-.5)*.012,(rng()-.5)*.012],bob:.12+rng()*.05,f:.85+rng()*.5,ph:i*.85,glass,v:new THREE.Vector3()};
  floaters.add(m);
});

/* ---------- dust ---------- */
const dp=new Float32Array(1440);for(let i=0;i<1440;i++)dp[i]=(rng()-.5)*(i%3===1?9:14);
const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
const dust=new THREE.Points(dg,new THREE.PointsMaterial({color:0xecc284,size:.026,transparent:true,opacity:.55,depthWrite:false}));
scene.add(dust);
const shadowPlane=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({opacity:.26}));
shadowPlane.rotation.x=-Math.PI/2; shadowPlane.position.y=-2.16; shadowPlane.receiveShadow=true; scene.add(shadowPlane);

/* ---------- pointer interaction: ripples, squish, parallax ---------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),ptr={x:0,y:0,sx:0,sy:0,last:0};
let squash=0,squashV=0;
function pick(e,strong){
  const r=canvas.getBoundingClientRect();
  ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  ptr.x=ndc.x; ptr.y=ndc.y;
  ray.setFromCamera(ndc,camera);
  const hit=ray.intersectObjects([...squares,slab],false)[0];
  if(hit){
    cursorLight.position.copy(hit.point).add(new THREE.Vector3(0,1.1,0)); cursorLight.intensity=18;
    const now=performance.now();
    if(strong||now-ptr.last>140){addRipple(hit.point,strong?1.8:.55);ptr.last=now;}
    if(hit.object.userData.idx!==undefined&&strong)hit.object.userData.popV=-5;
    if(strong)squashV-=3.2;
    // glass blobs get pushed away from the touch point
    floaters.children.forEach(f=>{const d=f.position.clone().sub(hit.point);const l=d.length();if(l<3)f.userData.v.add(d.normalize().multiplyScalar((strong?.14:.03)*(3-l)));});
  } else cursorLight.intensity*=.85;
}
canvas.addEventListener('pointermove',e=>pick(e,false));
canvas.addEventListener('pointerdown',e=>pick(e,true));
canvas.addEventListener('pointerleave',()=>cursorLight.intensity=0);
document.getElementById('resetView').addEventListener('click',()=>{camera.position.copy(DEFAULT_CAM);controls.target.set(0,-.05,0);controls.update();});

/* ---------- resize / visibility ---------- */
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas); resize();
let visible=true; new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(canvas);

/* ---------- animate ---------- */
const clock=new THREE.Clock(); let prev=0;
const tmp=new THREE.Vector3();
function animate(){
  requestAnimationFrame(animate);
  if(!visible)return;
  const t=clock.getElapsedTime(),dt=Math.min(t-prev,1/30);prev=t; U.uTime.value=t;

  // pointer parallax + squash spring
  ptr.sx+=(ptr.x-ptr.sx)*.05; ptr.sy+=(ptr.y-ptr.sy)*.05;
  squashV+=(-90*squash-9*squashV)*dt; squash+=squashV*dt;
  bar.position.y=Math.sin(t*.85)*.09;
  bar.rotation.set(-.24+Math.cos(t*.38)*.016+ptr.sy*.06,ptr.sx*.1,-.08+Math.sin(t*.45)*.022);
  bar.scale.set(1-squash*.05,1+squash*.12,1-squash*.05);

  // assembly intro + elastic pop per square
  squares.forEach(s=>{
    const u=s.userData,e=elastic(clamp((t-.4-u.delay)/1.3,0,1));
    u.popV+=(-170*u.pop-10*u.popV)*dt; u.pop+=u.popV*dt;
    s.position.y=.21+(1-e)*3.2+Math.sin(t*1.1+u.phase)*.004+u.pop*.05;
    s.scale.setScalar(Math.max(.001,e)); s.rotation.y=(1-e)*1.4; s.rotation.z=(1-e)*.5;
  });
  decals.forEach(d=>{const s=d.userData.sq;d.position.y=s.position.y+.216*s.scale.y;d.scale.setScalar(s.scale.x);d.rotation.z=-s.rotation.y;});

  // droplets: swell → stretch → detach → fall → splash into pool
  drops.forEach(d=>{
    const u=d.userData,c=(t*u.speed+u.phase)%1;
    if(c<.55){const p=c/.55,e=p*p,s=u.base*(.25+e*.85);d.position.set(u.x,u.topY-e*.07,u.z);d.scale.set(s,s*(1+e*.55),s);d.visible=true;u.landed=false;}
    else if(c<.92){const f=(c-.55)/.37,fall=.07+f*f*1.65,s=u.base*(1.05-f*.25);d.position.set(u.x,u.topY-fall,u.z);d.scale.set(s*.92,s*(1.35+f*.55),s*.92);d.visible=true;
      if(f>.97&&!u.landed){u.landed=true;tmp.set(u.x,0,u.z);bar.localToWorld(tmp);addRipple(tmp,.35);}}
    else d.visible=false;
  });
  pool.scale.set(1.15+Math.sin(t*.6)*.04,.8+Math.cos(t*.5)*.03,1);

  // floaters: drift, bob, rotate, spring home after being shoved
  floaters.children.forEach(f=>{
    const u=f.userData;
    u.v.x+=(u.bx-f.position.x)*.012; u.v.z+=(u.bz-f.position.z)*.012; u.v.multiplyScalar(.92);
    f.position.x+=u.v.x; f.position.z+=u.v.z;
    f.position.y=u.y+Math.sin(t*u.f+u.ph)*u.bob+u.v.y;
    f.rotation.x+=u.rs[0]; f.rotation.y+=u.rs[1]; f.rotation.z+=u.rs[2];
  });
  floaters.rotation.y=ptr.sx*.12; floaters.rotation.x=-ptr.sy*.06;

  dust.rotation.y=t*.014; dust.rotation.x=Math.sin(t*.16)*.025;
  cursorLight.intensity*=.96;
  controls.update();
  renderer.render(scene,camera);
}
animate();
