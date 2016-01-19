;(function(){
  
  var YT_API_JSON_INFO_URL = 'js/youtube_api_info.json';
  var REQ_QTY = 3;  //リクエストするデータの件数

  var ytApiKey;   //APIキー
  var ytApiUrl;   //リクエストURL
  var ytPlaylistId;   //再生リストのURL

  var nextPageToken = '';   //次のページをリクエストする時に渡すパラメータ
  var totalResults = 0;   //再生リスト内の動画件数
  var totalPage = 1;  //最大ページ
  var currentPage = 0;  //現在のページ

  var scrollHeight;
  var scrollPosition;
  var loadingFlg = false;



  /*===================================
   メイン処理
 ===================================*/
  $(function(){
    getJsonData(YT_API_JSON_INFO_URL)
      .then(function(_jsonData){
      ytApiKey = _jsonData.apiKey;
      ytApiUrl = _jsonData.reqUrl;
      ytPlaylistId = _jsonData.listId;

      addContent();
    });

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
          addContent();
        }
      }
    });

  });


  /*===================================
   関数定義
   ===================================*/
  /**
   * 再生リストを取得して、コンテンツを追加する
   */
  function addContent(){
    loadingFlg = true;
    getPlayList()
      .then(function(_resData){
      nextPageToken = _resData.nextPageToken != undefined ? _resData.nextPageToken : '';
      totalResults = _resData.pageInfo.totalResults;
      totalPage = Math.ceil(totalResults / REQ_QTY);
      
      insertVideo(_resData);
      loadingFlg = false;
    });
  }


  /**
   * 動画のタグをDOMに追加する
   * @param {Object} _jsonData youtubeの再生リストのjsonデータ
   */
  function insertVideo(_jsonData){
    var insHtmlTag = '';
    for(var i = 0; i < _jsonData.items.length; i++){
      var videoId = _jsonData.items[i].snippet.resourceId.videoId;
      insHtmlTag = insHtmlTag +
        '<article id="' + videoId + '">' +
        '<div class="videoPlayer">' +
        '<iframe src="//www.youtube.com/embed/'+ _jsonData.items[i].snippet.resourceId.videoId +'?controls=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>'+
        '</div>' +
        '<dl>' +
        '<dt class="videoTitle">' +_jsonData.items[i].snippet.title + '</dt>' +
        '<dd class="videoDesc">' + _jsonData.items[i].snippet.description + '</dd>' +
        '</dl>' +
        '</article>';
    }

    $('#videoContainer').append(insHtmlTag);
    currentPage++;
  }




  /**
   * youtubeの再生リストを取得する
   * @return {$.Defferd}
   */
  function getPlayList(){
    //console.log('getPlayList()開始：'+ytApiUrl);
    var $dfd = $.Deferred();

    $.ajax({
      type: 'get',
      url: ytApiUrl,
      dataType:'json',
      data: {
        part: 'snippet',
        playlistId : ytPlaylistId,
        maxResults : REQ_QTY,
        pageToken : nextPageToken,
        key: ytApiKey
      },
      dataType: 'json',
      cache: false,
      timeout: 15000
    })
      .done(function(_data) {
      //console.log('再生リスト取得成功：' + ytApiUrl);
      $dfd.resolve(_data);
    })
      .fail(function(_data) {
      console.log('再生リスト取得error：' + ytApiUrl);
      $dfd.reject(_data);
    })
      .always(function(_data) {
      //console.log('getPlayList()終了：' + ytApiUrl);
    });

    return $dfd.promise();
  }


  /**
   * jsonのデータを取得する
   * @param {String} JSONデータのURL
   * @return {$.Defferd}
   */
  function getJsonData(_url){
    //console.log('getJsonData()開始：'+_url);
    var $dfd = $.Deferred();
    $.ajax({
      url:_url,
      dataType:'json',
      cache:false,
      timeout:15000
    })
      .done(function(_data){
      //console.log('json取得成功：'+_url);
      $dfd.resolve(_data);
    })
      .fail(function(_data){
      console.log('json取得error：'+_url);
      $dfd.reject(_data);
    })
      .always(function(_data){
      //console.log('getJsonData()終了：'+_url);
    });
    return $dfd.promise();
  }

})();


