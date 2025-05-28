// Fixed Iridescence Background for Vanilla JavaScript
class IridescenceBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        this.mouse = { x: 0.5, y: 0.5 };
        this.time = 0;
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Resize canvas to full screen
        this.resize();
        
        // Vertex shader
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_uv;
            varying vec2 v_uv;
            
            void main() {
                v_uv = a_uv;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // Fragment shader with proper iridescence effect
        const fragmentShaderSource = `
            precision highp float;
            
            varying vec2 v_uv;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform vec3 u_color;
            uniform float u_amplitude;
            uniform float u_speed;
            
            void main() {
                float mr = min(u_resolution.x, u_resolution.y);
                vec2 uv = (v_uv.xy * 2.0 - 1.0) * u_resolution.xy / mr;
                
                // Add mouse interaction
                uv += (u_mouse - vec2(0.5)) * u_amplitude;
                
                float d = -u_time * 0.5 * u_speed;
                float a = 0.0;
                
                // Create the iridescent pattern
                for (float i = 0.0; i < 8.0; ++i) {
                    a += cos(i - d - a * uv.x);
                    d += sin(uv.y * i + a);
                }
                
                d += u_time * 0.5 * u_speed;
                vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
                col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * u_color;
                
                gl_FragColor = vec4(col, 1.0);
            }
        `;

        // Create and compile shaders
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        
        // Create geometry (full screen quad)
        this.setupGeometry();
        
        // Setup uniforms
        this.setupUniforms();
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }

    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }

    setupGeometry() {
        // Full screen quad vertices
        const vertices = new Float32Array([
            -1, -1,  0, 0,  // Bottom left
             1, -1,  1, 0,  // Bottom right
            -1,  1,  0, 1,  // Top left
             1,  1,  1, 1   // Top right
        ]);

        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        // Get attribute locations
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.uvLocation = this.gl.getAttribLocation(this.program, 'a_uv');
    }

    setupUniforms() {
        this.gl.useProgram(this.program);
        
        // Get uniform locations
        this.uniforms = {
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            color: this.gl.getUniformLocation(this.program, 'u_color'),
            amplitude: this.gl.getUniformLocation(this.program, 'u_amplitude'),
            speed: this.gl.getUniformLocation(this.program, 'u_speed')
        };

        // Set initial uniform values
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.uniforms.mouse, this.mouse.x, this.mouse.y);
        this.gl.uniform3f(this.uniforms.color, 1.0, 1.0, 1.0);
        this.gl.uniform1f(this.uniforms.amplitude, 0.1);
        this.gl.uniform1f(this.uniforms.speed, 1.0);
    }

    setupEventListeners() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) / rect.width;
            this.mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
        });

        // Window resize
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.uniforms && this.uniforms.resolution) {
            this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        }
    }

    render() {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        this.gl.useProgram(this.program);
        
        // Update uniforms
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform2f(this.uniforms.mouse, this.mouse.x, this.mouse.y);
        
        // Bind buffer and set up attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 16, 0);
        
        this.gl.enableVertexAttribArray(this.uvLocation);
        this.gl.vertexAttribPointer(this.uvLocation, 2, this.gl.FLOAT, false, 16, 8);
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    animate() {
        this.time += 0.016; // ~60fps
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new IridescenceBackground('iridescence-bg');
});
