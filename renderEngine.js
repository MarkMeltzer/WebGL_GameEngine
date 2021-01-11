var RenderEngine = function(canvas, gl, opts) {
    console.log("Initing renderengine");
    this.canvas = canvas;
    this.gl = gl;

    // set options
    this.clearColor = opts.clearColor;
    this.fov = opts.fov;
    this.shadowmapSettings = {
        res: 4096,
        fov: 81,
        zNear: 1,
        zFar: 100,
        bias: 0.0002,
        lightPosition: [20,14,10]
    }

    // intialize shader program and save info
    this.shaderProgram = this.initShaderProgram(this.getVsSource(), this.getFsSource());
    this.shaderVarLocs = this.getShaderVarLocations();

    // initialize depthMap shader program
    this.depthMapShaderProgram = this.initShaderProgram(this.getDepthMapVsSource(), this.getDepthMapFsSource());
    this.depthMapShaderVarLocs = this.getDepthMapShaderVarLocations();
    this.initDepthmap();

    // intialize empty scene
    this.scene = null;

    // create the default texture
    this.defaultTextureBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.defaultTextureBuffer);
    gl.texImage2D(
        gl.TEXTURE_2D, 
        0, 
        gl.RGBA, 
        1, 
        1, 
        0, 
        gl.RGBA, 
        gl.UNSIGNED_BYTE, 
        new Uint8Array([0, 0, 255, 255,])
    );

    // create the default mesh
    this.defaultMeshData = createBox(2, 2, 2);
    this.defaultMeshBuffers = this.createBuffersFromModelData(this.defaultMeshData);

}

/**
 * Returns the GLSL source code for the vertex shader.
 */
RenderEngine.prototype.getVsSource = function() {
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 atextureCoord;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uCameraMatrix;
        uniform mat4 uModelViewMatrix;

        uniform mat4 uLightSpaceProjection;
        uniform mat4 uLightSpaceCamera;

        uniform mat4 uNormalMatrix;

        uniform vec3 uLightDirection;

        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;
        varying highp vec4 vLightSpaceVertex;

        void main() {
            gl_Position = uProjectionMatrix * uCameraMatrix * uModelViewMatrix * aVertexPosition;

            highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(uLightDirection);

            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);
            
            vLightSpaceVertex = uLightSpaceProjection * uLightSpaceCamera * uModelViewMatrix * aVertexPosition;

            vTextureCoord = atextureCoord;
        }
    `;
    return vsSource;
}

/**
 * Returns the GLSL source code for the fragment shader.
 */
RenderEngine.prototype.getFsSource = function() {
    const fsSource = `
        uniform sampler2D uTexture;
        uniform sampler2D uShadowmap;
        uniform highp float uShadowBias;

        varying highp vec3 vLighting;
        varying highp vec2 vTextureCoord;
        varying highp vec4 vLightSpaceVertex;

        bool inShadow() {
            // Manually do the perspective division
            highp vec3 vLightSpaceVertex = vLightSpaceVertex.xyz / vLightSpaceVertex.w;

            // shift the values from NDC to [0,1] range
            vLightSpaceVertex = vLightSpaceVertex * 0.5 + 0.5;

            // set everything outside the the shadowmap to not be in shadow
            if (
                vLightSpaceVertex.x > 1.0 ||
                vLightSpaceVertex.x < 0.0 ||
                vLightSpaceVertex.y > 1.0 ||
                vLightSpaceVertex.y < 0.0
            ) {
                return false;
            }

            // sample the shadow map
            highp vec4 shadowmapSample = texture2D(uShadowmap, vLightSpaceVertex.xy);
            
            // the distance to the closest fragment from the pov of the light
            highp float closestDist = shadowmapSample.r;

            // the distance of the current fragment from the pov of the light
            highp float currentDist = vLightSpaceVertex.z;

            return (closestDist + uShadowBias <= currentDist);
        }

        void main() {
            highp vec4 color = texture2D(uTexture, vTextureCoord);
            
            highp float shadowFactor = inShadow() ? 0.3 : 1.0;
            
            gl_FragColor = vec4(color.xyz * vLighting * shadowFactor, color.w);
        }
    `;
    return fsSource;
}

/**
 * Returns the GLSL source code for the depth map vertex shader.
 */
RenderEngine.prototype.getDepthMapVsSource = function() {
    const vsSource = `
        attribute vec4 aVertexPosition;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uCameraMatrix;
        uniform mat4 uModelViewMatrix;

        void main() {
            gl_Position = uProjectionMatrix * uCameraMatrix * uModelViewMatrix * aVertexPosition;
        }
    `;
    return vsSource;
}

/**
 * Returns the GLSL source code for the fragment shader.
 */
RenderEngine.prototype.getDepthMapFsSource = function() {
    const fsSource = `
        void main() {
            gl_FragColor = vec4(gl_FragCoord.z);
        }
    `;
    return fsSource;
}

RenderEngine.prototype.render = function(time) {
    const gl = this.gl;

    this.drawShadowmap(time, this.depthFrameBuffer);
    this.drawScene(time);
}


/**
 * Draws the shadow map to a depth texture.
 * 
 * @param {number} time the elapsed time since starting demo in seconds.
 */
RenderEngine.prototype.drawShadowmap = function(time, frameBuffer) {
    if (this.scene == null) {
        alert("No scene loaded!");
        return null;
    }

    const gl = this.gl;

    // render to framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

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
    
    // set viewport to the dimensions of the texture we are rendering to
    gl.viewport(0, 0, this.shadowmapSettings.res, this.shadowmapSettings.res);

    // clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // tell webgl which shader program to use
    gl.useProgram(this.depthMapShaderProgram);

    /**************************************************************************
    * Set all uniforms which are indepentent of mesh being drawn.
    **************************************************************************/

    // create the projection matrix and set it as uniform in the shader
    const fieldOfView = glMatrix.toRadian(this.shadowmapSettings.fov);
    const aspect = 1;
    const zNear = this.shadowmapSettings.zNear;
    const zFar = this.shadowmapSettings.zFar;
    const projectionMatrix = mat4.create();
    mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar
    );
    gl.uniformMatrix4fv(
        this.depthMapShaderVarLocs.uniformLocations.uProjectionMatrix, 
        false, 
        projectionMatrix
    );
    
    // save the projection matrix for the canvas render pass
    this.shadowmapProjection = projectionMatrix;

    // create the camera matrix and set it as uniform in the shader
    const cameraMatrix = mat4.create();
    mat4.lookAt(
        cameraMatrix, 
        this.shadowmapSettings.lightPosition, // position
        [0,0,0], // target
        [0,1,0]  // up
    );
    gl.uniformMatrix4fv(
        this.depthMapShaderVarLocs.uniformLocations.uCameraMatrix, 
        false,
        cameraMatrix
    );

    // save the camera matrix for the canvas render pass
    this.shadowmapCamera = cameraMatrix;

    // use sinus and cosinus for some simple animation
    const sinAnim = Math.sin(time) / 2 + 0.5;
    const cosAnim = Math.cos(time) / 2 + 0.5;

    /**************************************************************************
    * For all meshes:
    * Set uniforms which are specific to a mesh and issue it's draw call.
    **************************************************************************/

    // iterate over all models in the scene
    for (let modelId in this.scene.models) {
        const model = this.scene.models[modelId];
        
        // create model matrix
        const modelMatrix = mat4.create()

        // translate model to it's world position
        mat4.translate(
            modelMatrix,
            modelMatrix,
            model.position
        );

        // animate model translation, if applicable
        if (model.animateTrans) {
            mat4.translate(
                modelMatrix,
                modelMatrix,
                [6 * sinAnim - 3, 0, 6 * cosAnim - 3]
            );
        }

        // animate model rotation, if applicable
        if (model.animateRot) {
            mat4.rotate(
                modelMatrix,
                modelMatrix,
                time * model.rotSpeedFactor,
                model.rotAxis
                );
        }

        // set the model matrix uniform in the shader
        gl.uniformMatrix4fv(
            this.depthMapShaderVarLocs.uniformLocations.uModelViewMatrix, 
            false,
            modelMatrix
        );
            
        // tell webgl how it should pull information out of vertex position buffer
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.position);
            gl.vertexAttribPointer(
                this.depthMapShaderVarLocs.attribLocations.aVertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.depthMapShaderVarLocs.attribLocations.aVertexPosition);
        }

        // bind indices for rendering (move this down)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.buffers.index);

        // issue the draw call for the current object
        {
            const offset = 0;
            const type = gl.UNSIGNED_SHORT;
            const vertexCount = model.vertexData.vertexIndices.length;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
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

    // render to canvas not to framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

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

    // set the viewport to the whole canvas dimensions
    gl.viewport(0,0, gl.canvas.width, gl.canvas.height);

    // clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // tell webgl which shader program to use
    gl.useProgram(this.shaderProgram);

    /**************************************************************************
    * Set all uniforms which are indepentent of mesh being drawn.
    **************************************************************************/

    // create the projection matrix and set it as uniform in the shader
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
    gl.uniformMatrix4fv(
        this.shaderVarLocs.uniformLocations.uProjectionMatrix, 
        false, 
        projectionMatrix
    );

    // create the camera matrix and set it as uniform in the shader
    const cameraMatrix = mat4.create();
    this.scene.camera.getViewMatrix(cameraMatrix);
    gl.uniformMatrix4fv(
        this.shaderVarLocs.uniformLocations.uCameraMatrix, 
        false,
        cameraMatrix
    );

    // set the lightdirection uniform in the shader
    gl.uniform3fv(
        this.shaderVarLocs.uniformLocations.uLightDirection, 
        this.scene.light
    );

    // set the shadowmap texture uniform
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowmap);
    gl.uniform1i(
        this.shaderVarLocs.uniformLocations.uShadowmap,
        1
    );

    // set the light space transformation uniform for shadowmapping
    gl.uniformMatrix4fv(
        this.shaderVarLocs.uniformLocations.uLightSpaceCamera, 
        false,
        this.shadowmapCamera
    );
    
    // set the light space projection uniform for shadowmapping
    gl.uniformMatrix4fv(
        this.shaderVarLocs.uniformLocations.uLightSpaceProjection, 
        false,
        this.shadowmapProjection
    );

    // set the shadow bias which is used to combat shadow acne
    gl.uniform1f(
        this.shaderVarLocs.uniformLocations.uShadowBias,
        this.shadowmapSettings.bias
    );

    // use sinus and cosinus for some simple animation
    const sinAnim = Math.sin(time) / 2 + 0.5;
    const cosAnim = Math.cos(time) / 2 + 0.5;

    /**************************************************************************
    * For all meshes:
    * Set uniforms which are specific to a mesh and issue it's draw call.
    **************************************************************************/

    // iterate over all models in the scene
    for (let modelId in this.scene.models) {
        const model = this.scene.models[modelId];
        
        // create model matrix
        const modelMatrix = mat4.create()

        // translate model to it's world position
        mat4.translate(
            modelMatrix,
            modelMatrix,
            model.position
        );

        // animate model translation, if applicable
        if (model.animateTrans) {
            mat4.translate(
                modelMatrix,
                modelMatrix,
                [6 * sinAnim - 3, 0, 6 * cosAnim - 3]
            );
        }

        // animate model rotation, if applicable
        if (model.animateRot) {
            mat4.rotate(
                modelMatrix,
                modelMatrix,
                time * model.rotSpeedFactor,
                model.rotAxis
                );
        }

        // set the model matrix uniform in the shader
        gl.uniformMatrix4fv(
            this.shaderVarLocs.uniformLocations.uModelViewMatrix, 
            false,
            modelMatrix
        );

        // create the normal matrix and set it as uniform in the shader
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(
            this.shaderVarLocs.uniformLocations.uNormalMatrix, 
            false,
            normalMatrix
        );
            
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

        // tell webgl how it should pull information out of the texture coordinate buffer
        {
            const numComponents = 2;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.buffers.textureCoord);
            gl.vertexAttribPointer(
                this.shaderVarLocs.attribLocations.atextureCoord,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.shaderVarLocs.attribLocations.atextureCoord);
        }

        // set the texture uniform in the shader
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, model.buffers.texture);
        gl.uniform1i(
            this.shaderVarLocs.uniformLocations.uTexture,
            0
        );

        // bind indices for rendering (move this down)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.buffers.index);

        // issue the draw call for the current object
        {
            const offset = 0;
            const type = gl.UNSIGNED_SHORT;
            const vertexCount = model.vertexData.vertexIndices.length;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}

RenderEngine.prototype.initShaderProgram = function(vsSource, fsSource) {
    const gl = this.gl;
    
    // load shaders
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

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
        alert('An error occured while compiling the shader: ' + gl.getShaderInfoLog(shader) + source);
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
            atextureCoord: gl.getAttribLocation(this.shaderProgram, 'atextureCoord')
        },
        uniformLocations: {
            uProjectionMatrix: gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
            uCameraMatrix: gl.getUniformLocation(this.shaderProgram, 'uCameraMatrix'),
            uModelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
            uNormalMatrix: gl.getUniformLocation(this.shaderProgram, 'uNormalMatrix'),
            uLightDirection: gl.getUniformLocation(this.shaderProgram, 'uLightDirection'),
            uTexture: gl.getUniformLocation(this.shaderProgram, 'uTexture'),
            uShadowmap: gl.getUniformLocation(this.shaderProgram, 'uShadowmap'),
            uLightSpaceCamera: gl.getUniformLocation(this.shaderProgram, 'uLightSpaceCamera'),
            uLightSpaceProjection: gl.getUniformLocation(this.shaderProgram, 'uLightSpaceProjection'),
            uShadowBias: gl.getUniformLocation(this.shaderProgram, 'uShadowBias'),
        }
    }

    return shaderVarLocs;
}

RenderEngine.prototype.getDepthMapShaderVarLocations = function() {
    //
    // Requires 'this.depthMapShaderProgram' to be set!
    //
    const gl = this.gl;

    const shaderVarLocs = {
        attribLocations: {
            aVertexPosition: gl.getAttribLocation(this.depthMapShaderProgram, 'aVertexPosition')
        },
        uniformLocations: {
            uProjectionMatrix: gl.getUniformLocation(this.depthMapShaderProgram, 'uProjectionMatrix'),
            uCameraMatrix: gl.getUniformLocation(this.depthMapShaderProgram, 'uCameraMatrix'),
            uModelViewMatrix: gl.getUniformLocation(this.depthMapShaderProgram, 'uModelViewMatrix')
        }
    }

    return shaderVarLocs;
}

RenderEngine.prototype.initDepthmap = function() {
    const gl = this.gl;

    // create and set up depth texture
    const depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.DEPTH_COMPONENT,
        this.shadowmapSettings.res,
        this.shadowmapSettings.res,
        0,
        gl.DEPTH_COMPONENT,
        gl.UNSIGNED_INT,
        null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // create framebuffer to render depth information to
    const depthFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFrameBuffer);

    // attach the depth texture
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, 
        gl.DEPTH_ATTACHMENT, 
        gl.TEXTURE_2D,
        depthTexture, 
        0
    );

    // create and attach a unused color texture
    const unusedTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        this.shadowmapSettings.res,
        this.shadowmapSettings.res,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, 
        gl.COLOR_ATTACHMENT0, 
        gl.TEXTURE_2D, 
        unusedTexture, 
        0
    );

    this.depthFrameBuffer = depthFrameBuffer;
    this.shadowmap = depthTexture;
}


RenderEngine.prototype.setScene = function(scene) {
    const gl = this.gl;

    for (let modelId in scene.models) {
        const model = scene.models[modelId];

        // create and save the vertex buffers
        if (model.vertexData) {
            model.buffers = this.createBuffersFromModelData(model.vertexData);
        } else {
            model.vertexData = this.defaultMeshData;
            model.buffers = this.defaultMeshBuffers;
        }

        // fill texture buffer with default texture (single pixel color)
        model.buffers.texture = this.defaultTextureBuffer;
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

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(modelData.textureCoords),
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
        textureCoord: textureCoordBuffer,
        index: indexBuffer
    };
}


RenderEngine.prototype.setTexture = function(modelId, image) {
    const gl = this.gl;
    
    // Find the model corresponding to the modelId
    const model = this.scene.models[modelId];
    if (!model) {
        console.log("Model not found during call to setTexture. ModelId: " + modelId);
        return null;
    }

    // create a new buffer and set the new texture
    const textureBuffer = gl.createTexture();
    model.buffers.texture = textureBuffer;
    gl.bindTexture(gl.TEXTURE_2D, model.buffers.texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
    );
    
    // No power of 2? No mipmap for you!
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
}

RenderEngine.prototype.setMesh = function(modelId, meshData) {
    const gl = this.gl;
    
    // Find the model corresponding to the modelId
    const model = this.scene.models[modelId];
    if (!model) {
        console.log("Model not found during call to setMesh. ModelId: " + modelId);
        return null;
    }
    
    // set the new mesh
    model.vertexData = meshData;
    model.numVertices = meshData.vertexIndices.length;
    
    // fill the buffers with the new data
    const tempTextureBuffer = model.buffers.texture;
    model.buffers = this.createBuffersFromModelData(meshData);
    model.buffers.texture = tempTextureBuffer;
}