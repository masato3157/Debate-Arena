# AI Debate Chrome Extension Walkthrough

Chromeブラウザ上で複数のAIチャットボット（ChatGPT, Claude, Gemini）を連携させ、ユーザーが指定したテーマについて自動討論させる拡張機能の実装が完了しました。

## 実装された機能 (Features)

### 1. 討論アリーナ (Debate Arena)
- 拡張機能専用のタブ（Tab C）として提供。
- ユーザーはこの画面で討論の進行を見守り、必要に応じて介入（プロンプト送信）が可能。
- 発言者ごとに色分けされたチャットUI（ChatGPT: 緑, Claude: オレンジ, Gemini: 青, Human: 青）。

### 2. マルチAI対応 & 選択機能
- **ChatGPT, Claude, Gemini** の3つの主要AIに対応。
- アリーナ画面のドロップダウンメニューから、対戦させる2つのAIを自由に選択可能（例: ChatGPT vs Gemini）。

### 3. バックグラウンドオーケストレーション
- `background.js` が司会者（Message Broker）として機能。
- ユーザーの介入なしに、片方のAIの回答をもう片方のAIに入力・送信するリレー機能を搭載。
- プロンプトに「【ChatGPTからの発言】」といった文脈を自動付与し、AIに状況を理解させる。

## インストール方法 (Installation)

1. リポジトリをクローンまたはダウンロード: [GitHub Link](https://github.com/masato3157/Debate-Arena)
2. Chromeブラウザで `chrome://extensions` を開く。
3. 右上の「デベロッパーモード」をONにする。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`Debate-Arena` フォルダを選択。

## 使い方 (Usage)

1. **準備**: 対戦させたいAIのタブ（例: chatgpt.com と claude.ai）を裏で開いてログインしておく。
2. **起動**: 拡張機能アイコンをクリックして「Debate Arena」を開く。
3. **設定**: 画面上部のメニューで「Player 1」「Player 2」を選択し、「New Debate」をクリック。
4. **開始**: 画面下部の入力欄にテーマを入力して送信。

## ファイル構成 (File Structure)

```text
Debate-Arena/
├── manifest.json           # 設定ファイル（権限、スクリプト登録）
├── background.js           # バックグラウンド処理（メッセージ中継）
├── arena/                  # 討論アリーナ画面
│   ├── index.html
│   ├── style.css           # (Inlined in HTML for prototype)
│   └── script.js           # UIロジック
└── content_scripts/        # 各AI操作用アダプター
    ├── chatgpt.js
    ├── claude.js
    └── gemini.js
```
