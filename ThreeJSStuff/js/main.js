var scene;
var camera;
var renderer;
var geometry;
var material
var mesh;
var light;

init();
animate();

function init() {

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 1000;

	

	geometry = new THREE.BoxGeometry( 200, 200, 200 );
	material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF, wireframe: false } );
	light = new THREE.PointLight(0x999999, 1, 0, 2);
	light.position.set(0, 0, 210);
	
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );
	scene.add(light);
	scene.background

	renderer = new THREE.WebGLRenderer({
		canvas: document.getElementById('canvas')
	});
	renderer.setClearColor(0xdddddd, 1);
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

	requestAnimationFrame( animate );

	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.02;

	renderer.render( scene, camera );

}