document.getElementById("saveButton").addEventListener("click", function () {
    // Query all open tabs to get the URLs of the active tabs
    chrome.tabs.query({}, function (tabs) {
        // Extract URLs from the tabs
        const urls = tabs.map((tab) => tab.url);

        const urlListDiv = document.getElementById("urlList");
        urlListDiv.innerHTML = "";
        const totalTabs = tabs.length;
        const totalTabsElement = document.createElement("h4");
        totalTabsElement.textContent = `Total open tabs: ${totalTabs}`;
        urlListDiv.appendChild(totalTabsElement);

        // Convert the array of URLs to a single string
        const urlsText = urls.join("\n");

        // Create a Blob with the URLs as text content
        const blob = new Blob([urlsText], { type: "text/plain" });

        // Create a download link
        const url = URL.createObjectURL(blob);

        // Use chrome.downloads API to trigger the download
        chrome.downloads.download({
            url: url,
            filename: "active_tabs_urls.txt",
            saveAs: true,
        });
    });
});

const fileChosen = document.getElementById("file-chosen");

document.getElementById("importFile").addEventListener("change", function () {
    fileChosen.textContent = this.files[0].name;
});

document.getElementById("importButton").addEventListener("click", async function () {
    const fileInput = document.getElementById("importFile");
    const file = fileInput.files[0]; // Get the selected file

    if (!file) {
        alert("Please select a file to import.");
        return;
    }

    // Create a FileReader to read the content of the file
    const reader = new FileReader();

    reader.onload = async function (event) {
        const fileContent = event.target.result;

        // Split the file content into an array of URLs (one URL per line)
        const urls = fileContent.split("\n").map((url) => url.trim());

        console.log("Sending URLs to background:", urls.length);

        chrome.runtime.sendMessage({
            action: "START_IMPORT",
            urls
        });
    };

    // Read the file as a text
    reader.readAsText(file);
});

document.getElementById("unloadButton").addEventListener("click", function () {
    chrome.tabs.query({}, function (tabs) {
        chrome.runtime.sendMessage({
            action: "START_UNLOAD",
            tabs
        });
    });
});
