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
        let waitPromise=cTab.waitForSelector('.index-message.style-scope.ytd-playlist-panel-renderer span');
        return waitPromise;
    })
    .then(function(){
        let totalVideosPromise=cTab.evaluate(getTotalVideos,'.index-message.style-scope.ytd-playlist-panel-renderer span');
        return totalVideosPromise;
    })
    .then(function(totalVideos){
        console.log("Total Videos : ",totalVideos);
        let waitAndClickPromise=waitAndClick('span[title="DEAF KEV - Invincible [NCS Release]"]');
        return waitAndClickPromise;
    })
    .then(function(){
        console.log("Clicked on 3rd video");
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

    function getTotalVideos(selector){
        let total=document.querySelectorAll('.index-message.style-scope.ytd-playlist-panel-renderer span');
        return total[2].innerText;
    }

    function waitAndClick(selector){
        return new Promise(function(resolve,reject){
            let waitPromise=cTab.waitForSelector(selector);
            waitPromise
                .then(function(){
                    let clickPromise=cTab.click(selector);
                    return clickPromise;
                })
                .then(function(){
                    resolve();
                })
                .catch(function(err){
                    reject(err);
                })
        })
    }