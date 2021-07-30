// globals
gameEngine = null;
selectedObject = null;
sceneDescriptions = [
    "scenes/scene1_v2.json",
    "scenes/scene2_v2.json"
];
currentScene = sceneDescriptions[0];

function main() {
    // initialize WebGL
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");
    if (gl == null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    const depthTextureExtension = gl.getExtension('WEBGL_depth_texture');
    if (depthTextureExtension == null) {
        alert("Unable to get depth texture extension, your browser may not support it.");
        return;
    }

    // start the game engine
    gameEngine = new GameEngine(canvas, gl);

    // load the default scene
    loadSceneAndRefreshFrontend(currentScene, startNewGameLoop=true);

    // set up the statistics in the middle pane
    setupStats();
}

/**
 * Set up the statistics monitoring in the middle pane.
 */
 function setupStats() {
    window.setInterval( () => {
        document.getElementById("stats-r1c1").innerHTML = 
            "fps: "  + (1 / gameEngine.deltaTime).toFixed(2);
    }, 100);

    window.setInterval( () => {
        document.getElementById("stats-r2c1").innerHTML = 
            selectedObject ? "Selected object: " + selectedObject : "Selected object: None";
    }, 100);

    window.setInterval( () => {
        document.getElementById("stats-r3c1").innerHTML = 
            "Game time (seconds): " + gameEngine.time.toFixed(2);
    }, 500);

    window.setInterval( () => {
        document.getElementById("stats-r4c1").innerHTML = 
            (gameEngine.loadingState.currentAtomic +
            gameEngine.loadingState.currentComposite) + 
            " / " + 
            (gameEngine.loadingState.totalAtomic + 
            gameEngine.loadingState.totalComposite) + 
            " items loaded!";
    }, 100);
}

/**
 * Setup the global(object-independent) settings in the right pane.
 */
function setupGlobalSettings() {
    // display the right pane when clicking the button
    document.getElementById("global-settings-button").onclick = function() {
        document.getElementById("object-settings").style.display = "none";
        document.getElementById("global-settings").style.display = "block";
    }
    document.getElementById("global-settings-button").checked = true;

    // lighting settings
    setupVec3Slider("light", ["renderEngine", "scene", "light"], parseInt);
    setupSlider("light-fov", ["renderEngine", "shadowmapSettings"], "fov", parseInt);
    setupSlider("shadow-bias", ["renderEngine", "shadowmapSettings"], "bias", parseFloat);
    setupSlider("light-znear", ["renderEngine", "shadowmapSettings"], "zNear", parseInt);
    setupSlider("light-zfar", ["renderEngine", "shadowmapSettings"], "zFar", parseInt);
    
    
    // player settings 
    setupSlider("fov", ["renderEngine", "scene", "camera"], "fieldOfView", parseInt);
    setupSlider("znear", ["renderEngine", "scene", "camera"], "zNear", parseFloat);
    setupSlider("zfar", ["renderEngine", "scene", "camera"], "zFar", parseFloat);

    // scene setttings
    setupSceneDropdown();
    document.getElementById("view-scene-json-button").onclick = function() {
        window.open(currentScene);
    }
    document.getElementById("reload-button").onclick = function() {
        loadSceneAndRefreshFrontend(currentScene);
        printToConsole("Reloaded scene!");
    }

    // controller settings
    setupObjectDropdown();
    setupCheckbox("flying", ["controller", "child"], "flying");
    setupSlider("movespeed", ["controller"], "movementSpeed", parseInt);
    setupSlider("sensitivity", ["controller"], "turnSpeed", parseInt);
    setupSlider("jump-height", ["controller"], "jumpHeight", parseInt);

    // physics settings
    setupSlider("gravity", ["physicsEngine"], "gravity", parseFloat);
    setupSlider("friction", ["physicsEngine"], "frictionFactor", parseFloat);
}

/**
 * Set up settings object settings in the right pane.
 */
function setupObjectSettings() {
    // display the right pane when clicking the button
    document.getElementById("object-settings-button").onclick = function() {
        this.checked = true;
        document.getElementById("object-settings").style.display = "block";
        document.getElementById("global-settings").style.display = "none";
    }

    // transform settings
    setupVec3Slider("pos", ["position"], parseFloat, true);
    setupVec3Slider("rot", ["rotation"], parseFloat, true);


    // render settings
    setupCheckbox("render", ["model", "renderSettings"], "render", true);
    setupCheckbox("cast-shadow", ["model", "renderSettings"], "castShadow", true);
    setupCheckbox("recv-shadow", ["model", "renderSettings"], "recieveShadow", true);
    setupCheckbox("recv-lighting", ["model", "renderSettings"], "recieveLighting", true);
    setupCheckbox("render-AABB", ["AABB"], "render", true);
    setupSlider("texture-scale", ["model", "material"], "scale", parseFloat, true);
}

onload = main;