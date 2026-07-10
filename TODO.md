# schedule-share TODO

## これまでの成果

### 基本構成
- Next.js (App Router) + TypeScript + Tailwind CSS v4 + ESLint + `src/` ディレクトリ構成
- DB接続方式はDynamoDBに決定・実装完了。詳細は「データ永続化: DynamoDB」を参照

### データモデル
- `src/lib/categories.ts`（2026-07-10 新設）: カテゴリ定義を一元管理
  - `categories`: `{ id, label, colorRole }` の配列。**追加・変更はこの配列を編集するだけ**（`as const satisfies` で型もここから自動導出）
  - 現在のカテゴリ: `soccer`(サッカー) / `shorinji_kempo`(少林寺) / `ballet`(バレエ) / `cram_school`(塾) / `school_event`(学校行事) / `other`(その他)
  - `colorRole`: `primary`/`secondary`/`tertiary`/`quaternary`/`quinary`/`neutral` の6色から選択。`error` はステータス表示用に予約のためカテゴリには使わない方針
  - 6色を使い切った場合、新規カテゴリは `neutral` を割り当てるか、`globals.css` に新しい色ロールを追加した上で `categoryColorRoleStyles` に1行足す運用
  - `categoryLabels` / `categoryStyles`（`Record<CategoryId, string>`）をここから自動導出し、コンポーネント側でのハードコードを排除
- `src/lib/mock-data.ts`
  - `ScheduleItem`: `id` / `title` / `categoryId`(`CategoryId`) / `startDate` / `endDate` / `startTime` / `endTime` / `location` / `notes?`
    - 2026-07-10: 単一の`date`を`startDate`/`endDate`に分割（遠征など複数日にまたがる予定に対応。単日は同じ値）。任意項目`notes`（メモ）を追加
  - `location`: `{ name, address, lat?, lng? }` — `lat`/`lng` は2026-07-10、Google Places Autocomplete連携により実際に使われるようになった（詳細は「外部連携: Google Maps」参照）
  - サンプルデータは7〜9月にまたがる10件、6カテゴリすべてを1件以上含む。複数日の遠征例（`遠征: 道東カップ`, 8/15–8/16, メモ付き）を1件含む（月ナビゲーション・カテゴリ配色・日付範囲表示の動作確認用）

### 状態管理（2026-07-10 新設）
- `src/components/ScheduleApp.tsx`: 予定の配列を`useState`で一元管理するクライアントコンポーネント。`page.tsx`（サーバーコンポーネント）から`initialSchedule`（現在はDynamoDBから取得した値）を受け取り、以降はここで追加・更新・削除する
  - `handleAdd`/`handleUpdate`/`handleDelete`を`ScheduleBoard`・`AddScheduleToggle`に配って渡す。2026-07-10よりServer Action経由でDynamoDBに書き込み、サーバーが返した確定値でクライアント一覧を更新する方式に変更済み（詳細は「データ永続化: DynamoDB」参照）
  - id発行は`crypto.randomUUID()`（DynamoDB導入に向けて`ScheduleItem.id`を`number`→`string`(UUID)に変更。現在は`createSchedule`側でサーバー発行）
- `src/components/ScheduleForm.tsx`（旧`AddScheduleForm.tsx`から改名・汎用化）: 新規追加・編集の両方で使う共通フォーム
  - `initialValues`未指定＝新規追加モード、指定あり＝編集モード。編集モードでは終了日の自動追従を無効化（既存の終了日を尊重）
  - `onSubmit(values: ScheduleFormValues)`で親に値を渡すだけの設計にし、リセット処理はフォーム自身は持たない（呼び出し側が`key`変更で再マウントさせる）

### データ永続化: DynamoDB（2026-07-10 完了）
進め方: ①AWS認証情報・DynamoDBテーブル準備とseed投入 → ②書き込みAPI実装 → ③`page.tsx`/`ScheduleApp`をDynamoDB接続に切り替え、の順で実施。

- **キー設計**: `ScheduleItem.id`を`number`→`string`(UUID、`crypto.randomUUID()`)に変更。DynamoDBのパーティションキーは`id`(String, HASH)
- **AWS設定**: `.env.local`に`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION=ap-northeast-1`/`DYNAMODB_TABLE_NAME=schedule-share-records`。IAMポリシーは`schedule-share*`テーブルのみに絞り込み
- **`scripts/seed-dynamodb.ts`**: テーブルが無ければ`CreateTableCommand`で作成（オンデマンド課金`PAY_PER_REQUEST`、容量プランニング不要）し、`sampleSchedule`を`PutCommand`で全件投入する冪等なスクリプト。`../src/lib/mock-data.ts`を相対importしているため、シード内容は常に実際のサンプルデータと一致する（手動転記によるズレが起きない）。実行: `node --env-file=.env.local scripts/seed-dynamodb.ts`（Node 24のネイティブTS実行を利用。`@/`パスエイリアスは使えないため相対importにしている点に注意）
- **`src/lib/db.ts`**: `@aws-sdk/client-dynamodb`（低レベルクライアント）+ `@aws-sdk/lib-dynamodb`（`DynamoDBDocumentClient`でJSオブジェクトの相互変換を吸収）を`dependencies`に追加
  - `getSchedules(): Promise<ScheduleItem[]>`: `ScanCommand`で全件取得。`LastEvaluatedKey`が無くなるまでページングするループを実装（1回のScanは最大1MB/1ページ分しか返らないため）
  - `createSchedule(values): Promise<ScheduleItem>`: `crypto.randomUUID()`でid発行後`PutCommand`
  - `updateSchedule(id, values): Promise<ScheduleItem>`: `ScheduleForm`は常に全項目を送る設計のため、`UpdateCommand`（部分更新）ではなく`PutCommand`で丸ごと置き換え。`ConditionExpression: "attribute_exists(id)"`を付け、複数タブ等で既に削除された id への更新が誤って再作成にならないようにした（存在しない id への更新は`ConditionalCheckFailedException`で失敗）
  - `deleteSchedule(id): Promise<void>`: `DeleteCommand`
  - `requireTableName()`ヘルパーに`DYNAMODB_TABLE_NAME`未設定時のエラー処理を集約。テーブル名未設定時は各関数呼び出し時に明示的なエラーを投げる（`google-maps.ts`の`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`と同じ、遅延バリデーションのパターン）
  - `getSchedules`が返す`Items`は`ScheduleItem[]`へ直接キャストしているのみで、テーブル側のスキーマがずれていた場合の実行時検証は無い
- **`src/lib/actions.ts`**（`"use server"`）: `addScheduleAction`/`updateScheduleAction`/`deleteScheduleAction`。`db.ts`の関数を呼んだ後`revalidatePath("/")`でキャッシュを無効化し、確定した`ScheduleItem`を返す
- **`page.tsx`**: `sampleSchedule`のimportを廃止し`getSchedules()`を`await`。`export const dynamic = "force-dynamic"`を追加（付けないと稀に静的最適化されデータが古くなるリスクがあるため明示。ビルド出力で`/`が`ƒ (Dynamic)`になることを確認済み）
- **`ScheduleApp`**: `handleAdd`/`handleUpdate`/`handleDelete`をasync化し、Server Actionを呼んで**サーバー側が返した確定値**でクライアント一覧を更新する方式（クライアント側での楽観的id生成はやめた。理由: `createSchedule`はサーバー側でid発行するため、クライアントとサーバーで別々にidを生成すると後続の更新・削除がidの不一致で失敗する）
- **`ScheduleForm`/`ScheduleCard`**: 実際のネットワーク通信が発生するため、送信中は「保存中…」/「削除中…」でボタンを無効化し、失敗時は`role="alert"`でエラーメッセージを表示（フォームやシートは閉じずに再入力・再試行できる状態を保つ）
- `tsconfig.json`に`allowImportingTsExtensions: true`を追加（`noEmit: true`のため安全。`scripts/seed-dynamodb.ts`がNode実行のため`.ts`拡張子付きで相対importする必要があり、素の`tsc`がそれを拒否するのを回避するため）
- **検証**: `getSchedules()`経由の実データ取得、`createSchedule`/`updateSchedule`/`deleteSchedule`の作成・更新・削除・条件付き更新拒否を実データで確認。2026-07-10、ブラウザでの追加・編集・削除の一連の操作をユーザーが実機で確認し、正常動作を確認済み

### 予定追加フォーム
- `src/components/AddScheduleToggle.tsx`: 画面右下に`fixed`固定した「+」FABボタン（2026-07-10、以前はページ内インライン展開だったが一覧を下スクロールすると押せなくなる問題があったため変更）
  - タップするとM3ボトムシート（スクリム + 下から迫り上がるパネル、`translate-y-full`⇄`translate-y-0`のCSSトランジション）で`ScheduleForm`を表示
  - シート表示中は`document.body.style.overflow = "hidden"`で背後のスクロールをロック
  - `env(safe-area-inset-bottom)`をFAB位置・シート下部パディングに反映し、iOSのホームインジケーター領域と重ならないようにした
  - スクリムタップ／×ボタン／送信完了のいずれでも閉じ、閉じるたびに`formKey`をインクリメントして`ScheduleForm`を再マウント（次回開いたときに空欄に戻す）
  - `onAdd`プロップ経由で`ScheduleApp`の`handleAdd`を呼ぶ
- `src/components/ScheduleForm.tsx`: タイトル・カテゴリ(セレクト)・開始日/終了日・開始/終了時間・開催場所(Places Autocomplete)・住所・メモ(任意)の全項目を入力可能
  - 開始日を入力すると終了日が自動的に同じ日に追従（新規追加時のみ）。終了日を手動編集した後はその追従を止める（遠征などの複数日入力を想定）。終了日には`min={開始日}`を設定
  - 「開催場所」は`LocationAutocomplete`（Google Places Autocomplete）。候補選択で開催場所名・住所・緯度経度（非表示のstate）が自動入力される
  - 「住所」欄は選択後も手動編集可能。編集すると自動取得した座標は破棄され（`setCoords(null)`）、地図起動時は住所文字列検索にフォールバックする
  - フォーム自体は見た目（背景・角丸・余白）を持たず、呼び出し側（`AddScheduleToggle`のボトムシート／`ScheduleCard`の詳細シート）に委譲する構成（二重の枠にならないように）

### 予定一覧表示
- `src/components/ScheduleCard.tsx`: カード（タップ可能なボタン）にはカテゴリバッジ・タイトル・日付（単日は`7/10(木)`、複数日は`7/10(木)–7/12(土)`のレンジ表示）・時間帯・開催場所/住所のみを表示
  - カードをタップすると詳細ボトムシートを表示（`AddScheduleToggle`と同じスクリム+スライドアップ形式）。メモ(任意)は詳細シート側にのみ表示（カード上には出さない、入力項目と一覧の表示項目を揃えるため）
  - 詳細シートに「地図アプリで開く」ボタンを設置。`location.lat`/`lng`があれば座標検索、無ければ地点名+住所のテキスト検索にフォールバック（`https://www.google.com/maps/search/?api=1&query=...`、APIキー不要）
  - 2026-07-10: 詳細シートに「編集」「削除」ボタンを追加
    - 「編集」を押すと詳細表示(`dl`)を`ScheduleForm`（`initialValues`に既存値を渡す編集モード）に差し替え。「保存する」で`onUpdate(item.id, values)`、「キャンセル」で閲覧モードに戻る
    - 「削除」を押すとインラインの確認UI（`error-container`色、「削除する」/「キャンセル」）に切り替わる2段階操作。ネイティブ`confirm()`は不使用（アプリ内デザインに合わせるため）。確定すると`onDelete(item.id)`
    - `mode`/`confirmingDelete`はシートを開く（`openDetail`）たびに`view`/`false`にリセットされる
- `src/components/ScheduleBoard.tsx`: 月ごとの絞り込みUI
  - 当初「年月ごとにボタンを並べる」実装だったが、年をまたぐとボタン数が際限なく増える問題があり却下
  - 前月/次月ボタン + 中央のネイティブ `<input type="month">` によるナビゲーター方式（表示されるボタン数は常に一定）
  - モバイル操作性を考慮し、ボタン類は48px角以上のタッチターゲットを確保。年月ラベルをネイティブ月ピッカーにすることで、遠い年月へも矢印連打せず一手でジャンプ可能にした
  - 2026-07-10: 絞り込みバーを`sticky top-0`で画面上端に固定（一覧が長くなっても月移動のたびに上まで戻らなくて済むように）。`main`の水平パディング分を`-mx-6 sm:-mx-10`+`px-6 sm:px-10`で相殺し、背景色付きで端から端まで貼り付くようにしている
  - 2026-07-10: 「すべて」チップを削除し、デフォルトを当月表示に変更（`selectedMonth`/`viewMonth`の二重stateを`month`単一stateに統合）
  - 複数日の予定は`startDate`の月でのみ絞り込みにヒットする（例: 7月開始・8月にまたがる予定は8月ビューには出ない）簡易実装。必要になれば見直す

### デザイン: Material 3 Expressive 化
- `src/app/globals.css` に M3 のカラーロール一式（primary/secondary/tertiary/error × container、surface系トーン等）をCSS変数として定義し、Tailwind v4 の `@theme inline` でユーティリティ化（`bg-primary-container` 等が使える）
- カラーは実際のHCT(Hue-Chroma-Tone)アルゴリズムで生成
  - プライマリー seed: `#F5E2C5`（指定色、暖色のタン/サンド系、hue 82.8）
  - セカンダリー seed: `#2F6F76`（提案色、深いティール。プライマリーと好対比、屋外競技場らしい印象、hue 206.2）
  - ターシャリーはプライマリー色相+60°から自動導出（セージグリーン、hue 142.8）
  - `quaternary`(hue 280、藍/紫)・`quinary`(hue 330、マゼンタ)は2026-07-10、カテゴリ数(6)に対して既存3色+error(予約)では不足したため追加生成。既存色・error色（hue ~25）から離れた位置を選び視覚的な分離を確保
  - 生成には `@material/material-color-utilities` を一時インストールしてスクリプトで算出、値だけをCSSに焼き込み（本体の依存関係には追加していない）。深い階層のESMエクスポート制限により `index.js` は使えず、`hct/hct.js` / `palettes/tonal_palette.js` を相対パスで直接importする必要があった（要 `npm install --no-save`、使用後 `npm uninstall`）
  - カテゴリバッジは常にラベルテキストを併記するため、色のみでの識別を前提にしていない（コントラストは全ロールでライト13:1超・ダーク7:1超を確認済み）
- 種別バッジ・カード・フォーム・FAB・チップ類をすべてM3ロール/形状/イージングカーブに準拠して再実装
- 注意: React の `ViewTransition` コンポーネントは検討したが、インストール済み React 19.2.4 には未搭載のため不採用（CSSトランジションで代替）

### 外部連携: Google Maps（2026-07-10 新設）
- 依存追加: `@googlemaps/js-api-loader`（実行時に使う正式な依存として`dependencies`に追加。HCT色生成スクリプトのような一時インストールとは異なる）、`@types/google.maps`（devDependency）
- `.env.local` に `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` を設定（ブラウザに露出するクライアント用キー。HTTPリファラー制限必須、Places API (New) + Maps JavaScript API を有効化）。`.env*`は`.gitignore`済み
- `src/lib/google-maps.ts`: `@googlemaps/js-api-loader`の関数API（`setOptions`/`importLibrary`、旧`Loader`クラスは非推奨）でPlacesライブラリを一度だけロードするシングルトン
- `src/components/LocationAutocomplete.tsx`: `google.maps.places.PlaceAutocompleteElement`（新Places API、`google.maps.places.Autocomplete`は2025年3月に新規顧客向け提供終了のため不採用）をuseEffect内で生成・DOM追加するクライアントコンポーネント
  - 選択時に発火する`gmp-select`イベントの型（`PlacePredictionSelectEvent`）はクラス固有の`addEventListener`オーバーロードに解決されないTypeScriptの制約があり、`Event`で受けてキャストする実装にした
  - `ScheduleForm`の「開催場所」欄に組み込み。選択すると開催場所名・住所・緯度経度（非表示state）を自動入力。住所欄を手動編集すると座標は破棄される
- **重要: このサンドボックス環境にはヘッドレスブラウザが無いため、実際の入力→候補サジェスト→選択→座標取得という一連の動作は未検証。** TypeScript型・ESLint・ビルド・SSR構造の確認のみ実施済み。型定義(`@types/google.maps`のインストール済み`.d.ts`)を直接確認しながら実装したが、実機/実ブラウザでの動作確認が必要
- APIキーの利用状況・エラーハンドリング（クォータ超過、リファラー拒否時の挙動）は未検証・未実装。`LocationAutocomplete`はロード失敗時に「候補検索を読み込めませんでした」の案内を出すのみ

### 開発環境メモ
- このサンドボックス環境はヘッドレスChromiumに必要な共有ライブラリ（libnspr4, libnss3等）がシステムに入っておらず、`apt-get download` + `dpkg-deb -x` + `LD_LIBRARY_PATH` で回避してスクリーンショット確認を行った実績あり（現在は環境になし、以降はSSR HTML出力・生成後CSSの直接検査で代用）
- 同環境にはCJK（日本語）フォントも無く、スクリーンショット上で日本語がtofu box表示になる（DOM上のテキスト自体は正しい）
- `AGENTS.md` の指示どおり、コーディング前に `node_modules/next/dist/docs/` の該当ガイドを確認する運用を継続中

## 次に着手すべきこと

### 機能面
- カテゴリ管理のUI化（優先度: 中、未着手）: 現状 `categories.ts` を直接編集する運用。ユーザーがアプリ上でカテゴリの追加・改名・並べ替えをできるようにする場合、DB化とあわせて設計が必要（`colorRole` の割り当てをどう自動化するかも検討）
- フォームのバリデーション（必須項目以外のエラー表示など。「開催場所」はPlaces Autocompleteのカスタム要素のためネイティブ`required`が効いておらず未選択のまま送信できてしまう点も含む）
- Google Places Autocompleteの実機動作確認（優先度: 高、未着手）— 上記の通りサンドボックス環境では未検証
- `location.lat`/`lng` を使ったマップ「表示」（一覧上のピン打ちなど）は依然未着手。今回実装したのは登録時の座標取得と詳細画面からの外部マップ起動のみ

### デザイン面
- モバイル実機での表示・操作感の確認（矢印ボタン・ネイティブ月ピッカーの見た目はOS/ブラウザ依存のため要チェック。FABの`env(safe-area-inset-bottom)`・ボトムシートのスワイプ挙動も実機要確認）
- 月送りナビゲーターのネイティブ `<input type="month">` の見た目はブラウザ間で差が出るため、統一感を優先するなら自前のボトムシート型月選択UIへの置き換えも検討候補（今回はコスト優先でネイティブ採用）
- ダークモード表示の実機確認（`prefers-color-scheme` に依存、まだ目視確認していない）
- カードグリッドが増えた場合のページネーション/無限スクロールの要否（月フィルターはあるが「すべて」表示時に件数が増えた場合の挙動は未検討）
- 2026-07-10: モバイル操作を主用途とする方針を踏まえ以下を実施
  - `<html lang="en">` → `lang="ja"` に修正（中身がほぼ日本語のため）
  - 「+」FABをページ内インラインから画面右下`fixed`＋ボトムシートに変更（スクロールしても常に押せる位置に）
  - 月絞り込みバーを`sticky`化（一覧が長くても月移動のたびに上まで戻らずに済むように）
  - ボトムシートを閉じる際のフォーカス復帰（×ボタン押下後、FABへのフォーカス移動）は未対応。アクセシビリティを詰めるなら次の候補
