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

    let engine = new GameEngine(canvas, gl);
    engine.loadScene(sceneJson);
    engine.startGameLoop();

    window.setInterval( () => {
        document.getElementById("debug_output").innerHTML = "fps: "  + (1 / engine.deltaTime).toFixed(2);
    }, 100);

    console.log("Main done!")
}

onload = main;