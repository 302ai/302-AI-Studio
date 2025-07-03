<h1 align="center">
<img src='./docs/imgs/icon.svg' width='30'>
<span>
    302 AI Studio
</span>
</h1>
 
<p align="center">
<em>302 AI Studio は、Windows、Mac、Linux に対応した、複数の大規模言語モデル（LLM）サービスプロバイダーをサポートするデスクトップクライアントです。</em>
</p>

<p align="center"><a href="https://302.ai/ja/" target="blank"><img src="https://file.302.ai/gpt/imgs/github/20250102/72a57c4263944b73bf521830878ae39a.png" /></a></p >

<p align="center"><a href="README_zh.md">中文</a> | <a href="README.md">English</a> | <a href="README_ja.md">日本語</a></p>


## 🌟 主な特徴

### ドキュメントとデータ処理
- 🖼️ 画像をアップロードしてAIに内容を分析・説明させる
- 📄 PDF、CSV、PNG、PY、JSONなど多様なフォーマットに対応
- 💻 コードのシンタックスハイライト
- 📊 Mermaidチャートの可視化


### 優れたユーザー体験
- 🖥️ Windows、Mac、Linuxのマルチプラットフォーム対応
- 🌙 ライト/ダークテーマで様々な環境や好みに対応
- 📝 完全なMarkdownレンダリング
- 📱 あらゆる画面サイズに完璧に適応、自由なウィンドウ調整

### 効率的なワークフロー
- 🗂️ 複数のプロジェクト会話を同時に進行、整理された思考の流れ

### 多言語対応
- **中文**
- **English** 
- **日本語**


## 🛠️ 技術アーキテクチャ

<div align="center">
  <img src="./docs/imgs/architecture.png" alt="技術アーキテクチャ図" />
</div>

### 🏗️ コア技術スタック


| レイヤー | 技術選定 | 説明 |
|------|----------|------|
| **UIレイヤー** | React 19 + TypeScript | モダンなコンポーネント開発、型安全性 |
| **スタイルレイヤー** | Tailwind CSS + Framer Motion | アトミックCSS + スムーズなアニメーション |
| **デスクトップ** | Electron 35 | クロスプラットフォームデスクトップアプリケーションフレームワーク |
| **状態管理** | Zustand + React Query | 軽量な状態管理 + データキャッシング |
| **データレイヤー** | SQLite + Triplit | ローカルデータベース + リアルタイム同期 |
| **AI統合** | AI SDK | 統一AIプロバイダーインターフェース |
| **ビルドツール** | Vite + Electron Vite | 高速ビルド + ホットリロード |


## 🚀 クイックスタート

### 📋 システム要件

- **OS**: Windows 10+ / macOS 10.14+ / Linux (Ubuntu 18.04+)
- **メモリ**: 4GB RAM (8GB+ 推奨)
- **ストレージ**: 500MB の空き容量
- **ネットワーク**: 安定したインターネット接続

### ⚡ クイックスタート

```bash
# 1️⃣ プロジェクトのクローン
git clone https://github.com/302ai/302-AI-Studio.git
cd 302-AI-Studio

# 2️⃣ インストール依存
yarn install

# 3️⃣ 事前構築
yarn prebuild

# 4️⃣ Electron依存のインストール
yarn install:deps

# 5️⃣ 開発サーバーの起動 🎉
yarn dev
```

## 📦 構築と導入

### 🔧 開発構築

```bash
# タイプチェック
yarn typecheck

# コード仕様チェック
yarn lint

# コード問題の修正
yarn lint:fix
```

### 🚀 生産構築

```bash
# 一般的な構築
yarn build

# プラットフォーム固有の構築
yarn build:win     # Windows
yarn build:mac     # macOS  
yarn build:linux   # Linux
```

### 📱 クロスプラットフォームサポート

| プラットフォーム | アーキテクチャ | ステータス |
|------|------|------|
| Windows | x64 / ARM64 | ✅ 完全サポート |
| macOS | x64 / Apple Silicon | ✅ 完全サポート |
| Linux | x64 / ARM64 | ✅ 完全サポート |


## 🛠️ 開発ガイド

### 📁 プロジェクト構造

```
📦 302-AI-Studio
├── 📂 src/                          # ソースディレクトリ
│   ├── 📂 components/               # Reactコンポーネント
│   ├── 📂 pages/                    # ページコンポーネント
│   ├── 📂 hooks/                    # カスタムHooks
│   ├── 📂 utils/                    # ツール関数
│   ├── 📂 stores/                   # ステータス管理
│   ├── 📂 types/                    # TypeScriptタイプ定義
│   └── 📂 assets/                   # 静的リソース
├── 📂 scripts/                      # 構築スクリプト
├── 📂 .github/                      # GitHub Actions
├── 📄 electron-builder.ts           # Electron 構成の構築
├── 📄 electron.vite.config.ts       # Vite構成
└── 📄 package.json                  # プロジェクト構成
```

## 🤝 貢献ガイドライン

あらゆる形での貢献を歓迎します！バグの報告、新機能の提案、コードの改善など、どんな貢献でも大歓迎です。

### 💡 貢献方法

1. **コード貢献** ：PRを提出してコードを改善する
2. **バグ修正** ：発見した問題の修正を提出する
3. **機能提案** ：良いアイデアがあれば、ぜひご提案ください
4. **ドキュメント作成** ：ドキュメントや使用ガイドの充実にご協力ください
5. **アプリのプロモーション** ：302 AI Studioの宣伝

### 📋 コントリビューションステップ

```bash
# 1. Fork 项目
# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m 'feat: add amazing feature'

# 4. 推送到分支
git push origin feature/amazing-feature

# 5. 创建 Pull Request
```

## 💬 お問い合わせ

<div align="center">

[![公式サイト](https://img.shields.io/badge/官网-302.ai-blue.svg)](https://302.ai)
[![GitHub](https://img.shields.io/badge/GitHub-302--AI--Studio-black.svg)](https://github.com/302ai/302-AI-Studio)
[![メール](https://img.shields.io/badge/邮件-support@302.ai-red.svg)](mailto:support@302.ai)

**問題が発生しましたか？** [GitHub Issues](https://github.com/302ai/Chat-Chat-App/issues) でご報告ください。

**機能提案がありますか？** [GitHub Discussions](https://github.com/302ai/Chat-Chat-App/discussions) でお待ちしています。

</div>


## 📄 ライセンス

本プロジェクトは [AGPL-3.0](LICENSE) のもとでオープンソース化されており、自由に使用・改変・配布できます。


## ✨ 302.AIについて ✨
[302.AI](https://302.ai/ja/)は企業向けのAIアプリケーションプラットフォームであり、必要に応じて支払い、すぐに使用できるオープンソースのエコシステムです。✨
1. 🧠 包括的なAI機能：主要AIブランドの最新の言語、画像、音声、ビデオモデルを統合。
2. 🚀 高度なアプリケーション開発：単なるシンプルなチャットボットではなく、本格的なAI製品を構築。
3. 💰 月額料金なし：すべての機能が従量制で、完全にアクセス可能。低い参入障壁と高い可能性を確保。
4. 🛠 強力な管理ダッシュボード：チームやSME向けに設計 - 一人で管理し、多くの人が使用可能。
5. 🔗 すべてのAI機能へのAPIアクセス：すべてのツールはオープンソースでカスタマイズ可能（進行中）。
6. 💪 強力な開発チーム：大規模で高度なスキルを持つ開発者集団。毎週2-3の新しいアプリケーションをリリースし、毎日製品更新を行っています。才能ある開発者の参加を歓迎します。