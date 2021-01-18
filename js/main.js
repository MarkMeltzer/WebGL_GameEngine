debugGlobal = null;

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
        document.getElementById("debug_output").innerHTML = engine.controller.velocity;
    }, 1000);

    setupSettings();

    console.log("Main done!")
}

function setupSettings() {
    // setup sliders
    document.getElementById("X_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[0] = this.value;
        debugGlobal.scene.models["light"].position[0] = this.value;
        document.getElementById("X_value").innerHTML = this.value;
    }
    document.getElementById("Y_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[1] = this.value;
        debugGlobal.scene.models["light"].position[1] = this.value;
        document.getElementById("Y_value").innerHTML = this.value;
    }
    document.getElementById("Z_slider").oninput = function() {
        debugGlobal.renderEngine.scene.light[2] = this.value;
        debugGlobal.scene.models["light"].position[2] = this.value;
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
    document.getElementById("player_fov_slider").oninput = function() {
        debugGlobal.renderEngine.fov = this.value;
        document.getElementById("player_fov_value").innerHTML = this.value;
    }
    document.getElementById("player_zNear_slider").oninput = function() {
        debugGlobal.renderEngine.zNear = parseFloat(this.value);
        document.getElementById("player_zNear_value").innerHTML = this.value;
    }
    document.getElementById("player_zFar_slider").oninput = function() {
        debugGlobal.renderEngine.zFar = parseFloat(this.value);
        document.getElementById("player_zFar_value").innerHTML = this.value;
    }


    // setup dropdowns
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
        })
    }

    document.getElementById("reload_button").onclick = function() {
        loadJSON(document.getElementById("scene_dropdown").value, function(sceneJson) {
            debugGlobal.loadScene(sceneJson);
        })
    }
}

onload = main;