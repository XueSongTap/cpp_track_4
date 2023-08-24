(function (win, global_config) {
    var util = win.util;
    var localStorage = util.localStorage;
    var convId = localStorage.get("convId");
    var conUserName = localStorage.get("conUserName");
    var resolution = localStorage.get("resolution");
    var isCameraClose = false;
    var userType = 0;       // 强制为普通模式
    var mediaArea =  $(".voice-mediaarea");
    var talkTypeRadio =  $("#voice-talkType");
    var voiceConvId =  $("#voice-convId");
    var userName =  $("#voice-userName");
    

    conUserName = ''
    voiceConvId.val(convId);
    userName.val(conUserName);
    //页面的自适应
    function pageAdaptation() {
        bodyHeight = win.innerHeight;
        $("body").css({"height": bodyHeight})
    }
    pageAdaptation();
    win.onresize = pageAdaptation;

    //分辨率样式
    if (resolution != null && resolution != "") {
        $(".voice-media-resolution input[value='" + resolution + "']").attr("checked", true);
    } else {
        $(".voice-media-resolution input[value='640*480']").attr("checked", true);
    }


    //事件处理
    // 分辨率设置的按钮点击事件
    $(".voice-media-btn").click(function () {
        $(this).css('display', 'none');
        mediaArea.css('display', 'block');
        mediaArea[0].tabIndex = 0;
        mediaArea[0].focus();
        mediaArea[0].style.outline = "none";
    });

    // 分辨率设置的窗口失去焦点事件
    mediaArea.blur(function () {
        $(this).css('display', 'none');
        $(".voice-media-btn").css('display', 'block');
    });
    // 是否关闭摄像头change事件
    // $('input[name=voice-talkType][type=radio]').change(
    // talkTypeRadio.change(function (e) {
    $('input[name=voice-talkType][type=radio]').change(function (e) {
        var type = $(this).attr('data-video-call');
        if (type=='video') {
            isCameraClose = false;
        } else {
            isCameraClose = true;
        }
    });
   
    // 会议ID输入框获得焦点事件
    voiceConvId.focus(function () {
        this.placeholder = '';
        if (this.value == '请在这里输入会议ID') {
            this.value = '';
        }
    });
    // 会议ID输入框失去焦点事件
    voiceConvId.blur(function () {
        if (this.value == '') {
            this.placeholder = '请在这里输入会议ID';
        }
    });

    // 用户名输入框获得焦点事件
    userName.focus(function () {
        this.placeholder = '';
        if (this.value == '请在这里输入用户名') {
            this.value = '';
        }
    });
    // 用户名输入框失去焦点事件
    userName.blur(function () {
        if (this.value == '') {
            this.placeholder = '请在这里输入用户名';
        }
    });

    

    // 页面回车事件——加入会议
    document.onkeydown = function (e) {
        var ev = document.all ? window.event : e;
        if (ev.keyCode == 13) {
            joinConversation(global_config);
        }
    };

    $("#voice-joinChannel").click(function () {
        joinConversation(global_config)
    });

    function joinConversation(global_config) {
        // 会议ID
        var convId = $('#voice-convId').val();
        if (convId == "" || convId == "请输入会议ID") {
            util.swal("请输入会议ID");
            return;
        }

        var userName = $('#voice-userName').val();
        // if (userName == "" || convId == "请输入用户名") {
        //     util.swal("请输入用户名");
        //     return;
        // }
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

        // 正常身份
        // var userType = 0;
        // 分辨率
        var resolution = $("input[name='media_radio']:checked").val();
        // var userId = util.guid();
        // var userId = randomString(10);
        var appId = global_config.appId;
        // var tpl = 'convId={convId}&userName={userName}&isCameraClose={isCameraClose}&resolution={resolution}&userId={userId}&appId={appId}&userType={userType}';
        // var tpl = 'convId={convId}&isCameraClose={isCameraClose}&resolution={resolution}&userId={userId}&appId={appId}&userType={userType}';
        var tpl = 'convId={convId}&userName={userName}&isCameraClose={isCameraClose}&resolution={resolution}&appId={appId}';
        var queryString = util.formatTpl(tpl, {
            convId: convId,
            userName:userName,
            isCameraClose: isCameraClose,
            resolution: resolution,
            // userId: userId,
            appId: appId
            // userType: userType
        });
        win.location.href = 'room.html?' + queryString;
    }
})(window, global_config);
