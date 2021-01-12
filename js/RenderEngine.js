var RenderEngine = function(canvas, gl, opts) {
    console.log("Initing renderengine");
    this.canvas = canvas;
    this.gl = gl;

    // set options
    this.clearColor = opts.clearColor;
    this.fov = opts.fov;
    this.zNear = 0.1;
    this.zFar = 100;
    this.shadowmapSettings = {
        res: 4096,
        fov: 81,
        zNear: 1,
        zFar: 100,
        bias: 0.0002
    }

    // intialize main shader
    this.mainShader = new Shader(
        this.gl,
        mainVsSource,
        mainFsSource,
        mainAttributeNames,
        mainUniformNames
    );

    // initialize depthMap shader and the depthmap buffers
    this.depthMapShader = new Shader(
        this.gl,
        depthMapVsSource,
        depthMapFsSource,
        depthMapAttributeNames,
        depthMapUniformNames
    );
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
    gl.useProgram(this.depthMapShader.program);

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
        this.depthMapShader.uniformLocations.uProjectionMatrix, 
        false, 
        projectionMatrix
    );
    
    // save the projection matrix for the canvas render pass
    this.shadowmapProjection = projectionMatrix;

    // create the camera matrix and set it as uniform in the shader
    const cameraMatrix = mat4.create();
    mat4.lookAt(
        cameraMatrix, 
        this.scene.light, // position
        [0,0,0], // target
        [0,1,0]  // up
    );
    gl.uniformMatrix4fv(
        this.depthMapShader.uniformLocations.uCameraMatrix, 
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
            this.depthMapShader.uniformLocations.uModelViewMatrix, 
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
                this.depthMapShader.attribLocations.aVertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.depthMapShader.attribLocations.aVertexPosition);
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
    gl.useProgram(this.mainShader.program);

    /**************************************************************************
    * Set all uniforms which are indepentent of mesh being drawn.
    **************************************************************************/

    // create the projection matrix and set it as uniform in the shader
    const fieldOfView = glMatrix.toRadian(this.fov);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = this.zNear;
    const zFar = this.zFar;
    const projectionMatrix = mat4.create();
    mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar
    );
    gl.uniformMatrix4fv(
        this.mainShader.uniformLocations.uProjectionMatrix, 
        false, 
        projectionMatrix
    );

    // create the camera matrix and set it as uniform in the shader
    const cameraMatrix = mat4.create();
    this.scene.camera.getViewMatrix(cameraMatrix);
    gl.uniformMatrix4fv(
        this.mainShader.uniformLocations.uCameraMatrix, 
        false,
        cameraMatrix
    );

    // set the lightdirection uniform in the shader
    gl.uniform3fv(
        this.mainShader.uniformLocations.uLightDirection, 
        this.scene.light
    );

    // set the shadowmap texture uniform
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowmap);
    gl.uniform1i(
        this.mainShader.uniformLocations.uShadowmap,
        1
    );

    // set the light space transformation uniform for shadowmapping
    gl.uniformMatrix4fv(
        this.mainShader.uniformLocations.uLightSpaceCamera, 
        false,
        this.shadowmapCamera
    );
    
    // set the light space projection uniform for shadowmapping
    gl.uniformMatrix4fv(
        this.mainShader.uniformLocations.uLightSpaceProjection, 
        false,
        this.shadowmapProjection
    );

    // set the shadow bias which is used to combat shadow acne
    gl.uniform1f(
        this.mainShader.uniformLocations.uShadowBias,
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
            this.mainShader.uniformLocations.uModelViewMatrix, 
            false,
            modelMatrix
        );

        // create the normal matrix and set it as uniform in the shader
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(
            this.mainShader.uniformLocations.uNormalMatrix, 
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
                this.mainShader.attribLocations.aVertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.mainShader.attribLocations.aVertexPosition);
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
                this.mainShader.attribLocations.aVertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.mainShader.attribLocations.aVertexNormal);
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
                this.mainShader.attribLocations.aTextureCoord,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.mainShader.attribLocations.aTextureCoord);
        }

        // set the texture uniform in the shader
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, model.buffers.texture);
        gl.uniform1i(
            this.mainShader.uniformLocations.uTexture,
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