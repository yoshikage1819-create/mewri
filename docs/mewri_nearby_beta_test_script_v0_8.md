# Mewri Nearby Beta Test Script v0.8

Date: 2026-05-22
Status: local nearby-beta checklist

## Setup

1. Start the local network dev server:

```powershell
npm.cmd run dev:host
```

2. Open the app on the test phone:

```text
http://192.168.1.11:3000
```

3. Keep the developer machine and phone on the same Wi-Fi network.

## Tester Instructions

Give the tester only this short prompt:

```text
今日のテーマに写真を投稿して、みんなの投稿で反映を確認し、ZINE生成まで試してください。
分かりにくい言葉や、次に何をすればいいか迷った場所があれば教えてください。
```

Do not explain the whole product first. The point is to see whether the screen itself explains enough.

## Flow Checklist

- Tester can open the app.
- Tester can identify `今日のテーマ`.
- Tester understands only today's theme can be posted to.
- Tester can tap `今日の投稿をする`.
- Tester can use the sample image button.
- Tester can add or edit a caption.
- Tester can submit a post.
- Tester can open `みんなの投稿`.
- Tester can find the submitted post inside `このZINEの中身`.
- Tester can understand closed themes are for viewing.
- Tester can understand `ZINEを生成` as the later reward after posts collect.
- Tester understands follow/discovery areas are future placeholders.
- Tester can generate a ZINE after enough posts exist.
- Tester can reset the demo.

## Questions To Ask After Testing

- 最初に何をすればいいか分かりましたか？
- 今日のテーマだけに投稿するルールは分かりましたか？
- `みんなの投稿` は何を見る場所だと思いましたか？
- `このZINEの中身` は、投稿一覧とZINE生成の場所として自然でしたか？
- `ZINEを生成` が押せる条件は分かりましたか？
- 未実装の場所は未実装だと分かりましたか？
- 画像URL/サンプル画像での投稿はMVPとして許容できましたか？
- 友人にURLを送って試してもらうなら、何が足りないと思いましたか？

## Notes Template

```text
Tester:
Device:
Date:

Where they hesitated:

Words that were unclear:

UI breakage:

Posting success:

ZINE generation success:

Most important fix before URL beta:
```

