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
        let waitPromise=cTab.waitForSelector('div[id="info-container"] #info span');
        return waitPromise;
    })
    .then(function(){
        let dataPromise=cTab.evaluate(getViews,'div[id="info-container"] #info span');
        return dataPromise;
    })
    .then(function(dataArr){
        console.log("Views : ",dataArr[0]);
        console.log("Years : ",dataArr[2]);
    })

    function getPlaylistName(selector){
        let name=document.querySelector(selector);
        return name.innerText;
    }

    function getViews(selector){
        let data=document.querySelectorAll(selector);
        let dataArr=[];
        for(let i=0;i<data.length;i++){
            dataArr.push(data[i].innerText);
        }
        return dataArr;
    }