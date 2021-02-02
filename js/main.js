debugGlobal = null;
logCounter = 0;

sceneDescriptions = [
    "scenes/scene1.json",
    "scenes/scene2.json"
];

function main() {
    loadJSON("scenes/scene1.json", demo);
}

function demo(sceneJson) {
    // Find our webGL canvas
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");

    // Make sure gl could be initialized
    if (gl == null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    const depthTextureExtension = gl.getExtension('WEBGL_depth_texture');
    if (depthTextureExtension == null) {
        alert("Unable to get depth texture extension, your browser may not support it.");
        return;
    }

    let engine = new GameEngine(canvas, gl);
    debugGlobal = engine;
    engine.loadScene(sceneJson);
    engine.startGameLoop();

    window.setInterval( () => {
        document.getElementById("overlay_content").innerHTML = "fps: "  + (1 / engine.deltaTime).toFixed(2);
    }, 100);

    window.setInterval( () => {
        document.getElementById("debug_output").innerHTML = debugGlobal.controller.position;
    }, 1000);

    setupSettings();

    console.log("Main done!")
}

function setupSettings() {
    // shadow sliders
    document.getElementById("X_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[0] = this.value;
        debugGlobal.scene.worldObjects["light model"].position[0] = this.value;
        document.getElementById("X_value").innerHTML = this.value;
    }
    document.getElementById("Y_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[1] = this.value;
        debugGlobal.scene.worldObjects["light model"].position[1] = this.value;
        document.getElementById("Y_value").innerHTML = this.value;
    }
    document.getElementById("Z_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[2] = this.value;
        debugGlobal.scene.worldObjects["light model"].position[2] = this.value;
        document.getElementById("Z_value").innerHTML = this.value;
    }
    document.getElementById("light_fov_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.fov = this.value;
        document.getElementById("light_fov_value").innerHTML = this.value;
    }
    document.getElementById("shadow_bias_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.bias = parseFloat(this.value);
        document.getElementById("shadow_bias_value").innerHTML = this.value;
    }
    document.getElementById("light_zNear_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.zNear = parseInt(this.value);
        document.getElementById("light_zNear_value").innerHTML = this.value;
    }
    document.getElementById("light_zFar_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.zFar = parseInt(this.value);
        document.getElementById("light_zFar_value").innerHTML = this.value;
    }

    // player sliders
    document.getElementById("player_fov_slider").oninput = function() {
        debugGlobal.renderEngine.scene.camera.fieldOfView = parseInt(this.value);
        document.getElementById("player_fov_value").innerHTML = this.value;
    }
    document.getElementById("player_zNear_slider").oninput = function() {
        debugGlobal.renderEngine.scene.camera.zNear = parseFloat(this.value);
        document.getElementById("player_zNear_value").innerHTML = this.value;
    }
    document.getElementById("player_zFar_slider").oninput = function() {
        debugGlobal.renderEngine.scene.camera.zFar = parseFloat(this.value);
        document.getElementById("player_zFar_value").innerHTML = this.value;
    }

    // scene dropdown
    for (var i = 0; i < sceneDescriptions.length; i++){
        const sceneDescription = sceneDescriptions[i];
        const option = document.createElement("option");
        option.value = sceneDescription;
        option.text = sceneDescription;
        document.getElementById("scene_dropdown").add(option);
    }
    document.getElementById("scene_dropdown").onchange = function() {
        loadJSON(this.value, function(sceneJson) {
            debugGlobal.loadScene(sceneJson);
            populateObjectDropdown("controller_child_dropdown", true);
            populateObjectDropdown("object_dropdown");
        })
    }

    // scene reload button
    document.getElementById("reload_button").onclick = function() {
        loadJSON(document.getElementById("scene_dropdown").value, function(sceneJson) {
            debugGlobal.loadScene(sceneJson);
            populateObjectDropdown("controller_child_dropdown", true);
            populateObjectDropdown("object_dropdown");
        })
    }

    // flying checkbox
    document.getElementById("flying_checkbox").onclick = function() {
        if (this.checked) {
            debugGlobal.controller.startFlying();
        } else {
            debugGlobal.controller.stopFlying();
        }
    }

    // controller slider
    document.getElementById("movement_speed_slider").oninput = function() {
        debugGlobal.controller.movementSpeed = parseInt(this.value);
        document.getElementById("movement_speed_value").innerHTML = this.value;
    }
    document.getElementById("sensitivity_slider").oninput = function() {
        debugGlobal.controller.turnSpeed = parseInt(this.value);
        document.getElementById("sensitivity_value").innerHTML = this.value;
    }
    document.getElementById("jump_height_slider").oninput = function() {
        debugGlobal.controller.jumpHeight = parseInt(this.value);
        document.getElementById("jump_height_value").innerHTML = this.value;
    }
    document.getElementById("gravity_slider").oninput = function() {
        debugGlobal.controller.gravity = parseFloat(this.value);
        document.getElementById("gravity_value").innerHTML = this.value;
    }
    document.getElementById("friction_slider").oninput = function() {
        debugGlobal.controller.frictionFactor = parseFloat(this.value);
        document.getElementById("friction_value").innerHTML = this.value;
    }

    // controller child dropdown
    populateObjectDropdown("controller_child_dropdown", true);
    document.getElementById("controller_child_dropdown").onchange = function() {
        if (this.value == "camera") {
            debugGlobal.controller.parent(debugGlobal.scene.camera)
        } else {
            debugGlobal.controller.parent(debugGlobal.scene.worldObjects[this.value]);
        }   
    }

    // object render settings dropdown
    populateObjectDropdown("object_dropdown")
    document.getElementById("object_dropdown").onchange = function() {
        currentObject = this.value; 
    }

    // render checkbox
    document.getElementById("render_checkbox").onclick = function() {
        const worldObject = debugGlobal.scene.worldObjects[
            document.getElementById("object_dropdown").value
        ];
        if (this.checked) {
            worldObject.model.renderSettings.render = true;
        } else {
            worldObject.model.renderSettings.render = false;
        }
    }

    // shadow checkbox
    document.getElementById("shadow_checkbox").onclick = function() {
        const worldObject = debugGlobal.scene.worldObjects[
            document.getElementById("object_dropdown").value
        ];
        if (this.checked) {
            worldObject.model.renderSettings.castShadow = true;
        } else {
            worldObject.model.renderSettings.castShadow = false;
        }
    }

    // render AABB
    document.getElementById("AABB_checkbox").onclick = function() {
        const worldObject = debugGlobal.scene.worldObjects[
            document.getElementById("object_dropdown").value
        ];
        if (this.checked) {
            worldObject.model.renderSettings.renderAABB = true;
        } else {
            worldObject.model.renderSettings.renderAABB = false;
        }
    }
}

function populateObjectDropdown(dropdownId, addCamera=false) {
    // clear the dropdown list
    const len = document.getElementById(dropdownId).options.length;
    for (var i = len - 1; i >= 0; i--) {
        document.getElementById(dropdownId).remove(i);
    }

    // add camera
    if (addCamera) {
        const option = document.createElement("option");
        option.value = "camera";
        option.text = "Player Camera";
        document.getElementById(dropdownId).add(option);
    }

    // add all worldObjects
    const keys = Object.keys(debugGlobal.scene.worldObjects);
    for (var i = 0; i < keys.length; i++) {
        const option = document.createElement("option");
        option.value = keys[i];
        option.text = keys[i];
        document.getElementById(dropdownId).add(option);
    }
}

onload = main;