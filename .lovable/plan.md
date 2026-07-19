## Mục tiêu
Thêm **nghĩa tiếng Anh** (theo phương án C) hiển thị dưới badge cấp độ và trên かな, kiểu chữ xám mờ, nhỏ.

## Thay đổi

### 1. Dữ liệu — `src/data/vocab.json` + script parse
- Cập nhật lại script parse markdown để bắt thêm phần nghĩa sau dấu `—`.
- Shape mới mỗi mục: `{ r, k, l, m }` với `m` = meaning tiếng Anh (string, có thể `""` với ~30 mục nguồn để trống).
- Regenerate toàn bộ `vocab.json` (3747 mục).

### 2. Type — `src/lib/shiritori.ts`
- Thêm field `meaning: string` vào `Word` type và mapping từ `m` khi load.
- Logic sinh chuỗi không đổi.

### 3. UI — `src/routes/index.tsx` (`WordBlock`)
Thứ tự dọc trong mỗi ô:
```
[ N5 ]        ← badge cấp (đã có)
to meet       ← nghĩa EN, xám mờ nhỏ (MỚI)
あう          ← かな lớn (đã có)
会う          ← kanji (đã có)
```
- Class nghĩa: `text-[10px] md:text-xs text-[#a89f8f] leading-tight text-center max-w-[7em] line-clamp-2`
- Dùng `whitespace-normal` + `max-w-[7em]` để nghĩa dài xuống dòng thay vì kéo giãn ô; giữ かな/kanji vẫn `whitespace-nowrap`.
- Với mục không có nghĩa: render `\u00A0` giữ chỗ để các ô cùng hàng thẳng đáy.
- Giữ nguyên khoảng cách ngang giữa các từ; ô sẽ cao hơn ~1 dòng nhưng không rộng hơn.

## Không đổi
- Thuật toán shiritori, filter cấp độ, input chữ bắt đầu, 2 nút シャッフル / 別の10本に変える.
- Palette washi và font Shippori Mincho / Zen Kaku Gothic.
