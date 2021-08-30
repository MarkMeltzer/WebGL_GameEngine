// TODO: use class syntax
var RenderEngine = function(canvas, gl, opts) {
    console.log("Initing renderengine");
    this.canvas = canvas;
    this.gl = gl;

    // set options
    this.clearColor = opts.clearColor;
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

    // initialize AABB drawing shader
    this.AABBShader = new Shader(
        this.gl,
        AABBVsSource,
        AABBFsSource,
        AABBAttributeNames,
        AABBUniformNames
    );

    // intialize empty scene
    this.scene = null;
}

// TODO: add function comment
RenderEngine.prototype.render = function(time) {
    const gl = this.gl;

    this.drawShadowmap(time, this.depthFrameBuffer);
    this.drawScene(this.scene.camera, time);
}

/**
 * Draws the shadow map to a depth texture.
 * 
 * @param {number} time the elapsed time since starting demo in seconds.
 * @param {object} frameBuffer frameBuffer to draw to.
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
    // TODO: if light is directional light/sunlight, this should be a orthographic camera
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
    for (let id in this.scene.worldObjects) {
        const worldObject = this.scene.worldObjects[id];
        
        if (!worldObject.model || 
            !worldObject.model.mesh ||
            !worldObject.model.renderSettings.castShadow) {
            continue;
        }

        this.drawModel(worldObject, time, this.depthMapShader, false, false);
    }
}

/**
 * Draws the scene set in 'this.scene' to the canvas.
 * 
 * @param {object} camera camera to render with.
 * @param {number} time the elapsed time since starting demo in seconds.
 */
RenderEngine.prototype.drawScene = function(camera, time) {
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
    const projectionMatrix = mat4.create();
    camera.getProjectionMatrix(projectionMatrix);
    gl.uniformMatrix4fv(
        this.mainShader.uniformLocations.uProjectionMatrix, 
        false, 
        projectionMatrix
    );

    // create the camera matrix and set it as uniform in the shader
    const cameraMatrix = mat4.create();
    camera.getViewMatrix(cameraMatrix);
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

    // set the camera position in the shader
    gl.uniform3fv(
        this.mainShader.uniformLocations.uCameraPos, 
        this.scene.camera.position
    );

    // set the shadowmap texture uniform
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowmap);
    gl.uniform1i(
        this.mainShader.uniformLocations.uShadowmap,
        2
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

    /**************************************************************************
    * For all meshes:
    * Set uniforms which are specific to a mesh and issue it's draw call.
    **************************************************************************/

    // iterate over all models in the scene
    for (let id in this.scene.worldObjects) {
        gl.useProgram(this.mainShader.program);
        const worldObject = this.scene.worldObjects[id];
        
        if (worldObject.model && 
            worldObject.model.mesh &&
            worldObject.model.renderSettings.render) {
            this.drawModel(worldObject, time, this.mainShader, true, true);
        }

        // draw the AABBs
        if (worldObject.AABB && worldObject.AABB.render) {
            this.drawAABBs(worldObject, cameraMatrix, projectionMatrix);
        }
    }
}

/**
 * Draws a model. This should only be called in a scene rendering function so
 * assumes other shader variables such as camera and projection matrix to be
 * set.
 * 
 * @param {model} worldObject The worldObject containing the model.
 * @param {number} time Time sinds starting the demo in seconds. Used for animations.
 * @param {shader} shader The shader to draw the model with.
 * @param {bool} normals Wether to provide normals to the shader.
 * @param {bool} textures Wether to provide textures to the shader.
 */
RenderEngine.prototype.drawModel = function(worldObject, time, shader, normals, textures) {
    const gl = this.gl;
  
    // fall back to defaults if no material is defined
    const model = worldObject.model;
    const material = model.material != null ? model.material : this.scene.defaultMaterial;

    // use sinus and cosinus for some simple animation
    const sinAnim = Math.sin(time) / 2 + 0.5;
    const cosAnim = Math.cos(time) / 2 + 0.5;

    // create model matrix
    const modelMatrix = mat4.create()

    // translate model to it's world position
    mat4.translate(
        modelMatrix,
        modelMatrix,
        worldObject.position
    );

    // apply the objects rotation
    mat4.rotateX(
        modelMatrix,
        modelMatrix,
        glMatrix.toRadian(worldObject.rotation[0])
    );
    mat4.rotateY(
        modelMatrix,
        modelMatrix,
        glMatrix.toRadian(worldObject.rotation[1])
    );
    mat4.rotateZ(
        modelMatrix,
        modelMatrix,
        glMatrix.toRadian(worldObject.rotation[2])
    );

    // apply the objects scale
    mat4.scale(
        modelMatrix,
        modelMatrix,
        worldObject.scale
    )

    // animate model translation, if applicable
    if (model.animation.animateTrans) {
        mat4.translate(
            modelMatrix,
            modelMatrix,
            [6 * sinAnim - 3, 0, 6 * cosAnim - 3]
        );
    }

    // animate model rotation, if applicable
    if (model.animation.animateRot) {
        mat4.rotate(
            modelMatrix,
            modelMatrix,
            time * model.animation.rotSpeedFactor,
            model.animation.rotAxis
            );
    }

    // set whether the object should be highlighted
    // set the specular exponent of the material
    gl.uniform3fv(
        shader.uniformLocations.uHighlight,
        worldObject.selected ? [50, 0, 0] : [0, 0, 0]
    );

    // set the model matrix uniform in the shader
    gl.uniformMatrix4fv(
        shader.uniformLocations.uModelViewMatrix, 
        false,
        modelMatrix
    );

    // set wether model should recieve shadows
    gl.uniform1i(
        shader.uniformLocations.uRecieveShadow,
        model.renderSettings.recieveShadow ? 1 : 0
    );

    // set wether model should recieve lighting
    gl.uniform1i(
        shader.uniformLocations.uRecieveLighting,
        model.renderSettings.recieveLighting ? 1 : 0
    );

    // set wether the texture scale
    gl.uniform1f(
        shader.uniformLocations.uTexScale,
        material.scale
    );

    // set the specular exponent of the material
    gl.uniform1f(
        shader.uniformLocations.uSpecExp,
        material.specularExponent
    );

    // set the specular strength of the material
    gl.uniform1f(
        shader.uniformLocations.uSpecStrength,
        material.specularStrength
    );

    // set the specular strength of the material
    gl.uniform1f(
        shader.uniformLocations.uDiffStrength,
        material.diffuseStrength
    );

    // tell webgl how it should pull information out of vertex position buffer
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.buffers.position);
        gl.vertexAttribPointer(
            shader.attribLocations.aVertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
            );
            gl.enableVertexAttribArray(shader.attribLocations.aVertexPosition);
    }
        
    // create the normal matrix and set it as uniform in the shader
    if (normals) {
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(
            shader.uniformLocations.uNormalMatrix, 
            false,
            normalMatrix
        );
        
        // tell webgl how it should pull information out of vertex normals buffer
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.buffers.normal);
            gl.vertexAttribPointer(
                shader.attribLocations.aVertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(shader.attribLocations.aVertexNormal);
        }

        // tell webgl how it should pull information out of vertex tangent and bitangent buffers
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.buffers.tangent);
            gl.vertexAttribPointer(
                shader.attribLocations.aVertexTangent,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(shader.attribLocations.aVertexTangent);
        }
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.buffers.bitangent);
            gl.vertexAttribPointer(
                shader.attribLocations.aVertexBitangent,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(shader.attribLocations.aVertexBitangent);
        }
    }
        
    if (textures) {
        // tell webgl how it should pull information out of the texture coordinate buffer
        {
            const numComponents = 2;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.buffers.texCoord);
            gl.vertexAttribPointer(
                shader.attribLocations.aTextureCoord,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(shader.attribLocations.aTextureCoord);
        }
    
        // set the diffuse texture uniform in the shader
        const diffuseBuffer = material.useDiffuse && material.diffuseTexture != null ? 
                              material.diffuseTexture.buffer : 
                              this.scene.defaultMaterial.diffuseTexture.buffer
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, diffuseBuffer);
        gl.uniform1i(
            shader.uniformLocations.uTexDiffuse,
            0
        );

        // set the normal texture uniform in the shader
        const normalBuffer = material.useNormal && material.normalTexture != null ?
                              material.normalTexture.buffer :
                              this.scene.defaultMaterial.normalTexture.buffer
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalBuffer);
        gl.uniform1i(
            shader.uniformLocations.uTexNormal,
            1
        );
    }

    // bind indices for rendering
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.buffers.index);

    // issue the draw call for the current object
    {
        const offset = 0;
        const type = gl.UNSIGNED_SHORT;
        const vertexCount = model.mesh.getNumVerts();
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

// TODO: add function comment
RenderEngine.prototype.drawAABBs = function(worldObject, cameraMatrix, projectionMatrix) {
    const gl = this.gl;

    if (worldObject.AABB && worldObject.AABB.renderBuffer) {
        // use the AABB rendering shader for rendering
        gl.useProgram(this.AABBShader.program);

        // set the AABB vertex positions in the shader
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, worldObject.AABB.renderBuffer);
            gl.vertexAttribPointer(
                this.AABBShader.attribLocations.aVertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            gl.enableVertexAttribArray(this.AABBShader.attribLocations.aVertexPosition);
        }

        // set the projection and cameramatrix to render the AABBs with
        gl.uniformMatrix4fv(
            this.AABBShader.uniformLocations.uProjectionMatrix,
            false,
            projectionMatrix
        );
        gl.uniformMatrix4fv(
            this.AABBShader.uniformLocations.uCameraMatrix,
            false,
            cameraMatrix
        );

        // set the color of the wireframe of the AABB
        var renderColor = [0, 0, 0];
        if (worldObject.isColliding) {
            renderColor = [1, 0, 0];
        } else {
            renderColor = [0, 0, 1];
        }
        gl.uniform3fv(
            this.AABBShader.uniformLocations.AABBRenderColor, 
            renderColor
        );

        const AABBModelMatrix = mat4.create()
        mat4.translate(
            AABBModelMatrix,
            AABBModelMatrix,
            worldObject.position
        );
        gl.uniformMatrix4fv(
            this.AABBShader.uniformLocations.uModelViewMatrix,
            false,
            AABBModelMatrix
        );

        // draw the AABBs
        gl.lineWidth(5);
        gl.drawArrays(gl.LINES, 0, 24);            
    }
}

// TODO: add function comment
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

// TODO: add function comment
RenderEngine.prototype.setScene = function(scene) {
    for (let id in scene.worldObjects) {
        const object = scene.worldObjects[id];

        if (object.AABB) {
            object.AABB.createRenderBuffer();
        }

        if (!object.model) {
            continue;
        }

        // create mesh buffers
        if (object.model.mesh) {    
            object.model.setMeshBuffers();
        } else {
            // set the default mesh and create buffers for it
            object.model.mesh = this.defaultMesh;
            object.model.setMeshBuffers();
        }

        // create texture buffer
        if (object.model.material) {
            object.model.setTextureBuffer();
        } else {
            object.model.material = this.defaultMaterial;
            object.model.setTextureBuffer();
        }
    }

    this.scene = scene;
}