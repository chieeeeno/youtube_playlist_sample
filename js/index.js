var YT_API_JSON_INFO_URL = 'js/youtube_api_info.json';
var REQ_QTY = 3;  //リクエストするデータの件数

var totalResults = 0;   //再生リスト内の動画件数
var totalPage = 1;  //最大ページ
var currentPage = 0;  //現在のページ

var scrollHeight;
var scrollPosition;
var loadingFlg = false;

var videoIdList = []; //youtube動画のIDリスト

// プレーヤーのサイズを指定
var ytWidth = 640;
var ytHeight = 390;

var ytPlayer = [];
var ytPlaying;
var ytPlay;
var ytStop;

// YouTube iframeAPIを読み込む
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


/*===================================
 メイン処理
===================================*/
$(function(){
  $(window).bind('scroll', function(e) {
    if(currentPage == totalPage){
      $(window).unbind('scroll');
      return;
    }
    scrollHeight = $(document).height();
    scrollPosition = $(window).height() + $(window).scrollTop();
    if ((scrollHeight - scrollPosition) / scrollHeight <= 0.05){
      //スクロールの位置が下部5%の範囲に来た場合
      if(!loadingFlg){
        YTApiRequest();
      }
    }
  });
});


/*===================================
 関数定義
===================================*/
/**
 * 再生リストの情報からDOMにコンテンツを追加する
 * @param {Object} 再生リストのjsonデータ
 */
function addContent(_jsonData){
  pageToken = _jsonData.nextPageToken != undefined ? _jsonData.nextPageToken : '';
  totalResults = _jsonData.pageInfo.totalResults;
  totalPage = Math.ceil(totalResults / REQ_QTY);

  insertVideo(_jsonData);
}


/**
 * 動画のタグをDOMに追加する
 * @param {Object} _jsonData youtubeの再生リストのjsonデータ
 */
function insertVideo(_jsonData){
  var insHtmlTag = '';
  
  for(var i = 0; i < _jsonData.items.length; i++){
    var videoId = _jsonData.items[i].snippet.resourceId.videoId;
    var videoCount = videoIdList.length;
    insHtmlTag = 
      '<article>' +
      '<div class="videoPlayer">' +
      '<div id="' + videoId + '"></div>' +
      '</div>' +
      '<dl>' +
      '<dt class="videoTitle">' +_jsonData.items[i].snippet.title + '</dt>' +
      '<dd class="videoDesc">' + _jsonData.items[i].snippet.description + '</dd>' +
      '</dl>' +
      '</article>';
    $('#videoContainer').append(insHtmlTag);

    ytPlayer[videoCount] = new YT.Player(videoId, {
      height: ytHeight,
      width: ytWidth,
      videoId: videoId,
      events: {
        'onReady' : onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });

    videoIdList.push(videoIdList)
  }
  currentPage++;
}


/**
 * jsonのデータを取得する
 * @param {String} JSONデータのURL
 * @return {$.Defferd}
 */
function getJsonData(_url){
  console.log('getJsonData()開始：'+_url);
  var $dfd = $.Deferred();
  $.ajax({
    url:_url,
    dataType:'json',
    cache:false,
    timeout:15000
  })
    .done(function(_data){
    console.log('json取得成功：'+_url);
    $dfd.resolve(_data);
  })
    .fail(function(_data){
    console.log('json取得error：'+_url);
    $dfd.reject(_data);
  })
    .always(function(_data){
    console.log('getJsonData()終了：'+_url);
  });
  return $dfd.promise();
}


/*===================================
 YouTube Data API setting
===================================*/
var pageToken;
var apiOptions = {
  part:'snippet',
  playlistId:'',
  maxResults:REQ_QTY,
  pageToken:''
};

var requestParam = {
  mine:false,
  path:'/youtube/v3/playlistItems',
  params:apiOptions
}

/**
 * google clientライブラリが読み込まれた直後に呼ばれる関数
 * APIキー等の情報を取得し、YouTube Data APIに再生リスト取得のリクエストを送る
 */
function googleApiClientReady(){
  console.log('googleApiClientReady');
  getJsonData(YT_API_JSON_INFO_URL)
    .then(function(_jsonData){
    apiOptions.playlistId = _jsonData.listId;

    gapi.client.setApiKey(_jsonData.apiKey);
    gapi.client.load('youtube', 'v3', YTApiRequest);
  });
}

/**
 * YouTube Data APIを使って再生リストを取得する
 */
function YTApiRequest(){
  loadingFlg = true;
  if(pageToken){
    apiOptions.pageToken = pageToken;
  }

  var request=gapi.client.request(requestParam);

  request.execute(function(resp) {
    if(resp.error){ //エラーの時
      console.log('error!!!');
    }else{  //リクエスト成功の時
      addContent(resp);
      loadingFlg = false;
    }
  });
}


/*===================================
  YouTube iframe API setting
 ===================================*/
/**
 * YouTube iframe API読み込み直後に呼ばれる関数
 */
function onYouTubeIframeAPIReady() {
}

/**
 * YouTubeプレーヤーが再生可能になった時に呼ばれる関数
 */
function onPlayerReady(event){
}

/**
 * プレーヤーの状態に変化があった時に実行
 */
function onPlayerStateChange(event) {
  // 各プレーヤーの状態を確認
  for(var i = 0; i < videoIdList.length; i++) {
    var thisState = ytPlayer[i].getPlayerState();
    if( thisState == 1 && ytPlaying == undefined) {
      ytPlaying = i;
    } else if(thisState == 1 && ytPlaying != i) {
      ytStop = ytPlaying;
      ytPlay = i;
    } else {
    }
  }
  // 同時再生があった場合、元々再生していた方を停止する
  if(ytStop != undefined) {
    ytPlayer[ytStop].pauseVideo();
    ytStop = undefined;
  }
  // 現在再生中のプレーヤー番号を保存しておく
  if(ytPlay != undefined) {
    ytPlaying = ytPlay;
    ytPlay = undefined;
  }
}