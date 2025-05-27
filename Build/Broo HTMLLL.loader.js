const buildPath = "Build/";
const baseFileName = "Broo HTMLLL";

// Function to load and merge split files
function loadAndMergeFiles(baseName, totalParts, callback) {
  let buffers = [];
  let loaded = 0;

  for (let i = 1; i <= totalParts; i++) {
    fetch(`${buildPath}${baseName}.part${i}`)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load part ${i}`);
        return response.arrayBuffer();
      })
      .then(buffer => {
        buffers[i - 1] = buffer;
        loaded++;
        if (loaded === totalParts) {
          // Merge all parts
          const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
          const merged = new Uint8Array(totalLength);
          let offset = 0;
          for (const buf of buffers) {
            merged.set(new Uint8Array(buf), offset);
            offset += buf.byteLength;
          }
          callback(merged.buffer);
        }
      })
      .catch(error => console.error(`Error loading ${baseName}.part${i}:`, error));
  }
}

// Initialize Unity
function startUnity(canvasId) {
  const canvas = document.getElementById(canvasId);

  loadAndMergeFiles(`${baseFileName}.data`, 16, (dataBuffer) => {
    loadAndMergeFiles(`${baseFileName}.wasm`, 2, (wasmBuffer) => {
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
        createUnityInstance(canvas, config).then((unityInstance) => {
          console.log("Unity instance created successfully.");
        }).catch((message) => {
          console.error("Failed to create Unity instance:", message);
        });
      };
      document.body.appendChild(script);
    });
  });
}

// Start Unity on window load
window.addEventListener('load', () => {
  startUnity('unityCanvas');
});
