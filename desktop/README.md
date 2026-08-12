# 漫画ネームエディタ デスクトップ版 (MNE.exe)

Web版と同じ `index.html` を WebView2 (Chromium) で表示するスタンドアロンアプリ。

- 単一ファイル: `MNE.exe` をコピーするだけで動作（Webアセットはexeに埋め込み）
- プロセス名は `MNE.exe`、ウィンドウタイトルは `漫画ネームエディタ：<ファイル名>`
  （ポモドーロタイマー等のアプリ計測ソフトから個別アプリとして捕捉できる）
- `https://mne.local/MNE/index.html` として読み込むためセキュアオリジン扱いになり、
  localStorage と 保存/開く（File System Access API）がWeb版と同じ動作
- ServiceWorker は無効化（同梱ファイルを直接読むため不要、古いキャッシュ防止）
- localStorage 等のユーザーデータは exe と同じ場所の `userdata/` に保存（ポータブル）

## 必要なもの

- .NET SDK 10
- Microsoft Edge WebView2 Runtime（Windows 11 には標準搭載）

## ビルド

```
cd desktop/MNE.App
dotnet publish -c Release -o ../dist
```

`desktop/dist/MNE.exe`（約49MB、self-contained）が生成される。
同時に出力される `.xml` / `.pdb` は不要。

Web版の `index.html` を更新したら再ビルドすると内容が反映される。
