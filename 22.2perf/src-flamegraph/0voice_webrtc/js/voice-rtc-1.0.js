// "严格模式"是一种在JavaScript代码运行时自动实行更严格解析和错误处理的方法。这种模式使得Javascript在更严格的条件下运行。

'use strict';
var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription);

// var vConsole = new VConsole();


// voice-rtc sdk ver 1.0
// liaoqingfu create 2019-04-17
/** ----- 参数定义 ----- */
var VoiceRTCGlobal = {
    /** 带宽设置计数器 */
    bandWidthCount: 0
};

/** ----- 参数定义 ----- */

/** ----- 常量定义 ----- */
var VoiceRTCConstant = {
    /** VoiceRTC SDK版本号 */
    SDK_VERSION_NAME: '1.0.0',
    /** logon version */
    LOGON_VERSION: '1',
    /** keepAlive时间间隔 */
    KEEPALIVE_INTERVAL: 5 * 1000,
    /** keepAlive最大连续失败次数 */
    KEEPALIVE_FAILEDTIMES_MAX: 4,
    /** keepAliveTimer时间间隔 */
    KEEPALIVE_TIMER_INTERVAL: 2 * 1000,
    /** keepAlive未收到result最大超时时间 */
    KEEPALIVE_TIMER_TIMEOUT_MAX: 20,
    /** keepAlive未收到result最大超时时间 */
    KEEPALIVE_TIMER_TIMEOUT_RECONNECT: 12,
    /** reconnect最大连续次数 */
    RECONNECT_MAXTIMES: 10,
    /** reconnect连续重连时间间隔 */
    RECONNECT_TIMEOUT: 1 * 1000,
    /** getStatsReport时间间隔 */
    GETSTATSREPORT_INTERVAL: 2 * 1000,
    PEER_CONNECT_STATE_TIMEOUT: 20000   // 设置20秒
};

/** 用户模式类型 */
VoiceRTCConstant.UserType = {
    /** 普通模式 */
    NORMAL: 0,
    /** 观察者模式 */
    OBSERVER: 1
};

/** 通话类型 **/
VoiceRTCConstant.TalkType = {
    AUDIO_ONLY: 0,      //无视频有音频, 
    AUDIO_VIDEO: 1,     //有视频有音频,
    VIDEO_ONLY: 2,      //有视频无音频, 
    NO_AUDIO_VIDEO: 3   //无视频无音频
};


/** 与服务器的连接状态 */
VoiceRTCConstant.NetState = {
    INIT:'INIT',                // 初始化状态
    CONNECTED: 'CONNECTED',     // 网络连接成功
    CONNECTING: 'CONNECTING',       // 正常开始连接
    TRY_CONNECTING: 'TRY_CONNECTING',   // 断开后的重新尝试连接
    DISCONNECTED: 'DISCONNECTED',   // 网络断开，但会尝试重连
    DISCONNECTED_AND_EXIT: 'DISCONNECTED_AND_EXIT' // 网络断开并退出
};
/** websocket的连接状态 */
VoiceRTCConstant.wsConnectionState = {
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
    CONNECTING: 'CONNECTING'
};

/** logonAndJoin status */
VoiceRTCConstant.LogonAndJoinStatus = {
    CONNECT: 0,
    RECONNECT: 1
};
/** offer status */
VoiceRTCConstant.OfferStatus = {
    SENDING: 'SENDING',
    DONE: 'DONE'
};


VoiceRTCConstant.RoomErrorCode = {
    ROOM_ERROR_SUCCESS: 0,		// 为0
    ROOM_ERROR_FULL: 1,		    // 房间已经满了
    ROOM_ERROR_NOT_FIND_UID: 2,		// 不能找到指定的用户ID
    ROOM_ERROR_PARSE_FAILED: 3,		// 解析json错误
    ROOM_ERROR_WEBSOCKET_BROKEN: 4,	// websocket出现异常
    ROOM_ERROR_NOT_FIND_RID: 5,	// 没有找到指定的房间
    ROOM_ERROR_NOT_FIND_REMOTEID: 6,	// 远程ID
    ROOM_ERROR_WEBSOCKET_FAILED: 7,	// websocket出错
    ROOM_ERROR_ICE_FULL_LOADING: 8,	// ice server负载已满
    ROOM_ERROR_ICE_INVALID: 9,	// ice server失效
    ROOM_ERROR_NO_MICROPHONE_DEV: 10,    // 没有音频设备
    ROOM_ERROR_CLIENT_EXCEPTION:11,     // 客户端异常
};

VoiceRTCConstant.RoomErrorString = {
    ROOM_ERROR_SUCCESS: "successful",	// 0
    ROOM_ERROR_FULL: "room is full, it up to max number",	// 1
    ROOM_ERROR_NOT_FIND_UID: "can't find the designated uid, it may leave the room halfway", // 2
    ROOM_ERROR_PARSE_FAILED: "server parse the message faild, please check the format",	// 3
    ROOM_ERROR_WEBSOCKET_BROKEN: "websocket may be broken",	// 4
    ROOM_ERROR_NOT_FIND_RID: "can't find the designated room id",	// 5
    ROOM_ERROR_NOT_FIND_REMOTEID: "can't find the remote user id",	//6
    ROOM_ERROR_WEBSOCKET_FAILED: "can't connect to room server ",	// 7
    ROOM_ERROR_ICE_FULL_LOADING: "ice server bandwidth is full loading", // 8
    ROOM_ERROR_ICE_INVALID: "ice server invalid, please report to the voice technology",//9
    ROOM_ERROR_NO_MICROPHONE_DEV: "no microphone device, you can't use talk feature", //10
    ROOM_ERROR_CLIENT_EXCEPTION:"client exception"
};

VoiceRTCConstant.Platform = {
    ANDROID: 'android',
    IOS: 'ios',
    WIN_PC: 'winpc',
    WEB: 'web'      // 暂不做手机web的优化，所以只要是浏览器统一认为是web
};

/** 信令 */
VoiceRTCConstant.SignalType = {
    // 请求信令
    LOGON: 'logon',        // 登录负载均衡服务器获取roomserver地址
    JOIN: 'join',
    LEAVE: 'leave',
    OFFER: 'offer',
    ANSWER: 'answer',
    CANDIDATE: 'candidate',
    KEEP_LIVE: 'keepLive',
    REPORT_INFO: 'reportInfo',
    REPORT_STATS: 'reportStats',
    /**
     * Index   设备索引：0摄像头，1麦克风，2共享屏幕，3系统声音
     * Enable  设备情况： false关闭，true开启
     * */
    TURN_TALK_TYPE: 'turnTalkType',  // 更新通话类型，主动通知自己的情况，比如自己关闭声音则房间其他人听不到你的声音，比如自己关闭画面则其他人看不到你画面.
    PEER_CONNECTED: 'peerConnected',

    // 服务器回应请求信令
    RESP_JOIN: 'respJoin',
    RESP_LEAVE: 'respLeave',
    RESP_OFFER: 'respOffer',
    RESP_ANSWER: 'respAnswer',
    RESP_CANDIDATE: 'respCandidate',
    RESP_KEEP_LIVE: 'respKeepLive',
    RESP_TURN_TALK_TYPE: 'respTurnTalkType',
    RESP_GENERAL_MSG: 'generalMsgResp',

    // 服务器转发的请求信令
    ON_REMOTE_LEAVE: 'relayLeave',
    ON_REMOTE_OFFER: 'relayOffer',
    ON_REMOTE_ANSWER: 'relayAnswer',
    ON_REMOTE_CANDIDATE: 'relayCandidate',
    ON_REMOTE_TURN_TALK_TYPE: 'relayTurnTalkType',   // 对端更新通话类型，接收端接收到该信令则通过回调提示应用层对端比如关闭声音等

    // 服务器主动给客户端发命令
    NOTIFYE_NEW_PEER: 'notifyNewPeer',
    ON_RE_NEW_PEER: 'renewPeer',
};

/** 视频分辨率 */
VoiceRTCConstant.VideoProfile_default = {
    width: 320,
    height: 240,
    frameRate: 7
}
/** 小视频分辨率 */
VoiceRTCConstant.VideoProfile_min = {
    width: 176,
    height: 144,
    frameRate: 3
}

/** 带宽 */
VoiceRTCConstant.BandWidth_default = {
    min: 80,
    max: 300
}
/** 带宽全部 */
VoiceRTCConstant.BandWidth_320_240 = {
    min: 80,
    max: 300
}
VoiceRTCConstant.BandWidth_640_480 = {
    min: 150,
    max: 600
}
VoiceRTCConstant.BandWidth_1280_720 = {
    min: 100,
    max: 1500
}

function RTCPeerConnectionWrapper(localUserId, remoteUserId, remoteUserName, rtcConfig) {
    this.localUserId = localUserId;
    this.remoteUserId = remoteUserId;
    this.remoteUserName = remoteUserName;
    this.rtcConfig = rtcConfig;
    this.remoteSdp = null;
    this.startTime_ = window.performance.now();
    this.connectTime_ = window.performance.now();
    this.initiator = false;     // 默认不是发起者，只有createoffer者被认为是发起者
    this.pc = this.create();
    this.checkPeerConnectTimer = null;
    this.peerConnectState = "new";
    this.startPeerConnectState = "new";
    this.isSendPeerConnectedResult = false;
    this.reportStatsStartTime = 0;
    this.getStatsReportInterval = null;
    // var timestamp = (new Date()).valueOf();
    this.preStats = {
        audio: {
            send: {
                packetsLost: 0,
                packetsSent: 0,
                bytesSent: 0,
                timestamp: 0 //时间戳
            },
            recv: {
                packetsLost: 0,  // 丢包数量
                packetsReceived: 0,  // 已接收数量
                bytesReceived: 0,   // 已接收字节
                timestamp: 0 //时间戳
            }
        },
        video: {
            send: {
                packetsLost: 0,
                packetsSent: 0,
                bytesSent: 0,
                timestamp: 0 //时间戳
            },
            recv: {
                packetsLost: 0,  // 丢包数量
                packetsReceived: 0,  // 已接收数量
                bytesReceived: 0,   // 已接收字节
                timestamp: 0 //时间戳
            }
        }
    };
    this.statsResult = {
        audio: {
            send: {
                packetsLost: 0,  // 丢包数量
                packetsSent: 0,  // 已发送包数量
                bytesSent: 0,   // 已发送字节
                codecName: '0',   // 编码器
                packetsLostRate: 0.0,// 丢包率
                bitRate: 0.0  // 发送的码率
            },
            recv: {
                packetsLost: 0,  // 丢包数量
                packetsReceived: 0,  // 已接收数量
                bytesReceived: 0,   // 已接收字节
                codecName: '0',   // 编码器
                packetsLostRate: 0.0,// 丢包率
                bitRate: 0  // 收到的码率
            },
        },
        video: {
            send: {
                packetsLost: 0,  // 丢包数量
                packetsSent: 0,  // 已发送包数量
                bytesSent: 0,   // 已发送字节 
                frameRateInput: 0, // 输入帧率
                frameRateSent: 0, // 实际发送的帧率
                width: 0,
                height: 0,
                codecName: '0',   // 编码器
                packetsLostRate: 0.0,// 丢包率
                bitRate: 0  // 发送的码率
            },
            recv: {
                packetsLost: 0,  // 丢包数量
                packetsReceived: 0,  // 已接收数量
                bytesReceived: 0,   // 已接收字节
                frameRateReceived: 0, // 收到的帧率
                frameRateOutput: 0,   // 对方发送的实际帧率
                width: 0,
                height: 0,
                codecName: '0',   // 编码器
                packetsLostRate: 0.0,// 丢包率
                bitRate: 0.0  // 收到的码率
            },
            videobwe: {//视频带宽相关信息
                actualEncBitrate: 0, // 视频编码器实际编码的码率，通常这与目标码率是匹配的
                availableSendBandwidth: 0,   // 视频数据发送可用的带宽。
                retransmitBitrate: 0,    // 如果RTX被使用的话，表示重传的码率
                availableReceiveBandwidth: 0,    //  视频数据接收可用的带宽。
                targetEncBitrate: 0,     // 视频编码器的目标比特率。
                transmitBitrate: 0 // 实际发送的码率，如果此数值与googActualEncBitrate有较大的出入，可能是fec的影响。
            }
        }
        , localcandidate: {
            portNumber: 0,
            networkType: '',
            ipAddress: '',
            transport: '',
            candidateType: 'Unknown'
        }
    };
}

/**
 * 如果一直处于失效状态则报错
 */
RTCPeerConnectionWrapper.prototype.checkPeerConnectState = function () {
    if (this.peerConnectState == this.startPeerConnectState) {
        // 报错
        VoiceRTCLogger.warn("the startPeerConnectState:" + this.startPeerConnectState + ", cur peerConnectState:" + this.peerConnectState);
        // 报告服务器，以便服务器收集错误信息
        voiceRTCEngine.reportInfo(VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_ICE_INVALID,
            VoiceRTCConstant.RoomErrorString.ROOM_ERROR_ICE_INVALID,
            JSON.stringify(this.rtcConfig), null);
        // 告诉调用者ICE服务器出现异常，可以考虑直接关闭通话
        voiceRTCEngine.voiceRTCEngineEventHandle.call("onError", {
            ret: VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_ICE_INVALID,    
            desc: VoiceRTCConstant.RoomErrorString.ROOM_ERROR_ICE_INVALID
        });
    } else {
        VoiceRTCLogger.info("the connect state have change [" + this.startPeerConnectState + "] to [" + this.peerConnectState + "]");
        // 停止
        this.stopCheckPeerConnectState();
    }   
}

RTCPeerConnectionWrapper.prototype.startCheckPeerConnectState = function (startState) {
    this.peerConnectState = startState;
    this.startPeerConnectState = startState;
    this.stopCheckPeerConnectState();   // 先停掉定时器
    var checkRTCPeerConnectionWrapper = this;
    this.checkPeerConnectTimer = setInterval(function () { checkRTCPeerConnectionWrapper.checkPeerConnectState(); }, VoiceRTCConstant.PEER_CONNECT_STATE_TIMEOUT);

};

RTCPeerConnectionWrapper.prototype.stopCheckPeerConnectState = function () {
    if (this.checkPeerConnectTimer != null) {
        clearInterval(this.checkPeerConnectTimer);
        this.checkPeerConnectTimer = null;
    }
};



RTCPeerConnectionWrapper.prototype.setSetupTimes = function (startTime, connectTime) {
    this.startTime_ = startTime;
    this.connectTime_ = connectTime;
};

RTCPeerConnectionWrapper.prototype.setInitiator = function (isInitiator) {
    this.initiator = isInitiator;
};

RTCPeerConnectionWrapper.prototype.getInitiator = function (isInitiator) {
    return this.initiator;
};


RTCPeerConnectionWrapper.prototype.create = function () {
    var configuration = this.rtcConfig;

    var pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = this.onicecandidate.bind(this);
    pc.onicecandidateerror = this.onicecandidateerror.bind(this);
    pc.onaddstream = this.onaddstream.bind(this);
    pc.onremovestream = this.onremovestream.bind(this);
    // sdp信令状态
    pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
    // Peer连接状态
    pc.onconnectionstatechange = this.onconnectionstatechange.bind(this);
    // 用于描述连接的ICE连接状态
    pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind(this);
    // 用来检测本地 candidate 的状态
    pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);

    pc.onremovestream = this.onremovestream.bind(this);

    pc.ontrack = this.ontrack.bind(this);;
    pc.onnegotiationneeded = null;
    pc.ondatachannel = null;

    return pc;
}
RTCPeerConnectionWrapper.prototype.getPc = function () {
    return this.pc
}

RTCPeerConnectionWrapper.prototype.close = function () {
    this.pc.close();
}

RTCPeerConnectionWrapper.prototype.addStream = function (stream) {
    if (this.pc.addStream == undefined) {
        stream.getTracks().forEach(track => this.pc.addTrack(track, stream));
        VoiceRTCLogger.info("stream.getTracks()");
    } else {
        this.pc.addStream(stream);
        VoiceRTCLogger.info("pc.addStream");
    }
}

RTCPeerConnectionWrapper.prototype.removeStream = function (stream) {
    this.pc.removeStream(stream);
}

RTCPeerConnectionWrapper.prototype.onicecandidate = function (evt) {
    VoiceRTCLogger.debug("PeerConnection: onicecandidate -> ", evt);

    handle(this.pc, evt, this.remoteUserId);

    function handle(pc, evt, userId) {
        if ((pc.signalingState || pc.readyState) == 'stable') {
            if (evt.candidate) {
                var message = {
                    'label': evt.candidate.sdpMLineIndex,
                    'id': evt.candidate.sdpMid,
                    'candidate': evt.candidate.candidate
                };
                voiceRTCEngine.candidate(JSON.stringify(message), userId);
            }
            return;
        }
        setTimeout(function () {
            handle(pc, evt, userId);
        }, 2 * 1000);
    }
}

RTCPeerConnectionWrapper.prototype.onicecandidateerror = function (evt) {
    VoiceRTCLogger.info("PeerConnection: onicecandidateerror -> ", evt);

}

// 显示远端码流加入
RTCPeerConnectionWrapper.prototype.onaddstream = function (evt) {
    VoiceRTCLogger.info("PeerConnection: onaddstream -> ", evt);

    voiceRTCEngine.remoteStreams.push(evt.stream);
    var joinedUser = voiceRTCEngine.joinedUsers.get(this.remoteUserId);
    joinedUser.splice(3, 1, evt.stream);    // [0] 用户类型 [1] 通话类型 [2] 用户名 [3] stream 插入 evt.stream
    var userType = joinedUser[0];
    var talkType = joinedUser[1];           // 获取类型
    console.log("talkType", talkType);
    if (talkType == VoiceRTCConstant.TalkType.AUDIO_ONLY || talkType == VoiceRTCConstant.TalkType.NO_AUDIO_VIDEO) {
        console.log("remove Video track", talkType);
        evt.stream.getVideoTracks().forEach(function (track) {
            track.enabled = false;              // 禁掉视频
        })
    }

    // 如果已经在view里面，则修改obj即可，否则调用onAddStream回调函数
    if(voiceRTCEngine.remoteViewMap.contains(this.remoteUserId)) {
        var videoView = voiceRTCEngine.remoteViewMap.get(this.remoteUserId);
        videoView.srcObject = evt.stream;
        VoiceRTCLogger.info("PeerConnection: onaddstream -> change srcObject");
    } else { 
        VoiceRTCLogger.info("PeerConnection: onaddstream -> call onAddStream");
        voiceRTCEngine.voiceRTCEngineEventHandle.call('onAddStream', { //
            userId: this.remoteUserId,
            userType: userType,
            talkType: talkType,
            stream: evt.stream,
            isLocal: false
        });
    }
}

RTCPeerConnectionWrapper.prototype.onremovestream = function (evt) {
    VoiceRTCLogger.info("PeerConnection: onremovestream -> ", evt);
}

/**
 * WebIDLenum RTCSignalingState {
    "stable",
    "have-local-offer",
    "have-remote-offer",
    "have-local-pranswer",
    "have-remote-pranswer",
    "closed"
};
 */
RTCPeerConnectionWrapper.prototype.onsignalingstatechange = function () {
    VoiceRTCLogger.info("PeerConnection: onsignalingstatechange -> ", this.pc.signalingState);
};


/**
 * "new",
    "connecting",
    "connected",
    "disconnected",
    "failed",
    "closed"
 */
RTCPeerConnectionWrapper.prototype.onconnectionstatechange = function () {
    VoiceRTCLogger.info("PeerConnection: onconnectionstatechange -> ", this.pc.connectionState);
    if (this.pc.connectionState === 'connected' || this.pc.connectionState === 'closed') {
        this.peerConnectState = this.pc.connectionState;
        // 停止状态监测
        this.stopCheckPeerConnectState();
    } else {
        VoiceRTCLogger.info("start timer to check connect state:" + this.pc.connectionState);
        this.startCheckPeerConnectState(this.pc.connectionState);
    }
};
/**
 * 用来检测远端 candidate 的状态。远端的状态比较复杂
 "new": ICE 代理正在搜集地址或者等待远程候选可用。
"checking": ICE 代理已收到至少一个远程候选，并进行校验，无论此时是否有可用连接。同时可能在继续收集候选。
"connected": ICE代理至少对每个候选发现了一个可用的连接，此时仍然会继续测试远程候选以便发现更优的连接。同时可能在继续收集候选。
"completed": ICE代理已经发现了可用的连接，不再测试远程候选。
"failed": ICE候选测试了所有远程候选没有发现匹配的候选。也可能有些候选中发现了一些可用连接。
"disconnected": 测试不再活跃，这可能是一个暂时的状态，可以自我恢复。
"closed": ICE代理关闭，不再应答任何请求。
 */
RTCPeerConnectionWrapper.prototype.oniceconnectionstatechange = function () {
    //  VoiceRTCLogger.warn("pc.iceConnectionState=" + this.pc.iceConnectionState);
    VoiceRTCLogger.info("PeerConnection: oniceconnectionstatechange -> ", this.pc.iceConnectionState);

    if (this.pc.iceConnectionState === "connected") {
        VoiceRTCLogger.info("ICE connected time: " + (window.performance.now() - this.startTime_).toFixed(0) + "ms.");
    }

    if (this.pc.iceConnectionState === "completed") {
        VoiceRTCLogger.info("ICE complete time: " + (window.performance.now() - this.startTime_).toFixed(0) + "ms.");
    }

    if (this.pc.iceConnectionState == 'failed') {
        if (voiceRTCEngine.wsConnectionState == VoiceRTCConstant.wsConnectionState.CONNECTED) { // ws连接可用
            if (this.initiator) {
                VoiceRTCLogger.warn("oniceconnectionstatechange createOffer");
                voiceRTCEngine.createOffer(this.remoteUserId, this.remoteUserName, null, true);   // 重新连接
            } else {
                VoiceRTCLogger.warn("oniceconnectionstatechange wait caller restart ice");
            }
        }
    }
    // ICE服务器不正常时最终是否出现 closed的状态
};

/**
 * iceGatheringState: 用来检测本地 candidate 的状态。其有以下三种状态：
 - new: 该 candidate 刚刚被创建
 - gathering: ICE 正在收集本地的 candidate
 - complete: ICE 完成本地 candidate 的收集
 */
RTCPeerConnectionWrapper.prototype.onicegatheringstatechange = function () {
    VoiceRTCLogger.info("PeerConnection: onicegatheringstatechange -> ", this.pc.iceGatheringState);

};

RTCPeerConnectionWrapper.prototype.ontrack = function (evt) {
    VoiceRTCLogger.info("PeerConnection: ontrack -> ", evt);

};


/**
 * 开始getStatsReport
 *
 */
RTCPeerConnectionWrapper.prototype.startScheduleGetStatsReport = function () {
    VoiceRTCLogger.info('startScheduleGetStatsReport, userId: ' + this.remoteUserId);
    this.exitScheduleGetStatsReport();
    var pc = this;
    this.getStatsReportInterval = setInterval(function () {
        pc.getStatsReport();
    }, VoiceRTCConstant.GETSTATSREPORT_INTERVAL);
}
/**
 * 停止getStatsReport
 *
 */
RTCPeerConnectionWrapper.prototype.exitScheduleGetStatsReport = function () {
    VoiceRTCLogger.info('exitScheduleGetStatsReport, userId: ' + this.remoteUserId);
    if (this.getStatsReportInterval != null) {
        clearInterval(this.getStatsReportInterval);
        this.getStatsReportInterval = null;
    }
}

/** ----- getStatsReport ---- */
/**
 * getStatsReport
 * https://stackoverflow.com/questions/24066850/is-there-an-api-for-the-chrome-webrtc-internals-variables-in-javascript?r=SearchResults
 *
 */
RTCPeerConnectionWrapper.prototype.getStatsReport = function () {
    var userId = this.userId;
    var pc = this;
    if (voiceRTCEngine.browserKnerl == 'chrome'
        || voiceRTCEngine.browserKnerl == 'opera') {
        pc.getPc().getStats(function callback(report) {
            var error, pcksent;
            var rtcStatsReports = report.result();
            // VoiceRTCLogger.debug('rtcStatsReports.length:' + rtcStatsReports.length);
            for (var i = 0; i < rtcStatsReports.length; i++) {
                var statNames = rtcStatsReports[i].names();
                // var timestamp = rtcStatsReports[i].timestamp;
                // VoiceRTCLogger.debug('statsResult = ' + pc.statsResult);
                // pc.statsResult = 'qingfu';
                // 数据源
                if (rtcStatsReports[i].type == 'ssrc') {
                    var mediaTypeIndex = statNames.indexOf("mediaType");
                    var statValue = rtcStatsReports[i].stat('mediaType');
                    var sendOrRecv = 'Unknown';
                    if (rtcStatsReports[i].id.indexOf('_recv') > 0) {
                        sendOrRecv = 'recv';
                    } else if (rtcStatsReports[i].id.indexOf('send') > 0) {
                        sendOrRecv = 'send';
                    }
                    if (statValue == 'audio') {
                        var timestamp = rtcStatsReports[i].timestamp.valueOf() / 1000;
                        var duration = VoiceRTCConstant.GETSTATSREPORT_INTERVAL / 1000;
                        if (sendOrRecv == 'send') {
                            if (pc.preStats.audio.send.timestamp > 0 && pc.preStats.audio.send.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.audio.send.timestamp;
                            }
                            pc.preStats.audio.send.timestamp = timestamp;
                            // 计算丢包率
                            statValue = rtcStatsReports[i].stat('packetsLost');
                            var lostpkt = statValue - pc.preStats.audio.send.packetsLost;
                            pc.statsResult.audio.send.packetsLost = statValue;
                            pc.preStats.audio.send.packetsLost = statValue;
                            statValue = rtcStatsReports[i].stat('packetsSent');
                            var sendpkt = statValue - pc.preStats.audio.send.packetsSent;
                            pc.statsResult.audio.send.packetsSent = statValue;
                            pc.preStats.audio.send.packetsSent = statValue;
                            if (sendpkt > 0) {
                                pc.statsResult.audio.send.packetsLostRate = (lostpkt / sendpkt).toFixed(2);
                            }
                            // 计算码率
                            statValue = rtcStatsReports[i].stat('bytesSent');
                            var sendbytes = statValue - pc.preStats.audio.send.bytesSent;
                            pc.preStats.audio.send.bytesSent = statValue;
                            if (sendbytes > 0) {
                                pc.statsResult.audio.send.bitRate = Math.round(sendbytes * 8 / duration / 1024);
                            }
                            // 获取编码器
                            statValue = rtcStatsReports[i].stat('googCodecName');
                            pc.statsResult.audio.send.codecName = statValue;
                            // VoiceRTCLogger.debug('audio send: lostRate: ' + pc.statsResult.audio.send.packetsLostRate + ', bitRate:'
                            //     + pc.statsResult.audio.send.bitRate + 'kbps');
                        } else if (sendOrRecv == 'recv') {
                            if (pc.preStats.audio.recv.timestamp > 0 && pc.preStats.audio.recv.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.audio.recv.timestamp;
                            }
                            pc.preStats.audio.recv.timestamp = timestamp;
                            // 计算丢包率
                            statValue = rtcStatsReports[i].stat('packetsLost');
                            var lostpkt = statValue - pc.preStats.audio.recv.packetsLost;
                            pc.statsResult.audio.recv.packetsLost = statValue;
                            pc.preStats.audio.recv.packetsLost = statValue;
                            statValue = rtcStatsReports[i].stat('packetsReceived');
                            var recvdpkt = statValue - pc.preStats.audio.recv.packetsReceived;
                            pc.statsResult.audio.recv.packetsReceived = statValue;
                            pc.preStats.audio.recv.packetsReceived = statValue;
                            if (recvdpkt > 0) {
                                pc.statsResult.audio.recv.packetsLostRate = (lostpkt / recvdpkt).toFixed(2);
                            }
                            // 计算码率
                            statValue = rtcStatsReports[i].stat('bytesReceived');
                            var recvbytes = statValue - pc.preStats.audio.recv.bytesReceived;
                            pc.preStats.audio.recv.bytesReceived = statValue;
                            if (recvbytes > 0) {
                                pc.statsResult.audio.recv.bitRate = Math.round(recvbytes * 8 / duration / 1024);
                            }
                            // 获取编码器
                            statValue = rtcStatsReports[i].stat('googCodecName');
                            pc.statsResult.audio.recv.codecName = statValue;
                            // VoiceRTCLogger.debug('audio recv: lostRate: ' + pc.statsResult.audio.recv.packetsLostRate + ', bitRate:'
                            //     + pc.statsResult.audio.recv.bitRate + 'kbps');
                        } else {
                            VoiceRTCLogger.error('media can not handle:' + statValue);
                        }
                    } else if (statValue == 'video') {
                        var timestamp = rtcStatsReports[i].timestamp.valueOf() / 1000;
                        var duration = VoiceRTCConstant.GETSTATSREPORT_INTERVAL / 1000;
                        if (sendOrRecv == 'send') {
                            if (pc.preStats.video.send.timestamp > 0 && pc.preStats.video.send.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.video.send.timestamp;
                            }
                            pc.preStats.video.send.timestamp = timestamp;
                            // 计算丢包率
                            statValue = rtcStatsReports[i].stat('packetsLost');
                            var lostpkt = statValue - pc.preStats.video.send.packetsLost;
                            pc.statsResult.video.send.packetsLost = statValue;
                            pc.preStats.video.send.packetsLost = statValue;
                            statValue = rtcStatsReports[i].stat('packetsSent');
                            var sendpkt = statValue - pc.preStats.video.send.packetsSent;
                            pc.statsResult.video.send.packetsSent = statValue;
                            pc.preStats.video.send.packetsSent = statValue;
                            if (sendpkt > 0) {
                                pc.statsResult.video.send.packetsLostRate = (lostpkt / sendpkt).toFixed(2);
                            }
                            // 计算码率
                            statValue = rtcStatsReports[i].stat('bytesSent');
                            var sendbytes = statValue - pc.preStats.video.send.bytesSent;
                            pc.preStats.video.send.bytesSent = statValue;
                            if (sendbytes > 0) {
                                pc.statsResult.video.send.bitRate = Math.round(sendbytes * 8 / duration / 1024);
                            }
                            // 获取编码器
                            statValue = rtcStatsReports[i].stat('googCodecName');
                            pc.statsResult.video.send.codecName = statValue;
                            // VoiceRTCLogger.debug('video send: lostRate: ' + pc.statsResult.video.send.packetsLostRate + ', bitRate:'
                            //     + pc.statsResult.video.send.bitRate  + 'kbps');
                            // 输入帧率
                            statValue = rtcStatsReports[i].stat('googFrameRateInput');
                            pc.statsResult.video.send.frameRateInput = parseInt(statValue);
                            // 实际发送的帧率
                            statValue = rtcStatsReports[i].stat('googFrameRateSent');
                            pc.statsResult.video.send.frameRateSent = parseInt(statValue);
                            // 分辨率
                            statValue = rtcStatsReports[i].stat('googFrameWidthSent');
                            pc.statsResult.video.send.width = parseInt(statValue);
                            statValue = rtcStatsReports[i].stat('googFrameHeightSent');
                            pc.statsResult.video.send.height = parseInt(statValue);

                        } else if (sendOrRecv == 'recv') {
                            if (pc.preStats.video.recv.timestamp > 0 && pc.preStats.video.recv.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.video.recv.timestamp;
                            }
                            pc.preStats.video.recv.timestamp = timestamp;
                            // 计算丢包率
                            statValue = rtcStatsReports[i].stat('packetsLost');
                            var lostpkt = statValue - pc.preStats.video.recv.packetsLost;
                            pc.statsResult.video.recv.packetsLost = statValue;
                            pc.preStats.video.recv.packetsLost = statValue;
                            statValue = rtcStatsReports[i].stat('packetsReceived');
                            var recvdpkt = statValue - pc.preStats.video.recv.packetsReceived;
                            pc.statsResult.video.recv.packetsReceived = statValue;
                            pc.preStats.video.recv.packetsReceived = statValue;
                            if (recvdpkt > 0) {
                                pc.statsResult.video.recv.packetsLostRate = (lostpkt / recvdpkt).toFixed(2);
                            }
                            // 计算码率
                            statValue = rtcStatsReports[i].stat('bytesReceived');
                            var recvbytes = statValue - pc.preStats.video.recv.bytesReceived;
                            pc.preStats.video.recv.bytesReceived = statValue;
                            if (recvbytes > 0) {
                                pc.statsResult.video.recv.bitRate = Math.round(recvbytes * 8 / duration / 1024);
                            }
                            // 获取编码器
                            statValue = rtcStatsReports[i].stat('googCodecName');
                            pc.statsResult.video.recv.codecName = statValue;
                            //VoiceRTCLogger.debug('video recv: lostRate: ' + pc.statsResult.video.recv.packetsLostRate + ', bitRate:'
                            //    + pc.statsResult.video.recv.bitRate + 'kbps');
                            // 实际发送的帧率
                            statValue = rtcStatsReports[i].stat('googFrameRateOutput');
                            pc.statsResult.video.recv.frameRateOutput = statValue;
                            // 实际接收的帧率
                            statValue = rtcStatsReports[i].stat('googFrameRateReceived');
                            pc.statsResult.video.recv.frameRateReceived = parseInt(statValue);
                            // 分辨率
                            statValue = rtcStatsReports[i].stat('googFrameWidthReceived');
                            pc.statsResult.video.recv.width = parseInt(statValue);
                            statValue = rtcStatsReports[i].stat('googFrameHeightReceived');
                            pc.statsResult.video.recv.height = parseInt(statValue);
                            var logs = "";
                            for (var j = 0; j < statNames.length; j++) {
                                var statName = statNames[j];
                                var statValue = rtcStatsReports[i].stat(statName);
                                logs = logs + "n:" + statName + ": " + statValue + ", ";
                            }
                            // VoiceRTCLogger.debug(timestamp + ' '+ "localcandidate: " + logs);         
                        } else {
                            VoiceRTCLogger.error('media can not handle:' + statValue);
                        }

                    } else {
                        VoiceRTCLogger.error('ssrc can not handle:' + statValue);
                    }
                } else if (rtcStatsReports[i].type == 'VideoBwe') {
                    var statValue = rtcStatsReports[i].stat('googActualEncBitrate');
                    pc.statsResult.video.videobwe.actualEncBitrate = Math.round(statValue / 1024);
                    statValue = rtcStatsReports[i].stat('googAvailableSendBandwidth');
                    pc.statsResult.video.videobwe.availableSendBandwidth = Math.round(statValue / 1024);
                    statValue = rtcStatsReports[i].stat('googRetransmitBitrate');
                    pc.statsResult.video.videobwe.retransmitBitrate = Math.round(statValue / 1024);
                    statValue = rtcStatsReports[i].stat('googAvailableReceiveBandwidth');
                    pc.statsResult.video.videobwe.availableReceiveBandwidth = Math.round(statValue / 1024);
                    statValue = rtcStatsReports[i].stat('googTargetEncBitrate');
                    pc.statsResult.video.videobwe.targetEncBitrate = Math.round(statValue / 1024);
                    statValue = rtcStatsReports[i].stat('googTransmitBitrate');
                    pc.statsResult.video.videobwe.transmitBitrate = Math.round(statValue / 1024);
                } else if (rtcStatsReports[i].type == 'localcandidate') {
                    var statValue = rtcStatsReports[i].stat('portNumber');
                    pc.statsResult.localcandidate.portNumber = statValue;
                    statValue = rtcStatsReports[i].stat('networkType');
                    pc.statsResult.localcandidate.networkType = statValue;
                    statValue = rtcStatsReports[i].stat('ipAddress');
                    pc.statsResult.localcandidate.ipAddress = statValue;
                    statValue = rtcStatsReports[i].stat('transport');
                    pc.statsResult.localcandidate.transport = statValue;
                    statValue = rtcStatsReports[i].stat('candidateType');
                    pc.statsResult.localcandidate.candidateType = statValue;

                }
            }
        }, function (error) {
            VoiceRTCLogger.error("getStatsReport error: ", error);
        }); // finish getStats
    } else if (voiceRTCEngine.browserKnerl == 'safari') {
        // https://webrtc-stats.callstats.io/verify/
        // Microsoft EdgeHTML 17.17134 读取到的参数存在问题。https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/18766260/
        pc.getPc().getStats().then(function (stats) {
            for (const stat of stats.values()) {
                switch (stat.type) {
                    case "outbound-rtp": {
                        var timestamp = stat.timestamp.valueOf() / 1000;
                        var duration = VoiceRTCConstant.GETSTATSREPORT_INTERVAL / 1000;
                        if (stat.id.indexOf('Video') > 0) {
                            // 保存最新数据
                            pc.statsResult.video.send.packetsSent = stat.packetsSent;
                            pc.statsResult.video.send.packetsLost = stat.nackCount;
                            pc.statsResult.video.send.bytesSent = stat.bytesSent;
                            // 计算经过的时间
                            if (pc.preStats.video.send.timestamp > 0 && pc.preStats.video.send.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.video.send.timestamp;
                            }
                            pc.preStats.video.send.timestamp = timestamp;
                            // 计算此段时间发送的包
                            var sendpkt = stat.packetsSent - pc.preStats.video.send.packetsSent;
                            pc.preStats.video.send.packetsSent = stat.packetsSent;
                            // 计算此段时间丢失的包
                            var lostpkt = stat.nackCount - pc.preStats.video.send.packetsLost;
                            pc.preStats.video.send.packetsLost = stat.nackCount;
                            // 计算此段时间发送的字节
                            var sendbytes = stat.bytesSent - pc.preStats.video.send.bytesSent;
                            pc.preStats.video.send.bytesSent = stat.bytesSent;

                            // 计算丢包率
                            if (sendpkt > 0) {
                                pc.statsResult.video.send.packetsLostRate = (lostpkt / sendpkt).toFixed(2);
                                if (pc.statsResult.video.send.packetsLostRate == 'NaN') {
                                    pc.statsResult.video.send.packetsLostRate = -1;
                                }
                            }
                            // 计算码率
                            pc.statsResult.video.send.bitRate = Math.round(sendbytes * 8 / duration / 1024);
                            // console.log(stat.id + " send packetsLost: " + stat.nackCount);
                        } else if (stat.id.indexOf('Audio') > 0) {
                            // 保存最新数据
                            pc.statsResult.audio.send.packetsSent = stat.packetsSent;
                            pc.statsResult.audio.send.packetsLost = stat.nackCount;
                            pc.statsResult.audio.send.bytesSent = stat.bytesSent;
                            // 计算经过的时间
                            if (pc.preStats.audio.send.timestamp > 0 && pc.preStats.audio.send.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.audio.send.timestamp;
                            }
                            pc.preStats.audio.send.timestamp = timestamp;
                            // 计算此段时间发送的包
                            var sendpkt = stat.packetsSent - pc.preStats.audio.send.packetsSent;
                            pc.preStats.audio.send.packetsSent = stat.packetsSent;
                            // 计算此段时间丢失的包
                            var lostpkt = stat.nackCount - pc.preStats.audio.send.packetsLost;
                            pc.preStats.audio.send.packetsLost = stat.nackCount;
                            // 计算此段时间发送的字节
                            var sendbytes = stat.bytesSent - pc.preStats.audio.send.bytesSent;
                            pc.preStats.audio.send.bytesSent = stat.bytesSent;

                            // 计算丢包率
                            if (sendpkt > 0) {
                                pc.statsResult.audio.send.packetsLostRate = (lostpkt / sendpkt).toFixed(2);
                                if (pc.statsResult.audio.send.packetsLostRate == 'NaN') {
                                    pc.statsResult.audio.send.packetsLostRate = -1;
                                }
                            }
                            // 计算码率
                            pc.statsResult.audio.send.bitRate = Math.round(sendbytes * 8 / duration / 1024);
                            // console.log(stat.id + " send packetsLost: " + stat.nackCount);
                        }
                        break;
                    }
                    case "inbound-rtp": {
                        var timestamp = stat.timestamp.valueOf() / 1000;
                        var duration = VoiceRTCConstant.GETSTATSREPORT_INTERVAL / 1000;
                        if (stat.id.indexOf('Video') > 0) {
                            // 保存最新数据
                            pc.statsResult.video.recv.packetsReceived = stat.packetsReceived;
                            pc.statsResult.video.recv.packetsLost = stat.packetsLost;
                            pc.statsResult.video.recv.bytesReceived = stat.bytesReceived;
                            // 计算经过的时间
                            if (pc.preStats.video.recv.timestamp > 0 && pc.preStats.video.recv.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.video.recv.timestamp;
                            }
                            pc.preStats.video.recv.timestamp = timestamp;
                            // 计算此段时间发送的包
                            var recvpkt = stat.packetsReceived - pc.preStats.video.recv.packetsReceived;
                            pc.preStats.video.recv.packetsReceived = stat.packetsReceived;
                            // 计算此段时间丢失的包
                            var lostpkt = stat.packetsLost - pc.preStats.video.recv.packetsLost;
                            pc.preStats.video.recv.packetsLost = stat.packetsLost;
                            // 计算此段时间发送的字节
                            var recvbytes = stat.bytesReceived - pc.preStats.video.recv.bytesReceived;
                            pc.preStats.video.recv.bytesReceived = stat.bytesReceived;

                            // 计算丢包率
                            if (recvpkt > 0) {
                                pc.statsResult.video.recv.packetsLostRate = (lostpkt / recvpkt).toFixed(2);
                            }
                            // 计算码率
                            pc.statsResult.video.recv.bitRate = Math.round(recvbytes * 8 / duration / 1024);
                            // console.log(stat.id + "recv packetsLost: " + stat.packetsLost);
                        } else if (stat.id.indexOf('Audio') > 0) {
                            // 保存最新数据
                            pc.statsResult.audio.recv.packetsReceived = stat.packetsReceived;
                            pc.statsResult.audio.recv.packetsLost = stat.packetsLost;
                            pc.statsResult.audio.recv.bytesReceived = stat.bytesReceived;
                            // 计算经过的时间
                            if (pc.preStats.audio.recv.timestamp > 0 && pc.preStats.audio.recv.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.audio.recv.timestamp;
                            }
                            pc.preStats.audio.recv.timestamp = timestamp;
                            // 计算此段时间发送的包
                            var recvpkt = stat.packetsReceived - pc.preStats.audio.recv.packetsReceived;
                            pc.preStats.audio.recv.packetsReceived = stat.packetsReceived;
                            // 计算此段时间丢失的包
                            var lostpkt = stat.packetsLost - pc.preStats.audio.recv.packetsLost;
                            pc.preStats.audio.recv.packetsLost = stat.packetsLost;
                            // 计算此段时间发送的字节
                            var recvbytes = stat.bytesReceived - pc.preStats.audio.recv.bytesReceived;
                            pc.preStats.audio.recv.bytesReceived = stat.bytesReceived;

                            // 计算丢包率
                            if (recvpkt > 0) {
                                pc.statsResult.audio.recv.packetsLostRate = (lostpkt / recvpkt).toFixed(2);
                            }
                            // 计算码率
                            pc.statsResult.audio.recv.bitRate = Math.round(recvbytes * 8 / duration / 1024);
                            // console.log(stat.id + " recv packetsLost: " + stat.packetsLost);
                        }
                        break;
                    }
                    case "local-candidate": {
                        pc.statsResult.localcandidate.portNumber = stat.port;
                        pc.statsResult.localcandidate.networkType = stat.networkType;
                        pc.statsResult.localcandidate.ipAddress = stat.ip;
                        pc.statsResult.localcandidate.transport = stat.protocol;
                        pc.statsResult.localcandidate.candidateType = stat.candidateType;
                        break;
                    }
                    case "track": {
                        if (stat.remoteSource == true) {
                            if (stat.id.indexOf('receiver') > 0 && stat.frameWidth > 0) {
                                // 对端分辨率
                                pc.statsResult.video.recv.width = stat.frameWidth;
                                pc.statsResult.video.recv.height = stat.frameHeight;
                            }
                        } else {
                            if (stat.id.indexOf('sender') > 0 && stat.frameWidth > 0) {
                                pc.statsResult.video.send.width = stat.frameWidth;
                                pc.statsResult.video.send.height = stat.frameHeight;
                            }
                        }
                        break;
                    }
                }
            }
        }
        );

    } else {
        // https://webrtc-stats.callstats.io/verify/
        // Microsoft EdgeHTML 17.17134 读取到的参数存在问题。https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/18766260/
        pc.getPc().getStats().then(function (stats) {
            VoiceRTCLogger.debug("getStats stats: " + stats);
            for (const stat of stats.values()) {
                // VoiceRTCLogger.debug("getStats stat.type: " + stat.type);
                switch (stat.type) {
                    case "outbound-rtp": {
                        var timestamp = stat.timestamp.valueOf() / 1000;
                        var duration = VoiceRTCConstant.GETSTATSREPORT_INTERVAL / 1000;
                        if (stat.kind == 'video') {
                            // 保存最新数据
                            pc.statsResult.video.send.packetsSent = stat.packetsSent;
                            pc.statsResult.video.send.packetsLost = stat.nackCount;
                            pc.statsResult.video.send.bytesSent = stat.bytesSent;
                            // 计算经过的时间
                            if (pc.preStats.video.send.timestamp > 0 && pc.preStats.video.send.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.video.send.timestamp;
                            }
                            pc.preStats.video.send.timestamp = timestamp;
                            // 计算此段时间发送的包
                            var sendpkt = stat.packetsSent - pc.preStats.video.send.packetsSent;
                            pc.preStats.video.send.packetsSent = stat.packetsSent;
                            // 计算此段时间丢失的包
                            var lostpkt = stat.nackCount - pc.preStats.video.send.packetsLost;
                            pc.preStats.video.send.packetsLost = stat.nackCount;
                            // 计算此段时间发送的字节
                            var sendbytes = stat.bytesSent - pc.preStats.video.send.bytesSent;
                            pc.preStats.video.send.bytesSent = stat.bytesSent;

                            // 计算丢包率
                            if (sendpkt > 0) {
                                pc.statsResult.video.send.packetsLostRate = (lostpkt / sendpkt).toFixed(2);
                                if (pc.statsResult.video.send.packetsLostRate == 'NaN') {
                                    pc.statsResult.video.send.packetsLostRate = -1;
                                }
                            }
                            // 计算码率
                            pc.statsResult.video.send.bitRate = Math.round(sendbytes * 8 / duration / 1024);
                            console.log(stat.mediaType + " send packetsLost: " + stat.nackCount);
                        } else if (stat.kind == 'audio') {
                            // 保存最新数据
                            pc.statsResult.audio.send.packetsSent = stat.packetsSent;
                            pc.statsResult.audio.send.packetsLost = stat.nackCount;
                            pc.statsResult.audio.send.bytesSent = stat.bytesSent;
                            // 计算经过的时间
                            if (pc.preStats.audio.send.timestamp > 0 && pc.preStats.audio.send.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.audio.send.timestamp;
                            }
                            pc.preStats.audio.send.timestamp = timestamp;
                            // 计算此段时间发送的包
                            var sendpkt = stat.packetsSent - pc.preStats.audio.send.packetsSent;
                            pc.preStats.audio.send.packetsSent = stat.packetsSent;
                            // 计算此段时间丢失的包
                            var lostpkt = stat.nackCount - pc.preStats.audio.send.packetsLost;
                            pc.preStats.audio.send.packetsLost = stat.nackCount;
                            // 计算此段时间发送的字节
                            var sendbytes = stat.bytesSent - pc.preStats.audio.send.bytesSent;
                            pc.preStats.audio.send.bytesSent = stat.bytesSent;

                            // 计算丢包率
                            if (sendpkt > 0) {
                                pc.statsResult.audio.send.packetsLostRate = (lostpkt / sendpkt).toFixed(2);
                                if (pc.statsResult.audio.send.packetsLostRate == 'NaN') {
                                    pc.statsResult.audio.send.packetsLostRate = -1;
                                }
                            }
                            // 计算码率
                            pc.statsResult.audio.send.bitRate = Math.round(sendbytes * 8 / duration / 1024);
                            console.log(stat.mediaType + " send packetsLost: " + stat.nackCount);
                        }
                        break;
                    }
                    case "inbound-rtp": {
                        var timestamp = stat.timestamp.valueOf() / 1000;
                        var duration = VoiceRTCConstant.GETSTATSREPORT_INTERVAL / 1000;
                        if (stat.kind == 'video') {
                            // 保存最新数据
                            pc.statsResult.video.recv.packetsReceived = stat.packetsReceived;
                            pc.statsResult.video.recv.packetsLost = stat.packetsLost;
                            pc.statsResult.video.recv.bytesReceived = stat.bytesReceived;
                            // 计算经过的时间
                            if (pc.preStats.video.recv.timestamp > 0 && pc.preStats.video.recv.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.video.recv.timestamp;
                            }
                            pc.preStats.video.recv.timestamp = timestamp;
                            // 计算此段时间发送的包
                            var recvpkt = stat.packetsReceived - pc.preStats.video.recv.packetsReceived;
                            pc.preStats.video.recv.packetsReceived = stat.packetsReceived;
                            // 计算此段时间丢失的包
                            var lostpkt = stat.packetsLost - pc.preStats.video.recv.packetsLost;
                            pc.preStats.video.recv.packetsLost = stat.packetsLost;
                            // 计算此段时间发送的字节
                            var recvbytes = stat.bytesReceived - pc.preStats.video.recv.bytesReceived;
                            pc.preStats.video.recv.bytesReceived = stat.bytesReceived;

                            // 计算丢包率
                            if (recvpkt > 0) {
                                pc.statsResult.video.recv.packetsLostRate = (lostpkt / recvpkt).toFixed(2);
                            }
                            // 计算码率
                            pc.statsResult.video.recv.bitRate = Math.round(recvbytes * 8 / duration / 1024);
                            console.log(stat.mediaType + "recv packetsLost: " + stat.packetsLost);
                        } else if (stat.kind == 'audio') {
                            // 保存最新数据
                            pc.statsResult.audio.recv.packetsReceived = stat.packetsReceived;
                            pc.statsResult.audio.recv.packetsLost = stat.packetsLost;
                            pc.statsResult.audio.recv.bytesReceived = stat.bytesReceived;
                            // 计算经过的时间
                            if (pc.preStats.audio.recv.timestamp > 0 && pc.preStats.audio.recv.timestamp < timestamp) {
                                duration = timestamp - pc.preStats.audio.recv.timestamp;
                            }
                            pc.preStats.audio.recv.timestamp = timestamp;
                            // 计算此段时间发送的包
                            var recvpkt = stat.packetsReceived - pc.preStats.audio.recv.packetsReceived;
                            pc.preStats.audio.recv.packetsReceived = stat.packetsReceived;
                            // 计算此段时间丢失的包
                            var lostpkt = stat.packetsLost - pc.preStats.audio.recv.packetsLost;
                            pc.preStats.audio.recv.packetsLost = stat.packetsLost;
                            // 计算此段时间发送的字节
                            var recvbytes = stat.bytesReceived - pc.preStats.audio.recv.bytesReceived;
                            pc.preStats.audio.recv.bytesReceived = stat.bytesReceived;

                            // 计算丢包率
                            if (recvpkt > 0) {
                                pc.statsResult.audio.recv.packetsLostRate = (lostpkt / recvpkt).toFixed(2);
                            }
                            // 计算码率
                            pc.statsResult.audio.recv.bitRate = Math.round(recvbytes * 8 / duration / 1024);
                            console.log(stat.mediaType + " recv packetsLost: " + stat.packetsLost);
                        }
                        break;
                    }
                    case "local-candidate": {
                        pc.statsResult.localcandidate.portNumber = stat.port;
                        pc.statsResult.localcandidate.networkType = stat.networkType;
                        pc.statsResult.localcandidate.ipAddress = stat.ip;
                        pc.statsResult.localcandidate.transport = stat.protocol;
                        pc.statsResult.localcandidate.candidateType = stat.candidateType;
                        break;
                    }
                    case "track": {
                        if (stat.kind == 'video') {
                            if (stat.id.indexOf('receiver') > 0) {
                                // 对端分辨率
                                pc.statsResult.video.recv.width = stat.frameWidth;
                                pc.statsResult.video.recv.height = stat.frameHeight;
                            } else if (stat.id.indexOf('sender') > 0) {
                                pc.statsResult.video.send.width = stat.frameWidth;
                                pc.statsResult.video.send.height = stat.frameHeight;
                            }
                        }
                        break;
                    }
                }
            }
        }
        );
        // 下面代码块只有火狐支持
        // var sender = pc.getPc().getSenders()[1];
        // sender.getStats().then(function (report) {
        //     var baselineReport = report;
        //     for (let now of baselineReport.values()) {
        //         // if (now.type != "outbound-rtp")
        //         //     continue;

        //         // get the corresponding stats from the baseline report
        //         let base = baselineReport.get(now.id);
        //         VoiceRTCLogger.debug("getStatsReport base: ", base);
        //         if (base) {

        //             // if intervalFractionLoss is > 0.3, we've probably found the culprit
        //             // var intervalFractionLoss = (packetsSent - packetsReceived) / packetsSent;
        //         }
        //     };
        // });
    }

    // 有数据发送再报告连接成功
    if (!pc.isSendPeerConnectedResult &&
        (pc.preStats.audio.send.bytesSent > 0 || pc.preStats.video.send.bytesSent > 0)) {
        pc.isSendPeerConnectedResult = true;
        var connectType = 'Unknown';
        if (pc.statsResult.localcandidate.candidateType == 'relayed'
            || pc.statsResult.localcandidate.candidateType == 'relay') {
            connectType = 'TURN';
        } else if (pc.statsResult.localcandidate.candidateType == 'all'
            || pc.statsResult.localcandidate.candidateType == 'host') {
            connectType = 'STUN';
        }

        VoiceRTCLogger.debug(pc.statsResult.localcandidate);
        voiceRTCEngine.peerConnected(pc.remoteUserId, connectType);
        voiceRTCEngine.voiceRTCEngineEventHandle.call('onPeerConnected', {
            ret: VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_SUCCESS,
            desc: 'success'
        });
    }

    if (pc.reportStatsStartTime == 0) {
        pc.reportStatsStartTime = Math.round(new Date().getTime() / 1000);
    } else if (Math.round(new Date().getTime() / 1000) - pc.reportStatsStartTime > voiceRTCEngine.reportStatsInterval) {
        pc.reportStatsStartTime = Math.round(new Date().getTime() / 1000);
        // 报告信息
        voiceRTCEngine.reportStats(pc);
    }
    // VoiceRTCLogger.info('audio recv: lostRate: ' + pc.statsResult.audio.recv.packetsLostRate + ', bitRate:'
    //                             + pc.statsResult.audio.recv.bitRate + 'kbps');
    // VoiceRTCLogger.info('video recv: lostRate: ' + pc.statsResult.video.recv.packetsLostRate + ', bitRate:'
    //                             + pc.statsResult.video.recv.bitRate + 'kbps');                            
    // VoiceRTCLogger.info('video recv: width: ' + pc.statsResult.video.recv.width + ', height:' + pc.statsResult.video.recv.height
    //     + ', targetRate:'+pc.statsResult.video.videobwe.targetEncBitrate + 'kbps, transmitRate:' + pc.statsResult.video.videobwe.transmitBitrate + 'kbps');


}

// 封装RTCPeerConnection
/** ----- 常量定义 ----- */

/** ----- VoiceRTCEngine ----- */
//var VoiceRTCEngine = (function() {
/**
 * 构造函数
 *
 */

var voiceRTCengine, voiceRTCEngine;
var VoiceRTCEngine = function (wsNavUrl, appId) {
    this.init(wsNavUrl, appId);
    voiceRTCEngine = voiceRTCengine = this;
    return this;
}

function extractVersion(uastring, expr, pos) {
    var match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
}

/**
 * Browser detector.
 *
 * @return {object} result containing browser and version
 *     properties.
 */
function detectBrowser(window) {
    var navigator = window.navigator;

    // Returned result object.

    var result = { browser: null, version: null };

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
        result.browser = 'Not a browser.';
        return result;
    }

    if (navigator.mozGetUserMedia) {
        // Firefox.
        result.browser = 'firefox';
        result.version = extractVersion(navigator.userAgent, /Firefox\/(\d+)\./, 1);
    } else if (navigator.webkitGetUserMedia) {
        // Chrome, Chromium, Webview, Opera.
        // Version matches Chrome/WebRTC version.
        result.browser = 'chrome';
        result.version = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
    } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
        // Edge.
        result.browser = 'edge';
        result.version = extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2);
    } else if (window.RTCPeerConnection && navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) {
        // Safari.
        result.browser = 'safari';
        result.version = extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1);
    } else {
        // Default fallthrough: not supported.
        result.browser = 'Not a supported browser.';
        return result;
    }
    return result;
}
/**
 * 初始化
 *
 */
VoiceRTCEngine.prototype.init = function (wsNavUrl, appId) {
    var browser = detectBrowser(window);
    this.browserKnerl = browser.browser;
    this.browserVersion = browser.version;
    VoiceRTCLogger.info('browser = ' + browser.browser + ',ver =' + browser.version);
    // 应用ID
    this.appId = appId;
    // 服务器是否为sfu模式,初始化为非,具体由服务器返回结果确定
    /** 会议ID */
    this.roomId = null;
    this.roomName = 'talk-now'
    // 多媒体数据连接类型
    /** 连接集合 */
    this.peerConnections = {};         // 连接集合
    /** 本地视频流 */
    this.localStream = null;
    /** 远端视频流数组 */
    this.remoteStreams = new Array();
    /** 远程用户userId数组 **/
    this.remoteUserIds = new Array();
    this.remoteUserIndex = 0;
    /** logonAndJoin status 登录类型，第一次登录加入房间传0，断线重连传1 */
    this.logonAndJoinStatus = null;
    /** offer status */
    this.offerStatus = null;            // offer的状态切换
    /** 连接的用户集合 */
    this.joinedUsers = new VoiceRTCMap();
    /** remote cname Map */
    this.remoteCnameMap = new VoiceRTCMap();
    /** remote Sdp Map */
    this.remoteSdpMap = new VoiceRTCMap();
    /** remote view */
    this.remoteViewMap = new VoiceRTCMap();
    /** 麦克风开关 */
    this.microphoneEnable = true;
    /** 本地视频开关 */
    this.localVideoEnable = true;
    /** 远端音频开关 */
    this.remoteAudioEnable = true;
    /** keepAlive连续失败次数计数器 */
    this.keepAliveFailedTimes = 0;
    /** keepAlive间隔 */
    this.keepAliveInterval = null;
    /** keepAlive未收到result计时 */
    this.keepAliveTimerCount = 0;
    /** keepAlive未收到result计时器 */
    this.keepAliveTimer = null;
    /** reconnect连续次数计数器 */
    this.reconnectTimes = 0;
    /** csequence */
    this.csequence = 0;
    /** websocket对象 */
    this.signaling = null;
    /** websocket消息队列 */
    this.wsQueue = [];
    /** websocket连接状态, true:已连接, false:未连接 */
    this.wsConnectionState = null;
    /** websocket是否强制关闭：true:是, false不是 */
    this.wsForcedClose = false;
    /** websocket是否需要重连：true:是, false不是 */
    this.wsNeedConnect = true;
    /** websocket地址列表 */
    this.wsUrlList = [];    // 不要去获取
    /** websocket地址索引 */
    this.wsUrlIndex = 0;
    this.isJoined = false;
    this.netState = VoiceRTCConstant.NetState.INIT;

    // 设置websocket nav url
    this.wsNavUrl = wsNavUrl;

    /** 视频参数默认值 */
    this.userType = VoiceRTCConstant.UserType.NORMAL;
    this.talkType = VoiceRTCConstant.TalkType.AUDIO_VIDEO;
    this.isAudioOnly = false;
    this.localVideoEnable = true;
    // 缺省分辨率和帧率
    this.videoProfile = VoiceRTCConstant.VideoProfile_default;
    // 最小分辨率   
    this.videoMinProfile = VoiceRTCConstant.VideoProfile_min;
    // 最大码率
    this.videoMaxRate = VoiceRTCConstant.BandWidth_default.max;
    // 最小码率
    this.videoMinRate = VoiceRTCConstant.BandWidth_default.min;
    /** media config */
    this.mediaConfig = {
        video: this.videoProfile,
        audio: true
    }

    /** bandwidth */
    this.bandWidth = {
        min: this.videoMinRate,
        max: this.videoMaxRate
    };


    /** 是否上报丢包率信息 */
    this.isSendLostReport = false;
    /** VoiceRTCConnectionStatsReport */
    this.voiceRTCConnectionStatsReport = null;
    /** getStatsReport间隔 */
    this.getStatsReportInterval = null;

    this.startTime = window.performance.now(); // 起始时间
    this.reportStatsInterval = 30;       // 初始化为30秒上报一次
};

/**
 * reset
 *
 */
VoiceRTCEngine.prototype.reset = function () {

}
/**
 * clear
 *
 */
VoiceRTCEngine.prototype.clear = function () {
    this.exitScheduleKeepAlive();
    this.exitScheduleKeepAliveTimer();
    this.disconnect(false);
    this.clearAllPeerConnection();
    this.closePeerConnection(this.selfUserId);
}
/** ----- 提供能力 ----- */
/**
 * 获取VoiceRTC SDK版本号
 *
 * @return sdkversion
 */
VoiceRTCEngine.prototype.getSDKVersion = function () {
    return VoiceRTCConstant.SDK_VERSION_NAME;
}

/**
 * 获取当前时间(Unix时间戳（Unix timestamp）)
 * Unix时间戳在线转换 http://tool.chinaz.com/Tools/unixtime.aspx
 */
VoiceRTCEngine.prototype.getCurrentTime = function () {
    // let t = new Date().valueOf();  
    let t = Math.round(new Date().getTime() / 1000);
    return t.toString();
}


/**
 * 获取平台信息
 */
VoiceRTCEngine.prototype.getOsName = function () {
    var osName = navigator.platform;
    VoiceRTCLogger.debug('getOsName:' + osName);
    return osName;
}

/**
var neihe = getBrowser("n"); // 所获得的就是浏览器所用内核。
var banben = getBrowser("v");// 所获得的就是浏览器的版本号。
var browser = getBrowser();// 所获得的就是浏览器内核加版本号。
 */
function getBrowser(n) {
    var ua = navigator.userAgent.toLowerCase(),
        s,
        name = '',
        ver = 0;
    //探测浏览器
    (s = ua.match(/msie ([\d.]+)/)) ? _set("ie", _toFixedVersion(s[1])) :
        (s = ua.match(/firefox\/([\d.]+)/)) ? _set("firefox", _toFixedVersion(s[1])) :
            (s = ua.match(/chrome\/([\d.]+)/)) ? _set("chrome", _toFixedVersion(s[1])) :
                (s = ua.match(/opera.([\d.]+)/)) ? _set("opera", _toFixedVersion(s[1])) :
                    (s = ua.match(/version\/([\d.]+).*safari/)) ? _set("safari", _toFixedVersion(s[1])) : 0;

    function _toFixedVersion(ver, floatLength) {
        ver = ('' + ver).replace(/_/g, '.');
        floatLength = floatLength || 1;
        ver = String(ver).split('.');
        ver = ver[0] + '.' + (ver[1] || '0');
        ver = Number(ver).toFixed(floatLength);
        return ver;
    }
    function _set(bname, bver) {
        name = bname;
        ver = bver;
    }
    return (n == 'n' ? name : (n == 'v' ? ver : name + ver));
};

/**
 * 获取浏览器信息
 */
VoiceRTCEngine.prototype.getBrowser2 = function () {
    var browser = getBrowser();
    VoiceRTCLogger.info('getBrowser:' + browser);
    return browser;
}
VoiceRTCEngine.prototype.getBrowser = function () {
    var NV = {};
    var UA = navigator.userAgent.toLowerCase();
    console.log("UA:" + UA);
    try {
        NV.name = !-[1,] ? 'ie' :
            (UA.indexOf("firefox") > 0) ? 'firefox' :
                (UA.indexOf("chrome") > 0) ? 'chrome' :
                    window.opera ? 'opera' :
                        window.openDatabase ? 'safari' :
                            'unkonw';
    } catch (e) { };
    try {
        NV.version = (NV.name == 'ie') ? UA.match(/msie ([\d.]+)/)[1] :
            (NV.name == 'firefox') ? UA.match(/firefox\/([\d.]+)/)[1] :
                (NV.name == 'chrome') ? UA.match(/chrome\/([\d.]+)/)[1] :
                    (NV.name == 'opera') ? UA.match(/opera.([\d.]+)/)[1] :
                        (NV.name == 'safari') ? UA.match(/version\/([\d.]+)/)[1] :
                            '0';
    } catch (e) { };
    try {
        NV.shell = (UA.indexOf('360ee') > -1) ? '360Jisu' :
            (UA.indexOf('360se') > -1) ? '360Safe' :
                (UA.indexOf('qq') > -1) ? 'QQ' :
                    (UA.indexOf('se') > -1) ? 'Sogou' :
                        (UA.indexOf('aoyou') > -1) ? 'Aoyou' :
                            (UA.indexOf('theworld') > -1) ? 'Theworld' :
                                (UA.indexOf('worldchrome') > -1) ? 'TheworldChrome' :
                                    (UA.indexOf('greenbrowser') > -1) ? 'Green' :
                                        (UA.indexOf('baidu') > -1) ? 'Baidu' :
                                            (UA.indexOf('edg') > -1) ? 'Edge' :
                                                (UA.indexOf('firefox') > -1) ? 'Firefox' :
                                                    (UA.indexOf('opr') > -1) ? 'Opera' :
                                                        (UA.indexOf('chrome') > -1) ? 'Chrome' :
                                                            'Nnknown';
    } catch (e) { }
    console.log('浏览器UA=' + UA +
        '\n\n浏览器名称=' + NV.name +
        '\n\n浏览器版本=' + parseInt(NV.version) +
        '\n\n浏览器外壳=' + NV.shell);
    return NV.name + parseInt(NV.version) + NV.shell;
}

/**
 * 设置VoiceRTCEngineEventHandle监听
 *
 */
VoiceRTCEngine.prototype.setVoiceRTCEngineEventHandle = function (voiceRTCEngineEventHandle) {
    this.voiceRTCEngineEventHandle = voiceRTCEngineEventHandle;
}
/**
 * 设置视频参数
 *
 */
VoiceRTCEngine.prototype.setVideoParameters = function (config) {
    if (config.USER_TYPE != null && config.USER_TYPE == VoiceRTCConstant.UserType.OBSERVER) {
        this.userType = VoiceRTCConstant.UserType.OBSERVER;
    }
    if (config.IS_AUDIO_ONLY != null) {
        this.isAudioOnly = config.IS_AUDIO_ONLY;        // 单纯音频
    }
    if (config.IS_CLOSE_VIDEO != null) {                // 是否允许视频
        this.localVideoEnable = !config.IS_CLOSE_VIDEO;
        if (!this.localVideoEnable) {
            if (this.talkType == VoiceRTCConstant.TalkType.AUDIO_VIDEO) {
                this.talkType = VoiceRTCConstant.TalkType.AUDIO_ONLY;
            }
        }

    }
    if (config.VIDEO_PROFILE != null) {                 // 适配设置
        this.videoProfile = config.VIDEO_PROFILE;
        /** media config */
        this.mediaConfig.video = this.videoProfile;
    }
    /** bandwidth */
    if (config.VIDEO_MAX_RATE != null) {            // 最高码率控制
        this.videoMaxRate = config.VIDEO_MAX_RATE;
        this.bandWidth.max = this.videoMaxRate;
    } else if (config.VIDEO_PROFILE.width != null && config.VIDEO_PROFILE.height != null) {
        var bandWidth_resulotion = VoiceRTCConstant["BandWidth_" + config.VIDEO_PROFILE.width + "_" + config.VIDEO_PROFILE.height]
        if (bandWidth_resulotion != null) {
            this.videoMaxRate = bandWidth_resulotion.max;
            this.bandWidth.max = this.videoMaxRate;
        }
    }
    if (config.VIDEO_MIN_RATE != null) {            // 最低码率控制
        this.videoMinRate = config.VIDEO_MIN_RATE;
        this.bandWidth.min = this.videoMinRate;
    } else if (config.VIDEO_PROFILE.width != null && config.VIDEO_PROFILE.height != null) {
        var bandWidth_resulotion = VoiceRTCConstant["BandWidth_" + config.VIDEO_PROFILE.width + "_" + config.VIDEO_PROFILE.height]
        if (bandWidth_resulotion != null) {
            this.videoMinRate = bandWidth_resulotion.min;   // 最低码率
            this.bandWidth.min = this.videoMinRate;
        }
    }
    // 当初始分辨率较高时则可以设置最低分辨率，设置最小分辨率和最小帧率,调最小分辨率时出现按最小码率发送数据的情况。
    if (this.videoProfile.width >= 480) {
        var myVideoConstraints = {};
        myVideoConstraints.width = {
            max: this.videoProfile.width,
            min: this.videoProfile.width / 2
        };
        myVideoConstraints.height = {
            max: this.videoProfile.height,
            min: this.videoProfile.height / 2
        };
        myVideoConstraints.frameRate = this.videoProfile.frameRate;
        // myVideoConstraints.frameRate = { // 火狐浏览器不支持
        //     max: this.videoProfile.frameRate,
        //     min: 3
        // };
        // this.videoProfile.frameRate = myVideoConstraints.frameRate;
        this.mediaConfig.video = myVideoConstraints; // 如果带了最低分辨率，画面质量下降严重
    }

    if (this.getOsName().indexOf('arm') > -1) {
        this.mediaConfig.video = {
            width: { min: this.videoProfile.width, ideal: this.videoProfile.width, max: this.videoProfile.width },
            height: { min: this.videoProfile.height, ideal: this.videoProfile.height, max: this.videoProfile.height },
            facingMode: "user",
            frameRate: { min: 5, ideal: this.videoProfile.frameRate, max: this.videoProfile.frameRate }
        }
    }
    // 在手机端，不同的浏览器需要不同的constraint

    // this.mediaConfig = {
    //     video: true,
    //     audio: true
    // }
}

/**
 * 列举 麦克风  摄像头
 * @return audioState ：0 没有麦克风 1 有 ；videoState 0 没有摄像头 1 有
 */
VoiceRTCEngine.prototype.audioVideoState = async function () {
    // 列举设备 audioState  videoState
    let audioState = 0;
    let videoState = 0;
    let audioAuthorized = 0;
    let videoAuthorized = 0;
    let time1 = new Date().getTime();
    // 监测摄像头和麦克风
    await navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
        let deviceArr = deviceInfos.map(function (deviceInfo, index) {
            return deviceInfo.kind;
        })
        deviceArr.forEach(function (kind) {
            if (kind.indexOf('video') > -1)
                videoState = 1;
            if (kind.indexOf('audio') > -1)
                audioState = 1;
        })
    });

    // 如果摄像头存在，检测是否可以打开
    if (videoState) {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function (data) {
            videoAuthorized = 1;
        }).catch(function (error) {
            if (error.name == 'PermissionDeniedError')
                videoAuthorized = 0;
        })
    }
    // 如果麦克风存在，检测是否可以打开
    if (audioState) {
        await navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(function (data) {
            audioAuthorized = 1;
        }).catch(function (error) {
            if (error.name == 'PermissionDeniedError')
                audioAuthorized = 0;
        });
    }
    VoiceRTCLogger.info('audioAuthorized ' + audioAuthorized);
    VoiceRTCLogger.info('videoAuthorized ' + videoAuthorized);

    if (audioAuthorized == 1 && videoAuthorized == 0) {
        voiceRTCEngine.talkType = VoiceRTCConstant.TalkType.AUDIO_ONLY; //无视频有音频
    } else if (audioAuthorized == 1 && videoAuthorized == 1) {
        voiceRTCEngine.talkType = VoiceRTCConstant.TalkType.AUDIO_VIDEO;
    } else if (audioAuthorized == 0 && videoAuthorized == 1) {
        voiceRTCEngine.talkType = VoiceRTCConstant.TalkType.VIDEO_ONLY;
    } else if (audioAuthorized == 0 && videoAuthorized == 0) {
        voiceRTCEngine.talkType = VoiceRTCConstant.TalkType.NO_AUDIO_VIDEO;
    }

    let time2 = new Date().getTime();
    VoiceRTCLogger.warn("audioVideoState time:" + (time2 - time1));
    return {
        audioState: audioState,
        audioAuthorized: audioAuthorized,
        videoState: videoState,
        videoAuthorized: videoAuthorized
    }
}

/**
 * 获取本地视频流
 * 
 */
VoiceRTCEngine.prototype.getLocalDeviceStream = function () {
    return navigator.mediaDevices.getUserMedia(voiceRTCEngine.mediaConfig).then(function (stream) {
        VoiceRTCLogger.info("navigator.getUserMedia success");
        voiceRTCEngine.localStream = stream;
        if (!voiceRTCEngine.localVideoEnable) {
            voiceRTCEngine.closeLocalVideoWithUpdateTalkType(        // 如果不允许视频传输在关闭视频的获取
                !voiceRTCEngine.localVideoEnable, false);
        }
        let track = stream.getVideoTracks()[0];
        if (track != null) {
            let constraints = track.getConstraints();
            VoiceRTCLogger.info('Result constraints: ' + JSON.stringify(constraints));
        }

        return stream;
    }).catch(function (error) {
        VoiceRTCLogger.error("getLocalDeviceStream error")
        VoiceRTCLogger.error(error)
    });
}
/**
 * 获取设备信息
 * 
 */
VoiceRTCEngine.prototype.getDevicesInfos = function () {
    return navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
        return deviceInfos;
    }).catch(function (error) {
        VoiceRTCLogger.error('getDevicesInfos ' + error);
    })
}

/**
 * 检测 麦克风  摄像头
 * 
 */
VoiceRTCEngine.prototype.checkDeviceState = function () {
    VoiceRTCLogger.log("执行checkDeviceState，检测麦克风和摄像头")
    var voiceRTCEngine = this;
    return voiceRTCEngine.getDevicesInfos().then(function (deviceInfos) {
        var input = false;
        var output = false;
        var videoState = false;
        deviceInfos.forEach(function (deviceInfo) {
            var kind = deviceInfo.kind;
            if (kind.indexOf('video') > -1)
                videoState = true;
            if (kind.indexOf('audioinput') > -1)
                input = true;
            if (kind.indexOf('audiooutput') > -1)
                output = true;
        })
        var audioState = {
            input: input,
            output: output
        }
        VoiceRTCLogger.log("getDevicesInfos().then, input:" + input
            + ", output:" + output + ", videoState:" + videoState)
        return {
            audioState: audioState,
            videoState: videoState
        }
    }).catch(function (error) {
        VoiceRTCLogger.error(error)
    })
}
/**
 *摄像头信息获取
 */
VoiceRTCEngine.prototype.getVideoInfos = function () {
    var voiceRTCEngine = this;
    return voiceRTCEngine.getDevicesInfos().then(function (deviceInfos) {
        var videoInfoList = voiceRTCEngine.videoInfoList
        deviceInfos.forEach(function (deviceInfo) {
            var kind = deviceInfo.kind;
            if (kind.indexOf('video') > -1) {
                var deviceId = deviceInfo.deviceId;
                var label = deviceInfo.label;
                deviceInfo = {
                    deviceId: deviceId,
                    label: label
                }
                videoInfoList.push(deviceInfo)
            }
        })
        return videoInfoList
    }).catch(function (error) {
        VoiceRTCLogger.error(error)
    })
}

/**
 *摄像头切换 需要重新连接？
 */
VoiceRTCEngine.prototype.switchVideo = function (deviceId) {
    var voiceRTCEngine = this;
    var oldStream = voiceRTCEngine.localStream;
    if (oldStream) {
        oldStream.getTracks().forEach(function (track) {
            track.stop();
        })
    }
    if (deviceId) {
        var config = voiceRTCEngine.mediaConfig;
        var video = config.video;
        video.deviceId = { exact: deviceId }
    }
    this.getLocalDeviceStream().then(function (stream) {
        var pcClient = voiceRTCEngine.peerConnections[voiceRTCEngine.selfUserId];
        if (pcClient != null) {
            var pc = pcClient['pc'];
            pc.getPc().removeStream(oldStream);
            pc.addStream(stream);
            voiceRTCEngine.createOffer(pc, voiceRTCEngine.selfUserId, true)
        }
        voiceRTCEngine.voiceRTCEngineEventHandle.call("onSwithVideo", {
            "isSuccess": true
        })
    }).catch(function (error) {
        VoiceRTCLogger.error("navigator.mediaDevices error", error)
    })
}

/**
 * 加入会议
 *
 */
VoiceRTCEngine.prototype.joinRoom = function (roomId, userId, userName, token) {

    VoiceRTCLogger.log("joinRoom into");
    let time1 = new Date().getTime();

    // 摄像头检查
    this.checkDeviceState().then(function (status) {
        VoiceRTCLogger.log("执行完checkDeviceState 后执行")
        var audioState = status.audioState;
        var input = audioState.input;
        var videoState = status.videoState;
        if (!videoState) {
            var key = 'NOCAMERA';
            VoiceRTCLogger.error("navigator.mediaDevices.getUserMedia error", VoiceRTCReason.get(key))
            voiceRTCEngine.talkType = VoiceRTCConstant.TalkType.AUDIO_ONLY;// 只有audio
            voiceRTCEngine.isAudioOnly = true;
            voiceRTCEngine.mediaConfig.video = false;
        }
        if (!input) {
            var key = 'NOAUDIOINPUT'
            VoiceRTCLogger.error("navigator.mediaDevices.getUserMedia error", VoiceRTCReason.get(key));
            // 如果音频也没有则退出
            voiceRTCEngine.mediaConfig.audio = false;
            voiceRTCEngine.voiceRTCEngineEventHandle.call("onError", {
                ret: VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_NO_MICROPHONE_DEV,
                desc: VoiceRTCConstant.RoomErrorString.ROOM_ERROR_NO_MICROPHONE_DEV
            });
            return
        }
        voiceRTCEngine.roomId = roomId;
        voiceRTCEngine.selfUserId = userId;
        voiceRTCEngine.selfUserName = userName
        voiceRTCEngine.token = token;

        if (voiceRTCEngine.videoId) {
            var config = voiceRTCEngine.mediaConfig;
            var video = config.video;
            video.deviceId = { exact: voiceRTCEngine.videoId }
        }
        voiceRTCEngine.getLocalDeviceStream(voiceRTCEngine.mediaConfig).then(function (stream) {
            voiceRTCEngine.createWebsocket();
            let time2 = new Date().getTime();
            VoiceRTCLogger.warn("joinRoom time:" + (time2 - time1));
            voiceRTCEngine.Join(VoiceRTCConstant.LogonAndJoinStatus.CONNECT);
        }).catch(function (error) {
            VoiceRTCLogger.error("navigator.mediaDevices.getUserMedia error: ", error);
        })
    }).catch(function (error) {
        VoiceRTCLogger.error("navigator.mediaDevices.enumerateDevices: ", error);
    })
};
/**
 * 离开会议
 *
 */
VoiceRTCEngine.prototype.leaveRoom = function () {
    this.leave();
}
/**
 * 获取本地视频视图
 * @Deprecated
 *
 */
VoiceRTCEngine.prototype.getLocalVideoView = function () {
    return this.getLocalStream();
};
/**
 * 获取远端视频视图
 * @Deprecated
 *
 */
VoiceRTCEngine.prototype.getRemoteVideoView = function (userId) {
    return this.getRemoteStream(userId);
};
/**
 * 获取本地视频流
 *
 */
VoiceRTCEngine.prototype.getLocalStream = function () {
    return this.localStream;
};
/**
 * 获取远端视频流
 *
 */
VoiceRTCEngine.prototype.getRemoteStream = function (userId) {
    for (var i in this.remoteStreams) {
        if (this.remoteStreams[i].id == userId) {
            return this.remoteStreams[i]
            break;
        }
    }
    return null;
};
/**
 * 获取远端视频流数量
 *
 */
VoiceRTCEngine.prototype.getRemoteStreamCount = function () {
    return this.remoteStreams.length;
};

/**
 * 创建视频视图
 *
 */
VoiceRTCEngine.prototype.createVideoView = function () {
    var videoView = document.createElement('video');
    // 视频自动播放
    videoView.autoplay = true;
    videoView.setAttribute("playsinline", true); // isa
    return videoView;
};
/**
 * 创建本地视频视图
 *
 */
VoiceRTCEngine.prototype.createLocalVideoView = function () {
    var localVideoView = this.createVideoView();
    // 本地视频静音
    localVideoView.muted = true;
    // ID
    localVideoView.id = this.selfUserId;
    // 附加视频流
    localVideoView.srcObject = this.getLocalStream();
    return localVideoView;
};
/**
 * 创建远端视频视图
 *
 */
VoiceRTCEngine.prototype.createRemoteVideoView = function (userId) {
    VoiceRTCLogger.info('createRemoteVideoView, userId: ' + userId);
    var remoteStream = this.getRemoteStream(userId);
    var remoteVideoView = null;
    if(!this.remoteViewMap.contains(userId)) {
        remoteVideoView = this.createVideoView();
        // ID
        remoteVideoView.id = userId;
        this.remoteViewMap.put(userId, remoteVideoView);
    } else {
        remoteVideoView = this.remoteViewMap.get(userId);
    }
    
    // 附加视频流
    remoteVideoView.srcObject = remoteStream;
    return remoteVideoView;
};
/**
 * 关闭/打开麦克风 true, 关闭 false, 打开
 *
 */
VoiceRTCEngine.prototype.muteMicrophone = function (isMute) {
    this.updateTalkTypeMic(isMute);
}
/**
 * 关闭/打开本地摄像头 true, 关闭 false, 打开
 *
 */
VoiceRTCEngine.prototype.closeLocalVideo = function (isCameraClose) {
    this.updateTalkTypeCamera(isCameraClose);
}
/**
 * 关闭/打开本地摄像头和发送updateTalkType信令
 *
 * @param isCameraClose
 *            true, 关闭 false, 打开
 * @param isUpdateTalkType
 *            true, 发送 false, 不发送
 */
VoiceRTCEngine.prototype.closeLocalVideoWithUpdateTalkType = function (isCameraClose, isUpdateTalkType) {
    this.localStream && this.localStream.getVideoTracks().forEach(function (track) {
        track.enabled = !isCameraClose;
    })
    VoiceRTCLogger.info("Local video close=" + isCameraClose);
    this.localVideoEnable = !isCameraClose;
}
/**
 * 关闭/打开声音 true, 关闭 false, 打开
 *
 */
VoiceRTCEngine.prototype.closeRemoteAudio = function (isAudioClose) {
    if (this.remoteStreams.length === 0) {
        VoiceRTCLogger.info("No remote audio available.");
        return;
    }
    for (var x = 0; x < this.remoteStreams.length; x++) {
        var tmpRemoteStream = this.remoteStreams[x];
        if (tmpRemoteStream && tmpRemoteStream.getAudioTracks()
            && tmpRemoteStream.getAudioTracks().length > 0) {
            for (var y = 0; y < tmpRemoteStream.getAudioTracks().length; y++) {
                tmpRemoteStream.getAudioTracks()[y].enabled = !isAudioClose;
            }
        }
    }
    VoiceRTCLogger.info("Remote audio close=" + isAudioClose);
    this.remoteAudioEnable = !isAudioClose;
}
/**
 * 关闭本地媒体流（视频流和音频流）
 *
 */
VoiceRTCEngine.prototype.closeLocalStream = function () {
    if (this.localStream == null || this.localStream.getTracks() == null
        || this.localStream.getTracks().length === 0) {
        VoiceRTCLogger.info("No local track available.");
    } else {
        for (var i = 0; i < this.localStream.getTracks().length; i++) {
            this.localStream.getTracks()[i].stop();
        }
    }
}

/**
 * 设置是否上报丢包率信息
 *
 */
VoiceRTCEngine.prototype.enableSendLostReport = function (enable) {
    this.isSendLostReport = enable
}

/** ----- 提供能力 ----- */
/** ----- websocket ----- */
/**
 * 创建WebSocket对象
 * 用于和房间服务器进行通话
 */
VoiceRTCEngine.prototype.createWebsocket = function () {
    // ws正在连接
    this.wsConnectionState = VoiceRTCConstant.wsConnectionState.CONNECTING;
    this.createWebsocketWithUrl(this.wsNavUrl);
};
/**
 * 创建WebScoket对象
 *
 */
VoiceRTCEngine.prototype.createWebsocketWithUrl = function (url) {
    var voiceRTCEngine = this;
    // voiceRTCEngine.signaling = new WebSocket('wss://' + url + '/signaling');
    voiceRTCEngine.signaling = new WebSocket('ws://' + url);
    voiceRTCEngine.signaling.onopen = function () {
        voiceRTCEngine.onOpen();
    };
    voiceRTCEngine.signaling.onmessage = function (ev) {
        voiceRTCEngine.onMessage(ev);
    };
    voiceRTCEngine.signaling.onerror = function (ev) {
        voiceRTCEngine.onError(ev);
    };
    voiceRTCEngine.signaling.onclose = function (ev) {
        voiceRTCEngine.onClose(ev);
    };
};


/**
 * 发送消息
 *
 */
VoiceRTCEngine.prototype.sendJsonMsg = function (parameters) {
    this.csequence++;
    var message = JSON.stringify(parameters);
    this.send(message);
};
/**
 * 发送消息
 *
 */
VoiceRTCEngine.prototype.send = function (message) {
    var signal = JSON.parse(message).cmd;
    if (this.wsConnectionState == VoiceRTCConstant.wsConnectionState.CONNECTED) { // ws连接可用
        // if (signal == VoiceRTCConstant.SignalType.CHANNEL_PING) { // keepLive记录debug日志
        //     VoiceRTCLogger.debug("req: " + message);
        // } else {
        //     VoiceRTCLogger.info("req: " + message);
        // }
        this.signaling.send(message);
    } else { // websocket不可用
        VoiceRTCLogger.warn("websocket not connected!, signal:" + signal);
        if (this.wsQueue.length == 0 // 消息队列只保留一条logonAndJoin
            && signal == VoiceRTCConstant.SignalType.JOIN) { // logonAndJoin
            // 加入消息队列
            this.wsQueue.push(message);
        }
    }
};
/**
 * 发送队列中的消息
 */
VoiceRTCEngine.prototype.doWsQueue = function () {
    if (this.wsQueue.length > 0) {
        // 消息队列只有一条logonAndJoin，取出并删除
        var message = this.wsQueue.shift();
        this.send(message);
    }
};
/**
 * onOpen
 *
 */
VoiceRTCEngine.prototype.onOpen = function () {
    VoiceRTCLogger.info('websocket open');
    // 报告网络已经恢复
    if(this.netState == VoiceRTCConstant.NetState.INIT) {
        this.netState = VoiceRTCConstant.NetState.CONNECTED;     // 第一次连接ws成功不需要通知调用者
    } else {
        this.netState = VoiceRTCConstant.NetState.CONNECTED;     //不是第一次则说明出现了断开重连的情况，如果能恢复则通知调用者
        this.voiceRTCEngineEventHandle.call("onNetStateChanged", {
            ret: VoiceRTCConstant.NetState.CONNECTED,
        });
    } 
    
    // ws连接可用
    this.wsConnectionState = VoiceRTCConstant.wsConnectionState.CONNECTED;
    // 重置reconnectTimes
    this.reconnectTimes = 0;
    // websocket可用后，发送队列中的消息
    this.doWsQueue();
}

function parseJSON(json) {
    try {
        return JSON.parse(json);
    } catch (e) {
        VoiceRTCLogger.error("Error parsing json: " + json);
    }
    return null;
}
/**
 * onMessage
 *
 */
VoiceRTCEngine.prototype.onMessage = function (event) {
    // VoiceRTCLogger.info("onMessage: " + event.data);
    var message = parseJSON(event.data);

    switch (message.cmd) {
        // 应答信令
        case VoiceRTCConstant.SignalType.RESP_JOIN:
            this.handleResponseJoin(message);
            return;
        case VoiceRTCConstant.SignalType.RESP_LEAVE:
            this.handleResponseLeave(message);
            return;
        case VoiceRTCConstant.SignalType.RESP_OFFER:
            this.handleResponseOffer(message);
            return;
        case VoiceRTCConstant.SignalType.RESP_ANSWER:
            this.handleResponseAnswer(message);
            return;
        case VoiceRTCConstant.SignalType.RESP_CANDIDATE:
            this.handleResponseCandidate(message);
            return;
        case VoiceRTCConstant.SignalType.RESP_GENERAL_MSG:
            this.handleResponseGeneralMessage(message);
            return;
        case VoiceRTCConstant.SignalType.RESP_KEEP_LIVE:
            this.handleResponseKeepLive(message);
            return;

        // 服务器转发的信令 webrtc信令
        case VoiceRTCConstant.SignalType.ON_REMOTE_LEAVE:
            this.onRemoteLeave(message);
            return;
        case VoiceRTCConstant.SignalType.ON_REMOTE_OFFER:
            this.onRemoteOffer(message);
            return;
        case VoiceRTCConstant.SignalType.ON_REMOTE_ANSWER:
            this.onRemoteAnswer(message);
            return;
        case VoiceRTCConstant.SignalType.ON_REMOTE_CANDIDATE:
            this.onRemoteCandidate(message);
            return;
        case VoiceRTCConstant.SignalType.ON_REMOTE_TURN_TALK_TYPE:
            this.onRemoteTurnTalkType(message);
            return;
        // 服务器主动下发的命令，  webrtc信令
        case VoiceRTCConstant.SignalType.NOTIFYE_NEW_PEER:
            this.onNotifyNewPeer(message);      // 新人加入
            return;
        default:
            VoiceRTCLogger.warn('Event ' + message.cmd);
    }
};
/**
 * onClose
 *
 */
VoiceRTCEngine.prototype.onClose = function (ev) {
    var voiceRTCEnv = this;
    VoiceRTCLogger.warn('websocket close', ev);
    if (ev.code == 1000 && ev.reason == 'wsForcedClose') { // 如果自定义关闭ws连接，避免二次重连
        return;
    }
    // ws连接不可用
    this.wsConnectionState = VoiceRTCConstant.wsConnectionState.DISCONNECTED;
    if (this.wsNeedConnect) { // ws需要重连
        setTimeout(function () {
            voiceRTCEnv.reconnect()
        }, VoiceRTCConstant.RECONNECT_TIMEOUT)
    }
};
/**
 * onError
 *
 */
VoiceRTCEngine.prototype.onError = function (ev) {
    VoiceRTCLogger.error('websocket error', ev);
    this.netState = VoiceRTCConstant.NetState.DISCONNECTED;
    // 调用用户的回调函数
    this.voiceRTCEngineEventHandle.call("onNetStateChanged", {
        ret: VoiceRTCConstant.NetState.DISCONNECTED,
    });
};
/**
 * disconnect
 *
 */
VoiceRTCEngine.prototype.disconnect = function (wsNeedConnect) {
    VoiceRTCLogger.warn('websocket disconnect');
    VoiceRTCLogger.warn('wsNeedConnect=' + wsNeedConnect);

    this.wsForcedClose = true;
    this.wsNeedConnect = wsNeedConnect;
    this.wsConnectionState = VoiceRTCConstant.wsConnectionState.DISCONNECTED;
    // 自定义关闭ws连接
    this.signaling.close(1000, 'wsForcedClose');
    // 网断后，执行close方法后不会立即触发onclose事件，所以需要手动重连
    if (this.wsNeedConnect) { // ws需要重连
        this.reconnect();
    }
};
/**
 * reconnect
 *
 */
VoiceRTCEngine.prototype.reconnect = function () {
    if (this.wsConnectionState != VoiceRTCConstant.wsConnectionState.DISCONNECTED) { // ws连接可用或正在连接不重连
        return;
    }
    this.reconnectTimes++;
    VoiceRTCLogger.warn('reconnectTimes=' + this.reconnectTimes);
    if (this.reconnectTimes > VoiceRTCConstant.RECONNECT_MAXTIMES) {
        this.keepAliveDisconnect();
    } else {
        var voiceRTCEngine = this;
        if (voiceRTCEngine.reconnectTimes > 1) { // 连续重连的话间隔一定时间
            setTimeout(function () {
                reconnectFunc(voiceRTCEngine);
            }, VoiceRTCConstant.RECONNECT_TIMEOUT);
        } else {
            reconnectFunc(voiceRTCEngine);
        }

        function reconnectFunc(voiceRTCEngine) {
            if (voiceRTCEngine.wsConnectionState == VoiceRTCConstant.wsConnectionState.DISCONNECTED) { // ws连接不可用
                // 清除所有连接   
                voiceRTCEngine.clearAllInitiatorState();
                VoiceRTCLogger.info('websocket reconnect');
                voiceRTCEngine.createWebsocket();
                // 重新logonAndJoin
                voiceRTCEngine.Join(VoiceRTCConstant.LogonAndJoinStatus.RECONNECT);
            }
        }
    }
};
/** ----- websocket ----- */
/** ----- keepAlive ---- */
/**
 * keepAlive
 *
 */
VoiceRTCEngine.prototype.keepAlive = function () {
    if (this.wsConnectionState == VoiceRTCConstant.wsConnectionState.CONNECTED) { // ws连接可用
        // 开始计时startScheduleKeepAlive
        this.startScheduleKeepAliveTimer(); // 启动超时计时器
        this.keepLive();
    } else {
        this.keepAliveFailed();
    }
}
/**
 * keepAlive失败
 *
 */
VoiceRTCEngine.prototype.keepAliveFailed = function () {
    this.keepAliveFailedTimes++;
    VoiceRTCLogger.warn("keepAliveFailedTimes=" + this.keepAliveFailedTimes);
    if (this.keepAliveFailedTimes > VoiceRTCConstant.KEEPALIVE_FAILEDTIMES_MAX) {
        this.keepAliveDisconnect();
    }
}
/**
 * 开始keepAlive
 *
 */
VoiceRTCEngine.prototype.startScheduleKeepAlive = function () {
    this.exitScheduleKeepAlive();
    this.exitScheduleKeepAliveTimer();

    var voiceRTCEngine = this;
    voiceRTCEngine.keepAlive(); // 立即执行1次
    voiceRTCEngine.keepAliveInterval = setInterval(function () {
        voiceRTCEngine.keepAlive();
    }, VoiceRTCConstant.KEEPALIVE_INTERVAL);
}
/**
 * 停止keepAlive
 *
 */
VoiceRTCEngine.prototype.exitScheduleKeepAlive = function () {
    this.keepAliveFailedTimes = 0;
    if (this.keepAliveInterval != null) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
    }
}
/**
 * keepAlive未收到result计时器方法
 *
 */
VoiceRTCEngine.prototype.keepAliveTimerFunc = function () {
    this.keepAliveTimerCount++;
    if (this.keepAliveTimerCount > VoiceRTCConstant.KEEPALIVE_TIMER_TIMEOUT_MAX / 3) {
        VoiceRTCLogger.warn("keepAliveTimerCount=" + this.keepAliveTimerCount);
    } else {
        VoiceRTCLogger.debug("keepAliveTimerCount=" + this.keepAliveTimerCount);
    }
    if (this.keepAliveTimerCount > VoiceRTCConstant.KEEPALIVE_TIMER_TIMEOUT_MAX) {
        this.keepAliveDisconnect(); // 和服务器断开
        return;
    }
    if (this.keepAliveTimerCount == VoiceRTCConstant.KEEPALIVE_TIMER_TIMEOUT_RECONNECT) {
        // 断开本次连接，进行重连
        this.disconnect(true);
    }
}
/**
 * 开始keepAlive未收到result计时器
 *
 */
VoiceRTCEngine.prototype.startScheduleKeepAliveTimer = function () {
    if (this.keepAliveTimer == null) {
        var voiceRTCEngine = this;
        // keepAlive5秒间隔，这个时候有可能已经断了5秒
        voiceRTCEngine.keepAliveTimerCount += VoiceRTCConstant.KEEPALIVE_INTERVAL / 1000;
        voiceRTCEngine.keepAliveTimer = setInterval(function () {
            voiceRTCEngine.keepAliveTimerFunc();
        }, VoiceRTCConstant.KEEPALIVE_TIMER_INTERVAL);
    }
}
/**
 * 停止keepAlive未收到result计时器
 *
 */
VoiceRTCEngine.prototype.exitScheduleKeepAliveTimer = function () {
    this.keepAliveTimerCount = 0;
    if (this.keepAliveTimer != null) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
    }
}
/**
 * 与服务器断开
 *
 */
VoiceRTCEngine.prototype.keepAliveDisconnect = function () {
    this.clear();
    this.netState = VoiceRTCConstant.NetState.DISCONNECTED_AND_EXIT;
    this.voiceRTCEngineEventHandle.call('onNetStateChanged', {
        'connectionState': VoiceRTCConstant.NetState.DISCONNECTED_AND_EXIT
    });
}


/** ----- 请求信令 ----- */
// 请求加入房间
// cmd
VoiceRTCEngine.prototype.Join = function (status) {
    this.startTime = window.performance.now();
    this.logonAndJoinStatus = (status == null || status == undefined ? 0 : status);
    this.offerStatus = null;
    var message = {
        'cmd': VoiceRTCConstant.SignalType.JOIN,
        'appId': this.appId,
        'token': this.token,
        'roomId': this.roomId,
        'roomName': this.roomName,
        'uid': this.selfUserId,
        'uname': this.selfUserName,
        'userType': this.userType,
        'talkType': this.talkType,  // 根据摄像头/麦克风打开情况
        'time': this.getCurrentTime(),
        'osName': this.getOsName(),
        'browser': this.getBrowser(),
        'sdkInfo': this.getSDKVersion()
    };

    this.sendJsonMsg(message)
}

/**
 * 请求leave信令
 *
 */
VoiceRTCEngine.prototype.leave = function () {
    this.startTime = null;
    VoiceRTCLogger.info("leave this.appId " + this.appId)
    var message = {
        'cmd': VoiceRTCConstant.SignalType.LEAVE,
        'appId': this.appId,
        'roomId': this.roomId,
        'uid': this.selfUserId,
        'uname': this.selfUserName,
        'userType': this.userType,
        'time': this.getCurrentTime()
    };
    this.sendJsonMsg(message)
}


/**
 * 摄像头开关闭通知服务端
 */
VoiceRTCEngine.prototype.updateTalkTypeCamera = function (isClosed) {
    var isUpdateTalkType = true;
    if (this.userType == VoiceRTCConstant.UserType.OBSERVER) { // 观察者模式
        isUpdateTalkType = false;
    }
    this.closeLocalVideoWithUpdateTalkType(isClosed, isUpdateTalkType);
    this.turnTalkType(0, this.localVideoEnable);
}
/**
 * m麦克风开关闭通知服务端
 */
VoiceRTCEngine.prototype.updateTalkTypeMic = function (isMute) {
    this.localStream && this.localStream.getAudioTracks().forEach(function (track) {
        track.enabled = !isMute;
    })

    VoiceRTCLogger.info("Microphone mute=" + isMute);
    this.microphoneEnable = !isMute;
    this.turnTalkType(1, this.microphoneEnable);
}

VoiceRTCEngine.prototype.turnTalkType = function (index, enable) {
    VoiceRTCLogger.info("turnTalkType into")
    this.offerStatus = null;
    var message = {
        'cmd': VoiceRTCConstant.SignalType.TURN_TALK_TYPE,
        'appId': this.appId,
        'roomId': this.roomId,
        'uid': this.selfUserId,
        'uname': this.selfUserName,
        'index': index,
        'enable': enable,
        'time': this.getCurrentTime()
    };
    this.sendJsonMsg(message)
}

/**
 * 请求keepLive信令
 *
 */
VoiceRTCEngine.prototype.keepLive = function () {
    // VoiceRTCLogger.info("keepLive into")
    this.offerStatus = null;
    var message = {
        'cmd': VoiceRTCConstant.SignalType.KEEP_LIVE,
        'appId': this.appId,
        'roomId': this.roomId,
        'uid': this.selfUserId,
        'time': this.getCurrentTime()
    };
    this.sendJsonMsg(message)
}

// 主动向服务器发送信令
/**
 * 请求offer信令
 *
 */
VoiceRTCEngine.prototype.offer = function (desc, from, isIceReset) {
    VoiceRTCLogger.info("offer into");
    this.offerStatus = null;
    var message = {
        'cmd': VoiceRTCConstant.SignalType.OFFER,
        'appId': this.appId,
        'roomId': this.roomId,
        'uid': this.selfUserId,
        'uname': this.selfUserName,
        'remoteUid': from,
        'isIceReset':isIceReset,
        'time': this.getCurrentTime(),
        'msg': desc
    };
    this.sendJsonMsg(message)
}
/**
 * 请求answer信令
 *
 */
VoiceRTCEngine.prototype.answer = function (desc, from) {
    VoiceRTCLogger.info("answer into")
    this.offerStatus = null;
    var message = {
        'cmd': VoiceRTCConstant.SignalType.ANSWER,
        'appId': this.appId,
        'roomId': this.roomId,
        'uid': this.selfUserId,
        'uname': this.selfUserName,
        'remoteUid': from,
        'time': this.getCurrentTime(),
        'msg': desc
    };
    this.sendJsonMsg(message)
}
/**
 * 请求candidate信令
 *
 */
VoiceRTCEngine.prototype.candidate = function (candidate, remoteUserId) {
    this.offerStatus = null;
    var message = {
        'cmd': VoiceRTCConstant.SignalType.CANDIDATE,
        'appId': this.appId,
        'roomId': this.roomId,
        'roomName': this.roomName,
        'uid': this.selfUserId,
        'remoteUid': remoteUserId,
        'time': this.getCurrentTime(),
        'msg': candidate
    };
    VoiceRTCLogger.info("prototype.candidate: " + JSON.stringify(message))
    this.sendJsonMsg(message)
}

// 通知服务器客户端已经连接成功
VoiceRTCEngine.prototype.peerConnected = function (remoteUserId, connectType) {
    this.offerStatus = null;
    var message = {
        'cmd': VoiceRTCConstant.SignalType.PEER_CONNECTED,
        'appId': this.appId,
        'connectType': connectType,
        'roomId': this.roomId,
        'uid': this.selfUserId,
        'remoteUid': remoteUserId,   // 当预设的talkType和当前的DevType不一样时则通知remoteUserId
        'time': this.getCurrentTime()
    };
    VoiceRTCLogger.info("prototype.peerConnected: " + JSON.stringify(message))
    this.sendJsonMsg(message)
}

VoiceRTCEngine.prototype.reportInfo = function (result, desc, data1, data2) {
    var message = {
        'cmd': VoiceRTCConstant.SignalType.REPORT_INFO,
        'appId': this.appId,
        'roomId': this.roomId,
        'uid': this.selfUserId,
        'uname': this.selfUserName,
        'result': result,
        'desc': desc,
        'data1': data1,
        'data2': data2,
        'time': this.getCurrentTime(),
    };
    VoiceRTCLogger.info("prototype.reportInfo: " + JSON.stringify(message))
    this.sendJsonMsg(message)
}

VoiceRTCEngine.prototype.reportStats = function (pc) {
    var message = {
        'cmd': VoiceRTCConstant.SignalType.REPORT_STATS,
        'appId': this.appId,
        'roomId': this.roomId,
        'uid': this.selfUserId,
        'remoteUid': pc.remoteUserId, 
        'audio': {
            'send': {
                'packetsLostRate': pc.statsResult.audio.send.packetsLostRate.toString(),// 丢包率
                'bitRate': pc.statsResult.audio.send.bitRate  // 发送的码率
            },
            'recv': {
                'packetsLostRate': pc.statsResult.audio.recv.packetsLostRate.toString(),// 丢包率
                'bitRate': pc.statsResult.audio.recv.bitRate  // 收到的码率
            }
        },
        'video': {
            'send': {
                'frameRateSent': pc.statsResult.video.send.frameRateSent, // 实际发送的帧率
                'width': pc.statsResult.video.send.width,
                'height': pc.statsResult.video.send.height,
                'codecName': pc.statsResult.video.send.codecName,   // 编码器
                'packetsLostRate': pc.statsResult.video.send.packetsLostRate.toString(),// 丢包率
                'bitRate': pc.statsResult.video.send.bitRate  // 发送的码率
            },
            'recv': {
                'frameRateRecv': pc.statsResult.video.recv.frameRateReceived, // 收到的帧率
                'width': pc.statsResult.video.recv.width,
                'height': pc.statsResult.video.recv.height,
                'codecName': pc.statsResult.video.recv.codecName,   // 编码器
                'packetsLostRate': pc.statsResult.video.recv.packetsLostRate.toString(),// 丢包率
                'bitRate': pc.statsResult.video.recv.bitRate // 收到的码率
            }
        },
        'time': this.getCurrentTime(),
    };
     VoiceRTCLogger.info("prototype.reportStats: " + JSON.stringify(message))
    this.sendJsonMsg(message)
}

VoiceRTCEngine.prototype.closeStream = function (stream) {
    stream ? stream.getTracks().forEach(function (track) {
        track.stop();
    }) : VoiceRTCLogger.error(" stream is not exist")
}
VoiceRTCEngine.prototype.getPeerConnection = function (userId) {
    var pcClient = this.peerConnections[userId];
    var pc = pcClient['pc'];
    if (!pc) {
        throw new Error("userId => peerConnection is not exist", userId);
    }
    return pc;
}

var deviceControl = {
    1: function (isOpen) { //摄像头
        voiceRTCengine.changeVideo(isOpen);
    },
    2: function (isOpen) {//麦克风
        voiceRTCengine.changeMicPhone(isOpen);
    }
}

// 处理服务器响应信息
/**
 * 1. 解析join结果，调用onJoinComplete通知用户join结果
 * 2. 如果userlist不为空，则调用onUserJoined通知用户同个房间的所有人员
 */
VoiceRTCEngine.prototype.handleResponseJoin = function (message) {
    if (message.result == 0) {
        this.roomId = message.roomId;
        this.roomName = message.roomName;
        this.selfUserId = message.uid;
        this.uname = message.uname;
        this.reportStatsInterval = message.reportStatsInterval;
        var userList = message.userList;
        VoiceRTCLogger.info("handleResponseJoin finish, isJoined:" + this.isJoined);
        this.isJoined = true
        this.voiceRTCEngineEventHandle.call('onJoinComplete', {
            isJoined: this.isJoined,
            userId: this.selfUserId,
            talkType: this.talkType,
            roomId: this.roomId,
            roomName: this.roomName,
            uname: this.uname,
        });
        this.onJoinComplete = true;


        if (userList) {
            // 返回的结果包含自己
            for (var i in userList) {
                var userId = userList[i].uid;
                var userName = userList[i].uname;
                var userType = userList[i].userType;
                var talkType = userList[i].talkType;
                if (!this.joinedUsers.contains(userId)) {
                    voiceRTCEngine = this;
                    if(voiceRTCEngine.peerConnections[userId] != null) {
                        VoiceRTCLogger.info("handleResponseJoin -> clearOldConnect");
                        voiceRTCEngine.clearOldConnect(userId);
                    }

                    var joinedUser = new Array();
                    joinedUser.push(userType);  // [0] 用户类型，正常用户，观察用户
                    joinedUser.push(talkType);  // [1] 通话类型，只有音频、音视频等等
                    joinedUser.push(userName);  // [2] 用户名
                    joinedUser.push(null);
                    this.joinedUsers.put(userId, joinedUser);

                    if (userId != this.selfUserId) {
                        this.voiceRTCEngineEventHandle.call('onUserJoined', { // 观
                            userId: userId,
                            userName: userName,
                            userType: userType,
                            talkType: talkType
                        });
                    }

                }

            }
        }
        // 开始keepAlive
        this.startScheduleKeepAlive();

    } else {
        this.roomId = message.roomId;
        this.roomName = message.roomName;
        this.selfUserId = message.uid;
        this.uname = message.uname;
        VoiceRTCLogger.error('handleResponseJoin: result = ' + message.desc);
        voiceRTCengine.voiceRTCEngineEventHandle.call("onError", {
            ret: message.ret,
            desc: message.desc
        });
    }
}


VoiceRTCEngine.prototype.handleResponseLeave = function (message) {
    if (message.result == 0) {
        var isLeave = true;
        if (isLeave) {
            this.clear();
        }
        this.voiceRTCEngineEventHandle.call('onLeaveComplete', {
            'isLeave': isLeave
        });

    } else {    //报错同样离开
        VoiceRTCLogger.error('handleResponseLeave: result = ' + message.desc);
        var isLeave = true;
        if (isLeave) {
            this.clear();
        }
        this.voiceRTCEngineEventHandle.call('onLeaveComplete', {
            'isLeave': false
        });
    }
}

VoiceRTCEngine.prototype.handleResponseOffer = function (message) {
    if (message.result == 0) {
      
    } else {
        VoiceRTCLogger.error('handleResponseOffer: result = ' + message.desc);
        this.voiceRTCEngineEventHandle.call("onError", {
            ret: message.result,
            desc: message.desc
        });
    }
}

VoiceRTCEngine.prototype.handleResponseAnswer = function (message) {
    if (message.result == 0) {


    } else {
        VoiceRTCLogger.error('handleResponseAnswer: result = ' + message.desc);
        this.voiceRTCEngineEventHandle.call("onError", {
            ret: message.result,
            desc: message.desc
        });
    }
}


VoiceRTCEngine.prototype.handleResponseCandidate = function (message) {
    if (message.result == 0) {


    } else {
        VoiceRTCLogger.error('handleResponseCandidate: result = ' + message.desc);
        this.voiceRTCEngineEventHandle.call("onError", {
            ret: message.result,
            desc: message.desc
        });
    }
}

/**
* message格式
* cmd 回复的命令类型，比如CmdJoin，CmdOffer等等
* ret 返回码，0为正常，其他值则为出错值
* desc 文字描述ret的意义
* data1 不同的命令意义不同
* data2 不同的命令意义不同
 */
VoiceRTCEngine.prototype.handleResponseGeneralMessage = function (message) {
    //VoiceRTCLogger.warn(message);

    if (message.result == 0) {


    } else {
        VoiceRTCLogger.error('handleResponseGeneralMessage-> cmd:' + message.cmd + ', desc:' + message.desc);
        // 调用用户的回调函数
        voiceRTCengine.voiceRTCEngineEventHandle.call("onError", {
            ret: message.ret,
            desc: message.desc
        });
    }
}

VoiceRTCEngine.prototype.handleResponseKeepLive = function (message) {
    // VoiceRTCLogger.warn(message);
    // 收到result，停止计时
    this.exitScheduleKeepAliveTimer(); //收到keepAlive后停止计时器

    if (message.result == 0) {
        // VoiceRTCLogger.info("keeplive ok ");
        // 重置keepAliveFailedTimes
        this.keepAliveFailedTimes = 0;
    } else {
        this.keepAliveFailed();
        VoiceRTCLogger.error('handleResponseKeepLive-> cmd:' + message.cmd + ', desc:' + message.desc);
    }
}

/**
 * 处理新人加入信息并发起连接
 */
VoiceRTCEngine.prototype.onNotifyNewPeer = function (message) {
    VoiceRTCLogger.info("onNotifyNewPeer, msg:" + message);
    // 调用回调更新房间人员信息
    // 发起请求连接
    var fromId = message.uid;
    var fromName = message.uname;
    var userType = message.userType;
    var talkType = message.talkType;
    var rtcConfig = message.rtcConfig;

    voiceRTCEngine = this;
    if(voiceRTCEngine.peerConnections[fromId] != null) {
        VoiceRTCLogger.info("onNotifyNewPeer -> clearOldConnect");
        voiceRTCEngine.clearOldConnect(fromId);
    }

    // 加入用户列表
    if (!this.joinedUsers.contains(fromId)) {
        var joinedUser = new Array();
        joinedUser.push(userType);
        joinedUser.push(talkType);
        joinedUser.push(fromName);
        joinedUser.push(null);
        this.joinedUsers.put(fromId, joinedUser);
        this.voiceRTCEngineEventHandle.call('onUserJoined', {
            userId: fromId,
            userName: fromName,
            userType: userType,
            talkType: talkType
        });
    }

    VoiceRTCLogger.warn("onNotifyNewPeer createOffer");
    this.createOffer(fromId,fromName, rtcConfig ,false);        // 第一次加入不是ice reset
}



/**
 * 建立连接
 *
 */
VoiceRTCEngine.prototype.preparePeerConnection = function (userId, userName, rtcConfig) {
    VoiceRTCLogger.info("preparePeerConnection userId:" + userId + ", userName:" + userName);
    var voiceRTCEngine = this;
    
    if (voiceRTCEngine.peerConnections[userId] == null) {
        var pc = new RTCPeerConnectionWrapper(this.selfUserId, userId, userName, rtcConfig);
        voiceRTCEngine.peerConnections[userId] = {}
        voiceRTCEngine.peerConnections[userId].userName = userName;
        voiceRTCEngine.peerConnections[userId]['pc'] = pc;

        if (this.userType == VoiceRTCConstant.UserType.NORMAL) {
            pc.addStream(this.localStream);
        }
        // peerConnection创建成功，开始getStatsReport 
        pc.startScheduleGetStatsReport();
    }
    return voiceRTCEngine.peerConnections[userId];
};
/**
 * 关闭连接
 *
 */
VoiceRTCEngine.prototype.closePeerConnection = function (userId) {
    VoiceRTCLogger.info('closePeerConnection, userId: ' + userId);
    if (this.peerConnections[userId] != null) {
        this.peerConnections[userId]['pc'].stopCheckPeerConnectState();
        // peerConnection关闭，停止getStatsReport
        this.peerConnections[userId]['pc'].exitScheduleGetStatsReport();
        this.peerConnections[userId]['pc'].close();
        this.peerConnections[userId] = null;
    }
    // 重置带宽设置计数器
    VoiceRTCGlobal.bandWidthCount = 0;

}

/**
 * joinedUser.push(userType);  // [0] 用户类型，正常用户，观察用户
    joinedUser.push(talkType);  // [1] 通话类型，只有音频、音视频等等
    joinedUser.push(userName);  // [2] 用户名
 */
VoiceRTCEngine.prototype.clearAllPeerConnection = function () {
    VoiceRTCLogger.info("clearAllPeerConnection")

    var userArr = this.joinedUsers.getEntrys();
    for (var i in userArr) {
        var userId = userArr[i].key;        // 获取到userId
        var joinedUser = voiceRTCEngine.joinedUsers.get(userId);
        var userType = joinedUser[0];
        var userName = joinedUser[1];
        var talkType = joinedUser[2];
        VoiceRTCLogger.info("clear " + userId);
        this.closePeerConnection(userId)
        this.joinedUsers.remove(userId);
        this.remoteCnameMap.remove(userId);
        this.remoteSdpMap.remove(userId);
        this.remoteStreams = this.remoteStreams.filter(function (stream) {
            return stream.id != userId;
        })

        this.voiceRTCEngineEventHandle.call('onUserLeave', {
            userId: userId,
            userName: userName,
            userType: userType
        });
    }
}

VoiceRTCEngine.prototype.clearAllInitiatorState = function () {
    VoiceRTCLogger.info("clearAllInitiatorState")

    var userArr = this.joinedUsers.getEntrys();
    for (var i in userArr) {
        var userId = userArr[i].key;        // 获取到userId
        if (this.peerConnections[userId] != null) {
            this.peerConnections[userId]['pc'].setInitiator(false);
        }
    }
}

// 响应房间内其他人员离开
VoiceRTCEngine.prototype.onRemoteLeave = function (message) {
    VoiceRTCLogger.info("onRemoteLeave " + message.uid + " leave room")

    var userId = message.uid;
    var userName = message.uname;
    var userType = message.userType;

    this.closePeerConnection(userId)
    this.joinedUsers.remove(userId);
    this.remoteCnameMap.remove(userId);
    this.remoteSdpMap.remove(userId);
    this.remoteViewMap.remove(userId);
    this.remoteStreams = this.remoteStreams.filter(function (stream) {
        return stream.id != userId;
    })

    this.voiceRTCEngineEventHandle.call('onUserLeave', {
        userId: userId,
        userName: userName,
        userType: userType
    });
}

VoiceRTCEngine.prototype.clearOldConnect = function (userId) {  
    this.closePeerConnection(userId)
    this.joinedUsers.remove(userId);
    this.remoteCnameMap.remove(userId);
    this.remoteSdpMap.remove(userId);
    this.remoteStreams = this.remoteStreams.filter(function (stream) {
        return stream.id != userId;
    })
}

// 响应

/**
 * handle offer
 *
 */
VoiceRTCEngine.prototype.onRemoteOffer = function (message) {
    if (this.offerStatus == VoiceRTCConstant.OfferStatus.SENDING) {
        VoiceRTCLogger.warn("onRemoteOffer offerStatus sending");
        // return;
    }

    var fromId = message.uid;
    var fromName = message.uname;
    var rtcConfig = message.rtcConfig;
    var isIceReset = message.isIceReset;
    let desc = JSON.parse(message.msg);

    VoiceRTCLogger.info("onRemoteOffer -> isIceReset:" + isIceReset);
    voiceRTCEngine = this;
    if(voiceRTCEngine.peerConnections[fromId] != null) {
        VoiceRTCLogger.info("onRemoteOffer -> closePeerConnection");
        voiceRTCEngine.closePeerConnection(fromId);
    }

    // var desc2 = JSON.parse(message.msg.replace(new RegExp('\'', 'g'), '"'));
    // set bandwidth
    desc.sdp = VoiceRTCUtil.setBandWidth(desc.sdp, this.getBandWidth());


    var pcClient = this.preparePeerConnection(fromId, fromName, rtcConfig);
    var pc = pcClient['pc'];
    pc.isSendPeerConnectedResult = false;  //  
    var connectTime = window.performance.now();     // 收到发起端的连接
    pc.setSetupTimes(this.startTime, connectTime);
    VoiceRTCLogger.info("onRemoteOffer: Call setup time ->" + (connectTime - this.startTime).toFixed(0) + "ms.");

    var voiceRTCEngine = this;
    this.startTime = window.performance.now();
    pc.getPc().setRemoteDescription(new RTCSessionDescription(desc), function () {
        VoiceRTCLogger.info("onRemoteOffer setRemoteDescription success");
        voiceRTCEngine.offerStatus = VoiceRTCConstant.OfferStatus.DONE;
        // set remote cname map
        // voiceRTCEngine.setRemoteCnameMap(desc.sdp);
        pc.getPc().createAnswer(function (desc2) {
            VoiceRTCLogger.info("createAnswer success");
            desc2.sdp = VoiceRTCUtil.changeStreamId(desc2.sdp, voiceRTCEngine.localStream.id, voiceRTCEngine.selfUserId);
            // desc.sdp = VoiceRTCUtil.addFECSupport(desc.sdp);
            // desc2.sdp = VoiceRTCUtil.changeVideoDesc(desc2.sdp);// 用了视频会卡些
            pc.getPc().setLocalDescription(desc2, function () {
                VoiceRTCLogger.info("createAnswer setLocalDescription success");
                voiceRTCEngine.answer(JSON.stringify(desc2), fromId);
            }, function (error) {
                VoiceRTCLogger.error("createAnswer setLocalDescription error: ", error);
                voiceRTCEngine.reportInfo(VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_CLIENT_EXCEPTION,
                    VoiceRTCConstant.RoomErrorString.ROOM_ERROR_CLIENT_EXCEPTION,
                    "createAnswer setLocalDescription error", error);
            });
        }, function (error) {
            VoiceRTCLogger.error("createAnswer error: ", error);
            voiceRTCEngine.reportInfo(VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_CLIENT_EXCEPTION,
                VoiceRTCConstant.RoomErrorString.ROOM_ERROR_CLIENT_EXCEPTION,
                "createAnswer  error", error);
        });//, voiceRTCEngine.getSdpMediaConstraints(false));
    }, function (error) {
        VoiceRTCLogger.error("onRemoteOffer setRemoteDescription error: ", error);
        voiceRTCEngine.reportInfo(VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_CLIENT_EXCEPTION,
            VoiceRTCConstant.RoomErrorString.ROOM_ERROR_CLIENT_EXCEPTION,
            "onRemoteOffer setRemoteDescription error", error);
    });
};
/**
 * handle answer
 *
 */
VoiceRTCEngine.prototype.onRemoteAnswer = function (message) {
    VoiceRTCLogger.info('onRemoteAnswer');
    if (this.offerStatus == VoiceRTCConstant.OfferStatus.DONE) { 
        VoiceRTCLogger.warn("onRemoteAnswer offerStatus done"); // 监测是否有重复的Answer
        // return; // 已经设置过一次SDP，放弃本次设置
    }

    var fromId = message.uid;
    var fromName = message.uname;
    var desc = JSON.parse(message.msg);
    var pcClient = this.preparePeerConnection(fromId, fromName, null, null);
    var pc = pcClient['pc'];
    var connectTime = window.performance.now();     // 收到发起端的连接
    pc.setSetupTimes(this.startTime, connectTime)
    VoiceRTCLogger.info("onRemoteAnswer: Call setup time ->" + (connectTime - this.startTime).toFixed(0) + "ms.");
    // set bandwidth
    desc.sdp = VoiceRTCUtil.setBandWidth(desc.sdp, this.getBandWidth());


    var voiceRTCEngine = this;
    pc.getPc().setRemoteDescription(new RTCSessionDescription(desc), function () {
        VoiceRTCLogger.info("onRemoteAnswer setRemoteDescription success");
        voiceRTCEngine.offerStatus = VoiceRTCConstant.OfferStatus.DONE;
        // set remote cname map
        // voiceRTCEngine.setRemoteCnameMap(desc.sdp);
    }, function (error) {
        VoiceRTCLogger.error("onRemoteAnswer setRemoteDescription error: ", error);
        voiceRTCEngine.reportInfo(VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_CLIENT_EXCEPTION,
            VoiceRTCConstant.RoomErrorString.ROOM_ERROR_CLIENT_EXCEPTION,
            'onRemoteAnswer setRemoteDescription error', error);
    });
};
/**
 * handle candidate
 *
 */
VoiceRTCEngine.prototype.onRemoteCandidate = function (message) {
    VoiceRTCLogger.info('onRemoteCandidate');
    var fromId = message.uid;
    var fromName = message.uname;
    var desc = JSON.parse(message.msg);
    var pcClient = this.preparePeerConnection(fromId, fromName, null, null);
    var pc = pcClient['pc'];
    var desc2 = {
        'sdpMLineIndex': desc.label,
        'sdpMid': desc.id,
        'candidate': desc.candidate
    };

    pc.getPc().addIceCandidate(new RTCIceCandidate(desc2), function () {
        VoiceRTCLogger.info("addIceCandidate success");
    }, function (error) {
        VoiceRTCLogger.error("addIceCandidate error: ", error);
        voiceRTCEngine.reportInfo(VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_CLIENT_EXCEPTION,
            VoiceRTCConstant.RoomErrorString.ROOM_ERROR_CLIENT_EXCEPTION,
            'onRemoteCandidate addIceCandidate error', error);
    });
}

VoiceRTCEngine.prototype.onRemoteTurnTalkType = function (message) {
    var userId = message.uid;
    var userName = message.uname;
    var index = message.index;  // 设备索引，0摄像头，1麦克风，2共享屏幕，3系统声音
    var enable = message.enable;
    VoiceRTCLogger.warn(message);

    var remoteStream = voiceRTCengine.getRemoteStream(userId);
    if (index == 0 && enable == true) {
        remoteStream.getVideoTracks().forEach(function (track) {
            track.enabled = true;
        })
    }
    if (index == 1 && enable == true) {
        remoteStream.getAudioTracks().forEach(function (track) {
            track.enabled = true;
        })
    }
    voiceRTCengine.voiceRTCEngineEventHandle.call("onTurnTalkType", {
        userId: userId,
        userName: userName,
        index: index,
        enable: enable
    });
}
/**
 * create offer
 *
 */
VoiceRTCEngine.prototype.createOffer = function (fromId, fromName, rtcConfig, isIceReset) {

    voiceRTCEngine = this;
    if(!isIceReset) {
        // 先清除
        if(voiceRTCEngine.peerConnections[fromId] != null) {
            VoiceRTCLogger.info("createOffer -> closePeerConnection");
            voiceRTCEngine.closePeerConnection(fromId);   
        }
    }
    var pcClient = this.preparePeerConnection(fromId, fromName, rtcConfig, null);
    var pc = pcClient['pc'];

    pc.setInitiator(true);  // 设置为发起者

    pc.isSendPeerConnectedResult = false;   // 重置
    this.startTime = window.performance.now();

    if (this.offerStatus == VoiceRTCConstant.OfferStatus.SENDING) { // 已经创建过Offer，本次不创建
        VoiceRTCLogger.warn("createOffer offerStatus sending");
        return;
    }
    VoiceRTCLogger.info("createOffer userId = " + fromId);
    var voiceRTCEngine = this;

    pc.getPc().createOffer(function (desc) {
        VoiceRTCLogger.info("createOffer success");
        // change streamId use userId
        desc.sdp = VoiceRTCUtil.changeStreamId(desc.sdp, voiceRTCEngine.localStream.id, voiceRTCEngine.selfUserId);
        // desc.sdp = VoiceRTCUtil.addFECSupport(desc.sdp);
        // 替换video参数
        // desc.sdp = VoiceRTCUtil.changeVideoDesc(desc.sdp);
        pc.getPc().setLocalDescription(desc, function () {
            VoiceRTCLogger.info("createOffer setLocalDescription success");
            voiceRTCEngine.offerStatus = VoiceRTCConstant.OfferStatus.SENDING;
            voiceRTCEngine.offer(JSON.stringify(desc), fromId, isIceReset);
        }, function (error) {
            VoiceRTCLogger.error("createOffer setLocalDescription error: ", error);
            voiceRTCEngine.reportInfo(VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_CLIENT_EXCEPTION,
                VoiceRTCConstant.RoomErrorString.ROOM_ERROR_CLIENT_EXCEPTION,
                "createOffer setLocalDescription error", error);
        });
    }, function (error) {
        VoiceRTCLogger.error("createOffer error: ", error);
        voiceRTCEngine.reportInfo(VoiceRTCConstant.RoomErrorCode.ROOM_ERROR_CLIENT_EXCEPTION,
            VoiceRTCConstant.RoomErrorString.ROOM_ERROR_CLIENT_EXCEPTION,
            "createOffer error", error);
    });
}
/**
 * 设置sdp属性
 *
 */
VoiceRTCEngine.prototype.getSdpMediaConstraints = function (isIceReset) {
    var sdpMediaConstraints = {};
    sdpMediaConstraints.mandatory = {};
    // 统一设置，包含观察者模式和普通模式无摄像头情况
    sdpMediaConstraints.mandatory.OfferToReceiveAudio = true;
    sdpMediaConstraints.mandatory.OfferToReceiveVideo = true;
    // IceRestart
    VoiceRTCLogger.warn("isIceReset=" + isIceReset);
    sdpMediaConstraints.mandatory.IceRestart = isIceReset;
    return sdpMediaConstraints;
}
/**
 * 设置remote cname map
 *
 */
VoiceRTCEngine.prototype.setRemoteCnameMap = function (sdp) {
    var userArr = this.joinedUsers.getEntrys();
    for (var i in userArr) {
        var userId = userArr[i].key;
        if (userId == this.selfUserId) { // 不是远端
            continue;
        }
        if (!this.remoteCnameMap.contains(userId)) {
            var cname = VoiceRTCUtil.getCname(sdp, userId);
            if (cname != null && cname != "") {
                this.remoteCnameMap.put(userId, cname);
                this.remoteSdpMap.put(userId, sdp);
            }
        } else {
            var cname = this.remoteCnameMap.get(userId);
            if (cname != null && cname != ""
                && !VoiceRTCUtil.isHasCname(sdp, cname)) {
                var newCname = VoiceRTCUtil.getCname(sdp, userId);
                if (newCname != null && newCname != "") {
                    this.remoteCnameMap.put(userId, newCname);
                    VoiceRTCUtil.refreshMediaStream(userId);// 屏幕共享cname不变
                    // userId不变，cname变化，视为客户端杀进程后重连，刷新远端视频流
                }
            } else if (cname != null && cname != ""
                && VoiceRTCUtil.isHasCname(sdp, cname)) {
                var newCname = VoiceRTCUtil.getCname(sdp, userId);
                if (cname == newCname) {
                    var oldSdp = this.remoteSdpMap.get(userId);
                    var ts = VoiceRTCUtil.getSsrc(oldSdp, userId, cname);
                    var newTs = VoiceRTCUtil.getSsrc(sdp, userId, cname);
                    if (ts != newTs)
                        VoiceRTCUtil.refreshMediaStream(userId)

                }
            }

        }
    }
}
/**
 * 获取带宽
 * 
 */
VoiceRTCEngine.prototype.getBandWidth = function () {
    if (this.screenSharingStatus) { // 正在屏幕共享
        return VoiceRTCConstant.BandWidth_ScreenShare_1280_720;
    }
    return this.bandWidth;
}
/** ----- 处理通知信令 ----- */
//
// return VoiceRTCEngine;
// });
/** ----- VoiceRTCEngine ----- */


/** ----- VoiceRTCConnectionStatsReport ----- */
var VoiceRTCConnectionStatsReport = function () {
    this.statsReportSend = {};
    this.statsReportRecvs = new Array();
    this.packetSendLossRate = 0;
}


/** ----- VoiceRTCEngineEventHandle ----- */
// var VoiceRTCEngineEventHandle = (function() {
/**
 * 构造函数
 *
 */
var VoiceRTCEngineEventHandle = function (config) {
    /** 事件集合 */
    this.eventHandles = {};
    return this;
}
/**
 * 绑定事件
 *
 */
VoiceRTCEngineEventHandle.prototype.on = function (eventName, event) {
    this.eventHandles[eventName] = event;
};
/**
 * 调用事件
 *
 */
VoiceRTCEngineEventHandle.prototype.call = function (eventName, data) {
    for (var eventHandle in this.eventHandles) {
        if (eventName === eventHandle) {
            return this.eventHandles[eventName](data);
        }
    }
    VoiceRTCLogger.info('EventHandle ' + eventName + ' do not have defined function');
};

/** ----- VoiceRTCUtil ---- */
var VoiceRTCUtil = {
    /**
     * 获取websocket地址列表
     *
     */
    getWsUrlList: function (wsNavUrl, callback) {
        var wsUrlList;
        VoiceRTCLogger.info("getWsUrlList wsNavUrl:" + wsNavUrl)
        VoiceRTCAjax({
            type: "POST",
            url: wsNavUrl,
            async: true,
            data: {
                rand: Math.random()
            },
            dataType: "JSON",
            success: function (data) {
                callback(data);
            },
            error: function (error) {
                VoiceRTCLogger.error("request nav error: ", error);
                throw error;
            }
        });
    },
    /**
     * SDP设置带宽
     *  x-google-max-bitrate：视频码流最大值，当网络特别好时，码流最大能达到这个值，如果不设置这个值，网络好时码流会非常大 
     *  x-google-min-bitrate：视频码流最小值，当网络不太好时，WebRTC的码流每次5%递减，直到这个最小值为，如果没有设置这个值，网络不好时，视频质量会非常差 
     *  x-google-start-bitrate：视频编码初始值 ，当网络好时，码流会向最大值递增，当网络差时，码流会向最小值递减。
     * @param sdp
     * @param bandWidthParam
     * @returns
     */
    setBandWidth: function (sdp, bandWidthParam) {
        var currentBandWidth = JSON.parse(JSON.stringify(bandWidthParam));
        var startBandWidth;
        if (VoiceRTCGlobal.bandWidthCount == 0) {
            startBandWidth = (currentBandWidth.min + currentBandWidth.max) / 2;
        }
        // 给带宽设置增加计数器，使每次设置的最小码率不同，防止码率一样WebRTC将码率重置成默认最小值
        VoiceRTCGlobal.bandWidthCount++;
        if (VoiceRTCGlobal.bandWidthCount % 2 == 0) {
            currentBandWidth.min = currentBandWidth.min + 1;
        }

        // set BAS
        sdp = sdp.replace(/a=mid:video\n/g, 'a=mid:video\nb=AS:'
            + currentBandWidth.max + '\n');

        // 查找最优先用的视频代码
        var sep1 = "\n";
        var findStr1 = "m=video";

        var sdpArr = sdp.split(sep1);
        // 查找findStr1
        var findIndex1 = VoiceRTCUtil.findLine(sdpArr, findStr1);
        if (findIndex1 == null) {
            return sdp;
        }

        var sep2 = " ";

        var videoDescArr1 = sdpArr[findIndex1].split(sep2);
        // m=video 9 UDP/TLS/RTP/SAVPF
        var firstVideoCode = videoDescArr1[3];
        var findStr2 = "a=rtpmap:" + firstVideoCode;
        // 查找findStr2
        var findIndex2 = VoiceRTCUtil.findLine(sdpArr, findStr2);
        if (findIndex2 == null) {
            return sdp;
        }

        var appendStr = 'a=fmtp:' + firstVideoCode + ' x-google-min-bitrate=' + currentBandWidth.min
            + '; x-google-max-bitrate=' + currentBandWidth.max;
        if (startBandWidth != null) {
            appendStr += '; x-google-start-bitrate=' + startBandWidth;
        }
        sdpArr[findIndex2] = sdpArr[findIndex2].concat(sep1 + appendStr);

        return sdpArr.join(sep1);
    },
    /**
     * SDP修改stream id
     *
     * @param sdp
     * @param oldId
     * @param newId
     * @returns
     */
    changeStreamId: function (sdp, oldId, newId) {
        sdp = sdp.replace(new RegExp(oldId, 'g'), newId);
        return sdp;
    },
    addFECSupport: function (sdp) {
        return sdp;
        // https://github.com/muaz-khan/RTCMultiConnection/wiki/Bandwidth-Management
        var sdpLines = sdp.split('\r\n');

        // Find opus payload.
        var opusIndex = findLine(sdpLines, 'a=rtpmap', 'opus/48000');
        var opusPayload;
        if (opusIndex) {
            opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
        }

        // Find the payload in fmtp line.
        var fmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + opusPayload.toString());
        if (fmtpLineIndex === null) {
            return sdp;
        }

        // Append stereo=1 to fmtp line.
        // added maxaveragebitrate here; about 128 kbits/s
        // added stereo=1 here for stereo audio
        sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat('; useinbandfec=1');

        sdp = sdpLines.join('\r\n');

        return sdp;
    },
    /**
     * SDP修改video兼容参数
     *
     * @param sdp
     * @returns
     */
    changeVideoDesc: function (sdp) {
        return sdp;
        var sep1 = "\r\n";
        var findStr1 = "m=video";

        var sdpArr = sdp.split(sep1);   // 把一个字符串分割成字符串数组
        // 查找videoDesc1
        var findIndex1 = VoiceRTCUtil.findLine(sdpArr, findStr1);    // 查找子串
        if (findIndex1 == null) {
            return sdp;
        }

        var h264_code = "98";
        var vp8_code = "96";
        var red_code = "100"
        var ulpfec_code = "127";
        var flexfec_code = "125";
        var h264_rtx_code = "99";
        var vp8_rtx_code = "97";
        var red_rtx_code = "101"

        var h264_search = "H264/90000";
        var vp8_search = "VP8/90000";
        var red_search = "red/90000";
        var ulpfec_search = "ulpfec/90000";
        var flexfec_search = "flexfec-03/90000";

        var h264_replace = "a=rtpmap:98 H264/90000\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98";
        var vp8_replace = "a=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96";
        var red_replace = "a=rtpmap:100 red/90000\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100";
        var ulpfec_replace = "a=rtpmap:127 ulpfec/90000";
        var flexfec_replace = "a=rtpmap:125 flexfec-03/90000\r\na=rtcp-fb:125 transport-cc\r\na=rtcp-fb:125 goog-remb\r\na=fmtp:125 repair-window=10000000";

        var sep2 = " ";
        var findStr2 = "a=rtpmap";
        var findStr3 = "a=ssrc-group";

        var videoDescArr1 = sdpArr[findIndex1].split(sep2);
        // m=video 9 UDP/TLS/RTP/SAVPF
        var videoReplace1 = videoDescArr1[0] + sep2 + videoDescArr1[1] + sep2
            + videoDescArr1[2];
        // 查找videoDesc2
        var findIndex2 = VoiceRTCUtil.findLineInRange(sdpArr, findStr2, findIndex1 + 1, sdpArr.length - 1);
        var findIndex3 = VoiceRTCUtil.findLineInRange(sdpArr, findStr3, findIndex2 + 1, sdpArr.length - 1);
        if (findIndex3 == null) { // 观察者模式没有findStr3相关信息
            findIndex3 = sdpArr.length - 1;
        }
        // 删除中间的元素
        var removeArr = sdpArr.splice(findIndex2, findIndex3 - findIndex2);

        // 查找H264
        var h264_index = VoiceRTCUtil.findLine(removeArr, h264_search);
        // 查找VP8
        var vp8_index = VoiceRTCUtil.findLine(removeArr, vp8_search);
        // 查找red
        var red_index = VoiceRTCUtil.findLine(removeArr, red_search);
        // 查找ulpfec
        var ulpfec_index = VoiceRTCUtil.findLine(removeArr, ulpfec_search);
        // 查找flexfec
        var flexfec_index = VoiceRTCUtil.findLine(removeArr, flexfec_search);

        // 相等于只是换了codec的顺序
        var videoReplace2 = "";
        if (h264_index != null) {
            videoReplace1 += sep2 + h264_code;
            videoReplace2 += sep1 + h264_replace;
        }
        if (vp8_index != null) {
            videoReplace1 += sep2 + vp8_code;
            videoReplace2 += sep1 + vp8_replace;
        }
        if (red_index != null) {
            videoReplace1 += sep2 + red_code;
            videoReplace2 += sep1 + red_replace;
        }
        if (ulpfec_index != null) {
            videoReplace1 += sep2 + ulpfec_code;
            videoReplace2 += sep1 + ulpfec_replace;
        }
        if (flexfec_index != null) {
            videoReplace1 += sep2 + flexfec_code;
            videoReplace2 += sep1 + flexfec_replace;
        }
        if (h264_index != null) {
            videoReplace1 += sep2 + h264_rtx_code;
        }
        if (vp8_index != null) {
            videoReplace1 += sep2 + vp8_rtx_code;
        }
        if (red_index != null) {
            videoReplace1 += sep2 + red_rtx_code;
        }

        // 替换videoDesc1
        sdpArr[findIndex1] = videoReplace1;
        // 替换videoDesc2
        sdpArr[findIndex2 - 1] = sdpArr[findIndex2 - 1].concat(videoReplace2);

        return sdpArr.join(sep1);
    },
    /**
     * get cname
     *
     * @param userId
     */
    getCname: function (sdp, userId) {
        var sep1 = "\n";
        var sep2 = " ";
        var sdpArr = sdp.split(sep1);

        // a=ssrc:702269835 msid:A9532881-B4CA-4B23-B219-9837CE93AA70 4716df1f-046f-4b96-a260-2593048d7e9e
        var msid_search = "msid:" + userId;
        var msid_index = VoiceRTCUtil.findLine(sdpArr, msid_search);
        if (msid_index == null) {
            return null;
        }
        var ssrc = sdpArr[msid_index].split(sep2)[0];

        // a=ssrc:702269835 cname:wRow2WLrs18ZB3Dg
        var cname_search = ssrc + " cname:";
        var cname_index = VoiceRTCUtil.findLine(sdpArr, cname_search);
        var cname = sdpArr[cname_index].split("cname:")[1];
        return cname;
    },
    /**
     * check cname
     *
     * @param userId
     */
    isHasCname: function (sdp, cname) {
        var sep1 = "\n";
        var sdpArr = sdp.split(sep1);

        // a=ssrc:702269835 cname:wRow2WLrs18ZB3Dg
        var cname_search = "cname:" + cname;
        var cname_index = VoiceRTCUtil.findLine(sdpArr, cname_search);
        return cname_index != null;
    },
    getSsrc: function (sdp, userId, cname) {
        //ssrc变化则为屏幕共享

        var sdpArr = sdp.split('\n');
        var videoLine = sdpArr.map(function (line, index) {
            if (line.indexOf('mid:video') > -1)
                return index;
        }).filter(function (item) {
            return item;
        })
        sdpArr = sdpArr.slice(videoLine[0])
        var ssrc = sdpArr.filter(function (line) {
            return line.indexOf('a=ssrc:') > -1;
        })
        var cnameLine = ssrc.map(function (line, index) {
            if (line.indexOf('cname:' + cname) > -1)
                return index;
        }).filter(function (item) {
            return item;
        })
        var ts = ssrc.slice(cnameLine[0] + 1, cnameLine[0] + 2);
        return ts[0].split(" ")[2];

    },
    /**
     * 数组中查找
     *
     * @param arr
     * @param substr
     * @returns
     */
    findLine: function (arr, substr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].indexOf(substr) != -1) {
                return i;
            }
        }
        return null;
    },
    /**
     * 数组中查找
     *
     * @param arr
     * @param substr
     * @param startIndex
     * @param endIndex
     * @returns
     */
    findLineInRange: function (arr, substr, startIndex, endIndex) {
        var start = (startIndex == null || startIndex == '' || startIndex < 0) ? 0
            : startIndex;
        var end = (endIndex == null || endIndex == '' || endIndex < 0 || endIndex > arr.length - 1) ? arr.length - 1
            : endIndex;
        start = start > end ? end : start;
        for (var i = start; i <= end; i++) {
            if (arr[i].indexOf(substr) != -1) {
                return i;
            }
        }
        return null;
    },
    /**
     * 随机打乱数组内排序
     *
     * @param input
     * @returns
     */
    shuffle: function (input) {
        for (var i = input.length - 1; i >= 0; i--) {
            var randomIndex = Math.floor(Math.random() * (i + 1));
            var itemAtIndex = input[randomIndex];
            input[randomIndex] = input[i];
            input[i] = itemAtIndex;
        }
        return input;
    },
    /**
     * 刷新VideoView的视频流
     *
     * @param userId
     */
    refreshMediaStream: function (userId) {
        var videoView = document.getElementById(userId);
        if (videoView != null) {
            var stream = userId == voiceRTCengine.selfUserId ? voiceRTCengine.localStream : voiceRTCengine.remoteStreams.filter(function (stream) {
                return stream.id == userId;
            })[0];
            videoView.srcObject = stream;
            videoView.srcObject = videoView.srcObject
        }
    },
    /**
     * 设置VideoView的视频流为指定流
     *
     * @param userId
     */
    setMediaStream: function (userId, stream) {
        var videoView = document.getElementById(userId);
        if (videoView != null) {
            videoView.srcObject = stream;
        }
    },
    /**
     * 当前浏览器
     */
    myBrowser: function () {
        var userAgent = navigator.userAgent; // 取得浏览器的userAgent字符串
        var isOpera = userAgent.indexOf("Opera") > -1;
        if (isOpera) {
            return "Opera"
        }
        ; // 判断是否Opera浏览器
        if (userAgent.indexOf("Firefox") > -1) {
            return "FF";
        } // 判断是否Firefox浏览器
        if (userAgent.indexOf("Chrome") > -1) {
            return "Chrome";
        }
        if (userAgent.indexOf("Safari") > -1) {
            return "Safari";
        } // 判断是否Safari浏览器
        if (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera) {
            return "IE";
        }
        ; // 判断是否IE浏览器
    }
}

/** ----- VoiceRTCAjax ----- */
var VoiceRTCAjax = function (opt) {
    opt.type = opt.type.toUpperCase() || 'POST';
    if (opt.type === 'POST') {
        post(opt);
    } else {
        get(opt);
    }

    // 初始化数据
    function init(opt) {
        var optAdapter = {
            url: '',
            type: 'GET',
            data: {},
            async: true,
            dataType: 'JSON',
            success: function () {
            },
            error: function (s) {
                // alert('status:' + s + 'error!');
            }
        }
        opt.url = opt.url || optAdapter.url;
        opt.type = opt.type.toUpperCase() || optAdapter.method;
        opt.data = params(opt.data) || params(optAdapter.data);
        opt.dataType = opt.dataType.toUpperCase() || optAdapter.dataType;
        // opt.async = opt.async || optAdapter.async;
        opt.success = opt.success || optAdapter.success;
        opt.error = opt.error || optAdapter.error;
        return opt;
    }

    // 创建XMLHttpRequest对象
    function createXHR() {
        if (window.XMLHttpRequest) { // IE7+、Firefox、Opera、Chrome、Safari
            return new XMLHttpRequest();
        } else if (window.ActiveXObject) { // IE6 及以下
            var versions = ['MSXML2.XMLHttp', 'Microsoft.XMLHTTP'];
            for (var i = 0, len = versions.length; i < len; i++) {
                try {
                    return new ActiveXObject(version[i]);
                    break;
                } catch (e) {
                    // 跳过
                }
            }
        } else {
            throw new Error('浏览器不支持XHR对象！');
        }
    }

    function params(data) {
        var arr = [];
        for (var i in data) {
            // 特殊字符传参产生的问题可以使用encodeURIComponent()进行编码处理
            arr.push(encodeURIComponent(i) + '=' + encodeURIComponent(data[i]));
        }
        return arr.join('&');
    }

    function callback(opt, xhr) {
        if (xhr.readyState == 4 && xhr.status == 200) { // 判断http的交互是否成功，200表示成功
            var returnValue;
            switch (opt.dataType) {
                case "XML":
                    returnValue = xhr.responseXML;
                    break;
                case "JSON":
                    var jsonText = xhr.responseText;
                    if (jsonText) {
                        returnValue = eval("(" + jsonText + ")");
                    }
                    break;
                default:
                    returnValue = xhr.responseText;
                    break;
            }
            if (returnValue) {
                opt.success(returnValue);
            }
        } else {
            // alert('获取数据错误！错误代号：' + xhr.status + '，错误信息：' +
            // xhr.statusText);
            opt.error(xhr);
        }

    }

    // post方法
    function post(opt) {
        var xhr = createXHR(); // 创建XHR对象
        var opt = init(opt);
        opt.type = 'post';
        if (opt.async === true) { // true表示异步，false表示同步
            // 使用异步调用的时候，需要触发readystatechange 事件
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) { // 判断对象的状态是否交互完成
                    callback(opt, xhr); // 回调
                }
            };
        }
        // 在使用XHR对象时，必须先调用open()方法，
        // 它接受三个参数：请求类型(get、post)、请求的URL和表示是否异步。
        xhr.open(opt.type, opt.url, opt.async);
        // post方式需要自己设置http的请求头，来模仿表单提交。
        // 放在open方法之后，send方法之前。
        xhr.setRequestHeader('Content-Type',
            'application/x-www-form-urlencoded;charset=utf-8');
        xhr.send(opt.data); // post方式将数据放在send()方法里
        if (opt.async === false) { // 同步
            callback(opt, xhr); // 回调
        }
    }

    // get方法
    function get(opt) {
        var xhr = createXHR(); // 创建XHR对象
        var opt = init(opt);
        opt.type = 'get';
        if (opt.async === true) { // true表示异步，false表示同步
            // 使用异步调用的时候，需要触发readystatechange 事件
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) { // 判断对象的状态是否交互完成
                    callback(opt, xhr); // 回调
                }
            };
        }
        // 若是GET请求，则将数据加到url后面
        opt.url += opt.url.indexOf('?') == -1 ? '?' + opt.data : '&' + opt.data;
        // 在使用XHR对象时，必须先调用open()方法，
        // 它接受三个参数：请求类型(get、post)、请求的URL和表示是否异步。
        xhr.open(opt.type, opt.url, opt.async);
        xhr.send(null); // get方式则填null
        if (opt.async === false) { // 同步
            callback(opt, xhr); // 回调
        }
    }
}

/** ----- VoiceRTCMap ----- */
var VoiceRTCMap = function () {
    this._entrys = new Array();

    this.put = function (key, value) {
        if (key == null || key == undefined) {
            return;
        }
        var index = this._getIndex(key);
        if (index == -1) {
            var entry = new Object();
            entry.key = key;
            entry.value = value;
            this._entrys[this._entrys.length] = entry;
        } else {
            this._entrys[index].value = value;
        }
    };
    this.get = function (key) {
        var index = this._getIndex(key);
        return (index != -1) ? this._entrys[index].value : null;
    };
    this.remove = function (key) {
        var index = this._getIndex(key);
        if (index != -1) {
            this._entrys.splice(index, 1);
        }
    };
    this.clear = function () {
        this._entrys.length = 0;
    };
    this.contains = function (key) {
        var index = this._getIndex(key);
        return (index != -1) ? true : false;
    };
    this.size = function () {
        return this._entrys.length;
    };
    this.getEntrys = function () {
        return this._entrys;
    };
    this._getIndex = function (key) {
        if (key == null || key == undefined) {
            return -1;
        }
        var _length = this._entrys.length;
        for (var i = 0; i < _length; i++) {
            var entry = this._entrys[i];
            if (entry == null || entry == undefined) {
                continue;
            }
            if (entry.key === key) {// equal
                return i;
            }
        }
        return -1;
    };
}

/** ----- VoiceRTCException ----- */
var VoiceRTCException = function (code, message) {
    this.code = code;
    this.message = message;
}

/** ----- VoiceRTCLogger ----- */
var VoiceRTCLogger = {
    /**
     * debug
     *
     */
    debug: function (message, data) {
        console.debug(new Date() + " DEBUG " + message);
        if (data != null && data != undefined) {
            console.debug(data);
        }
    },
    /**
     * info
     *
     */
    info: function (message, data) {
        console.info(new Date() + " INFO " + message);
        if (data != null && data != undefined) {
            console.info(data);
        }
    },
    /**
     * log
     *
     */
    log: function (message, data) {
        console.log(new Date() + " LOG " + message);
        if (data != null && data != undefined) {
            console.log(data);
        }
    },
    /**
     * warn
     *
     */
    warn: function (message, data) {
        console.warn(new Date() + " WARN " + message);
        if (data != null && data != undefined) {
            console.warn(data);
        }
    },
    /**
     * error
     *
     */
    error: function (message, error) {
        console.error(new Date() + " ERROR " + message);
        if (error != null && error != undefined) {
            console.error(error);
        }
    }
}
var VoiceRTCReason = (function () {
    var result = {
        NOCAMERA: {
            code: 10001,
            info: '摄像头资源不存在'
        },
        NOAUDIOINPUT: {
            code: 10002,
            info: '麦克风资源不存'
        }
    };
    var get = function (key) {
        return result[key];
    };

    return {
        get: get
    };
})();
