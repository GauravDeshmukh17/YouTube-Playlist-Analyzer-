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
        let youTubeVisitPromise=cTab.goto("https://www.youtube.com/playlist?list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj");
        return youTubeVisitPromise;
    })
    .then(function(){
        console.log("YoTube visited");
        let waitPromise=cTab.waitForSelector('.style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28');
        return waitPromise;
    })
    .then(function(){
        console.log("Wait done");
        let namePromise=cTab.evaluate(getPlaylistName,'.style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28');
        return namePromise;
    })
    .then(function(name){
        console.log("PlaylistName : ",name);
        let waitPromise=cTab.waitForSelector('.byline-item.style-scope.ytd-playlist-byline-renderer');
        return waitPromise;
    })
    .then(function(){
        let dataPromise=cTab.evaluate(getData,'.byline-item.style-scope.ytd-playlist-byline-renderer');
        return dataPromise;
    })
    .then(function(dataArr){
        // console.log(dataArr);
        console.log("Total Videos : ",dataArr[0].split(" ")[0]);
        console.log("Views : ",dataArr[1].split(" ")[0]);
        console.log("Date : ",dataArr[2].split("on")[1]);
        let currentPageVideoPromise=cTab.evaluate(curPageVideos);
        return currentPageVideoPromise;
    })
    .then(function(length){
        console.log(length);
        let scrollToBottomPromise=scrollToBottom();
        // while(778-length>20){
        //     scrollToBottomPromise=scrollToBottomPromise.then(function(){
        //         length=curPageVideos();
        //         console.log(length);
        //         return scrollToBottom();
        //     })
        // }
        for(let i=0;i<1500;i++){
            scrollToBottomPromise=scrollToBottomPromise.then(function(){
                    return scrollToBottom();
                })
            }
        return scrollToBottomPromise;
    })
    .then(function(){
        console.log("scroll done");
    })




    function getPlaylistName(selector){
        let name=document.querySelector(selector);
        return name.innerText;
    }

    function getData(selector){
        let data=document.querySelectorAll(selector);
        let dataArr=[];
        for(let i=0;i<data.length;i++){
            dataArr.push(data[i].innerText);
        }
        return dataArr;
    }


    function curPageVideos(){
        let curPageAllVideos=document.querySelectorAll('.style-scope.ytd-playlist-video-list-renderer');
        return curPageAllVideos.length;
    }

    function scrollToBottom(){
        return new Promise(function(resolve,reject){
            function goToBottom(){
                window.scrollBy(0,window.innerHeight);
            }
            let goToBottomPromise=cTab.evaluate(goToBottom);
            goToBottomPromise
                .then(function(){
                    let wait10MilliSecPromise=cTab.waitForTimeout(10);
                    return wait10MilliSecPromise;
                })
                .then(function(){
                    resolve();
                })
                .catch(function(err){
                    reject(err);
                })
        })
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

