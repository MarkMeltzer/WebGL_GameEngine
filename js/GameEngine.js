var GameEngine = function(canvas, gl) {
    // remember canvas and gl context
    this.canvas = canvas;
    this.gl = gl;

    // current scene
    this.scene = null;

    // input globals
    this.controller = null;
    this.mouseChange = [0, 0];
    this.keyTracker = null;
    this.boundUpdateMousePosition = this.updateMousePosition.bind(this);

    // keep track of time
    this.time = 0.0;
    this.deltaTime = 0.0;

    // set render settings and create render engine
    const opts = {
        clearColor: [0.75, 0.88, 0.92, 1.0]
    };
    this.renderEngine = new RenderEngine(canvas, gl, opts);

    this.physicsEngine = new PhysicsEngine();
}

/**
 * Creates Scene object and sets 'this.scene'. Also sets up the input handeling
 * for the scene. Also starts the texture and mesh loading.
 *
 * @param {JSON} sceneJson the JSON object to create the scene from.
 */
GameEngine.prototype.loadScene = function(sceneJson) {
    // create and set the scene for the game engine
    this.scene = this.parseSceneJSON(sceneJson);

    // set the scene for the renderengine
    this.renderEngine.setScene(this.scene);

    // start loading the textures and meshes
    for (let id in this.scene.worldObjects) {
        const object = this.scene.worldObjects[id];

        if (object.model.texturePath) {
            this.loadTextureImage(object.model, object.model.texturePath);
        }

        if (object.type == "obj" && object.model.filePath) {
            this.loadOBJFile(object.model, object.model.filePath);
        }
    }

    // set the scene for the physicsEngine
    this.physicsEngine.setScene(this.scene);
    
    // set up input handeling
    this.mouseChange = [0, 0];
    this.keyTracker = this.getKeyTracker();
    this.initInputHandeling();
}

/**
 * Creates a scene object from a JSON object.
 * 
 * @param {JSON} jsonObj the JSON object containing scene data.
 * @return {Scene} the Scene object.
 */
GameEngine.prototype.parseSceneJSON = function(jsonObj) {
    var objectDict = {};

    for (var i = 0; i < jsonObj.worldObjects.length; i++) {
        const objectDescription = jsonObj.worldObjects[i];

        const worldObject = new WorldObject(
            objectDescription.id,
            objectDescription.type,
            objectDescription.position,
            [0, 0, 0], // TODO actually add support for rotation
        )

        if (objectDescription.type == "box") {
            const meshData = createBox(
                objectDescription.sizes[0],
                objectDescription.sizes[1],
                objectDescription.sizes[2]
            );

            var model = new Model(
                this.gl,
                null,
                objectDescription.texture,
                true,
                objectDescription.rotAxis,
                objectDescription.animateTrans,
                objectDescription.animateRot,
                objectDescription.rotSpeedFactor
            );

            const mesh = new Mesh(
                meshData.vertexPositions,
                meshData.vertexNormals,
                meshData.vertexIndices,
                meshData.textureCoords
            );

            model.mesh = mesh;
        } else {
            var model = new Model(
                this.gl,
                objectDescription.file_path,
                objectDescription.texture,
                true,
                objectDescription.rotAxis,
                objectDescription.animateTrans,
                objectDescription.animateRot,
                objectDescription.rotSpeedFactor
            )
        }

        worldObject.model = model;

        objectDict[worldObject.id] = worldObject;
    }

    const scene = new Scene();
    scene.worldObjects = objectDict;

    this.controller = new Controller()

    const cam = new Camera(
        [0,0,10],
        45,
        this.gl.canvas.clientWidth / this.gl.canvas.clientHeight,
        0.1,
        100
    );
    scene.camera = cam;
    this.controller.parent(cam);
    
    return scene;
}

/**
 * Starts the main gameloop.
 */
GameEngine.prototype.startGameLoop = function() {
    const self = this;
    
    var then = 0.0;
    function gameLoop(now) {
        // calculate time between frames
        now *= 0.001;
        self.deltaTime = now - then;
        then = now;

        // handle input
        self.handleKeyboardInput();
        self.handleMouseInput();
        self.controller.update();

        // update the locations of all objects
        self.physicsEngine.updateScene();

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
GameEngine.prototype.loadOBJFile = function(model, url) {
    loadOBJ(url, (OBJFile) => {
        const meshData = parseOBJFile(OBJFile);
        const mesh = new Mesh(
            meshData.vertexPositions,
            meshData.vertexNormals,
            meshData.vertexIndices,
            meshData.textureCoords
        );
        model.mesh = mesh;
        model.setMeshBuffers();
        model.setAABBBuffer();
    });
}