// ==UserScript==
// @name         Panopto Video Scraper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Script to download all videos in folder from Panopto
// @author       Your name
// @match        https://*.panopto.com/*
// @match        https://*.panopto.eu/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Add download button to Panopto interface
    function addDownloadButton() {
        // Check if button already exists
        if (document.getElementById('panopto-scraper-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'panopto-scraper-btn';
        button.textContent = 'Download All Videos';
        button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 10000; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;';
        
        button.addEventListener('click', function() {
            alert('Video scraper functionality - implement download logic here');
            // TODO: Add video download logic
        });

        document.body.appendChild(button);
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDownloadButton);
    } else {
        addDownloadButton();
    }
})();
