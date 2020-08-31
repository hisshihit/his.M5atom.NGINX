# his.M5atom.NGINX abstruct
1. using M5Atom push bottun to http GET/POST
1. receive GET/POST with Raspberry Pi NGINX server
1. NGINX njs setting to save M5Atom POST message body
1. Also NGINX njs can save M5Atom GET?a=1&b=hoge extension

# 概要
1. M5Atomのpushボタンから、http GET/POSTを実行する
1. ラズパイ上のNGIXサーバでGET/POSTを受け取る
1. NGINX組み込みのJavascriptエンジンであるnjsでPOSTメッセージをファイルに書き込む
1. 同じくM5AtomからのGET時のURI引数をファイルに書き込む

# 1.環境
## 1.1 エッジ側
* M5Atom
* Arduino IDE

## 1.2 サーバ側
* Raspberry Pi 4B
* ubuntu 20.4 LTS
* NGINX

# 2.エッジ側スクリプト
## 2.1 <a href="./M5Atom/his.LedMenu.POST2FS.atom.ino">his.LedMenu.POST2FS.atom.ino</a>
* M5Atomで動作させるArduino IDEのソースコード
* ボタンを押すたびにLEDの色が変わる
* ボタンを長押しすると、Wifi経由であらかじめ指定したURLにhttp POSTする

## 2.2 <a href="./M5Atom/his.LedMenu.GET2FS.atom.ino">his.LedMenu.GET2FS.atom.ino</a>
* M5Atomで動作させるArduino IDEのソースコード
* ボタンを押すたびにLEDの色が変わる
* ボタンを長押しすると、Wifi経由であらかじめ指定したURLにhttp GETする

# 3.サーバ側の設定
## 3.1 <a href="./Server.root/etc/nginx/nginx.conf">nginx.conf</a>
* ENGINX動作設定ファイル
* ubuntu上でのファイルの場所は`/etc/nginx/nginx.conf`
* ENGINXの組み込みJavaScriptエンジンである**njs**を動作させるための設定は下記の部分
```
load_module modules/ngx_http_js_module.so;
http {
### nginx njs Settings
  js_import his from js/his.js;
}
```
* modules/ngx_http_js_module.soは、/etc/nginx/modules/ngx_http_js_module.soである<br>
　**つまり、`/etc/nginx/`からの相対アドレス**で記載する
* `js/his.js`は/etc/nginx/js/his.jsである<br>
  **これも、`/etc/nginx/`からの相対アドレス**で記載する

>なお、現仕様では`js_import`の代わりに`js_include`という記法も使えたようだが、
>今後は廃止となり`js_import`を使うことが推奨されている<br>
>https://nginx.org/en/docs/http/ngx_http_js_module.html#js_include 参照
>
>また、2020/8/29時点では`js_include`は単独では使用可能だったが、
>同時に同一nginx.conf内で`js_import`は使えず、エラーとなった<br>
>上記エラーの原因がなかなか掴めず悩んだが、syslogを見たら、ズバリ書いてあった(^^;

## 3.2 <a href="./Server.root/etc/nginx/sites-available/default">default</a>
* 各仮想サーバの設定ファイル `default`は個別仮想サーバの設定に合致しない場合の設定を記載する
* ubuntu上でのファイルの場所は`/etc/nginx/site-available/default`
* `/etc/nginx/site-available/`内の設定ファイルは`/etc/nginx/site-enabled/`にシンボリックリンクを張ることで動作する
* 特定のURLにアクセスした場合に呼び出すnjsのスクリプトの設定は下記の部分
```
    location /GETURI {
        js_content his.getUri;
    }
```
* 上記は、http://Server/GETURI にアクセスした場合に、`js_import`したhisというクラスの`getUri`関数[function]を呼び出すと設定している

## 3.3 <a href="./Server.root/etc/nginx/js/his.js">his.js</a>
* njsのスクリプト本体
* ubuntu上でのファイルの場所は`/etc/nginx/js/his.js`
* 上記は<a href="./Server.root/etc/nginx/nginx.conf">nginx.conf</a>で設定している
* `getUri`関数の部分は下記
```
function getUri(r) {
    r.headersOut['Content-Type'] = "text/plain";
    r.return(200, r.uri);
}
```
* `r`はnjs組み込みオブジェクトでHTTPのRequest内容が格納されている<br>
　その他は https://nginx.org/en/docs/njs/reference.html#http 参照
* スクリプトの最終行の下記記述で各関数をexportし、NGINXから呼び出せるようにしている
```
export default {getUri, postStab, getArgs, getArgs2Fs, postBody2Fs, readFs};
```

# 4. 実行例
## 4.1 `getUri(r)`
* http://Server/GETURI へhttp GETする
* アクセスしたURIを表示して正常終了

## 4.2 `postStab(r)`
* http://Server/POSTSTAB へhttp POSTする
* 何もせず正常終了（アクセスログには残る）

## 4.3 `getArgs(r)`
* http://Server/GET へhttp GETする
* 上記URLにアクセスする際のURL引数(?)を表示して正常終了

## 4.4 `getArgs2Fs(r)`
* http://Server/GET2FS へhttp GETする
* 上記URLにアクセスする際のURL引数(?)を`/tmp/njs_storage`ファイルに追記する<br>
  **尚、/tmpはファイルシステムの絶対パスである**
* 追記した内容を表示して正常終了
* http GETでサーバ側にデータ送信が可能となる

* /tmp/njs_storage
```
{ "Method" : "GET" , "RemoteAddress" : "192.168.0.117" , "URI" : "/GET2FS" , "UserAgent" : "ESP32HTTPClient" , "menu" : 4 , "Color" : "Blue"}
{ "Method" : "GET" , "RemoteAddress" : "192.168.0.117" , "URI" : "/GET2FS" , "UserAgent" : "ESP32HTTPClient" , "menu" : 5 , "Color" : "Yellow"}
{ "Method" : "GET" , "RemoteAddress" : "192.168.0.117" , "URI" : "/GET2FS" , "UserAgent" : "ESP32HTTPClient" , "menu" : 2 , "Color" : "Red"}
```

* /var/log/nginx/access.log
```
192.168.0.117 - - [31/Aug/2020:16:36:52 +0900] "GET /GET2FS?menu=4&Color=\x22Blue\x22 HTTP/1.1" 200 142 "-" "ESP32HTTPClient"
192.168.0.117 - - [31/Aug/2020:16:36:56 +0900] "GET /GET2FS?menu=5&Color=\x22Yellow\x22 HTTP/1.1" 200 144 "-" "ESP32HTTPClient"
192.168.0.117 - - [31/Aug/2020:16:41:34 +0900] "GET /GET2FS?menu=2&Color=\x22Red\x22 HTTP/1.1" 200 141 "-" "ESP32HTTPClient"
```

## 4.5 `postBody2Fs(r)`
* http://Server/POST2FS へhttp POSTする
* 上記URLにアクセスするmessge Bodyを`/tmp/njs_storage`ファイルに追記する<br>
  **尚、/tmpはファイルシステムの絶対パスである**
* 追記した内容を表示して正常終了

* /tmp/njs_storage
```
SELECTED:menu =1
SELECTED:menu =2
SELECTED:menu =4
SELECTED:menu =5
SELECTED:menu =6
SELECTED:menu =6
```

* /var/log/nginx/access.log
```
192.168.0.117 - - [31/Aug/2020:16:18:14 +0900] "POST /POST2FS?Red HTTP/1.1" 200 0 "-" "ESP32HTTPClient"
192.168.0.117 - - [31/Aug/2020:16:18:18 +0900] "POST /POST2FS?Green HTTP/1.1" 200 0 "-" "ESP32HTTPClient"
192.168.0.117 - - [31/Aug/2020:16:18:25 +0900] "POST /POST2FS?Yellow HTTP/1.1" 200 0 "-" "ESP32HTTPClient"
192.168.0.117 - - [31/Aug/2020:16:19:40 +0900] "POST /POST2FS?BlueGreen HTTP/1.1" 200 0 "-" "ESP32HTTPClient"
192.168.0.117 - - [31/Aug/2020:16:19:52 +0900] "POST /POST2FS?Pink HTTP/1.1" 200 0 "-" "ESP32HTTPClient"
192.168.0.117 - - [31/Aug/2020:16:19:55 +0900] "POST /POST2FS?Pink HTTP/1.1" 200 0 "-" "ESP32HTTPClient"
```

## 4.6 `readFs(r)`
* http://Server/READ へhttp GETする
* `/tmp/njs_storage`ファイルの内容を表示して正常終了<br>
  **尚、/tmpはファイルシステムの絶対パスである**

# 5.参考文献
## 5.1 エッジ側
* M5Atom Liteがやってきた：led_menu https://qiita.com/fumi38g/items/60c3f371adff025d6eae
* M5Stick-CでJsonをPOSTする　https://qiita.com/poruruba/items/4bf6a52520e431a8f4a5

## 5.2 サーバ側
* njs-examples https://github.com/xeioex/njs-examples
* njsリファンレンス https://nginx.org/en/docs/njs/reference.html
* http API https://nginx.org/en/docs/http/ngx_http_js_module.html
* ファイルシステムAPI https://nginx.org/en/docs/njs/reference.html#njs_api_fs

# 6.お試しサイト
* 未定

# 7.今後の予定
* 
