import { rendererReference } from 'three/src/Three.TSL.js';
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';

class DegRadHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return THREE.MathUtils.radToDeg(this.obj[this.prop]);
  }
  set value(v) {
    this.obj[this.prop] = THREE.MathUtils.degToRad(v);
  }
}

class StringToNumberHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return this.obj[this.prop];
  }
  set value(v) {
    this.obj[this.prop] = parseFloat(v);
  }
}

class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return '#' + this.object[this.prop].getHexString()
;
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}




const scene = new THREE.Scene();


const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.setZ(30);


const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#displayer')
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);


const controls = new OrbitControls(camera, renderer.domElement);
document.addEventListener('keydown', (e) => {

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3();
  right.crossVectors(camera.up, forward).normalize();

  const speed = 2;

  const step = 0.5;
  if (e.code === 'ArrowUp')    camera.position.add(forward.clone().multiplyScalar(speed));
  if (e.code === 'ArrowDown')  camera.position.add(forward.clone().multiplyScalar(-speed));
  if (e.code === 'ArrowLeft')  camera.position.add(right.clone().multiplyScalar(speed));
  if (e.code === 'ArrowRight') camera.position.add(right.clone().multiplyScalar(-speed));
  controls.update();
});


const geometry = new THREE.PlaneGeometry(1, 1);


const my_uniforms = {
  total_instances : {value : 10000},
    total_segments : {value: 100},
    span_t : {value:15},
    b : {value: 0.215},
    d : {value : 1.0},
    z : {value : 3.125},
    a : {value : 1.25},
    n : {value : 6},
    phi : {vaalue : 0.0},
    psi : {value : 0},
}
const material = new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.merge([
    
    THREE.UniformsLib.lights,
    {
      diffuse: { value: new THREE.Color(0xff0000) },
      emissive: { value: new THREE.Color(0x000000) },
      opacity: { value: 1.0 },
    },
    my_uniforms
  ]),
  lights: true,
  side: THREE.DoubleSide,
  transparent: false,

  vertexShader: `

    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform float total_instances;
uniform float total_segments;
uniform float span_t;
uniform float b;
uniform float d;
uniform float z;
uniform float a;
uniform int n;

uniform float phi;
uniform float psi;



#define TAU 6.283185307179586
#define PI  3.14159265358979323846


float[6] C(float t, float theta, mat3 R)
{
  float[6] ans;
  float nf = float(n);

  // ---- Obtain the point p on the generating curve. Note that it is centered at (0,0,0) ----
  // C(t, theta) is a 2D function projected to the plane defined by the vectors N and B. Let's call the original c(theta)

  float c1 = (a*sin(theta)*cos(phi) + cos(theta)*sin(phi)) * (1. + 0.1 * sin(nf * theta));
  float c2 = (a*sin(theta)*sin(phi) - cos(theta)*cos(phi)) * (1. + 0.1 * sin(nf * theta));

  vec3 N = normalize(vec3(b*cos(t)-sin(t), -b*sin(t)-cos(t), 0.));
  vec3 B = normalize(vec3(b*z*(b*sin(t)+cos(t)), b*z*(b*cos(t) - sin(t)), d*(b*b+1.)));
  vec3 p = (exp(b*t) - 1./(t+1.)) * R * (c1 * N + c2 * B);
  ans[0] = p.x; ans[1] = p.y; ans[2] = p.z;

    // ---- Now we obtain the normal at this point -----

    // Obtain the derivative of c(theta) in the plane.
    float df1 = (a*cos(theta)*cos(phi) - sin(theta)*sin(phi)) * (1. + 0.1 * sin(nf * theta)) + 0.1 * nf * (a*sin(theta)*cos(phi) + cos(theta)*sin(phi))*cos(nf*theta);
    float df2 = (a*cos(theta)*sin(phi) + sin(theta)*cos(phi)) * (1. + 0.1 * sin(nf * theta)) + 0.1 * nf * (a*sin(theta)*cos(phi) - cos(theta)*cos(phi))*cos(nf*theta);

    // Project such derivative using the same method as in the paper.
    // This vector is such that is tangent to C(theta)
    vec3 tangent = df1 * N + df2 * B;

    // Vector T is perpendicular to the plane defined by N and B
    vec3 T = normalize(vec3(d*(b*sin(t)+cos(t)), d*(b*cos(t)-sin(t)), -b*z));

    // Cross product gives us the desired normal
    // The order is given by the right-hand rule
    vec3 normal = cross(T, tangent);
    ans[3] = normal.x; ans[4] = normal.y; ans[5] = normal.z;

  return ans;
}



void main() {

  float instance_id = float(int(gl_InstanceID));
	
	
	float quads_per_segment = total_instances / total_segments; 
	float segment_id = float(int(instance_id/quads_per_segment));
	float group_id = mod(instance_id, quads_per_segment); // For creating the ring. This divides TAU
	
  // Parameters for the 4 vertices that defines this quad
	float t1 = (segment_id) / (total_segments) * span_t + 0.001;
	float t2 = (segment_id + 1.) / (total_segments) * span_t + 0.001;
	float theta1 = (group_id) / (quads_per_segment) * TAU;
	float theta2 = (group_id+1.) / (quads_per_segment) * TAU;

  // We obtain the displacement for the generating curves
	vec3 c1 = exp(b*t1) * vec3(d * sin(t1), d * cos(t1), -z); 
	vec3 c2 = exp(b*t2) * vec3(d * sin(t2), d * cos(t2), -z);
	
  // Rotation matix unique to the whole shell
	mat3 R = mat3(vec3(cos(psi), sin(psi), 0.), 
				vec3(-sin(psi), cos(psi), 0.), 
				vec3(0., 0., 1.));

  // We get the outline of the shell centered at (0,0,0)
  float[6] data1 = C(t1, theta1, R);
  float[6] data2 = C(t1, theta2, R);
  float[6] data3 = C(t2, theta1, R);
  float[6] data4 = C(t2, theta2, R);

  vec3 p1 = vec3(data1[0], data1[1], data1[2]);
  vec3 n1 = vec3(data1[3], data1[4], data1[5]);

  vec3 p2 = vec3(data2[0], data2[1], data2[2]);
  vec3 n2 = vec3(data2[3], data2[4], data2[5]);

  vec3 p3 = vec3(data3[0], data3[1], data3[2]);
  vec3 n3 = vec3(data3[3], data3[4], data3[5]);

  vec3 p4 = vec3(data4[0], data4[1], data4[2]);
  vec3 n4 = vec3(data4[3], data4[4], data4[5]);

	// By translating the outlines, we obtain their real position in the mesh
  vec3 pos;

	switch(gl_VertexID){
		case 0:
			pos = p1 + c1;
      vNormal = normalize(normalMatrix * n1);
			break;
		case 1:
			pos = p2 + c1;
      vNormal = normalize(normalMatrix * n2);
			break;
		case 2:
			pos = p3 + c2;
      vNormal = normalize(normalMatrix * n3);
			break;
		case 3:
			pos = p4 + c2;
      vNormal = normalize(normalMatrix * n4);
			break;
		default:
	    	//pos = vec3(2000.);
			break;
	}

    pos.z += exp(b * span_t);

      

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;


      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 diffuse;
    uniform vec3 emissive;
    uniform float opacity;

    varying vec3 vNormal;
    //varying vec3 vViewPosition;

    #include <common>
    #include <packing>
    #include <bsdfs>
    #include <lights_pars_begin>
    #include <lights_phong_pars_fragment>
    #include <shadowmap_pars_fragment>

    #include <cube_uv_reflection_fragment>
    #include <envmap_pars_fragment>
    #include <envmap_physical_pars_fragment>

struct GeometricContext {
 	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef CLEARCOAT
	vec3 clearcoatNormal;
#endif
};

    void main() {
      vec3 normal = normalize(gl_FrontFacing ? vNormal : -vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Required struct for lighting calculations
      GeometricContext  geometry;
      geometry.position = -vViewPosition;
      geometry.normal = normal;
      geometry.viewDir = viewDir;

      // Lighting calculation
      IncidentLight directLight;
      ReflectedLight reflectedLight;
      reflectedLight.directDiffuse = vec3(0.0);
      reflectedLight.directSpecular = vec3(0.0);
      reflectedLight.indirectDiffuse = vec3(0.0);
      reflectedLight.indirectSpecular = vec3(0.0);

      vec3 diffuse = vec3(0.0);
      vec3 specular = vec3(0.0);

      #if NUM_DIR_LIGHTS > 0
        for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
          vec3 lightDir = normalize(directionalLights[i].direction); // already points *from* surface toward light
          vec3 lightColor = directionalLights[0].color;

          float diff = max(dot(normal, lightDir), 0.0);
          diffuse += diff * lightColor;
        
          vec3 halfwayDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
          specular = spec * lightColor * 0.3;
        }
      #endif
      // Add ambient light
      reflectedLight.indirectDiffuse += vec3(1.0) * ambientLightColor;

      vec3 outgoingLight = specular + diffuse + reflectedLight.indirectDiffuse;

      gl_FragColor = vec4(outgoingLight, opacity);

      //gl_FragColor = vec4(vec3(0.0, 1.0, 1.0) * ambientLightColor, opacity);
    }
  `,
});
const count = 10000;
const mesh = new THREE.InstancedMesh(geometry, material, count);
scene.add(mesh);



const textureLoader = new THREE.TextureLoader();
textureLoader.load('/resources/skybox.png', function(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
});



const geometry2 = new THREE.BoxGeometry( 2, 2, 2 ); 
const material2 = new THREE.MeshPhongMaterial({ color: 0x44aa88, shininess: 100 });
const cube = new THREE.Mesh( geometry2, material2 ); 
cube.position.set(5, 4, 0);
scene.add( cube );




const light1 = new THREE.AmbientLight(0xFFFFFF, 0.1);
const light2 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
light2.position.set(0, 10, 0);
light2.target.position.set(-5, 0, 0);
scene.add(light2);
scene.add(light2.target);
scene.add(light1);

const dirLightHelper = new THREE.DirectionalLightHelper(light2, 1); // 1 is the size
scene.add(dirLightHelper);


const gui = new GUI();
gui.addColor(new ColorGUIHelper(light2, 'color'), 'value').name('color');
gui.add(light2, 'intensity', 0, 5, 0.01);
gui.add(light2.target.position, 'x', -10, 10);
gui.add(light2.target.position, 'z', -10, 10);
gui.add(light2.target.position, 'y', 0, 10);


function animate()
{

  // Update time uniform
  dirLightHelper.update();
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop( animate );


/**
 
const loader = new THREE.CubeTextureLoader();
const skyboxTexture = loader.load([
  'px.jpg', 'nx.jpg', // Right, Left
  'py.jpg', 'ny.jpg', // Top, Bottom
  'pz.jpg', 'nz.jpg', // Front, Back
]);

scene.background = skyboxTexture;
 * 
 *
 */