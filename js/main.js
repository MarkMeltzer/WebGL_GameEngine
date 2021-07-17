debugGlobal = null;
debugGlobal2 = null;
logCounter = 0;

sceneDescriptions = [
    "scenes/scene1_v2.json"
];

function main() {
    loadJSON("scenes/scene1_v2.json", demo);
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

    // setup engine
    let engine = new GameEngine(canvas, gl);
    debugGlobal = engine;
    engine.loadScene(sceneJson, afterLoading);
    engine.startGameLoop();

    // set up some output
    window.setInterval( () => {
        document.getElementById("fps").innerHTML = "fps: "  + (1 / engine.deltaTime).toFixed(2);
    }, 100);

    window.setInterval( () => {
        // document.getElementById("debug_output").innerHTML = (debugGlobal.lookingAtObj) ? debugGlobal.lookingAtObj.id : "None";
        document.getElementById("debug_output").innerHTML = (engine.loadingState.currentAtomic +
                                                            engine.loadingState.currentComposite) + 
                                                            " / " + 
                                                            (engine.loadingState.totalAtomic + 
                                                            engine.loadingState.totalComposite) + 
                                                            " items loaded!";
    }, 100);

    console.log("demo() done!")
}

function afterLoading() {
    setupSettings();

    // temporarily set flying to be on by default for the player camera
    document.getElementById("flying_checkbox").click();
}

const assert = function(condition, message) {
    if (!condition)
        throw Error('Assert failed: ' + (message || ''));
};

function setupSettings() {
    // set up tabs
    currentPanel = null;
    currentButton = null;
    document.getElementById("shadow_settings_button").click();

    initShadowPanel();
    initPlayerPanel();
    initScenePanel();
    initControllerPanel();
    initObjectPanel();
    initPhysicsPanel();
}

function initShadowPanel() {
    // shadow sliders
    document.getElementById("X_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[0] = this.value;
        document.getElementById("X_value").innerHTML = this.value;
    }
    document.getElementById("Y_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[1] = this.value;
        document.getElementById("Y_value").innerHTML = this.value;
    }
    document.getElementById("Z_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[2] = this.value;
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
}

function initPlayerPanel() {
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
}

function initScenePanel() {
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
            populateObjectDropdown("controller_child_dropdown");
            populateObjectDropdown("object_dropdown");
        })
    }

    // scene reload button
    document.getElementById("reload_button").onclick = function() {
        loadJSON(document.getElementById("scene_dropdown").value, function(sceneJson) {
            debugGlobal.loadScene(sceneJson, () => {
                populateObjectDropdown("controller_child_dropdown");
                populateObjectDropdown("object_dropdown");
            });
        })
    }
}

function initControllerPanel() {
    // flying checkbox
    document.getElementById("flying_checkbox").onclick = function() {
        debugGlobal.controller.child.flying = this.checked;
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

    // controller child dropdown
    document.getElementById("controller_child_dropdown").onchange = function() {
        debugGlobal.controller.parent(debugGlobal.scene.worldObjects[this.value]);
        document.getElementById("flying_checkbox").checked = debugGlobal.controller.child.flying;
    }
    populateObjectDropdown("controller_child_dropdown");
}

function initObjectPanel() {
    // object render settings dropdown
    document.getElementById("object_dropdown").onchange = function() {
        const currentObject = debugGlobal.scene.worldObjects[this.value]
        // render checkbox
        if (currentObject.model) {
            document.getElementById("render_checkbox_container").style.display = "inline-block";
            document.getElementById("render_checkbox").checked = currentObject.model.renderSettings.render;
        } else {
            document.getElementById("render_checkbox_container").style.display = "none";
        }

        // cast shadow checkbox
        if (currentObject.model) {
            document.getElementById("shadow_checkbox_container").style.display = "inline-block";
            document.getElementById("shadow_checkbox").checked = currentObject.model.renderSettings.castShadow;
        } else {
            document.getElementById("shadow_checkbox_container").style.display = "none";
        }

        // recieve shadow checkbox
        if (currentObject.model) {
            document.getElementById("recv_shadow_checkbox_container").style.display = "inline-block";
            document.getElementById("recv_shadow_checkbox").checked = currentObject.model.renderSettings.recieveShadow;
        } else {
            document.getElementById("recv_shadow_checkbox_container").style.display = "none";
        }
        
        // recieve lighting checkbox
        if (currentObject.model) {
            document.getElementById("recv_lighting_checkbox_container").style.display = "inline-block";
            document.getElementById("recv_lighting_checkbox").checked = currentObject.model.renderSettings.recieveLighting;
        } else {
            document.getElementById("recv_lighting_checkbox_container").style.display = "none";
        }

        // render AABB
        if (currentObject.AABB) {
            document.getElementById("AABB_checkbox_container").style.display = "inline-block";
            document.getElementById("AABB_checkbox").checked = currentObject.AABB.render;
        } else {
            document.getElementById("AABB_checkbox_container").style.display = "none";
        }
    }
    populateObjectDropdown("object_dropdown")

    // render checkbox
    document.getElementById("render_checkbox").onclick = function() {
        const worldObject = debugGlobal.scene.worldObjects[
            document.getElementById("object_dropdown").value
        ];
        worldObject.model.renderSettings.render = this.checked;
    }

    // cast shadow checkbox
    document.getElementById("shadow_checkbox").onclick = function() {
        const worldObject = debugGlobal.scene.worldObjects[
            document.getElementById("object_dropdown").value
        ];
        worldObject.model.renderSettings.castShadow = this.checked;
    }

    // recieve shadow checkbox
    document.getElementById("recv_shadow_checkbox").onclick = function() {
        const worldObject = debugGlobal.scene.worldObjects[
            document.getElementById("object_dropdown").value
        ];
        worldObject.model.renderSettings.recieveShadow = this.checked;
    }

    // recieve lighting checkbox
    document.getElementById("recv_lighting_checkbox").onclick = function() {
        const worldObject = debugGlobal.scene.worldObjects[
            document.getElementById("object_dropdown").value
        ];
        worldObject.model.renderSettings.recieveLighting = this.checked;
    }

    // render AABB
    document.getElementById("AABB_checkbox").onclick = function() {
        const worldObject = debugGlobal.scene.worldObjects[
            document.getElementById("object_dropdown").value
        ];
        worldObject.AABB.render = this.checked;
    }
}

function initPhysicsPanel() {
    // gravity slider
    document.getElementById("gravity_slider").oninput = function() {
        debugGlobal.physicsEngine.gravity = parseFloat(this.value);
        document.getElementById("gravity_value").innerHTML = this.value;
    }

    // friction slider
    document.getElementById("friction_slider").oninput = function() {
        debugGlobal.physicsEngine.frictionFactor = parseFloat(this.value);
        document.getElementById("friction_value").innerHTML = this.value;
    }
}

function populateObjectDropdown(dropdownId) {
    // clear the dropdown list
    const len = document.getElementById(dropdownId).options.length;
    for (var i = len - 1; i >= 0; i--) {
        document.getElementById(dropdownId).remove(i);
    }

    // add all worldObjects
    const keys = Object.keys(debugGlobal.scene.worldObjects);
    for (var i = 0; i < keys.length; i++) {
        const option = document.createElement("option");
        option.value = keys[i];
        option.text = keys[i];
        document.getElementById(dropdownId).add(option);
    }

    // explicitly call the onchange function
    document.getElementById(dropdownId).onchange();
}

function openPanel(setting) {
    const panel = document.getElementById(setting + "_container");

    // hide current panel
    if (currentPanel) {
        currentPanel.style.display = "none";
    }
    currentPanel = panel;

    // show the new panel
    panel.style.display = "block";

    // change old button
    if (currentButton) {
        currentButton.style.backgroundColor = "rgba(0, 0, 0, 0)";
        currentButton.style.border = "0px";
        currentButton.style.borderBottom = "2px solid rgb(192, 192, 192)";
    }
    currentButton = document.getElementById(setting + "_button");

    // change the background color of new active button
    currentButton.style.backgroundColor = getComputedStyle(currentPanel).getPropertyValue("background-color");
    currentButton.style.border = "2px solid rgb(192, 192, 192)";
    currentButton.style.borderBottom = "2px solid " + currentButton.style.backgroundColor;
}

onload = main;