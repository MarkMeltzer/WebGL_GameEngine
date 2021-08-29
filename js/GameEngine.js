// TODO: use class syntax
var GameEngine = function(canvas, gl) {
    // remember canvas and gl context
    this.canvas = canvas;
    this.gl = gl;

    // scene loading
    this.scene = null;
    this.loadingState = {
        "currentAtomic" : 0,
        "currentComposite" : 0,
        "totalAtomic" : 0,
        "totalComposite" : 0,
        "done" : false
    }
    this.loadingCallback = null;

    // input globals
    this.controller = null;
    this.mouseChange = [0, 0];
    this.keyTracker = null;
    this.boundUpdateMousePosition = this.updateMousePosition.bind(this);

    // time variables
    this.time = 0.0;
    this.deltaTime = 0.0;

    // initiate sub-engines
    const opts = {
        clearColor: [0.75, 0.88, 0.92, 1.0]
    };
    this.renderEngine = new RenderEngine(canvas, gl, opts);
    this.physicsEngine = new PhysicsEngine();

    // raycasting variables
    this.lookingAtObj = null;
    this.rayCastT = null;

    // bind "add new" functions
    this.boundAddNewWorldObject = this.addNewWorldObject.bind(this);
    this.boundAddNewModel = this.addNewModel.bind(this);
    this.boundAddNewMaterial = this.addNewMaterial.bind(this);
}

/**
 * Creates Scene object and sets 'this.scene'. Also sets up the input handeling
 * for the scene and starts the loading of atomic and composite assets.
 *
 * @param {JSON} sceneJson the JSON object to create the scene from.
 */
GameEngine.prototype.loadScene = function(sceneJson, callback=null, verbose=false) {
    const scene = new Scene();
    this.scene = scene;
    this.createDefaults();
    this.renderEngine.scene = scene;
    this.physicsEngine.scene = scene;

    // reset the loading state and start loading assets
    this.loadingState.currentAtomic = 0;
    this.loadingState.currentComposite = 0;
    this.loadingState.totalAtomic = sceneJson.assets.meshes.length + 
                                    sceneJson.assets.textures.length;
    this.loadingState.totalComposite = sceneJson.assets.models.length + 
                                       sceneJson.assets.materials.length + 
                                       sceneJson.worldObjects.length;
    this.loadAtomicAssets(sceneJson, verbose=verbose);

    this.controller = new Controller()

    const cam = new Camera(
        [0,0,10],
        45,
        this.gl.canvas.clientWidth / this.gl.canvas.clientHeight,
        0.1,
        100
    );
    cam.AABB = new AABB(this.gl, -1, 1, -2.5, 2.5, -1, 1);
    scene.camera = cam;
    scene.worldObjects["camera"] = cam;
    this.controller.parent(cam);

    this.mouseChange = [0, 0];
    this.keyTracker = this.getKeyTracker();
    this.initInputHandeling();

    this.loadingCallback = callback;
}

// TODO: add function comment
GameEngine.prototype.loadAtomicAssets = function(sceneJson, verbose=false) {
    // load meshes
    for (var i = 0; i < sceneJson.assets.meshes.length; i++) {
        const meshData = sceneJson.assets.meshes[i];

        loadOBJ(meshData.path, (OBJFile) => {
            // parse the obj file and create mesh object
            const vertexData = parseOBJFile(OBJFile);
            const mesh = new Mesh(
                this.gl,
                meshData.id,
                meshData.path,
                vertexData.vertexPositions,
                vertexData.vertexNormals,
                vertexData.tangents,
                vertexData.bitangents,
                vertexData.vertexIndices,
                vertexData.textureCoords
            );

            // add mesh object to scene
            this.scene.assets.meshes[meshData.id] = mesh;

            // report loaded object
            this.loadingState.currentAtomic += 1;
            if (verbose) printToConsole("......Loaded mesh: " + meshData.id);

            // continue to loading materials
            if (this.loadingState.currentAtomic == this.loadingState.totalAtomic) {
                if (verbose) printToConsole("Finished loading atomic assets!");
                this.loadCompositeAssets(sceneJson, verbose=verbose);
            }
        });
    }

    // load textures
    for (var i = 0; i < sceneJson.assets.textures.length; i++) {
        const textureData = sceneJson.assets.textures[i];

        const image = new Image();
        image.onload = () => {
            const texture = new Texture(
                this.gl,
                textureData.id,
                textureData.path,
                textureData.type,
                image
            );

            // add texture to scene
            this.scene.assets.textures[textureData.id] = texture;

            // report loaded object
            this.loadingState.currentAtomic += 1;

            // continue to loading materials
            if (verbose) printToConsole("......Loaded texture: " + textureData.id);
            if (this.loadingState.currentAtomic == this.loadingState.totalAtomic) {
                if (verbose) printToConsole("Finished loading atomic assets!");
                this.loadCompositeAssets(sceneJson, verbose=verbose);
            }
        }
        image.crossOrigin = "";
        image.src = textureData.path;
    }
}

// TODO: add function comment
GameEngine.prototype.loadCompositeAssets = function(sceneJson, verbose=false) {
    // load materials
    for (var i = 0; i < sceneJson.assets.materials.length; i++) {
        const materialData = sceneJson.assets.materials[i];

        // if texture isn't specified or can't be found, use the default textures
        var diffuse = this.scene.assets.textures[materialData.diffuseTexture];
        if (materialData.diffuseTexture &&
            !diffuse) {
            console.log("Missing texture when creating material\n\tmaterial: " +
                        materialData.id + "\n\ttexture: " + materialData.diffuseTexture);
        }

        // if texture isn't specified or can't be found, use the default textures
        var normal = this.scene.assets.textures[materialData.normalTexture];
        if (materialData.normalTexture &&
            !normal) {
            console.log("Missing texture when creating material\n\tmaterial: " +
                        materialData.id + "\n\ttexture: " + materialData.normalTexture);
        }

        const material = new Material(
            materialData.id,
            diffuse,
            normal,
        )

        if (materialData.scale !== undefined) material.scale = materialData.scale;

        this.scene.assets.materials[materialData.id] = material;

        // report loaded object
        this.loadingState.currentComposite += 1;
        if (verbose) printToConsole("......Loaded material: " + materialData.id);
    }
    if (verbose) printToConsole("Finished loading materials!");
    
    // load models
    for (var i = 0; i < sceneJson.assets.models.length; i++) {
        const modelData = sceneJson.assets.models[i];

        // if mesh isn't specified or can't be found, use the default textures
        var mesh = this.scene.assets.meshes[modelData.mesh];
        if (modelData.mesh &&
            !mesh) {
            console.log("Missing mesh when creating model\n\tmodel: " +
                        modelData.id + "\n\tmesh: " + modelData.mesh);
        }
        if (!mesh) mesh = this.scene.defaultMesh;

        // if material isn't specified or can't be found, use the default textures
        var material = this.scene.assets.materials[modelData.material];
        if (modelData.material &&
            !material) {
            console.log("Missing material when creating model\n\tmodel: " +
                        modelData.id + "\n\tmaterial: " + modelData.material);
        }

        const model = new Model(
            this.gl,
            modelData.id,
            mesh,
            material
        )

        // set other settings if specified
        if (modelData.render !== undefined) model.renderSettings.render = modelData.render;
        if (modelData.castShadow !== undefined) model.renderSettings.castShadow = modelData.castShadow;
        if (modelData.recieveShadow !== undefined) model.renderSettings.recieveShadow = modelData.recieveShadow;
        if (modelData.recieveLighting !== undefined) model.renderSettings.recieveLighting = modelData.recieveLighting;
        if (modelData.animateRot !== undefined) model.animation.animateRot = modelData.animateRot;
        if (modelData.rotAxis !== undefined) model.animation.rotAxis = modelData.rotAxis;
        if (modelData.rotSpeedFactor !== undefined) model.animation.rotSpeedFactor = modelData.rotSpeedFactor;
        if (modelData.animateTrans !== undefined) model.animation.animateTrans = modelData.animateTrans;

        this.scene.assets.models[modelData.id] = model;

        // report loaded object
        this.loadingState.currentComposite += 1;
        if (verbose) printToConsole("......Loaded model: " + modelData.id);
    }
    if (verbose) printToConsole("Finished loading models!");

    // load worldObjects
    for (var i = 0; i < sceneJson.worldObjects.length; i++) {
        const wOData = sceneJson.worldObjects[i];

        const worldObject = new WorldObject(
            wOData.id,
            wOData.type
        )
        
        // set the model for the worldObject if a model is specified and loaded
        if (wOData.model && wOData.model != "none") {
            // model is specified
            if (!this.scene.assets.models[wOData.model]) {
                console.log("Missing model when creating worldObject\n\tworldObject: " +
                            wOData.id + "\n\tmodel: " + wOData.model);
            } else {
                worldObject.model = this.scene.assets.models[wOData.model];
            }
        } else if (wOData.model && wOData.model == "none") {
            // model is explicitely set to none
            worldObject.model = null;
        } else {
            // no model is specified and default model is used
            worldObject.model = this.scene.defaultModel;
        }

        // set the AABB for the worldObject
        if (wOData.AABB && wOData.AABB != "none") {
            // AABB bounds are specified
            worldObject.AABB = new AABB(this.gl);
            worldObject.AABB.setBounds(wOData.AABB);
        } else if (wOData.AABB && wOData.AABB == "none"){
            // AABB is explicitely set to none
            worldObject.AABB = null;
        } else if (worldObject.model && worldObject.model.mesh) {
            // AABB bounds are created from model
            worldObject.AABB = new AABB(this.gl);
            worldObject.AABB.setBounds(worldObject.model.getModelAABB())
        }

        // set other settings if specified
        if (wOData.position) worldObject.position = wOData.position;
        if (wOData.rotation) worldObject.rotation = wOData.rotation;
        if (wOData.scale) worldObject.scale = wOData.scale;
        if (wOData.isImmovable !== undefined) worldObject.isImmovable = wOData.isImmovable;
        if (wOData.hasCollision !== undefined) worldObject.hasCollision = wOData.hasCollision;
        if (wOData.hasGravity !== undefined) worldObject.hasGravity = wOData.hasGravity;

        this.scene.worldObjects[wOData.id] = worldObject;

        // report loaded object
        this.loadingState.currentComposite += 1;
        if (verbose) printToConsole("......Loaded worldObject: " + wOData.id);
    }

    // were all done loading!
    this.loadingState.done = true;
    if (this.loadingCallback) this.loadingCallback();
    if (verbose) printToConsole("Finished loading worldObjects!")
}

// TODO: add function comment
GameEngine.prototype.createDefaults = function() {
    const defaultTextureData = new ImageData(
        new Uint8ClampedArray([127, 127, 127, 255,]),
        1,
        1
    );
    const defaultDiffuse = new Texture(
        this.gl,
        "defaultTexture",
        "none",
        "diffuse",
        defaultTextureData
    );
    const defaultNormalMapData = new ImageData(
        new Uint8ClampedArray([127, 127, 255, 255,]),
        1,
        1
    );
    const defaultNormal = new Texture(
        this.gl,
        "defaultTexture",
        "none",
        "normal",
        defaultNormalMapData
    );
    this.scene.defaultMaterial = new Material(
        "defaultMaterial",
        defaultDiffuse,
        defaultNormal
    );

    const defaultMeshData = createBoxMeshData(3, 3, 3);
    this.scene.defaultMesh = new Mesh(
        this.gl,
        "defaultMesh",
        "none",
        defaultMeshData.vertexPositions,
        defaultMeshData.vertexNormals,
        defaultMeshData.tangents,
        defaultMeshData.bitangents,
        defaultMeshData.vertexIndices,
        defaultMeshData.textureCoords
    );

    this.scene.defaultModel = new Model(
        this.gl, 
        "defaultModel",
        this.scene.defaultMesh,
        this.scene.defaultMaterial
    );
}

/**
 * Starts the main gameloop.
 */
GameEngine.prototype.startGameLoop = function() {
    const self = this;
    self.time = 0.0;
    
    var then = 0.0;
    function gameLoop(now) {
        // calculate time between frames
        now *= 0.001;
        self.deltaTime = now - then;
        then = now;

        // handle input
        self.handleKeyboardInput();
        self.handleMouseInput();

        // update the locations of all objects
        self.physicsEngine.update(this.deltaTime);

        // raycast
        self.castRay();

        // draw the scene
        self.renderEngine.render(self.time);

        // update total time
        self.time += self.deltaTime;

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}

/**
 * Returns an object tracking the state and associated functions
 * of keyboard inputs.
 * 
 * @return {object} keytracker
 */
GameEngine.prototype.getKeyTracker = function() {
    return {
        'a' : {pressed: false, func: this.controller.moveLeft},
        'd' : {pressed: false, func: this.controller.moveRight},
        'w' : {pressed: false, func: this.controller.moveForward},
        's' : {pressed: false, func: this.controller.moveBackward},
        ' ' : {pressed: false, func: this.controller.jump}
    };
}

/**
 * Initializes pointerlock, mouse tracking and keyboard tracking.
 * 
 * NOTE: 'this.keyTracker' must be set before calling this function.
 */
GameEngine.prototype.initInputHandeling = function() {
    const self = this;
    
    // set up pointer lock and mouse tracking
    this.canvas.requestPointerLock = this.canvas.requestPointerLock ||
                                     this.canvas.mozRequestPointerLock;
    this.canvas.onclick = function() {
        self.canvas.requestPointerLock();
    }
    document.addEventListener('pointerlockchange', function() {
        self.onPointerLockChange();
    });
    document.addEventListener('mozpointerlockchange', function() {
        self.onPointerLockChange();
    });
    
    // set up keytracking
    this.canvas.addEventListener('keydown', function(e) {
        if (self.keyTracker[e.key.toLowerCase()]) {
            self.keyTracker[e.key.toLowerCase()].pressed = true;
            e.preventDefault();
        }
    });
    this.canvas.addEventListener('keyup', function(e) {
        if (self.keyTracker[e.key.toLowerCase()]) {
            self.keyTracker[e.key.toLowerCase()].pressed = false;
            e.preventDefault();
        }
    });
}

/**
 * Adds an event listener when pointerlock is activated and removes event
 * listener when pointerlock is deactivated.
 */
GameEngine.prototype.onPointerLockChange = function() {
    if (document.pointerLockElement === this.canvas ||
        document.mozPointerLockElement === this.canvas) {
        document.addEventListener('mousemove', this.boundUpdateMousePosition, false);
    } else {
        document.removeEventListener('mousemove', this.boundUpdateMousePosition, false);
    }
}

/**
 * Updates the change in mouse position when mouse is moved. 
 * This can be called multiple times between frames.
 */
GameEngine.prototype.updateMousePosition = function(e) {
    this.mouseChange[0] += e.movementX;
    this.mouseChange[1] += e.movementY;
}

/**
 * Handles mouse inputs for each new frame.
 */
GameEngine.prototype.handleMouseInput = function() {
    const currentMouseChange = this.mouseChange;
    this.mouseChange = [0, 0];
    this.controller.turn(currentMouseChange, this.deltaTime);
}

/**
 * Handles keyboard inputs for each new frame.
 */
GameEngine.prototype.handleKeyboardInput = function() {
    for (var key in this.keyTracker) {
        if (this.keyTracker[key].pressed) {
            this.keyTracker[key].func(this.deltaTime);
        }
    }
}

/**
 * Loads an image and sets it as a texture.
 * 
 * @param {string} modelId the Id of the model the texture belongs to.
 * @param {string} url the url to load the image from.
 */
GameEngine.prototype.loadTextureImage = function(model, url) {
    const image = new Image();
    image.onload = () => {
        model.material = new Material(image);
        model.setTextureBuffer();
    }
    image.crossOrigin = "";
    image.src = url;
}

/**
 * Loads and parses an OBJFile and sets it as the mesh of a given model.
 * 
 * @param {string} modelId the Id of the model the mesh belongs to.
 * @param {string} url the url to load the .obj file from.
 */
GameEngine.prototype.loadOBJFile = function(worldObject, url) {
    loadOBJ(url, (OBJFile) => {
        const meshData = parseOBJFile(OBJFile);
        const mesh = new Mesh(
            meshData.vertexPositions,
            meshData.vertexNormals,
            meshData.vertexIndices,
            meshData.textureCoords
        );
        worldObject.model.mesh = mesh;
        worldObject.model.setMeshBuffers();
        worldObject.AABB.setBounds(worldObject.model.getModelAABB());
    });
}

// TODO: add function comment
GameEngine.prototype.castRay = function() {
    // reset lookingAtObj
    this.lookingAtObj = null;


    // for each world object with an AABB, check for ray intersection and
    // find the smallest distance
    var minT = Number.MAX_VALUE;
    var minObj = null;
    for (let id in this.scene.worldObjects) {
        const obj = this.scene.worldObjects[id];

        if (!obj.AABB || obj.id == "camera") {
            continue;
        }
    
        debugGlobal2 = obj;
        const t = this.rayAABBIntersect(this.controller.child.position, 
                                        this.controller.child.front,
                                        obj.getWorldSpaceAABBBounds());
        if (t && t < minT) {
            minT = t;
            minObj = obj;
        }
    }

    this.lookingAtObj = minObj;
    this.rayCastT = minT;
}

// TODO: add function comment
GameEngine.prototype.rayAABBIntersect = function(rayO, rayD, AABB) {
    // src: https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection
    var tMin = (AABB.minX - rayO[0]) / rayD[0];
    var tMax = (AABB.maxX - rayO[0]) / rayD[0];

    // ray has negative x-direction
    var temp;
    if (tMin > tMax) {
        temp = tMin;
        tMin = tMax;
        tMax = temp;
    }

    var tMinY = (AABB.minY - rayO[1]) / rayD[1];
    var tMaxY = (AABB.maxY - rayO[1]) / rayD[1];

    // ray has negative y-direction
    if (tMinY > tMaxY) {
        temp = tMinY;
        tMinY = tMaxY;
        tMaxY = temp;
    }

    // ray misses on the X-Y axes
    if (tMin > tMaxY || tMinY > tMax) {
        return false;
    }

    // get the tMin that actually lies on the AABB, rather than the one that
    // lies on the parallel plane
    if (tMinY > tMin) {
        tMin = tMinY;
    }

    // get the tMax that actually lies on the AABB, rather than the one that
    // lies on the parallel plane
    if (tMaxY < tMax) {
        tMax = tMaxY;
    }

    var tMinZ = (AABB.minZ - rayO[2]) / rayD[2];
    var tMaxZ = (AABB.maxZ - rayO[2]) / rayD[2];

    // ray has negative z-direction
    if (tMinZ > tMaxZ) {
        temp = tMinZ;
        tMinZ = tMaxZ;
        tMaxZ = temp;
    }

    // ray misses on the Z axis
    if (tMin > tMaxZ || tMinZ > tMax) {
        return false;
    }

    // get the tMin that actually lies on the AABB, rather than the one that
    // lies on the parallel plane
    if (tMinZ > tMin) {
        tMin = tMinZ;
    }

    // get the tMax that actually lies on the AABB, rather than the one that
    // lies on the parallel plane
    if (tMaxZ < tMax) {
        tMax = tMaxZ;
    }

    // only look in the positive ray direction
    if (tMin < 0) {
        return false;
    } else {
        return tMin;
    }
}

// TODO: what is this function for???
GameEngine.prototype.logLoadText = function(s) {
    if (this.loadingStateOutput) {
        this.loadingStateOutput.innerHTML = s;
    }
}

/**
 * Adds a new default worldObject to the scene.
 */
 GameEngine.prototype.addNewWorldObject = function() {
    const id = Math.floor(Math.random() * 100000).toString();
    const worldObject = new WorldObject(
        id,
        "model",
        [0,0,0],
        [0,0,0],
        [1,1,1],
        true,
        true,
        true
    );
    worldObject.model = this.scene.defaultModel;

    this.scene.worldObjects[id] = worldObject;

    return id;
}

/**
 * Adds a new default model to the scene.
 */
 GameEngine.prototype.addNewModel = function() {
    const id = Math.floor(Math.random() * 100000).toString();
    const model = new Model(
        this.gl, 
        id,
        this.scene.defaultMesh,
        this.scene.defaultMaterial
    );

    this.scene.assets.models[id] = model;

    return id;
}

/**
 * Adds a new default material to the scene.
 */
 GameEngine.prototype.addNewMaterial = function() {
    const id = Math.floor(Math.random() * 100000).toString();
    const material = new Material(
        id,
        this.scene.defaultDiffuse,
        this.scene.defaultNormal
    );

    this.scene.assets.materials[id] = material;

    return id;
}