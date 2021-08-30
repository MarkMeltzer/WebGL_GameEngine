// globals
gameEngine = null;
selectedObject = null;

// init scenes
initScenes();

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

    // ignore this
    document.addEventListener("keydown", (e)=> {
        if (e.key == "f") {
            const div = document.getElementById("fullscreen-div");
            if (div.style.display == "none") {
                div.style.display = "block";
            } else {
                div.style.display = "none";
            }
        }
    })
;}

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
            selectedObject ? "Selected object: " + selectedObject.id : "Selected object: None";
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
    window.setInterval( () => {
        document.getElementById("stats-r1c2").innerHTML = 
            "Current scene: " + 
            currentScene;
    }, 1000);
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
        const blob = new Blob([JSON.stringify(gameEngine.scene)], {type:"application/json"});
        window.open(URL.createObjectURL(blob));
    }
    document.getElementById("reload-button").onclick = function() {
        loadSceneAndRefreshFrontend(currentScene);
        printToConsole("Reloaded scene!");
    }
    document.getElementById("save-scene-text").setAttribute("placeholder", "Scene name")
    document.getElementById("save-scene-button").onclick = saveScene;
    document.getElementById("clear-local-button").onclick = function() {
        // check to be sure
        let confirmed = confirm("Are you sure you want to delete all locally stored scenes?");
        if (!confirmed) { return }

        // clear localStorage and reload default scene
        localStorage.clear();
        sceneDescriptions = sceneDescriptions.filter(
            scenePath => scenePath.split("/")[0] != "localStorage"
        );
        currentScene = sceneDescriptions[0];
        loadSceneAndRefreshFrontend(currentScene);
        printToConsole("Cleared all locally stored scenes!");
    }

    // controller settings
    setupControllerDropdown();
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
    // display the correct pane when clicking the button
    document.getElementById("object-settings-button").onclick = function() {
        this.checked = true;
        document.getElementById("object-settings").style.display = "block";
        document.getElementById("global-settings").style.display = "none";
    }

    // hide all settings
    hideElement("transform-settings");
    hideElement("AABB-settings");
    hideElement("sub-objects-worldObject");
    hideElement("sub-objects-model");
    hideElement("sub-objects-material");
    hideElement("render-settings");
    hideElement("material-settings");
    hideElement("mesh-settings");
    hideElement("texture-settings");

    // only show and set up the relevant settings
    const objectType = getTypeOfObject(selectedObject);
    if (objectType == "worldObject" || objectType == "camera") {
        // transform settings
        showElement("transform-settings");
        setupVec3Slider("pos", ["position"], parseFloat, true);
        setupVec3Slider("rot", ["rotation"], parseFloat, true);
        setupVec3Slider("scale", ["scale"], parseFloat, true);
        
        // sub objects
        showElement("sub-objects-worldObject");
        setupObjectDropdown("model", ["assets", "models"], [], "model");
        
        // AABB settings
        showElement("AABB-settings");
        setupCheckbox("render-AABB", ["AABB"], "render", true);
    } else if(objectType == "model") {
        // model/render settings
        showElement("render-settings");
        setupCheckbox("render", ["renderSettings"], "render", true);
        setupCheckbox("cast-shadow", ["renderSettings"], "castShadow", true);
        setupCheckbox("recv-shadow", ["renderSettings"], "recieveShadow", true);
        setupCheckbox("recv-lighting", ["renderSettings"], "recieveLighting", true);

        // sub objects
        showElement("sub-objects-model");
        setupObjectDropdown("mesh", ["assets", "meshes"], [], "mesh");
        setupObjectDropdown("material", ["assets", "materials"], [], "material");
    } else if(objectType == "material") {
        // material settings
        showElement("material-settings");
        setupSlider("texture-scale", [], "scale", parseFloat, true);
        setupSlider("diffuse-strength", [], "diffuseStrength", parseFloat, true);
        setupSlider("specular-strength", [], "specularStrength", parseFloat, true);
        setupSlider("specular-exponent", [], "specularExponent", parseFloat, true);
        setupCheckbox("use-diffuse", [], "useDiffuse", true);
        setupCheckbox("use-normal", [], "useNormal", true);

        // sub objects
        showElement("sub-objects-material");
        setupObjectDropdown("diffuse", ["assets", "textures"], [], "diffuseTexture");
        setupObjectDropdown("normal", ["assets", "textures"], [], "normalTexture");
    } else if(objectType == "mesh") {
        // mesh settings
        showElement("mesh-settings");
    } else if(objectType == "texture") {
        // texture settings
        showElement("texture-settings");
        setUpImagePreview("texture-preview", [], "data");
    }
}

onload = main;