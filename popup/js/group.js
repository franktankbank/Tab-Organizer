document
    .getElementById("groupButton")
    .addEventListener("click", async function () {
        const tabs = await new Promise((resolve) =>
            chrome.tabs.query({}, resolve)
        );
        const groupedUrls = groupUrlsByDomain(tabs);
        await createTabGroup(groupedUrls);
        await rearrangeTabGroups();
    });

function groupUrlsByDomain(tabs) {
    const groupedUrls = {};

    // Group URLs by domain
    tabs.forEach((tab) => {
        const domain = new URL(tab.url).hostname; // Extract the domain from the tab URL

        if (!groupedUrls[domain]) {
            groupedUrls[domain] = []; // If domain not found, initialize with an empty array
        }

        groupedUrls[domain].push({ url: tab.url, tabId: tab.id }); // Push the tab's URL to the respective domain's list
    });

    // Exclude domains with only one URL
    for (const domain in groupedUrls) {
        if (groupedUrls[domain].length <= 1) {
            delete groupedUrls[domain]; // Remove domains with only one URL
        }
    }

    // Sort grouped URLs: Domains with multiple tabs first
    const groupedUrlsArray = Object.entries(groupedUrls).sort(
        ([domainA, tabsA], [domainB, tabsB]) => {
            // Sort by the number of tabs in each domain (descending)
            return tabsB.length - tabsA.length;
        }
    );

    // Convert the sorted array back into an object
    const sortedGroupedUrls = Object.fromEntries(groupedUrlsArray);

    return sortedGroupedUrls;
}

async function createTabGroup(groupedUrls) {
    for (const domain in groupedUrls) {
        tabIds = [];
        groupedUrls[domain].forEach((item) => {
            tabIds.push(item.tabId);
        });
        await chrome.tabs.group({ tabIds }, async (groupId) => {
            await chrome.tabGroups.update(groupId, {
                collapsed: true,
                title: domain,
            });
        });
    }
}

async function rearrangeTabGroups() {
    const nonGrouped = [];
    const tabs = await new Promise((resolve) => chrome.tabs.query({}, resolve));
    await tabs.forEach((tab) => {
        if (tab.groupId === -1) {
            nonGrouped.push(tab.id);
        }
    });
    nonGrouped.forEach((id) => {
        chrome.tabs.move(id, { index: -1 });
    });
}
