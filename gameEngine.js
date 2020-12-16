var GameEngine = function(canvas, gl) {
    // remember canvas and gl context
    this.canvas = canvas;
    this.gl = gl;

    // current scene
    this.scene = null;

    // input globals
    this.mouseChange = [0, 0];
    this.keyTracker = null;
    this.boundUpdateMousePosition = this.updateMousePosition.bind(this);

    // keep track of time
    this.time = 0.0;
    this.deltaTime = 0.0;

    // set render settings and create render engine
    const opts = {
        fov: 45,
        clearColor: [0.75, 0.88, 0.92, 1.0]
    };
    this.renderEngine = new RenderEngine(canvas, gl, opts);
}

/**
 * Creates Scene object and sets 'this.scene'. Also sets up the input handeling
 * for the scene.
 *
 * @param {JSON} sceneJson the JSON object to create the scene from.
 */
GameEngine.prototype.loadScene = function(sceneJson) {
    // create and set the scene for the game engine
    this.scene = this.parseSceneJSON(sceneJson);
    const camera = new Camera();
    this.scene.camera = camera;

    // set the scene for the renderengine
    this.renderEngine.setScene(this.scene);
    
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
    // TODO make this also create the camera object
    var modelArray = [];

    for (var i = 0; i < jsonObj.objects.length; i++) {
        const model = jsonObj.objects[i];

        var boxData = createBox(
            model.sizes[0],
            model.sizes[1],
            model.sizes[2]
        );
        const box = {
            position: model.position,
            numVertices: boxData.vertexIndices.length,
            // TODO data -> meshdata
            data: boxData,
            animate: model.animate,
            rotSpeedFactor: model.rotSpeedFactor,
            rotAxis: model.rotAxis
        };
        modelArray.push(box);
    }

    const scene = new Scene();
    scene.models = modelArray;
    
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

        // draw the scene
        self.renderEngine.drawScene(self.time);

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
        'a' : {pressed: false, func: this.scene.camera.moveLeft},
        'd' : {pressed: false, func: this.scene.camera.moveRight},
        'w' : {pressed: false, func: this.scene.camera.moveForward},
        's' : {pressed: false, func: this.scene.camera.moveBackward}
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
    this.canvas.addEventListener('keydown', function() {
        if (self.keyTracker[event.key.toLowerCase()]) {
            self.keyTracker[event.key.toLowerCase()].pressed = true;
        }
    });
    this.canvas.addEventListener('keyup', function() {
        if (self.keyTracker[event.key.toLowerCase()]) {
            self.keyTracker[event.key.toLowerCase()].pressed = false;
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
GameEngine.prototype.updateMousePosition = function() {
    this.mouseChange[0] += event.movementX;
    this.mouseChange[1] += event.movementY;
}

/**
 * Handles mouse inputs for each new frame.
 */
GameEngine.prototype.handleMouseInput = function() {
    const currentMouseChange = this.mouseChange;
    this.mouseChange = [0, 0];
    this.scene.camera.turnCamera(currentMouseChange);
}

/**
 * Handles keyboard inputs for each new frame.
 */
GameEngine.prototype.handleKeyboardInput = function() {
    for (var key in this.keyTracker) {
        if (this.keyTracker[key].pressed) {
            this.keyTracker[key].func();
        }
    }
}