chrome.runtime.onInstalled.addListener(() => {
  console.log("Background Service Worker is active!");
});

document.getElementById("copy-storage-extension").addEventListener("click", async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const sourceTab = tabs[0];
    if (sourceTab.id && sourceTab.url && !sourceTab.url.startsWith("chrome://")) {
      // ใช้ chrome.scripting.executeScript เพื่อดึงข้อมูลจาก localStorage และ sessionStorage
      chrome.scripting.executeScript({
        target: { tabId: sourceTab.id },
        func: () => {
          return {
            localStorageData: JSON.stringify(localStorage),
            sessionStorageData: JSON.stringify(sessionStorage)
          };
        }
      }, (result) => {
        if (chrome.runtime.lastError) {
          console.error("Error executing script:", chrome.runtime.lastError);
          return;
        }

        // เช็คผลลัพธ์จากการ executeScript
        if (result && result[0] && result[0].result) {
          const savedStorage = result[0].result;
          // เก็บข้อมูลใน chrome.storage.local
          chrome.storage.local.clear()
          chrome.storage.local.set({
            localStorageData: savedStorage.localStorageData,
            sessionStorageData: savedStorage.sessionStorageData
          }, () => {
            console.log('Storage data saved successfully');
          });
        } else {
          console.error("No storage data received");
        }
      });
    }
  });
});

document.getElementById("paste-storage-extension").addEventListener("click", async () => {
  // ดึงข้อมูลจาก chrome.storage.local
  chrome.storage.local.get(['localStorageData', 'sessionStorageData'], (data) => {
    if (data.localStorageData && data.sessionStorageData) {
      console.log(JSON.parse(data.localStorageData), JSON.parse(data.sessionStorageData));

      // ค้นหาคำสั่งจากแท็บที่ active
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const targetTab = tabs[0]; // ใช้แท็บที่ active เป็นแท็บเป้าหมาย
        if (targetTab.id) {
          // ใช้ chrome.scripting.executeScript เพื่อ paste ข้อมูลจาก localStorage และ sessionStorage
          chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            func: (localStorageData, sessionStorageData) => {
              console.log(localStorageData, sessionStorageData);

              // ใช้ข้อมูลจาก localStorage และ sessionStorage ไปยัง URL ที่สอง
              Object.entries(JSON.parse(localStorageData)).forEach(([key, value]) => {
                if (value) { localStorage.setItem(key, value); }

              });
              Object.entries(JSON.parse(sessionStorageData)).forEach(([key, value]) => {
                if (value) { sessionStorage.setItem(key, value); }
              });
            },
            args: [data.localStorageData, data.sessionStorageData] // ส่งข้อมูลไป
          });
        }
      });
    } else {
      console.error("No data to paste. Ensure data was copied first.");
    }
  });
});