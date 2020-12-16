var RenderEngine = function(canvas, gl, opts) {
    console.log("Initing renderengine");
    this.canvas = canvas;
    this.gl = gl;

    // set options
    this.clearColor = opts.clearColor;
    this.fov = opts.fov;

    // intialize program and save info
    this.shaderProgram = this.initShaderProgram();
    this.shaderVarLocs = this.getShaderVarLocations();

    // intialize empty scene
    this.scene = null;
}

/**
 * Returns the GLSL source code for the vertex shader.
 */
RenderEngine.prototype.getVsSource = function() {
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec4 aVertexColor;

        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform vec3 uLightDirection;

        varying highp vec4 vColor;
        varying highp vec3 vLighting;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(uLightDirection);

            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);
            
            vColor = aVertexColor;
        }
    `;
    return vsSource;
}

/**
 * Returns the GLSL source code for the fragment shader.
 */
RenderEngine.prototype.getFsSource = function() {
    const fsSource = `
        varying highp vec4 vColor;
        varying highp vec3 vLighting;

        void main() {
            highp vec4 color = vColor;
            gl_FragColor = vec4(color.xyz * vLighting, color.w);
        }
    `;
    return fsSource;
}

/**
 * Draws the scene set in 'this.scene' to the canvas.
 * 
 * @param {number} time the elapsed time since starting demo in seconds.
 */
RenderEngine.prototype.drawScene = function(time) {
    if (this.scene == null) {
        alert("No scene loaded!");
        return null;
    }

    const gl = this.gl;

    // set gl settings
    gl.clearColor(
        this.clearColor[0],
        this.clearColor[1],
        this.clearColor[2],
        this.clearColor[3],
    );
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // create projection matrix
    const fieldOfView = glMatrix.toRadian(this.fov);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar
    );

    // get the camera matrix
    const cameraMatrix = mat4.create();
    this.scene.camera.getViewMatrix(cameraMatrix);

    // combine projection and camera matrix
    // TODO: seperate these and do matrix multiplication in shader
    mat4.mul(
        projectionMatrix,
        projectionMatrix,
        cameraMatrix
    );

    // use sinus and cosinus for some simple animation
    const sinAnim = Math.sin(time) / 2 + 0.5;
    const cosAnim = Math.cos(time) / 2 + 0.5;

    // iterate over all models in the scene
    for (var i = 0; i < this.scene.models.length; i++) {
        const model = this.scene.models[i];
        
        // create model matrix
        const modelMatrix = mat4.create()

        // translate model to it's world position
        mat4.translate(
            modelMatrix,
            modelMatrix,
            model.position
        );

        if (model.animate) {
            mat4.translate(
                modelMatrix,
                modelMatrix,
                [6 * sinAnim - 3, 0, 6 * cosAnim - 3]
            );

            mat4.rotate(
                modelMatrix,
                modelMatrix,
                time * model.rotSpeedFactor,
                model.rotAxis
            );
        }

        // tell webgl how it should pull information out of vertex position buffer
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.position);
            gl.vertexAttribPointer(
                this.shaderVarLocs.attribLocations.aVertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.shaderVarLocs.attribLocations.aVertexPosition);
        }

        // tell webgl how it should pull information out of vertexv normals buffer
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.normal);
            gl.vertexAttribPointer(
                this.shaderVarLocs.attribLocations.aVertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.shaderVarLocs.attribLocations.aVertexNormal);
        }

        // tell webgl how it should pull information out of vertex color buffer
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.color);
            gl.vertexAttribPointer(
                this.shaderVarLocs.attribLocations.aVertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.shaderVarLocs.attribLocations.aVertexColor);
        }

        // TODO: reorder stuff below if possible

        // bind indices for rendering (move this down)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.buffers.index);

        // tell webgl which shader program to use
        gl.useProgram(this.shaderProgram);

        // set the uniforms
        gl.uniformMatrix4fv(
            this.shaderVarLocs.uniformLocations.uProjectionMatrix, 
            false, 
            projectionMatrix
        );
        
        gl.uniformMatrix4fv(
            this.shaderVarLocs.uniformLocations.uModelViewMatrix, 
            false,
            modelMatrix
        );

        gl.uniform3fv(
            this.shaderVarLocs.uniformLocations.uLightDirection, 
            [0.85, 0.8, 0.75]
        );

        // create normalmatrix
        // TODO: (move this up)
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(
            this.shaderVarLocs.uniformLocations.uNormalMatrix, 
            false,
            normalMatrix
        );

        // issue the draw call for the current object
        {
            const offset = 0;
            const type = gl.UNSIGNED_SHORT;
            const vertexCount = model.numVertices;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}

RenderEngine.prototype.initShaderProgram = function() {
    const gl = this.gl;
    
    // load shaders
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, this.getVsSource());
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, this.getFsSource());

    // create program and attach shaders
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // check for linking success
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;    
}

RenderEngine.prototype.loadShader = function(type, source) {
    const gl = this.gl;

    // create shader and compile from source
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // check for compilation success
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occured while compiling the shader: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

RenderEngine.prototype.getShaderVarLocations = function() {
    //
    // Requires 'this.shaderProgram' to be set!
    //
    const gl = this.gl;

    const shaderVarLocs = {
        attribLocations: {
            aVertexPosition: gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
            aVertexNormal: gl.getAttribLocation(this.shaderProgram, 'aVertexNormal'),
            aVertexColor: gl.getAttribLocation(this.shaderProgram, 'aVertexColor')
        },
        uniformLocations: {
            uProjectionMatrix: gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
            uModelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
            uNormalMatrix: gl.getUniformLocation(this.shaderProgram, 'uNormalMatrix'),
            uLightDirection: gl.getUniformLocation(this.shaderProgram, 'uLightDirection')
        }
    }

    return shaderVarLocs;
}

RenderEngine.prototype.setScene = function(scene) {
    for (var i = 0; i < scene.models.length; i++) {
        scene.models[i].buffers = this.createBuffersFromModelData(
            scene.models[i].data
        );
    }

    this.scene = scene;
}

RenderEngine.prototype.createBuffersFromModelData = function(modelData) {
    const gl = this.gl;
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(modelData.vertexPositions),
        gl.STATIC_DRAW
    );
    
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(modelData.vertexNormals),
        gl.STATIC_DRAW
    );

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(modelData.vertexColors),
        gl.STATIC_DRAW
    );

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(modelData.vertexIndices),
        gl.STATIC_DRAW
    );

    return {
        position: positionBuffer,
        normal: normalBuffer,
        color: colorBuffer,
        index: indexBuffer
    };
}