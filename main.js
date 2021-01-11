debugGlobal = null;

function main() {
    loadJSON("objects.json", demo);
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

    setupSettings();

    console.log("Main done!")
}

function setupSettings() {
    document.getElementById("X_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.lightPosition[0] = this.value;
        debugGlobal.scene.models["light"].position[0] = this.value;
        document.getElementById("X_value").innerHTML = this.value;
    }
    document.getElementById("Y_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.lightPosition[1] = this.value;
        debugGlobal.scene.models["light"].position[1] = this.value;
        document.getElementById("Y_value").innerHTML = this.value;
    }
    document.getElementById("Z_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.lightPosition[2] = this.value;
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
    document.getElementById("zNear_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.zNear = parseInt(this.value);
        document.getElementById("zNear_value").innerHTML = this.value;
    }
    document.getElementById("zFar_slider").oninput = function() {
        debugGlobal.renderEngine.shadowmapSettings.zFar = parseInt(this.value);
        document.getElementById("zFar_value").innerHTML = this.value;
    }
    document.getElementById("player_fov_slider").oninput = function() {
        debugGlobal.renderEngine.fov = this.value;
        document.getElementById("player_fov_value").innerHTML = this.value;
    }
}

onload = main;