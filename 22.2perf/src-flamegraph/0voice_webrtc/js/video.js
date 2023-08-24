(function (global_config, win) {
    var util = win.util;
    var formatTime = util.formatTime;
    var  formatSeconds = util.formatSeconds
    var tokenUrl = global_config.TOKEN_URL;
    var wsNavUrl = global_config.WS_NAV_URL;
    var getParameterByName = util.getParameterByName;
    var localStorage = util.localStorage
    var convId = getParameterByName("convId");
    var isCameraClose = eval(getParameterByName("isCameraClose"));
    var selfUserType = 0;//getParameterByName("userType");
    var resolution = getParameterByName("resolution");
    var selfUserId = randomString(9)
    var selfUserName = getParameterByName("userName");//'client_' +randomString(3)
    var appId = getParameterByName("appId");
    var isMute = false;
    var isAudioClose = false;
    var voiceRTCEngine;
    var $voiceBtnCamera = $("#voice-btn-camera");
    var $voiceBtnMute = $("#voice-btn-mute");
    var $voiceRoom = $("#voice-room");
    var $voiceBtnHangup = $("#voice-btn-hangup");
    var $voiceBtnVoice = $("#voice-btn-voice");
    var localVideoView = null;
    voiceRTCEngine = initVoiceRTCEngine();

    // 自动生成用户名，在项目使用时可以使用自定义昵称
    if(selfUserName == "" || selfUserName == "请输入用户名")   {     // 如果为空则重新生成
        selfUserName = 'client_' +randomString(3);
        console.log("auto generate client name = " + selfUserName)
    }
    function getTime() {
        var date = new Date()
        return formatTime("hh:mm:ss", date)
    }

    // 生成随机数字字符串
    function randomString(strLength) {
        var result = [];
        strLength = strLength || 5;
        var charSet = "0123456789";
        while (strLength--) {
            result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
        }
        return result.join("");
    }

    // 屏幕自适应
    function highlyAdaptive (){
        var bodyHeight = window.innerHeight-60;
        var bodyWidth =(4*bodyHeight)/3;
        $("#voice-main").css({"height":bodyHeight,"width":bodyWidth});
    }
    
    highlyAdaptive();
    window.onresize=highlyAdaptive;
    if (convId == null || convId == "") {
        swal("请输入房间ID!");
        window.location.href = 'index.html';
        return
    }
    if (selfUserType == VoiceRTCConstant.UserType.OBSERVER) { // 本地观察者模式
        // 不开启本地摄像头
        isCameraClose = true;
        $voiceBtnCamera.addClass("voice-btn-camera-close");
        // 没有静音功能
        $voiceBtnMute.addClass("voice-btn-mute-close");
    } 

    $voiceRoom.text("房间ID : " + convId);
    initTimer();

    // 自己可以本地选择是否关闭摄像头，关闭摄像头则自己只发送语音
    if (selfUserType == VoiceRTCConstant.UserType.NORMAL) {
        // 关闭本地摄像头按钮点击事件
        if(isCameraClose){
            $voiceBtnCamera.addClass("voice-btn-camera-close");
        }
        $voiceBtnCamera.click(function () {
            voiceRTCEngine.closeLocalVideo(!isCameraClose);
            isCameraClose = !isCameraClose;
            if (isCameraClose) {
                $(this).addClass("voice-btn-camera-close");
                addCloseVideoCover(selfUserId);
            } else {
                $(this).removeClass("voice-btn-camera-close");
                removeCloseVideoCover(selfUserId);
            }
        });
    }
    // 自己本地可以选择关闭声音
    if (selfUserType == VoiceRTCConstant.UserType.NORMAL) { 
        // 本地静音按钮点击事件
        $voiceBtnMute.click(function () {
            voiceRTCEngine.muteMicrophone(!isMute);
            isMute = !isMute;
            if (isMute) {
                $(this).addClass("voice-btn-mute-close");
            } else {
                $(this).removeClass("voice-btn-mute-close");
            }
        });
    }
    // 挂断按钮点击事件
    $voiceBtnHangup.click(function () {
        leaveConv(convId);
    });
    // 关闭远端音频按钮点击事件, 可以实现本地静音
    $voiceBtnVoice.click(function () {
        voiceRTCEngine.closeRemoteAudio(!isAudioClose);
        isAudioClose = !isAudioClose;
        if (isAudioClose) {
            $(this).addClass("voice-btn-voice-close");
        } else {
            $(this).removeClass("voice-btn-voice-close");
        }
    });	

// 下一个
    $(".voice-next").click(function () {
        next();
    })
// 上一个
    $(".voice-prev").click(function () {
        prev();
    })

  	
     // 直接就获取token了，那我要先把token服务器架起来了，第一期可以不去获取
    getToken(tokenUrl, selfUserId, appId, async function (data) { 
        var token = data;
        console.log("getToken = " + token)
        try {
            if (selfUserType == VoiceRTCConstant.UserType.NORMAL) {
                await checkCameraAndMicrophone(voiceRTCEngine, token);      // 正常模式需要检测设备是否带有摄像头和麦克风
            }
            // 初始化视频参数，主要是分辨率和帧率
            var myVideoConstraints = initVideoConstraints();
            voiceRTCEngine.setVideoParameters({
                VIDEO_PROFILE: myVideoConstraints,      // 设置视频信息
                USER_TYPE: selfUserType,                // 设置用户类型
                IS_CLOSE_VIDEO: isCameraClose           // 是否关闭视频，纯语音通话时关闭视频
            });
            // 设置上报丢包率信息
            voiceRTCEngine.enableSendLostReport(true);
            // 加入会议 房间号，用户id，用户名，用户token
            voiceRTCEngine.joinRoom(convId, selfUserId, selfUserName, token);
        } catch (err) {
            console.log(err);
            swal("Initialization failed! " + err);
        }
    });
    // SweetAlert2 swal 弹出对话框
    async function checkCameraAndMicrophone(voiceRTCEngine, token) {
        await voiceRTCEngine.audioVideoState().then((data) => {
            if (data.videoState == 0) {
                isCameraClose = true;       // 没有摄像头可以加
                if(isCameraClose){
                    $voiceBtnCamera.addClass("voice-btn-camera-close");
                }
            }

            if (data.audioState == 0) {
                isCameraClose = true;       // 没有摄像头可以加
                if(isCameraClose){
                    $voiceBtnCamera.addClass("voice-btn-voice-close");
                }
            }
            if (data.videoState == 0 && data.audioState == 0) { // 如果摄像头和麦克风都不存在则将为观察者模式
                swal({
                    title: "Error",
                    text: 'No microphones and cameras be detected,lease check it.',
                    type: "error",
                    showCancelButton: false,
                    confirmButtonText: "Exit",
                    closeOnConfirm: false
                }, function () {
                    backLogin();
                });
            } else if (data.videoState == 1 && data.audioState == 1 && data.videoAuthorized == 0 && data.audioAuthorized == 0)
                swal("No the permission that access to microphones and cameras")
            else if (data.audioState == 1 && data.audioAuthorized == 0)
                swal("No the permission that access to microphones")
            else if (data.videoState == 1 && data.videoAuthorized == 0)
                swal("No the permission that access to cameras")
        })
    }

   

// 是否强制关闭浏览器操作
    var isFouce = true;
    /**
     * 页面关闭事件
     *
     */
    $(window).unload(function () {
        if (isFouce) {
            leaveConv(convId);
        }
    });

    /**
     * 请求token
     *
     */
    function getToken(tokenUrl, uid, appid, callback) {
        var tokenReq = {
            'appId': appid,
            'uid': uid
        };
        var message = JSON.stringify(tokenReq)
        // 请求token时附带参数 AppId + uid  参考下声网的方案
        // $.ajax({
        //     url: tokenUrl,
        //     type: "POST",
        //     data: message,
        //     async: true,
        //     success: function (data) {
        //         callback(data);
        //     },
        //     error: function (er) {
        //         swal("请求token失败!");
        //     }
        // });
        callback('xa3f3fsaf');      // 先不用token，直接登录
    }

    /**
     * 初始化视频参数
     *
     */
    function initVideoConstraints() {
        if (resolution != null) {
            var resolutionArr = resolution.split("*");
            var width = resolutionArr[0];
            var height = resolutionArr[1];
            if (width != null && height != null) {
                var myVideoConstraints = {};
                myVideoConstraints.width = parseInt(width);
                myVideoConstraints.height = parseInt(height);
                myVideoConstraints.frameRate = 10;
            }
        }
        return myVideoConstraints;
    }

    function Timer() {
        this.timeout = 0;
        this.startTime = 0;
        this.start = function (callback, second) {
            second = second || 0;

            if (callback) {
                this.timeout = setTimeout(function () {
                    callback();
                }, second);
            }

            this.startTime = +new Date;
        };

        this.stop = function (callback) {

            clearTimeout(this.timeout);

            var endTime = +new Date;
            var startTime = this.startTime;
            var duration = endTime - startTime;

            return {
                start: startTime,
                end: endTime,
                duration: duration
            };
        };
    }

    /**
     * 离开会议
     *
     */
    var queryEwbType;
    var timer = new Timer();

    function leaveConv(convId) {
        // 点击挂断后服务器4秒没响应直接后退到登录页面
        timer.start(function () {
            backLogin();
        }, 500)

        voiceRTCEngine.leaveRoom(convId);
        // 关闭本地媒体流
        voiceRTCEngine.closeLocalStream();
        isFouce = false;
    }

    /**
     * 初始化VoiceRTCEngine
     *
     */
    function initVoiceRTCEngine() {
        // 创建RTC Engine
        var voiceRTCEngine = new VoiceRTCEngine(wsNavUrl, appId);
        // 注册回调
        var voiceRTCEngineEventHandle = new VoiceRTCEngineEventHandle();
        // 加入完成
        voiceRTCEngineEventHandle.on('onJoinComplete', function (data) {
            console.log('onJoinComplete ' + JSON.stringify(data));
            var isJoined = data.isJoined;
            if (isJoined) {
                if(selfUserType == VoiceRTCConstant.UserType.NORMAL) {
                    if (localVideoView == null) {
                        localVideoView = voiceRTCEngine.createLocalVideoView();
                        $("#voice-mainVideo").append(localVideoView);
                        // 加入时是否关闭了本地摄像头
                        if (isCameraClose && selfUserType == VoiceRTCConstant.UserType.NORMAL) {
                            $("#btn_camera").addClass("btn_camera_close");
                            addCloseVideoCover(selfUserId);
                        }
                        $("#" + selfUserId).css("transform", " rotateY(180deg)");
                    }
                }    
            } else {
                swal({
                    title: "Error",
                    text: 'Join the meeting failed',
                    type: "error",
                    showCancelButton: false,
                    confirmButtonText: "Exit",
                    closeOnConfirm: false
                }, function () {
                    backLogin();
                });
            }
        });
        // 离开完成
        voiceRTCEngineEventHandle.on('onLeaveComplete', function (data) {
            console.log('onLeaveComplete ' + JSON.stringify(data));
            var isLeave = data.isLeave;
            if (isLeave) {
                // 关闭本地媒体流
                voiceRTCEngine.closeLocalStream();
                localVideoView = null;
                isFouce = false;
                // 返回login
                backLogin();
            } else {
                swal("离开会议失败!");
            }
        });
        // 其它用户加入
        voiceRTCEngineEventHandle.on('onUserJoined', function (data) {
            console.log('onUserJoined ' +JSON.stringify(data));
            var userId = data.userId;
            var userName = data.userName;
            var userType = data.userType;
            var talkType = data.talkType;

            // 加入时是否开启了摄像头
            console.log(talkType)
            if (talkType == VoiceRTCConstant.TalkType.AUDIO_ONLY) { // 没有开启
                // 提示信息
                console.log("加入会议")
                $("#voice-tip").text(getTime() + " [" + userName + "] 已加入会议且没有开启摄像头");

            } else {
                // 提示信息
                $("#voice-tip").text(getTime() + " [" + userName + "] 已加入会议");
            }
          
        });
        //其它视频流加入
        voiceRTCEngineEventHandle.on('onAddStream', function (data) {
            console.log('onAddStream ' + JSON.stringify(data));
            var isLocal = data.isLocal;
            var talkType = data.talkType;
            var userType = data.userType;
            if (userType == VoiceRTCConstant.UserType.NORMAL) {
                var userId = data.userId;
                var remoteVideoView = voiceRTCEngine.createRemoteVideoView(userId);
                if (selfUserType == VoiceRTCConstant.UserType.OBSERVER && voiceRTCEngine.getRemoteStreamCount() == 1) { // 						本地观察者用户，并且第一个非观察者用户加入
                    $("#voice-mainVideo").append(remoteVideoView);
                } else {
                    remoteVideoView.onclick = function () {
                        switchWindow(this.id);
                    }
                    var subLi = document.createElement('li');
                    subLi.appendChild(remoteVideoView);
                    $("#voice-subVideo").append(subLi);
                }

                if (talkType == VoiceRTCConstant.TalkType.AUDIO_ONLY) {
                    addCloseVideoCover(userId);
                }
                // 本地计时
                if (voiceRTCEngine.getRemoteStreamCount() == 1) {
                    timedCount();
                }
                // 滑动按钮
                if (voiceRTCEngine.getRemoteStreamCount() > showMax) {
                    $(".voice-prev").css('display', 'block');
                    $(".voice-next").css('display', 'block');
                }
            }
        })
        // 其它用户离开
        voiceRTCEngineEventHandle.on('onUserLeave', function (data) {
            console.log("onUserLeave " + JSON.stringify(data));
            var userType = data.userType;
            if (userType != VoiceRTCConstant.UserType.OBSERVER) {
                var userId = data.userId;
                var userName = data.userName;
                var mainVideo = $("#voice-mainVideo").children("video:eq(0)");
                var mainVideoId = mainVideo.attr("id");
                if (mainVideoId == userId) { // 主窗口如果是离开的远端视频
                    if (selfUserType == VoiceRTCConstant.UserType.NORMAL) { // 本地是普通用户
                        // 切换主窗口为本地视频
                        $("#" + selfUserId).trigger("click");
                    } else { // 本地是观察者用户
                        var firstSubVideo = $("#voice-subVideo").children("li:eq(0)").children("video:eq(0)");
                        if (firstSubVideo[0] != null) { // 如果当前退出的不是最后一个，切换主窗口为子窗口中的第一个远端视频
                            firstSubVideo.trigger("click");
                        }
                    }
                }
                // 移除远端视频
                removeVideo(userId);
                // 移除覆盖层
                removeCloseVideoCover(userId);
                // 提示信息
                $("#voice-tip").text(getTime() + " [" + userName + "] 已离开会议");
                // 重置本地计时
                if (voiceRTCEngine.getRemoteStreamCount() == 0) {
                    clearTimedCount();
                }
                if (voiceRTCEngine.getRemoteStreamCount() < showMax) {
                    $(".voice-prev").css('display', 'none');
                    $(".voice-next").css('display', 'none');
                }
            }
        });

        voiceRTCEngineEventHandle.on('onTurnTalkType', function (data) {
            console.log(JSON.stringify(data));
            var userId = data.userId;
            var userName = data.userName;
            var index = data.index;     // 设备类型，0摄像头，1麦克风，2共享屏幕，3系统声音
            var enable = data.enable;
            if (index == 0) {
                if (enable) {
                    $("#voice-tip").text(getTime() + " [" + userName + "] 打开了摄像头");
                    removeCloseVideoCover(userId);
                } else {
                    $("#voice-tip").text(getTime() + " [" + userName + "] 关闭了摄像头");
                    addCloseVideoCover(userId);
                }
            } else if (index == 1) {
                if (enable) {
                    console.log("对方打开麦克风")
                    $("#voice-tip").text(getTime() + " [" + userName + "] 打开了麦克风");
                } else {
                    console.log("对方关闭麦克风")
                    $("#voice-tip").text(getTime() + " [" + userName + "] 关闭了麦克风");
                }
            }
        });
        // 与服务器断开连接
        voiceRTCEngineEventHandle.on('onNetStateChanged', function (data) {
            console.log(JSON.stringify(data));
            var netState = data.netState;
            if (netState == VoiceRTCConstant.NetState.DISCONNECTED_AND_EXIT) {
                swal({
                    title: "",
                    text: "You have disconnected from the server, please try to re-enter the meeting!",
                    type: "error",
                    showCancelButton: false,
                    confirmButtonText: "OK",
                    closeOnConfirm: false
                }, function () {
                     // 关闭本地媒体流
                    voiceRTCEngine.closeLocalStream();

                    isFouce = false;
                    // 返回login
                    backLogin();
                });
               
            } else if (netState == VoiceRTCConstant.NetState.DISCONNECTED) {
                swal({
                    title: "Warning",   
                    text: desc,  
                    type: "warning",
                    showConfirmButton: true 
                });    
            } else if (netState == VoiceRTCConstant.NetState.CONNECTED) {
                swal({
                    title: "Warning",   
                    text: desc,  
                    type: "warning",
                    showConfirmButton: true 
                });    
            } 
        });
       
        // 返回本地数据流的丢包率
        voiceRTCEngineEventHandle.on('onNetworkSentLost', function (data) {
            console.info(JSON.stringify(data));
            var packetSendLossRate = data.packetSendLossRate;
            console.info("packetSendLossRate=" + packetSendLossRate);
        });

        // 返回异常结果
        voiceRTCEngineEventHandle.on('onError', function (data) {
            console.info(JSON.stringify(data));
            desc = data.desc;
            ret = data.ret;

            if (ret == VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_ICE_INVALID) {
                swal({
                    title: "Warning",   
                    text: desc,  
                    type: "warning",
                    timer: 2000,
                });    
            } else {
                swal({
                    title: "Error",
                    text: desc,
                    type: "error",
                    showCancelButton: false,
                    confirmButtonText: "OK",
                    closeOnConfirm: false
                }, function () {
                    // 关闭本地媒体流
                    isFouce = false;
                    // 退出会议
                    leaveConv();
                });
            }
        });

        voiceRTCEngineEventHandle.on('onPeerConnected', function (data) {
            console.info(JSON.stringify(data));
            desc = data.desc;
            console.info("onPeerConnected " + desc);
        });
        

        voiceRTCEngine.setVoiceRTCEngineEventHandle(voiceRTCEngineEventHandle);
        return voiceRTCEngine;
    }


    /**
     * 计时器
     *
     */
    var t;

    function timedCount() {
        var c = 0;
        t = setInterval(function () {
            $("#voice-timer").text("您已加入 : " + formatSeconds(c));
            c = c + 1;
        }, 1000);
    }

    function clearTimedCount() {
        clearInterval(t);
        t = null;
        initTimer();
    }

    function initTimer() {
        if (selfUserType == VoiceRTCConstant.UserType.NORMAL) {
            $("#voice-timer").text("当前会议只有您一人，您可以继续等待其他人加入，或者退出会议");
        } else {
            $("#voice-timer").text("等待其他人加入会议");
        }
    }

    /**
     * 切换视频窗口
     *
     */
    function switchWindow(clickVideoId) {
        var clickVideo = $("#" + clickVideoId);
        var mainVideo = $("#voice-mainVideo").children("video:eq(0)");
        var clickVideoParent = clickVideo.parent();
        var mainVideoParent = mainVideo.parent();
        var bigVideo = {};
        var minVideo = {};
        var videos = new Array();
        bigVideo.flowType = 1;
        bigVideo.uid = clickVideo[0].id;
        minVideo.flowType = 2;
        minVideo.uid = mainVideo[0].id;
        videos.push(bigVideo, minVideo);
        videos = videos.filter((video) => {
            return video.uid != selfUserId
        });
        var msgBody = JSON.stringify(videos);
        // 发送流变化信令
        // voiceRTCEngine.flowSubscribe(msgBody);
        // 移除元素
        clickVideo.remove();
        mainVideo.remove();
        // 点击事件处理
        clickVideo[0].onclick = "";
        mainVideo[0].onclick = function () {
            switchWindow(this.id);
        };
        // 切换
        clickVideoParent.append(mainVideo);
        mainVideoParent.append(clickVideo);
        // 刷新视频流
        clickVideo[0].srcObject = clickVideo[0].srcObject;
        mainVideo[0].srcObject = mainVideo[0].srcObject;
        $("#" + selfUserId).css("transform", " rotateY(180deg)");
        // 关闭摄像头后的覆盖层
        if ($("#" + clickVideo.attr("id") + "_cover")[0]) {
            removeCloseVideoCover(clickVideo.attr("id"));
            addCloseVideoCover(clickVideo.attr("id"));
        }
        if ($("#" + mainVideo.attr("id") + "_cover")[0]) {
            removeCloseVideoCover(mainVideo.attr("id"));
            addCloseVideoCover(mainVideo.attr("id"));

        }
        // 关闭摄像头后的覆盖层
        if ($("#" + clickVideo.attr("id") + "_share")[0]) {
            removeShareVideoCover(clickVideo.attr("id"))
            addShareCover(clickVideo.attr("id"))
        }
        if ($("#" + mainVideo.attr("id") + "_share")[0]) {
            removeShareVideoCover(mainVideo.attr("id"))
            addShareCover(mainVideo.attr("id"))

        }
    }

    /**
     * 窗口向前向滑动
     *
     */
    var showIndex = 1;
    var showMax = 7;
    var offset = 172;

    function next() {
        var length = voiceRTCEngine.getRemoteStreamCount();
        if (showIndex > length - showMax) {
            swal("已到最后!")
            return;
        }
        showIndex++;
        $("#voice-slide ul").animate({
            "left": "-=" + offset + "px"
        }, 200)
    }

    function prev() {
        if (showIndex <= 1) {
            swal("已到最前!")
            return;
        }
        showIndex--;
        $("#voice-slide ul").animate({
            "left": "+=" + offset + "px"
        }, 200)
    }

    /**
     * 加关闭视频后的覆盖层
     *
     */
    function addCloseVideoCover(closeVideoId) {
        var imgSrc1 = "images/microphone_120x_white.png";
        var imgSrc2 = "images/microphone_48x_white.png";
        var nameLocal = "您";
        var nameRemote1 = closeVideoId;
        var nameRemote2 = closeVideoId.substr(0, 6) + "...";
        var desc1 = "当前正以语音参与会议";
        var desc2 = "";
        var parentDiv = $("#" + closeVideoId).parent();
        var parentId = parentDiv.attr("id");
        var imgSrc = parentId == "voice-mainVideo" ? imgSrc1 : imgSrc2;
        var nameRemote = parentId == "voice-mainVideo" ? nameRemote1 : nameRemote2;
        var desc = parentId == "voice-mainVideo" ? desc1 : desc2;
        parentDiv
            .append("<div id='"
                + closeVideoId
                + "_cover' class='voice-closeVideoCover'><div style='margin-top:25%; margin-bottom: 25px;'><img src='" + imgSrc + "'></div></div>");
        if (closeVideoId == selfUserId) {
            $("#" + closeVideoId + "_cover").append(
                "<div>[" + nameLocal + "]" + desc + "</div>");
        } else {
            $("#" + closeVideoId + "_cover").append(
                "<div>[" + nameRemote + "]" + desc + "</div>");
        }
        if (parentId != "voice-mainVideo") {
            $("#" + closeVideoId + "_cover").click(function () {
                switchWindow(closeVideoId);
            });
        }
    }

    

    /**
     * 删除覆盖层
     *
     */
    function removeCloseVideoCover(closeVideoId) {
        $('#' + closeVideoId + '_cover').remove();
    }

    /**
     * 删除共享覆盖层
     *
     */
    function removeShareVideoCover(closeVideoId) {
        $('#' + closeVideoId + '_share').remove();
    }

    /**
     * 删除video
     *
     */
    function removeVideo(removeVideoId) {
        var parentDiv = $("#" + removeVideoId).parent();
        $("#" + removeVideoId).remove();
        if (parentDiv.is('li')) { // 如果是子窗口的video
            parentDiv.remove();
        }
    }

    /**
     * 返回login.html
     *
     */
    function backLogin() {
        // window.location.href = "login.html";
        var param = "convId=" + convId + "&isCameraClose="
            + (isCameraClose ? 1 : 0) + "&userType=" + selfUserType
        if (resolution != null && resolution != "") {
            param += "&resolution=" + resolution;
        }
        window.location.href = 'index.html?' + param;
    }
    localStorage.set("convId", convId);
    localStorage.set("isCameraClose", false);
    localStorage.set("resolution", resolution);
    localStorage.set("userType", VoiceRTCConstant.UserType.NORMAL);
    localStorage.set("conUserName", selfUserName);
})(global_config, window)
