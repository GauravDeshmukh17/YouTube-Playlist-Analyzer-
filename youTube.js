const puppeteer=require("puppeteer");
const pdf=require("pdfkit");
const fs=require("fs");
const xlsx=require("xlsx");

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
        for(let i=0;i<500;i++){
            scrollToBottomPromise=scrollToBottomPromise.then(function(){
                    return scrollToBottom();
                })
            }
        return scrollToBottomPromise;
    })
    .then(function(){
        console.log("scroll done");
        let waitFor2Sec=cTab.waitForTimeout(2000);
        return waitFor2Sec;
    })
    .then(function(){
        console.log("wait done");
        function getNameAndDuration(){
            let dataElement=document.querySelectorAll('.style-scope.ytd-playlist-video-list-renderer');
            // let durationElement=document.querySelectorAll('span[class="style-scope ytd-thumbnail-overlay-time-status-renderer"]',{delay:100000});
            let videoDataArr=[];
            for(let i=4;i<dataElement.length;i++){
                let videoData=dataElement[i].innerText.split('\n');
                // let videoDuation=durationElement[i].innerText;
                videoDataArr.push(videoData);
            }

            return videoDataArr;
        }

        let videoDataArrPromise=cTab.evaluate(getNameAndDuration);
        return videoDataArrPromise;
    })
    .then(function(videoDataArr){
        // console.log(videoDataArr);
        function fillDataInArrOfObject(videoDataArr){
            let videoDataArrOfObjects=[];
            for(let i=0;i<videoDataArr.length;i++){
                let videoNumber=videoDataArr[i][0];
                let videoDuration=videoDataArr[i][1];
                let videoName=videoDataArr[i][3];
                let videoViews=videoDataArr[i][6];
                videoDataArrOfObjects.push({videoNumber,videoDuration,videoName,videoViews});
                // console.log(videoNumber);
                // console.log(videoDuration);
                // console.log(videoName);
                // console.log(videoViews);
            }

            return videoDataArrOfObjects;
        }

        let fillDataInArrOfObjectPromise=cTab.evaluate(fillDataInArrOfObject,videoDataArr,{delay:1000});
        return fillDataInArrOfObjectPromise;
    })
    // .then(function(arrOfObjects){
    //     let inputArr=process.argv.slice(2);
    //     console.log(inputArr);
    //     let idx=parseInt(inputArr[0])-1;
    //     let selector=`a[title="`+arrOfObjects[idx].videoName+`"]`;
    //     let waitPromise=waitAndClick(selector);
    //     let data= {waitPromise,arrOfObjects};
    //     return data;
    // })
    .then(function(arrOfObjects){
        function getAllVideosLinks(){
            let linksArr=[];
            let anchorElement=document.querySelectorAll('a[class="yt-simple-endpoint style-scope ytd-playlist-video-renderer"]',{delay:1000});
            for(let i=0;i<anchorElement.length;i++){
                linksArr.push(anchorElement[i].getAttribute('href'));
            }

            return linksArr;
        }

        let getAllVideosLinksPromise=cTab.evaluate(getAllVideosLinks);
        let data={getAllVideosLinksPromise,arrOfObjects};
        return data;
    })
    .then(function(data){
        let allVideosVisitPromise=data.getAllVideosLinksPromise.then(function(links){
            console.log(links);
            let inputLiksArr=process.argv.slice(2);
            console.log(inputLiksArr);
            
            let fullLink="https://www.youtube.com"+links[parseInt(inputLiksArr[0])-1];
            let visitVideoPromise=goToLink(fullLink);
            for(let i=1;i<inputLiksArr.length;i++){
                visitVideoPromise=visitVideoPromise.then(function(){
                    fullLink="https://www.youtube.com"+links[parseInt(inputLiksArr[i])-1];
                    return goToLink(fullLink);
                })
            }

            return visitVideoPromise;
        });

        let data1={allVideosVisitPromise,data};
        return data1;
    })
    .then(function(data1){
        let data2=data1.data;
        console.log(data2.arrOfObjects);

        let pdfDoc=new pdf;
        pdfDoc.pipe(fs.createWriteStream("playlist.pdf"));
        pdfDoc.text(JSON.stringify(data2.arrOfObjects));
        pdfDoc.end();

        let jsonData=JSON.stringify(data2.arrOfObjects);
        fs.writeFileSync("playlist.json",jsonData);
    
        // creates new book
        let newWorkBook=xlsx.utils.book_new();
        // converts an array of JS objects to worksheet
        let newWorkSheet=xlsx.utils.json_to_sheet(data2.arrOfObjects);
        // aapends worksheet to workbook
        xlsx.utils.book_append_sheet(newWorkBook,newWorkSheet,"playlist");
        xlsx.writeFile(newWorkBook,"playlist.xlsx");
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

    function goToLink(url){
        return new Promise(function(resolve,reject){

            let visitUrl=cTab.goto(url);
            visitUrl
                .then(function(){
                    let waitAndClickPromise=waitAndClick('button[aria-keyshortcuts="k"]');
                    return waitAndClickPromise;
                })
                .then(function(){
                    let waitPromise=cTab.waitForTimeout(30000);
                    return waitPromise;
                })
                .then(function(){
                    resolve();
                })
                .catch(function(err){
                    reject(err);
                })
            });
        }