# his.M5atom.NGINX abstruct
1. using M5Atom push bottun to http POST
1. receive POST with Raspberry Pi NGINX server
1. NGINX njs setting to save M5Atom POST message body

# 概要
1. M5Atomのpushボタンから、http POSTを実行する。
1. ラズパイ上のNGIXサーバでPOSTを受け取る。
1. NGINX組み込みのJavascriptエンジンであるnjsでPOSTメッセージをファイルに書き込む。

# 1.環境
## 1.1 エッジ側
* M5Atom
* Arduino IDE

## 1.2 サーバ側
* Raspberry Pi 4B
* ubuntu 20.4 LTS
* NGINX

# 2.エッジ側スクリプト
## 2.1 <a href="./M5Atom/his.LedMenu2POST.atom.ino">his.LedMenu2POST.atom.ino</a>
* M5Atomで動作させるArduino IDEのソースコード
* ボタンを押すたびにLEDの色が変わる
* ボタンを長押しすると、Wifi経由であらかじめ指定したURLにhttp POSTする
* 参考にしたのはこちらですm(_|_)m
https://qiita.com/fumi38g/items/60c3f371adff025d6eae

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
* modules/ngx_http_js_module.soは、/etc/nginx/modules/ngx_http_js_module.soである
　**つまり、`/etc/nginx/`からの相対アドレス**で記載する
* `js/his.js`は/etc/nginx/js/his.jsである
  **これも、`/etc/nginx/`からの相対アドレス**で記載する

>なお、現仕様では`js_import`の代わりに`js_include`という記法も使えたようだが、
>今後は廃止となり`js_import`が推奨されている。
>https://nginx.org/en/docs/http/ngx_http_js_module.html#js_include
>
>また、2020/8/29時点では`js_include`は単独では使用可能だったが、
>同時に同一nginx.conf内で`js_import`は使えず、エラーとなった。
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
* 上記は、http://Server/GETURI にアクセスした場合に、`js_import`したhisというクラスの
`getUri`関数[function]を呼び出すと設定している

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
* `r`はnjs組み込みオブジェクトでHTTPのRequest内容が格納されている
　その他は https://nginx.org/en/docs/njs/reference.html#http 参照
* スクリプトの最終行の下記記述で各関数をexportし、NGINXから呼び出せるようにしている
```
export default {getUri, postStab, getArgs, getArgs2Fs, postBody2Fs, readFs};
```
# 4.参考文献
## 4.1 エッジ側
* M5Atom Liteがやってきた：led_menu https://qiita.com/fumi38g/items/60c3f371adff025d6eae
* M5Stick-CでJsonをPOSTする　https://qiita.com/poruruba/items/4bf6a52520e431a8f4a5

## 4.2 サーバ側
* njsリファンレンス https://nginx.org/en/docs/njs/reference.html
* http API https://nginx.org/en/docs/http/ngx_http_js_module.html
* ファイルシステムAPI https://nginx.org/en/docs/njs/reference.html#njs_api_fs

# 5. 実行例
*
# 6.お試しサイト
*

# 7.今後の予定
* 
