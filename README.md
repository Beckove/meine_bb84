# Hướng dẫn cài đặt và chạy dự án

## 📆 Cài đặt dependencies cho Frontend

```bash
npm install framer-motion
npm install react-router-dom
npm install react-icons
npm install lucide-react
```

> Nếu bạn sử dụng Tailwind CSS, hãy cài đặt theo hướng dẫn chính thức tại:
> [https://tailwindcss.com/docs/installation/using-vite](https://tailwindcss.com/docs/installation/using-vite)

---

## 🚀 Chạy dự án

### Backend

```bash
python server.py
```

> Yêu cầu Python đã được cài đặt và có đủ các thư viện cần thiết như Flask.

### Frontend

```bash
npm run dev
```

> Nếu bạn dùng Vite, frontend sẽ chạy ở địa chỉ `http://localhost:5173`.

---

## ✅ Tóm tắt các package cần thiết

| Gói                | Mục đích                                 |
| ------------------ | ---------------------------------------- |
| `framer-motion`    | Hiệu ứng chuyển động animation           |
| `react-router-dom` | Điều hướng trang trong React             |
| `react-icons`      | Icon từ các thư viện phổ biến            |
| `lucide-react`     | Bộ icon hiện đại, tối ưu cho React       |
| `tailwindcss`      | Styling bằng utility-first CSS framework |

---

## 🛠️ Lưu ý

* Kiểm tra kỹ các component có tồn tại như: `sidebar1`, `controlpanel`, `appbar`, `parameters`.
* Đảm bảo ảnh như `Alice.svg`, `Bob.svg` đã có trong thư mục `./assets`.
