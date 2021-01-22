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
    for (let modelId in this.scene.models) {
        const model = this.scene.models[modelId];

        if (model.texture) {
            this.loadTextureImage(modelId, model.texture);
        }

        if (model.type == "obj" && model.filePath) {
            this.loadOBJFile(modelId, model.filePath);
        }
    }
    
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
    var modelDict = {};

    for (var i = 0; i < jsonObj.objects.length; i++) {
        const model = jsonObj.objects[i];

        var meshData;
        if (model.type == "box") {
            meshData = createBox(
                model.sizes[0],
                model.sizes[1],
                model.sizes[2]
            );
        } else {
            meshData = null;
        }

        const object = {
            type: model.type,
            filePath: model.file_path,
            position: model.position,
            texture: model.texture,
            vertexData: meshData,
            animateTrans: model.animateTrans,
            animateRot: model.animateRot,
            rotSpeedFactor: model.rotSpeedFactor,
            rotAxis: model.rotAxis,
            AABB: null
        };

        // create AABB
        if (object.vertexData) {
            object.AABB = this.createAABB(object);
        }

        modelDict[model.id] = object;
    }

    const scene = new Scene();
    scene.models = modelDict;

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
GameEngine.prototype.loadTextureImage = function(modelId, url) {
    const image = new Image();
    image.onload = () => {
        this.renderEngine.setTexture(modelId, image);
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
GameEngine.prototype.loadOBJFile = function(modelId, url) {
    loadOBJ(url, (OBJFile) => {
        const mesh = parseOBJFile(OBJFile);
        this.renderEngine.setMesh(modelId, mesh);
        this.scene.models[modelId].AABB = this.createAABB(this.scene.models[modelId]);
    });
}

/**
 * Creates Axis-aligned bounding box for a given worldObject.
 * 
 * @param {object} worldObject the object for which to create an AABB
 * @return {dictionary} an dictionary containing the bounds of a AABB
 */
GameEngine.prototype.createAABB = function(worldObject) {
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    var minZ = Infinity;
    var maxZ = -Infinity;
    
    for (var i = 0; i < worldObject.vertexData.vertexPositions.length; i += 3) {
        const x = worldObject.vertexData.vertexPositions[i];
        const y = worldObject.vertexData.vertexPositions[i+1];
        const z = worldObject.vertexData.vertexPositions[i+2];

        if (x < minX) {
            minX = x;
        } else if (x > maxX) {
            maxX = x;
        }

        if (y < minY) {
            minY = y;
        } else if (y > maxY) {
            maxY = y;
        }

        if (z < minZ) {
            minZ = z;
        } else if (z > maxZ) {
            maxZ = z;
        }
    }

    return {
        "minX" : minX,
        "maxX" : maxX,
        "minY" : minY,
        "maxY" : maxY,
        "minZ" : minZ,
        "maxZ" : maxZ,
    }
}