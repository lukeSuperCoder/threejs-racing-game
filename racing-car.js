import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

let _b = 9/16;
let _w = 900;
let _h = 900*_b;
let car1;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, _w / _h, 1, 1000);

camera.position.z = 112;
// 创建一个变量来存储模型的位置
const modelPosition = new THREE.Vector3();


const vertexShader = `
        varying vec2 vUv;
        void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

let fragmentShader = `
    uniform float iTime;
    varying vec2 vUv;
    
    void main() {
        vec2 p = vUv;
        vec3 q=vec3(1.0,1.0,1.0),d=vec3(p-.5*q.xy,q.y)/q.y,c=vec3(0,.5,.7);
        q=d/(.1-d.y);
        float a=iTime, k=sin(.2*a), w = q.x *= q.x-=.05*k*k*k*q.z*q.z;
        vec3 col = vec3(0);
        col.xyz=d.y>.04?c:
            sin(4.*q.z+40.*a)>0.?
            w>2.?c.xyx:w>1.2?d.zzz:c.yyy:
            w>2.?c.xzx:w>1.2?c.yxx*2.:(w>.004?c:d).zzz;
        gl_FragColor = vec4(col,1.0);
    }
    `;

let width = 160;
const geometry = new THREE.PlaneGeometry(width,width*_b)

const material = new THREE.ShaderMaterial({
    uniforms: {
        iTime: { value: 0 },
    },
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(_w,_h);

// new OrbitControls(camera, renderer.domElement);

renderer.setClearColor(0xFFFFFF, 1.0);
document.body.appendChild(renderer.domElement);


//添加环境光
// const directionalLight = new THREE.DirectionalLight( 0xffffff, 20 ); // 光的颜色和强度
// directionalLight.position.set( 0, 10, 0 ); // 光的方向
// scene.add( directionalLight );
new RGBELoader()
		.setPath( './assets/model/textures/equirectangular/' )
		.load( 'blouberg_sunrise_2_1k.hdr', function ( texture ) {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			scene.background = texture;
			scene.environment = texture;
			//add car
			const loader = new GLTFLoader().setPath( './assets/model/glb_model/' );
			loader.load( 'bmw_m8_competition_widebody.glb', async function ( gltf ) {

				const model = gltf.scene;

				// model.position.x = -5
				model.position.y = -20;
				model.position.z = 18;
				model.scale.set( 10, 10, 10 );
				

				// wait until the model can be added to the scene without blocking due to shader compilation

				await renderer.compileAsync( model, camera, scene );

				scene.add( model );

				car1 = model;

			} );
		})
// 更新模型的位置
function updateModelPosition(type) {
	if(car1) {
		if(type==='L') {
			car1.position.x =car1.position.x-0.5;
			car1.rotation.y = car1.rotation.y + 0.008;
		} else if(type==='R') {
			car1.position.x =car1.position.x+0.5;
			car1.rotation.y = car1.rotation.y - 0.008;
		} else if(type===''){
			car1.position.x = car1.position.x;
		}
	}
}

let speed = 0.01;
let points_total = 1;
let car_type = '';
function animate() {
    requestAnimationFrame(animate);
	//监听键盘事件调整模型位置
	updateModelPosition(car_type);
	points_total += 1*speed*100;
	console.log(points_total);
    material.uniforms.iTime.value += speed;
    renderer.render(scene, camera);
}
animate();

let div = document.getElementById("speed");

div.innerHTML = `速度：${speed*3000 | 0}`

let point = document.getElementById("points");

point.innerHTML = `得分：${points_total | 0}`
window.addEventListener('keydown',(event)=>{
    switch (event.key) {
        case 'w':
          speed += 0.0005;
          break;
        case 's':
          speed -= 0.0005;
          break;
        case ' ':
          speed = 0 ;
          break;
		case 'a':
			//按下左键调整模型的位置
			car_type = 'L'; 
		  break;
		case 'd':
			//按下左键调整模型的位置
			car_type = 'R'; 
		break;
		default:
			car_type = ''
			break;
    }

    div.innerHTML = `速度：${speed*3000 | 0}`
	point.innerHTML = `得分：${points_total | 0}`
})
//监听键盘松开事件
window.addEventListener('keyup',(event)=>{
	car_type = ''
})
setInterval(()=> {
	point.innerHTML = `得分：${points_total | 0}`
},200)