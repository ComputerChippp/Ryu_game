self.addEventListener('message', function (e) {
  const { type, baseName, totalParts, buildPath } = e.data;

  if (type === 'loadAndMerge') {
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
            const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
            const merged = new Uint8Array(totalLength);
            let offset = 0;
            for (const buf of buffers) {
              merged.set(new Uint8Array(buf), offset);
              offset += buf.byteLength;
            }
            self.postMessage({ type: 'merged', baseName, buffer: merged.buffer }, [merged.buffer]);
          }
        })
        .catch(error => {
          self.postMessage({ type: 'error', message: error.message });
        });
    }
  }
});
