const buildPath = "Build/";
const baseFileName = "Broo HTMLLL";

// Load data parts (1–16)
function loadDataParts(callback) {
  const totalParts = 16;
  let buffers = [];
  let loaded = 0;

  for (let i = 1; i <= totalParts; i++) {
    fetch(`${buildPath}${baseFileName}.data.part${i}`)
      .then(response => response.arrayBuffer())
      .then(buffer => {
        buffers[i - 1] = buffer;
        loaded++;
        if (loaded === totalParts) {
          const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
          const fullData = new Uint8Array(totalLength);
          let offset = 0;
          for (const buf of buffers) {
            fullData.set(new Uint8Array(buf), offset);
            offset += buf.byteLength;
          }
          callback(fullData.buffer);
        }
      })
      .catch(error => console.error(`Error loading part ${i}:`, error));
  }
}

// Load and merge WASM parts
function loadWasmParts(callback) {
  Promise.all([
    fetch(`${buildPath}${baseFileName}.wasm.part1`).then(res => res.arrayBuffer()),
    fetch(`${buildPath}${baseFileName}.wasm.part2`).then(res => res.arrayBuffer())
  ])
  .then(([part1, part2]) => {
    const totalLength = part1.byteLength + part2.byteLength;
    const merged = new Uint8Array(totalLength);
    merged.set(new Uint8Array(part1), 0);
    merged.set(new Uint8Array(part2), part1.byteLength);
    callback(merged.buffer);
  })
  .catch(err => console.error("Failed to load wasm parts:", err));
}

// Bootstrap Unity
function startUnity(canvas) {
  loadDataParts((dataBuffer) => {
    loadWasmParts((wasmBuffer) => {
      const config = {
        dataUrl: `${buildPath}${baseFileName}.data`,
        frameworkUrl: `${buildPath}${baseFileName}.framework.js`,
        codeUrl: `${buildPath}${baseFileName}.wasm`,
        companyName: "DefaultCompany",
        productName: "Broo HTMLLL",
        productVersion: "1.0",
        streamingAssetsUrl: "StreamingAssets",
        overrideDataFile: {
          url: `${buildPath}${baseFileName}.data`,
          data: dataBuffer
        },
        overrideCodeFile: {
          url: `${buildPath}${baseFileName}.wasm`,
          data: wasmBuffer
        }
      };

      const script = document.createElement("script");
      script.src = `${buildPath}${baseFileName}.loader.js`;
      script.onload = () => {
        createUnityInstance(canvas, config).then(unityInstance => {
          console.log("Unity instance created");
        }).catch(err => {
          console.error("Failed to load Unity:", err);
        });
      };
      document.body.appendChild(script);
    });
  });
}
