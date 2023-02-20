const puppeteer=require("puppeteer");

let cTab;

let browserOpenPromise=puppeteer.launch({
    headless:false,
    defaultViewport:null,
    args:["--start-maximized"]
})

browserOpenPromise
    .then(function(browser){
        let allTabsPromise=browser.pages();
        return allTabsPromise;
    })
    .then(function(allTabsArr){
        cTab=allTabsArr[0];
        let youTubeVisitPromise=cTab.goto("https://www.youtube.com/watch?v=K4DyBUG242c&list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj");
        return youTubeVisitPromise;
    })
    .then(function(){
        console.log("YoTube visited");
        let waitPromise=cTab.waitForSelector('h1[class="style-scope ytd-watch-metadata"]');
        return waitPromise;
    })
    .then(function(){
        console.log("Wait done");
        let namePromise=cTab.evaluate(getPlaylistName,'h1[class="style-scope ytd-watch-metadata"]');
        return namePromise;
    })
    .then(function(name){
        console.log("PlaylistName : ",name);
    })

    function getPlaylistName(selector){
        let name=document.querySelector(selector);
        return name.innerText;
    }