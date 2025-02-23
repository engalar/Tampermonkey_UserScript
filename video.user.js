// ==UserScript==
// @name              少废话 - 全网VIP视频免费看
// @namespace         http://tampermonkey.net/
// @version           4.1.0
// @description       少废话 - 全网VIP视频免费看。支持：所有主流视频网站；
// @author            sfh
// @match             *://*.youku.com/*
// @match             *://*.iqiyi.com/*
// @match             *://*.iq.com/*
// @match             *://*.le.com/*
// @match             *://v.qq.com/*
// @match             *://m.v.qq.com/*Q
// @match             *://*.tudou.com/*
// @match             *://*.mgtv.com/*
// @match             *://tv.sohu.com/*
// @match             *://film.sohu.com/*
// @match             *://*.1905.com/*
// @match             *://*.bilibili.com/*
// @match             *://*.pptv.com/*

// @require           https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @grant             unsafeWindow
// @grant             GM_addStyle
// @grant             GM_openInTab
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_xmlhttpRequest
// @grant             GM_log
// @grant             GM_notification
// @license           gpl-3.0


// @downloadURL https://github.com/engalar/Tampermonkey_UserScript/raw/refs/heads/main/video.user.js
// ==/UserScript==

const util = (function () {

    function findTargetElement(targetContainer) {
        const body = window.document;
        let tabContainer;
        let tryTime = 0;
        const maxTryTime = 120;
        let startTimestamp;
        return new Promise((resolve, reject) => {
            function tryFindElement(timestamp) {
                if (!startTimestamp) {
                    startTimestamp = timestamp;
                }
                const elapsedTime = timestamp - startTimestamp;

                if (elapsedTime >= 500) {
                    GM_log("查找元素：" + targetContainer + "，第" + tryTime + "次");
                    tabContainer = body.querySelector(targetContainer);
                    if (tabContainer) {
                        resolve(tabContainer);
                    } else if (++tryTime === maxTryTime) {
                        reject();
                    } else {
                        startTimestamp = timestamp;
                    }
                }
                if (!tabContainer && tryTime < maxTryTime) {
                    requestAnimationFrame(tryFindElement);
                }
            }

            requestAnimationFrame(tryFindElement);
        });
    }

    function urlChangeReload() {
        const oldHref = window.location.href;
        let interval = setInterval(() => {
            let newHref = window.location.href;
            if (oldHref !== newHref) {
                clearInterval(interval);
                window.location.reload();
            }
        }, 500);
    }

    function reomveVideo() {
        setInterval(() => {
            for (let video of document.getElementsByTagName("video")) {
                if (video.src) {
                    video.removeAttribute("src");
                    video.muted = true;
                    video.load();
                    video.pause();
                }
            }
        }, 500);
    }

    function syncRequest(option) {
        return new Promise((resolve, reject) => {
            option.onload = (res) => {
                resolve(res);
            };
            option.onerror = (err) => {
                reject(err);
            };
            GM_xmlhttpRequest(option);
        });
    }

    return {
        req: (option) => syncRequest(option),
        findTargetEle: (targetEle) => findTargetElement(targetEle),
        urlChangeReload: () => urlChangeReload(),
        reomveVideo: () => reomveVideo()
    }
})();


const superVip = (function () {

    const _CONFIG_ = {
        isMobile: navigator.userAgent.match(/(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i),
        currentPlayerNode: null,
        vipBoxId: 'vip_jx_box' + Math.ceil(Math.random() * 100000000),
        flag: "flag_vip",
        autoPlayerKey: "auto_player_key" + window.location.host,
        autoPlayerVal: "auto_player_value_" + window.location.host,
        videoParseList: [
            {
                "name": "👍虾米",
                "type": "1,2",
                "url": "https://jx.xmflv.com/?url="
            },

            {
                "name": "👍m1907",
                "type": "1,2",
                "url": "https://im1907.top/?jx="
            },
            {
                "name": "👍yparse",
                "type": "1,2",
                "url": "https://jx.yparse.com/index.php?url="
            },
            {
                "name": "YT",
                "type": "1,3",
                "url": "https://jx.yangtu.top/?url="
            },
            {
                "name": "Player-JY",
                "type": "1,3",
                "url": "https://jx.playerjy.com/?url="
            },


            {
                "name": "剖元",
                "type": "1,3",
                "url": "https://www.pouyun.com/?url="
            },



            {
                "name": "冰豆",
                "type": "1,3",
                "url": "https://bd.jx.cn/?url="
            },

        ],
        playerContainers: [
            {
                host: "v.qq.com",
                container: "#mod_player,#player-container,.container-player",
                name: "QQ",
                displayNodes: ["#mask_layer", ".mod_vip_popup", "#mask_layer", ".panel-tip-pay", ".txp_videos_container"]
            },
            {
                host: "m.v.qq.com",
                container: ".mod_player,#player",
                name: "Default",
                displayNodes: [".mod_vip_popup", "[class^=app_],[class^=app-],[class*=_app_],[class*=-app-],[class$=_app],[class$=-app]", "div[dt-eid=open_app_bottom]", "div.video_function.video_function_new", "a[open-app]", "section.mod_source", "section.mod_box.mod_sideslip_h.mod_multi_figures_h,section.mod_sideslip_privileges,section.mod_game_rec", ".at-app-banner"]
            },

            {
                host: "w.mgtv.com",
                container: "#mgtv-player-wrap",
                name: "Default",
                displayNodes: []
            },
            {
                host: "www.mgtv.com",
                container: "#mgtv-player-wrap",
                name: "Default",
                displayNodes: []
            },
            {
                host: "m.mgtv.com",
                container: ".video-area",
                name: "Default",
                displayNodes: ["div[class^=mg-app]", ".video-area-bar", ".open-app-popup"]
            },
            {
                host: "www.bilibili.com",
                container: "#player_module,#bilibiliPlayer,#bilibili-player",
                name: "Bilibili",
                displayNodes: []
            },
            {
                host: "m.bilibili.com",
                container: ".player-wrapper,.player-container,.mplayer",
                name: "Default",
                displayNodes: []
            },
            {
                host: "www.iqiyi.com",
                container: "#flashbox",
                name: "Default",
                displayNodes: ["#playerPopup", "div[class^=qy-header-login-pop]", "section[class^=modal-cover_]", ".toast"]
            },
            {
                host: "m.iqiyi.com",
                container: ".m-video-player-wrap",
                name: "Default",
                displayNodes: ["div.m-iqyGuide-layer", "a[down-app-android-url]", "[name=m-extendBar]", "[class*=ChannelHomeBanner]", "section.m-hotWords-bottom"]
            },
            {
                host: "www.iq.com",
                container: ".intl-video-wrap",
                name: "Default",
                displayNodes: []
            },
            {
                host: "v.youku.com",
                container: "#player",
                name: "Default",
                displayNodes: ["#iframaWrapper", "#checkout_counter_mask", "#checkout_counter_popup"]
            },
            {
                host: "m.youku.com",
                container: "#player,.h5-detail-player",
                name: "Default",
                displayNodes: [".callEnd_box", ".h5-detail-guide", ".h5-detail-vip-guide"]
            },
            {
                host: "tv.sohu.com",
                container: "#player",
                name: "Default",
                displayNodes: []
            },
            {
                host: "film.sohu.com",
                container: "#playerWrap",
                name: "Default",
                displayNodes: []
            },
            {
                host: "www.le.com",
                container: "#le_playbox",
                name: "Default",
                displayNodes: []
            },
            {
                host: "video.tudou.com",
                container: ".td-playbox",
                name: "Default",
                displayNodes: []
            },
            {
                host: "v.pptv.com",
                container: "#pptv_playpage_box",
                name: "Default",
                displayNodes: []
            },
            {
                host: "vip.pptv.com",
                container: ".w-video",
                name: "Default",
                displayNodes: []
            },
            {
                host: "www.wasu.cn",
                container: "#flashContent",
                name: "Default",
                displayNodes: []
            },
            {
                host: "www.acfun.cn",
                container: "#player",
                name: "Default",
                displayNodes: []
            },
            {
                host: "vip.1905.com",
                container: "#player,#vodPlayer",
                name: "Default",
                displayNodes: []
            },
            {
                host: "www.1905.com",
                container: "#player,#vodPlayer",
                name: "Default",
                displayNodes: []
            },
        ]
    };

    class BaseConsumer {
        constructor() {
            this.parse = () => {
                util.findTargetEle('body')
                    .then((container) => this.preHandle(container))
                    .then((container) => this.generateElement(container))
                    .then((container) => this.bindEvent(container))
                    .then((container) => this.autoPlay(container))
                    .then((container) => this.postHandle(container));
            }
        }

        preHandle(container) {
            _CONFIG_.currentPlayerNode.displayNodes.forEach((item, index) => {
                util.findTargetEle(item)
                    .then((obj) => obj.style.display = 'none')
                    .catch(e => console.warn("不存在元素", e));
            });
            return new Promise((resolve, reject) => resolve(container));
        }

        generateElement(container) {
            GM_addStyle(`
                        #${_CONFIG_.vipBoxId} {cursor:pointer; position:fixed; top:120px; left:0px; z-index:9999999; text-align:left;}
                        #${_CONFIG_.vipBoxId} .img_box{width:32px; height:32px;line-height:32px;text-align:center;background-color:#1c84c6;margin:10px 0px;}
                        #${_CONFIG_.vipBoxId} .vip_list {display:none; position:absolute; border-radius:5px; left:32px; top:0; text-align:center; background-color: #3f4149; border:1px solid white;padding:10px 0px; width:380px; max-height:400px; overflow-y:auto;}
                        #${_CONFIG_.vipBoxId} .vip_list li{border-radius:2px; font-size:12px; color:#DCDCDC; text-align:center; width:calc(25% - 14px); line-height:21px; float:left; border:1px solid gray; padding:0 4px; margin:4px 2px;overflow:hidden;white-space: nowrap;text-overflow: ellipsis;-o-text-overflow:ellipsis;}
                        #${_CONFIG_.vipBoxId} .vip_list li:hover{color:#1c84c6; border:1px solid #1c84c6;}
                        #${_CONFIG_.vipBoxId} .vip_list ul{padding-left: 10px;}
                        #${_CONFIG_.vipBoxId} .vip_list::-webkit-scrollbar{width:5px; height:1px;}
                        #${_CONFIG_.vipBoxId} .vip_list::-webkit-scrollbar-thumb{box-shadow:inset 0 0 5px rgba(0, 0, 0, 0.2); background:#A8A8A8;}
                        #${_CONFIG_.vipBoxId} .vip_list::-webkit-scrollbar-track{box-shadow:inset 0 0 5px rgba(0, 0, 0, 0.2); background:#F1F1F1;}
                        #${_CONFIG_.vipBoxId} li.selected{color:#1c84c6; border:1px solid #1c84c6;}

                        #${_CONFIG_.vipBoxId} .vip_list2 {display:none; position:absolute; border-radius:5px; left:32px; top:0; text-align:center; background-color: #3f4149; border:1px solid white;padding:10px 0px; width:380px; max-height:400px; overflow-y:auto;}
                        #${_CONFIG_.vipBoxId} .vip_list2 li{border-radius:2px; font-size:12px; color:#DCDCDC; text-align:center; width:calc(25% - 14px); line-height:21px; float:left; border:1px solid gray; padding:0 4px; margin:4px 2px;overflow:hidden;white-space: nowrap;text-overflow: ellipsis;-o-text-overflow:ellipsis;}
                        #${_CONFIG_.vipBoxId} .vip_list2 li:hover{color:#1c84c6; border:1px solid #1c84c6;}
                        #${_CONFIG_.vipBoxId} .vip_list2 ul{padding-left: 10px;}
                        #${_CONFIG_.vipBoxId} .vip_list2::-webkit-scrollbar{width:5px; height:1px;}
                        #${_CONFIG_.vipBoxId} .vip_list2::-webkit-scrollbar-thumb{box-shadow:inset 0 0 5px rgba(0, 0, 0, 0.2); background:#A8A8A8;}
                        #${_CONFIG_.vipBoxId} .vip_list2::-webkit-scrollbar-track{box-shadow:inset 0 0 5px rgba(0, 0, 0, 0.2); background:#F1F1F1;}
						`);
            GM_addStyle(`
            /* 新增按钮的样式 */
            #${_CONFIG_.vipBoxId} .img_box#save_playback,
            #${_CONFIG_.vipBoxId} .img_box#load_playback {
                background-color: #28a745; /* 绿色背景 */
                margin: 5px 0;
            }
        `);

            if (_CONFIG_.isMobile) {
                GM_addStyle(`
                    #${_CONFIG_.vipBoxId} {top:300px;}
                    #${_CONFIG_.vipBoxId} .vip_list {width:300px;}
                    `);
            }

            let type_1_str = "";
            let type_2_str = "";
            let type_3_str = "";
            _CONFIG_.videoParseList.forEach((item, index) => {
                if (item.type.includes("1")) {
                    type_1_str += `<li class="nq-li" title="${item.name}1" data-index="${index}">${item.name}</li>`;
                }
                if (item.type.includes("2")) {
                    type_2_str += `<li class="tc-li" title="${item.name}" data-index="${index}">${item.name}</li>`;
                }
                if (item.type.includes("3")) {
                    type_3_str += `<li class="tc-li" title="${item.name}" data-index="${index}">${item.name}</li>`;
                }
            });

            let autoPlay = !!GM_getValue(_CONFIG_.autoPlayerKey, null) ? "开" : "关";

            $(container).append(`
                <div id="${_CONFIG_.vipBoxId}">
                    <div class="vip_icon">
                        <div class="img_box" title="选择解析源" style="color:white;font-size:16px;font-weight:bold;border-radius:5px;"><span style="color: red;">VIP</span></div>
                        <div class="vip_list">
                            <div>
                                <h3 style="color:#1c84c6; font-weight: bold; font-size: 16px; padding:5px 0px;">[内嵌播放]</h3>
                                <ul>
                                    ${type_1_str}
                                    <div style="clear:both;"></div>
                                </ul>
                            </div>
                            <div>
                                <h3 style="color:#1c84c6; font-weight: bold; font-size: 16px; padding:5px 0px;">[弹窗播放带选集]</h3>
                                <ul>
                                    ${type_2_str}
                                    <div style="clear:both;"></div>
                                </ul>
                            </div>
                            <div>
                                <h3 style="color:#1c84c6; font-weight: bold; font-size: 16px; padding:5px 0px;">[弹窗播放不带选集]</h3>
                                <ul>
                                    ${type_3_str}
                                    <div style="clear:both;"></div>
                                </ul>
                            </div>
                            <div style="text-align:left;color:#FFF;font-size:10px;padding:0px 10px;margin-top:10px;">
                                <b>自动解析功能说明：</b>
                                <br>&nbsp;&nbsp;1、自动解析功能默认关闭（自动解析只支持内嵌播放源）
                                <br>&nbsp;&nbsp;2、开启自动解析，网页打开后脚本将根据当前选中的解析源自动解析视频。如解析失败，请手动选择不同的解析源尝试
                                <br>&nbsp;&nbsp;3、没有选中解析源将随机选取一个
                                <br>&nbsp;&nbsp;4、如某些网站有会员可以关闭自动解析功能
                            </div>
                        </div>
                    </div>
                    <div class="img_box" id="vip_auto" style="color:white;font-size:16px;font-weight:bold;border-radius:5px;" title="是否打开自动解析。若自动解析失败，请手动选择其它接口尝试！！">${autoPlay}</div>

                    <!-- 新增保存和加载按钮 -->
                <div class="img_box" id="save_playback" title="保存当前播放记录">保存</div>
                <div class="img_box" id="load_playback" title="加载已保存的播放记录">加载</div>
                    
                    </div>
                </div>`);
            return new Promise((resolve, reject) => resolve(container));
        }

        bindEvent(container) {
            const vipBox = $(`#${_CONFIG_.vipBoxId}`);
            if (_CONFIG_.isMobile) {
                vipBox.find(".vip_icon").on("click", () => vipBox.find(".vip_list").toggle());
                vipBox.find(".money").on("click", () => vipBox.find(".vip_list2").toggle());
            } else {
                vipBox.find(".vip_icon").on("mouseover", () => vipBox.find(".vip_list").show());
                vipBox.find(".vip_icon").on("mouseout", () => vipBox.find(".vip_list").hide());
                vipBox.find(".money").on("mouseover", () => vipBox.find(".vip_list2").show());
                vipBox.find(".money").on("mouseout", () => vipBox.find(".vip_list2").hide());
            }

            let _this = this;
            vipBox.find(".vip_list .nq-li").each((liIndex, item) => {
                item.addEventListener("click", () => {
                    const index = parseInt($(item).attr("data-index"));
                    GM_setValue(_CONFIG_.autoPlayerVal, index);
                    GM_setValue(_CONFIG_.flag, "true");
                    _this.showPlayerWindow(_CONFIG_.videoParseList[index]);
                    vipBox.find(".vip_list li").removeClass("selected");
                    $(item).addClass("selected");
                });
            });
            vipBox.find(".vip_list .tc-li").each((liIndex, item) => {
                item.addEventListener("click", () => {
                    const index = parseInt($(item).attr("data-index"));
                    const videoObj = _CONFIG_.videoParseList[index];
                    let url = videoObj.url + window.location.href;
                    GM_openInTab(url, {
                        active: true,
                        insert: true,
                        setParent: true
                    });
                });
            });

            //右键移动位置
            vipBox.mousedown(function (e) {
                if (e.which !== 3) {
                    return;
                }
                e.preventDefault()
                vipBox.css("cursor", "move");
                const positionDiv = $(this).offset();
                let distenceX = e.pageX - positionDiv.left;
                let distenceY = e.pageY - positionDiv.top;

                $(document).mousemove(function (e) {
                    let x = e.pageX - distenceX;
                    let y = e.pageY - distenceY;
                    const windowWidth = $(window).width();
                    const windowHeight = $(window).height();

                    if (x < 0) {
                        x = 0;
                    } else if (x > windowWidth - vipBox.outerWidth(true) - 100) {
                        x = windowWidth - vipBox.outerWidth(true) - 100;
                    }

                    if (y < 0) {
                        y = 0;
                    } else if (y > windowHeight - vipBox.outerHeight(true)) {
                        y = windowHeight - vipBox.outerHeight(true);
                    }
                    vipBox.css("left", x);
                    vipBox.css("top", y);
                });
                $(document).mouseup(function () {
                    $(document).off('mousemove');
                    vipBox.css("cursor", "pointer");
                });
                $(document).contextmenu(function (e) {
                    e.preventDefault();
                })
            });
            // 绑定保存播放记录按钮的点击事件
            vipBox.find("#save_playback").on("click", () => this.savePlayback());

            // 绑定加载播放记录按钮的点击事件
            vipBox.find("#load_playback").on("click", () => this.loadPlayback());
            return new Promise((resolve, reject) => resolve(container));
        }

        autoPlay(container) {
            const vipBox = $(`#${_CONFIG_.vipBoxId}`);
            vipBox.find("#vip_auto").on("click", function () {
                if (!!GM_getValue(_CONFIG_.autoPlayerKey, null)) {
                    GM_setValue(_CONFIG_.autoPlayerKey, null);
                    $(this).html("关");
                    $(this).attr("title", "是否打开自动解析。若自动解析失败，请手动选择其它接口尝试！！");
                } else {
                    GM_setValue(_CONFIG_.autoPlayerKey, "true");
                    $(this).html("开");
                }
                setTimeout(function () {
                    window.location.reload();
                }, 200);
            });

            if (!!GM_getValue(_CONFIG_.autoPlayerKey, null)) {
                this.selectPlayer(container);
            }
            return new Promise((resolve, reject) => resolve(container));
        }

        selectPlayer(container) {
            let index = GM_getValue(_CONFIG_.autoPlayerVal, 2);
            let autoObj = _CONFIG_.videoParseList[index];
            let _th = this;
            if (autoObj.type.includes("1")) {
                setTimeout(function () {
                    _th.showPlayerWindow(autoObj);
                    const vipBox = $(`#${_CONFIG_.vipBoxId}`);
                    vipBox.find(`.vip_list [title="${autoObj.name}1"]`).addClass("selected");
                    $(container).find("#vip_auto").attr("title", `自动解析源：${autoObj.name}`);
                }, 2500);
            }
        }

        showPlayerWindow(videoObj) {
            util.findTargetEle(_CONFIG_.currentPlayerNode.container)
                .then((container) => {
                const type = videoObj.type;
                let url = videoObj.url + window.location.href;
                if (type.includes("1")) {
                    util.reomveVideo();
                    $(container).empty();
                    $(container).empty();
                    let iframeDivCss = "width:100%;height:100%;z-index:999999;";
                    if (_CONFIG_.isMobile) {
                        iframeDivCss = "width:100%;height:220px;z-index:999999;";
                    }
                    if (_CONFIG_.isMobile && window.location.href.indexOf("iqiyi.com") !== -1) {
                        iframeDivCss = "width:100%;height:220px;z-index:999999;margin-top:-56.25%;";
                    }
                    $(container).append(`<div style="${iframeDivCss}"><iframe id="iframe-player-4a5b6c" src="${url}" style="border:none;" allowfullscreen="true" width="100%" height="100%"></iframe></div>`);
                }
            });
        }

        postHandle(container) {
            if (!!GM_getValue(_CONFIG_.autoPlayerKey, null)) {
                util.urlChangeReload();
            } else {
                let oldHref = window.location.href;
                let interval = setInterval(() => {
                    let newHref = window.location.href;
                    if (oldHref !== newHref) {
                        oldHref = newHref;
                        if (!!GM_getValue(_CONFIG_.flag, null)) {
                            clearInterval(interval);
                            window.location.reload();
                        }
                    }
                }, 1000);
            }
        }

        // 保存播放记录的方法
        savePlayback() {
            const seriesId = this.getSeriesId(); // 获取电视剧的唯一标识
            const currentEpisode = this.getCurrentEpisode(); // 获取当前播放的剧集号

            if (seriesId && currentEpisode) {
                GM_setValue(`playback_${seriesId}`, currentEpisode);
                GM_log(`已保存播放记录：第${currentEpisode}集`);
                GM_notification({ text: `已保存播放记录：第${currentEpisode}集`,timeout:2000 });
            } else {
                GM_log("无法获取当前播放信息，请确保正在播放电视剧。");
            }
        }

        // 加载播放记录的方法
        loadPlayback() {
            const seriesId = this.getSeriesId(); // 获取电视剧的唯一标识
            const savedEpisode = GM_getValue(`playback_${seriesId}`, null);

            if (savedEpisode) {
                this.jumpToEpisode(savedEpisode);
            }
        }

        // 获取电视剧的唯一标识（需根据不同网站实现）
        getSeriesId() {
            const host = window.location.host;
            if (host.includes("v.qq.com")) {
                // 腾讯视频：从URL中提取系列ID
                const match = window.location.pathname.match(/\/cover\/([^\/]+)/);
                return match ? match[1] : null;
            } else if (host.includes("iqiyi.com")) {
                // 爱奇艺：从URL中提取系列ID
                const match = window.location.pathname.match(/\/v_([^\/]+)/);
                return match ? match[1] : null;
            }
            // 其他网站的实现
            return null;
        }

        // 获取当前播放的剧集号（需根据不同网站实现）
        getCurrentEpisode() {
            const host = window.location.host;
            if (host.includes("v.qq.com")) {
                // 腾讯视频：从页面中提取当前剧集号
                const episodeElement = document.querySelector(".txp_videos_container .current");
                return episodeElement ? parseInt(episodeElement.textContent.match(/\d+/)[0]) : null;
            } else if (host.includes("iqiyi.com")) {
                // 爱奇艺：从页面中提取当前剧集号
                const episodeElement = document.querySelector(".episode-list .current");
                return episodeElement ? parseInt(episodeElement.textContent.match(/\d+/)[0]) : null;
            }
            // 其他网站的实现
            return null;
        }

        // 跳转到指定剧集（需根据不同网站实现）
        jumpToEpisode(episode) {
            const host = window.location.host;
            if (host.includes("v.qq.com")) {
                // 腾讯视频：模拟点击指定剧集
                const episodeElement = document.querySelector(`.txp_videos_container [data-episode="${episode}"]`);
                if (episodeElement) episodeElement.click();
            } else if (host.includes("iqiyi.com")) {
                // 爱奇艺：模拟点击指定剧集
                const episodeElement = document.querySelector(`.episode-list [data-episode="${episode}"]`);
                if (episodeElement) episodeElement.click();
            }
            // 其他网站的实现
        }

    }

    class DefaultConsumer extends BaseConsumer { }
    class BilibiliConsumer extends BaseConsumer {
        // 获取电视剧的唯一标识（season_id）
        getSeriesId() {
            const mediaInfoElement = document.querySelector('[class*="mediainfo_mediaInfoWrap"]');
            if (mediaInfoElement) {
                const mrShow = mediaInfoElement.getAttribute('mr-show');
                if (mrShow) {
                    try {
                        const data = JSON.parse(mrShow);
                        return data.msg.season_id; // 返回 season_id
                    } catch (error) {
                        console.error("解析 mr-show 属性失败:", error);
                    }
                }
            }
            return null;
        }

        // 获取当前播放的剧集号（ep_id）
        getCurrentEpisode() {
            const mediaInfoElement = document.querySelector('[class*="mediainfo_mediaInfoWrap"]');
            if (mediaInfoElement) {
                const mrShow = mediaInfoElement.getAttribute('mr-show');
                if (mrShow) {
                    try {
                        const data = JSON.parse(mrShow);
                        return data.msg.ep_id; // 返回 ep_id
                    } catch (error) {
                        console.error("解析 mr-show 属性失败:", error);
                    }
                }
            }
            return null;
        }

        // 跳转到指定剧集
        jumpToEpisode(episode) {
            // 构建目标剧集的 URL
            const targetUrl = __NEXT_DATA__.page.replace('[videoId]', `ep${episode}`);
            window.location.href = targetUrl; // 跳转到目标 URL
        }
    }

    class QQConsumer extends BaseConsumer {
        // 从URL中提取SeriesId（如mcv8hkc8zk8lnov）
        getSeriesId() {
            const pathParts = window.location.pathname.split('/');
            // 预期URL结构：/x/cover/SeriesId/EpId.html
            if (pathParts.length >= 5 && pathParts[1] === 'x' && pathParts[2] === 'cover') {
                return pathParts[3]; // 返回SeriesId
            }
            console.error("无法从URL中提取SeriesId，请检查URL结构");
            return null;
        }

        // 从URL中提取当前剧集ID（如v0048tkd15x）
        getCurrentEpisode() {
            const pathParts = window.location.pathname.split('/');
            if (pathParts.length >= 5 && pathParts[1] === 'x' && pathParts[2] === 'cover') {
                const epPart = pathParts[4];
                // 去除末尾的.html后缀
                return epPart.replace(/\.html$/, '');
            }
            console.error("无法从URL中提取当前剧集ID，请检查URL结构");
            return null;
        }

        // 跳转到指定剧集
        jumpToEpisode(episode) {
            const pathParts = window.location.pathname.split('/');
            if (pathParts.length >= 5 && pathParts[1] === 'x' && pathParts[2] === 'cover') {
                // 替换EpId并保留其他路径部分
                pathParts[4] = `${episode}.html`;
                const newUrl = new URL(window.location.origin + pathParts.join('/'));
                window.location.href = newUrl.href;
            } else {
                console.error("当前页面URL结构不符合要求，跳转失败");
            }
        }
    }

    return {
        start: () => {
            GM_setValue(_CONFIG_.flag, null);
            let mallCase = 'Default';
            let playerNode = _CONFIG_.playerContainers.filter(value => value.host === window.location.host);
            if (playerNode === null || playerNode.length <= 0) {
                console.warn(window.location.host + "该网站暂不支持，请联系作者，作者将会第一时间处理（注意：请记得提供有问题的网址）");
                return;
            }
            _CONFIG_.currentPlayerNode = playerNode[0];
            mallCase = _CONFIG_.currentPlayerNode.name;
            const targetConsumer = eval(`new ${mallCase}Consumer`);
            targetConsumer.parse();
        }
    }

})();

(function () {
    superVip.start();
})();
