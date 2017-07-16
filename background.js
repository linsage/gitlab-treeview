// current tab.
function openSupport(tab) {
    window.open("https://chrome.google.com/webstore/detail/gitlab-treeview/mjnajpllpoaoookafjlcgfhbpkkodcgo/support");
}

// When the browser action is clicked, call the
chrome.browserAction.onClicked.addListener(openSupport);