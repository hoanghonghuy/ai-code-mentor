# Tính năng Quản lý Custom Learning Paths

## Tổng quan
Đây là tính năng cho phép người dùng xóa các custom learning paths (lộ trình học tập tùy chỉnh) mà họ đã tạo, cùng với việc dọn dẹp toàn bộ dữ liệu liên quan.

## Tính năng đã triển khai

### 1. Giao diện người dùng
- **Menu quản lý paths**: Thêm nút menu 3 chấm (⋮) bên cạnh dropdown chọn learning path
- **Nút xóa path**: Chỉ hiển thị khi đang chọn custom path (không hiển thị cho standard paths)
- **Modal xác nhận xóa**: Modal cảnh báo với màu đỏ và thông báo rõ ràng về hậu quả

### 2. Xử lý dữ liệu
Khi xóa một custom learning path, hệ thống sẽ:
- Xóa path khỏi danh sách `customLearningPaths`
- Dọn dẹp tất cả notes liên quan đến các lesson trong path
- Xóa tất cả bookmarks cho các lesson trong path  
- Xóa lịch sử chat cho tất cả lesson trong path
- Xóa chat history cache
- Tự động chuyển về path mặc định nếu đang sử dụng path bị xóa

### 3. Bảo vệ dữ liệu
- **Chỉ xóa custom paths**: Standard paths không thể bị xóa
- **Confirmation modal**: Yêu cầu xác nhận trước khi xóa
- **Cảnh báo rõ ràng**: Thông báo việc xóa không thể khôi phục
- **UI destructive**: Sử dụng màu đỏ để nhấn mạnh tính nguy hiểm

## Files đã thay đổi

### 1. `locales/vi/translation.json` & `locales/en/translation.json`
Thêm các keys mới:
```json
{
  "sidebar": {
    "deletePath": "Xóa Lộ trình",
    "managePaths": "Quản lý Lộ trình"
  },
  "deletePathModal": {
    "title": "Xóa Lộ trình",
    "message": "Bạn có chắc chắn muốn xóa lộ trình \"{{pathName}}\"? Tất cả tiến trình học tập và dữ liệu trong lộ trình này sẽ bị mất vĩnh viễn. Hành động này không thể hoàn tác.",
    "confirm": "Xóa Lộ trình",
    "warning": "Cảnh báo: Việc xóa lộ trình sẽ không thể khôi phục!"
  }
}
```

### 2. `App.tsx`
- Thêm state `pathToDelete` để quản lý path cần xóa
- Thêm function `handleDeleteCustomPath()` xử lý logic xóa
- Cập nhật props cho `LearningPathView` thêm `onDeletePath`
- Thêm `ConfirmationModal` cho việc xóa path với `isDestructive={true}`

### 3. `components/LearningPathView.tsx`
- Thêm state `showPathMenu` để quản lý dropdown menu
- Thêm logic kiểm tra `isCurrentPathCustom` 
- Thêm menu dropdown với nút "Tạo path mới" và "Xóa path"
- Chỉ hiển thị nút xóa khi đang chọn custom path
- Import thêm `TrashIcon` và `MoreVerticalIcon`

### 4. `components/ConfirmationModal.tsx`
- Thêm prop `isDestructive?: boolean`
- Thêm styling cho destructive mode (màu đỏ)
- Thêm warning box khi `isDestructive={true}`
- Cập nhật button colors tùy theo destructive mode

## Luồng sử dụng

1. **Truy cập menu**: Người dùng click vào nút 3 chấm bên cạnh dropdown learning path
2. **Chọn xóa**: Click "Xóa Lộ trình" (chỉ hiện khi đang chọn custom path)
3. **Xác nhận**: Modal cảnh báo màu đỏ hiện ra với thông báo chi tiết
4. **Thực hiện**: Sau khi xác nhận, path và tất cả dữ liệu liên quan bị xóa
5. **Chuyển hướng**: Tự động chuyển về "JavaScript Basics" nếu đang sử dụng path bị xóa

## Tính năng bảo mật

- ✅ Không thể xóa standard learning paths
- ✅ Yêu cầu xác nhận trước khi xóa
- ✅ UI rõ ràng với màu cảnh báo
- ✅ Dọn dẹp hoàn toàn dữ liệu liên quan
- ✅ Tự động chuyển hướng khi cần thiết
- ✅ Hỗ trợ cả guest mode và logged-in mode

## Testing

Để test tính năng:
1. Tạo một custom learning path mới
2. Học một vài lesson, tạo notes, bookmark
3. Thử xóa path và kiểm tra:
   - Modal hiển thị đúng
   - Dữ liệu được dọn dẹp hoàn toàn
   - Chuyển hướng đúng path mặc định
   - Không thể xóa standard paths