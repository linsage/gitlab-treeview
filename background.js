// current tab.
function openSupport(tab) {
    // window.open("https://chrome.google.com/webstore/detail/gitlab-treeview-fork/" + chrome.runtime.id + "/support");
    window.open("https://github.com/zWingz/gitlab-treeview")
}

// When the browser action is clicked, call the
chrome.browserAction.onClicked.addListener(openSupport);
