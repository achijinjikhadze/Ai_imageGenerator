const API_URL = "https://imgapi.achigamer10.workers.dev/";
const API_KEY = "Bearer aeiou10203aeiou";
const mymemoryApiKey = 'ee30cfd671d8eae7637c';

document.getElementById("genBtn").addEventListener("click", generate);

localStorage.removeItem("history");

loadHistory();

/**
 * Translate Georgian prompt to English using MyMemory API.
 * Returns the original text if translation fails.
 */
async function translatePrompt(text) {
  if (!text) return '';

  const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ka|en&key=${mymemoryApiKey}`;

  try {
    const response = await fetch(translateUrl);
    const data = await response.json();
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    } else {
      console.warn('Translation error, using original prompt.');
      return text;
    }
  } catch (err) {
    console.error('Translation request failed:', err);
    return text;
  }
}

async function generate() {
  const promptInput = document.getElementById("prompt").value.trim();
  if (!promptInput) return alert("Enter a prompt!");

  let finalPrompt = await translatePrompt(promptInput);

  const model = document.getElementById("model").value;
 const wsize = parseInt(document.getElementById("widthSlider").value);
const hsize = parseInt(document.getElementById("heightSlider").value);
  const count = parseInt(document.querySelector('input[name="quantity"]:checked').value);

  finalPrompt += ` | ${wsize}x${hsize} resolution`;

  const output = document.getElementById("image-container");
  const loading = document.getElementById("loading");
  output.innerHTML = "";
  loading.style.display = "block";


    const promises = Array.from({ length: count }, () =>
   /* fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        model: model,  
      }),
    })*/
    fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: API_KEY,
  },
  body: JSON.stringify({
    prompt: finalPrompt,
    model: document.getElementById("model").value,
    wsize: wsize,
    hsize: hsize
  })
})

  );


  const results = await Promise.allSettled(promises);

  results.forEach((res, i) => {
    if (res.status === "fulfilled") {
      res.value.blob().then(blob => {
        const url = URL.createObjectURL(blob);
        const img = document.createElement("img");
        img.src = url;

       
        img.style.cursor = "pointer";
        img.addEventListener("click", () => openFullscreen(url));
        //img.addEventListener("touchstart", () => openFullscreen(url));


        output.appendChild(img);
        saveHistory(url);
      });
    } else {
      const errMsg = document.createElement("div");
      errMsg.style.color = "#ff4444";
      errMsg.textContent = `Error generating image ${i + 1}`;
      output.appendChild(errMsg);
    }
  });

  loading.style.display = "none";
}


function openFullscreen(imgUrl) {
    const overlay = document.createElement("div");
    overlay.id = "image-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.9)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 9999;

    const closeBtn = document.createElement("div");
    closeBtn.innerHTML = "✖";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "20px";
    closeBtn.style.right = "20px";
    closeBtn.style.fontSize = "28px";
    closeBtn.style.color = "#fff";
    closeBtn.style.cursor = "pointer";
    closeBtn.onclick = () => document.body.removeChild(overlay);

    const img = document.createElement("img");
    img.src = imgUrl;
    img.style.maxWidth = "90%";
    img.style.maxHeight = "90%";
    img.style.borderRadius = "8px";

    
    img.addEventListener("click", (e) => e.stopPropagation());
    img.addEventListener("touchstart", (e) => e.stopPropagation());

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);

   
   // overlay.addEventListener("click", () => document.body.removeChild(overlay));

    document.body.appendChild(overlay);
}





function downloadImage(url) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai_image_${Date.now()}.jpg`;
  a.click();
}

function saveHistory(url) {
  let history = JSON.parse(localStorage.getItem("history") || "[]");
  history.unshift(url);
  history = history.slice(0, 20);
  localStorage.setItem("history", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  const container = document.getElementById("history");
  container.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.forEach((url, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "history-item";

    const img = document.createElement("img");
    img.src = url;
    img.style.cursor = "pointer";
    img.onclick = () => openFullscreen(url);

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "history-btn download";
    downloadBtn.innerHTML = "⬇️";
    downloadBtn.title = "Download";
    downloadBtn.onclick = () => downloadImage(url);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "history-btn delete";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Delete";
    deleteBtn.onclick = () => {
      history.splice(index, 1);
      localStorage.setItem("history", JSON.stringify(history));
      loadHistory();
    };

    wrapper.appendChild(img);
    wrapper.appendChild(downloadBtn);
    wrapper.appendChild(deleteBtn);
    container.appendChild(wrapper);
  });
}
