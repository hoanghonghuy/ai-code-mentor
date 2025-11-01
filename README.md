<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Code Mentor

Một nền tảng học lập trình thông minh sử dụng Gemini API, xây dựng bằng React + TypeScript + Vite, với giao diện tối giản, hiện đại và hỗ trợ đa ngôn ngữ (EN/VI). Ứng dụng đóng vai trò như một mentor AI chuyên nghiệp, hướng dẫn người học theo lộ trình và qua các dự án thực tế.

Live (AI Studio): https://ai.studio/apps/drive/1yOfJJAL-qMFgwVOsM-KKG9KmgNZuH39v

## Tính năng chính

- Lộ trình học tiêu chuẩn và lộ trình tùy chỉnh (Custom Paths)
- UI chọn lộ trình hiện đại (PathSelector) thay thế dropdown cũ
- Quản lý/xóa custom paths an toàn (xác nhận destructive + dọn dẹp dữ liệu liên quan)
- Chat với Mentor AI (Gemini 2.5 Flash), hỗ trợ nguồn tài liệu tùy chỉnh
- Trình soạn thảo mã + Live Preview + Playground
- Ghi chú theo bài học, đánh dấu (bookmark), hệ thống thành tích (achievements)
- Đa ngôn ngữ (English/Vietnamese) với i18n
- Lưu tiến trình: Firebase Auth + Firestore (hoặc LocalStorage cho guest)

## Cập nhật nổi bật trong nhánh này

Nhánh: `feature/custom-path-management`

- Thêm component PathSelector hiện đại để chọn lộ trình (không còn dùng `<select>`)
- Thêm khả năng xóa custom learning paths kèm modal xác nhận destructive
- Dọn dẹp toàn bộ dữ liệu liên quan khi xóa path (notes, bookmarks, chat histories)
- Cải thiện i18n: bổ sung keys cho giao diện mới (EN/VI)
- Viết tài liệu chi tiết: `FEATURE_CUSTOM_PATH_MANAGEMENT.md`

## Cài đặt & Chạy dự án

Yêu cầu: Node.js 18+

1. Cài dependencies

   ```bash
   npm install
   ```

2. Thiết lập biến môi trường cho Gemini API

   - Tạo file `.env.local`
   - Thêm biến sau (sử dụng đúng tên biến như trong mã nguồn):

   ```bash
   API_KEY=your_gemini_api_key_here
   ```

   Lưu ý: Ứng dụng sử dụng `process.env.API_KEY` (đã cấu hình trong Vite) để khởi tạo GoogleGenAI. Nếu không có khóa, UI sẽ hiển thị thông báo i18n "Không tìm thấy khóa API".

3. Chạy dev server

   ```bash
   npm run dev
   ```

4. Build sản phẩm

   ```bash
   npm run build
   npm run preview
   ```

## Cấu trúc thư mục chính

```
.
├── App.tsx                         # App chính, lưu state, logic save/load
├── components/
│   ├── PathSelector.tsx            # (Mới) UI chọn lộ trình hiện đại
│   ├── LearningPathView.tsx        # Sidebar lộ trình, tích hợp PathSelector
│   ├── ConfirmationModal.tsx       # Modal xác nhận (hỗ trợ destructive)
│   ├── ChatInterface.tsx           # Giao diện chat với AI
│   ├── CodeEditor.tsx              # Trình soạn thảo + file tree
│   ├── LivePreview.tsx             # Xem trước HTML/CSS/JS
│   └── ...                         # Các component khác
├── learningPaths.ts                # Lộ trình tiêu chuẩn (seed)
├── locales/
│   ├── en/translation.json         # i18n EN (đã bổ sung key mới)
│   └── vi/translation.json         # i18n VI (đã bổ sung key mới)
├── firebase.ts                     # Firebase Auth/Firestore
├── vite.config.ts                  # Cấu hình Vite (env API_KEY)
└── types.ts                        # Khai báo type dùng chung
```

## Lưu ý triển khai

- Tính năng xóa chỉ áp dụng cho Custom Paths; Standard Paths được bảo vệ
- Khi xóa Custom Path, ứng dụng sẽ:
  - Gỡ path khỏi `customLearningPaths`
  - Xóa notes, bookmarks, chat histories của các lesson/step trong path
  - Xóa cache `chatHistory` tương ứng
  - Chuyển về lộ trình mặc định ("JavaScript Basics") nếu path hiện tại bị xóa
- UI xác nhận sử dụng `ConfirmationModal` với `isDestructive={true}`

## Quốc tế hóa (i18n)

- Đã bổ sung các key cho giao diện PathSelector: 
  - `sidebar.selectPath`, `sidebar.modulesCount`, `sidebar.customLabel`, `sidebar.managePaths`, `sidebar.deletePath`, `sidebar.newPath`, `sidebar.standardPaths`, `sidebar.yourPaths`
- Kiểm tra chuyển đổi ngôn ngữ qua `SettingsView`

## Roadmap gợi ý

- Tìm kiếm và sắp xếp lộ trình
- Gộp nhóm theo chủ đề (categories)
- Template lộ trình dựng sẵn
- Export/Import lộ trình

## License

MIT
