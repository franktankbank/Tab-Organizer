const CORES = navigator.hardwareConcurrency || 4;
let BATCH_SIZE = CORES * 3;

if (performance.memory && performance.memory.totalJSHeapSize < 1e9) {
    BATCH_SIZE = Math.min(BATCH_SIZE, 10);
}

function waitForUrl(tabId) {
    return new Promise(resolve => {
        const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
    chrome.tabs.onUpdated.addListener(listener);
    });
}

async function processBatch(urls) {
    // Create all tabs in parallel
    const createdTabs = await Promise.all(
        urls.map(url => chrome.tabs.create({ url, active: false }))
    );

    // Wait until each tab commits navigation
    await Promise.all(
        createdTabs.map(tab => waitForUrl(tab.id))
    );

    // Discard all of them in parallel
    createdTabs.forEach(tab => chrome.tabs.discard(tab.id));
}

async function processAll(urls) {
    console.log(`Processors: ${CORES}, Batch Size: ${BATCH_SIZE}`);
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        console.log(`Batch ${i / BATCH_SIZE + 1}`);
        await processBatch(urls.slice(i, i + BATCH_SIZE));
    }

    console.log("✅ Completed!");
}

async function unloadUnused(tabs) {
    tabs.forEach(tab => {
        if (!tab.active) {
            chrome.tabs.discard(tab.id);
        };
    });
};

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "START_IMPORT" && msg.urls) {
        processAll(msg.urls);
    }
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "START_UNLOAD" && msg.tabs) {
        unloadUnused(msg.tabs);
    }
});
