const { Renderer, Camera, Transform, Mesh, Program, Plane, Vec2 } = ogl;

const renderer = new Renderer({ dpr: 2, canvas: document.querySelector("#iridescence-bg") });
const gl = renderer.gl;
document.body.appendChild(gl.canvas);

const camera = new Camera(gl);
camera.position.z = 1;
const scene = new Transform();

const geometry = new Plane(gl);

const program = new Program(gl, {
    vertex: `
        attribute vec2 uv;
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 0, 1);
        }`,
    fragment: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;

        float iridescence(float angle, float thickness) {
            return abs(sin(angle * 10.0 + thickness * 20.0));
        }

        void main() {
            float angle = vUv.x * 3.1415;
            float thickness = vUv.y;
            float r = iridescence(angle, thickness + 0.1);
            float g = iridescence(angle + 1.0, thickness);
            float b = iridescence(angle + 2.0, thickness - 0.1);
            gl_FragColor = vec4(r, g, b, 1.0);
        }`,
    uniforms: {
        uTime: { value: 0 },
    },
});

const mesh = new Mesh(gl, { geometry, program });
mesh.setParent(scene);

let time = 0;
function animate() {
    requestAnimationFrame(animate);
    program.uniforms.uTime.value = time += 0.01;
    renderer.render({ scene, camera });
}
animate();
