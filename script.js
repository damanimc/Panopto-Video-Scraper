// ==UserScript==
// @name         panopto-video-scraper
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  Video downloader for all videos in a folder in Panopto Video platform
// @author       majar5c

// @match        https://*.cloud.panopto.eu/*
// @grant        GM_openInTab
// @run-at       document-start
// ==/UserScript==

(function main() {
    'use strict';

    console.log("[Panopto DL] Script loaded at", new Date().toISOString());

    const BUTTON_ID = "panopto-download-button";
    const toolbarSelectors = [
        "#actionHeader > div",
        "#actionHeader",
        "#actionHeader .css-1h03d21",
        "#actionHeader .css-rns554",
        ".list-view-header",
        "[class*='toolbar']",
        "[class*='header']"
    ];

    const videoLinkSelectors = [
        "a.thumbnail-link",
        "a.list-title",
        "a[href*='Viewer.aspx?id=']",
        "[data-session-id]",
        "[data-sessionid]"
    ];

    function getURLHashParameters() {
        return new URLSearchParams(window.location.hash.substring(1));
    }

    const inFolderPage = getURLHashParameters().has("folderID");
    console.log("[Panopto DL] URL:", window.location.href);
    console.log("[Panopto DL] In folder page:", inFolderPage);

    if (inFolderPage) {
        let attemptCount = 0;
        const maxAttempts = 50;
        let retryIntervalId;

        function buildButton() {
            const btn = document.createElement("button");
            btn.setAttribute("id", BUTTON_ID);
            btn.setAttribute("type", "button");
            btn.style.padding = "10px 10px";
            btn.style.margin = "25px";
            btn.style.backgroundColor = "#ffffffff";
            btn.style.color = "#626262";
            btn.style.border = "1px solid #626262";
            btn.style.borderRadius = "5px";
            btn.style.cursor = "pointer";
            btn.style.fontSize = "14px";
            btn.style.fontWeight = "bold";
            btn.innerText = "📥 Download All Videos";
            btn.addEventListener("click", downloadVideos);
            return btn;
        }

        function injectButton(forceOverlay = false) {
            if (document.getElementById(BUTTON_ID)) {
                return true;
            }

            const btn = buildButton();

            // Try to inject after #actionHeader instead of inside it
            const actionHeader = document.querySelector("#actionHeader");
            if (actionHeader && actionHeader.parentNode) {
                actionHeader.insertAdjacentElement('afterend', btn);
                console.log("[Panopto DL] Button injected after #actionHeader");
                console.log(`[Panopto DL] Button element:`, btn);
                console.log(`[Panopto DL] Button visible:`, btn.offsetParent !== null);
                return true;
            }

            if (forceOverlay && document.body) {
                btn.style.position = "fixed";
                btn.style.top = "80px";
                btn.style.right = "20px";
                btn.style.zIndex = "99999";
                document.body.appendChild(btn);
                console.log("[Panopto DL] Button injected as fixed position overlay");
                console.log(`[Panopto DL] Button element:`, btn);
                return true;
            }

            return false;
        }

        function startInjectionLoop() {
            if (retryIntervalId) {
                clearInterval(retryIntervalId);
            }

            attemptCount = 0;
            retryIntervalId = setInterval(() => {
                attemptCount++;
                const forceOverlay = attemptCount >= maxAttempts;
                const inserted = injectButton(forceOverlay);

                if (inserted || attemptCount >= maxAttempts) {
                    clearInterval(retryIntervalId);
                    retryIntervalId = null;
                    if (document.getElementById(BUTTON_ID)) {
                        console.log("[Panopto DL] Button successfully injected");
                    } else {
                        console.log("[Panopto DL] Failed to inject button after", maxAttempts, "attempts");
                    }
                }
            }, 400);
        }

        const observer = new MutationObserver(() => {
            // Re-attach if Panopto re-renders the header (SPA navigation)
            injectButton(false);
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }

        window.addEventListener("hashchange", () => {
            console.log("[Panopto DL] Hash changed, retrying injection");
            startInjectionLoop();
        });

        injectButton(true); // aggressive first attempt to ensure visibility
        startInjectionLoop();

        function downloadVideos() {
            console.log("[Panopto DL] Download button clicked");
            const video_ids = getVideosIds();
            console.log("[Panopto DL] Found", video_ids.length, "videos");
            video_ids.forEach((id, index) => {
                if (id) {
                    const url = `${window.location.origin}/Panopto/Podcast/Download/${id}.mp4?mediaTargetType=videoPodcast`;
                    console.log(`[Panopto DL] Opening video ${index + 1}: ${url}`);
                    makeGetRequest(url);
                }
            });
        }

        function getVideosIds() {
            const ids = new Set();

            for (const selector of videoLinkSelectors) {
                document.querySelectorAll(selector).forEach((node) => {
                    if (node.dataset && (node.dataset.sessionId || node.dataset.sessionid)) {
                        ids.add(node.dataset.sessionId || node.dataset.sessionid);
                    }

                    const href = node.href || node.getAttribute("href") || "";
                    if (href) {
                        const match = href.match(/id=([a-f\d-]+)/i);
                        if (match && match[1]) {
                            ids.add(match[1]);
                        }
                    }
                });
            }

            console.log("[Panopto DL] Extracted", ids.size, "unique video IDs");
            return Array.from(ids).filter(Boolean);
        }

        function makeGetRequest(url) {
            if (typeof GM_openInTab !== 'undefined') {
                GM_openInTab(url, false);
            } else {
                console.warn("[Panopto DL] GM_openInTab not available, opening in new tab");
                window.open(url, '_blank');
            }
        }
    } else {
        console.log("[Panopto DL] Not on a folder page, script inactive");
    }
})();
