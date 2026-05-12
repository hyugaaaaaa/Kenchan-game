# けんちゃんゲーム（Cloudflare Workers版）

ブラウザで遊べる「ハズレを引くと怒る顔が出る」ミニゲームです。  
Cloudflare Workers + Static Assets で公開しています。

## システム概要

- フロントエンド
  - `index.html`: 画面構造
  - `styles.css`: 見た目・アニメーション
  - `script.js`: モード切替・ゲーム初期化
  - `game.js`: ゲームロジック本体
- 配信/認証
  - `worker.js`: ログイン画面、セッションCookie、静的ファイル配信
  - `wrangler.jsonc`: Workers設定（`ASSETS` バインディング）
  - `.assetsignore`: 配信対象から除外するファイル指定

## 現在のゲーム仕様

- モード切替: `3x3` / `4x4` / `5x5`
- 各モードで「1マスだけハズレ」
- ハズレ以外を押すとその顔は消える
- ハズレを押すとオーバーレイ表示 + セリフ表示
- 通常顔は `normal.png` と `normal2.png` をランダム表示
- `kiss.png` が確率でハズレ画像になる（現在 `20%`）
  - `kiss.png` のときは専用セリフ2種をランダム表示

## 画像ファイル

`img/` に以下を配置してください。

- `normal.png`
- `normal2.png`
- `angry.png`
- `kiss.png`

## ローカル実行

### 1. 依存インストール

```bash
npm install
```

### 2. ローカルサーバー起動

```bash
npm run dev
```

`http://localhost:8000` で確認できます。

### 3. テスト実行

```bash
npm test
```

## 本番再デプロイ手順

### 1. 変更をコミットしてPush

```bash
git add .
git commit -m "update game"
git push origin main
```

### 2. デプロイ実行

```bash
npm run deploy
```

成功すると `https://kenchangame.hyuga0510.workers.dev` に反映されます。

## 認証（ログイン画面）

- 未ログインで本番URLへアクセスすると `/login` にリダイレクト
- パスワード一致時にセッションCookieを発行してゲーム画面へ遷移
- パスワードは `worker.js` のデフォルト値または Secret で管理

Secret を使う場合:

```bash
npx wrangler secret put BASIC_AUTH_PASSWORD
```

## よくあるトラブル

### 1. `Asset too large` エラー

原因: `node_modules` が配信対象に含まれている。  
対策: `.assetsignore` で `node_modules/**` を除外（設定済み）。

### 2. `Error 1101 Worker threw exception`

原因: Worker 実行時例外。  
対策:

1. `npm run deploy` で最新を再反映
2. Cloudflare Workers Logs を確認
3. `worker.js` の直近変更を見直し

### 3. 変更が本番に出ない

1. `git push origin main` 済みか確認
2. `npm run deploy` を再実行
3. ブラウザのキャッシュを削除して再読み込み

