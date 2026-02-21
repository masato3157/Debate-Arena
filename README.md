# AI Debate Arena

複数のAI（ChatGPT, Claude, Gemini）を一つの舞台（アリーナ）で戦わせるためのChrome拡張機能。

## 概要
ユーザーは「討論アリーナ（専用タブ）」を通じて、2つのAIを選択して自由なテーマで討論させることができます。司会者（拡張機能）が各AIの回答を自動的にリレーし、まるで人間同士が議論しているかのような体験を提供します。

## 主な機能
- **2者対決モード**: ChatGPT, Claude, Geminiから2人を選択して対戦。
- **自動リレー**: 片方のAIの回答をもう片方へ自動で送信。
- **コンテキスト意識**: AIが「誰が何を言ったか」を理解できるよう、自動的にプロンプトを整形。
- **アリーナUI**: 発言者ごとの色分けと履歴管理。

## 始め方
1. `chrome://extensions` を開く。
2. デベロッパーモードをONにする。
3. 「パッケージ化されていない拡張機能を読み込む」で、本フォルダ（`Debate-Arena`）を選択。
4. 裏で対戦させたいAIのタブを開き、ログインしておく。
5. 拡張機能アイコンから「Debate Arena」を起動！

## 開発・ドキュメント
詳細な実装内容やタスク状況については、以下のファイルを参照してください。
- [Tasks (task.md)](./task.md)
- [Walkthrough (walkthrough.md)](./walkthrough.md)

---
Developed by Antigravity (Advanced Agentic AI)
