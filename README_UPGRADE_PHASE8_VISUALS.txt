KNTECH PHASE 8 - VISUAL/SIMULATION OVERHAUL

Da sua theo yeu cau:
1. Lam lai toan bo visual cho lesson.
2. Bo mo phong dung yen / lap lai boi canh.
3. Moi preset co visual profile rieng, sceneKind rieng, motion rieng.
4. Cac bai khong can mo phong dong (mat, kinh lup, kinh hien vi, kinh thien van, tia X, cau tao hat nhan, nang luong lien ket) se chuyen sang anh minh hoa dep va de doc.
5. Them lop "Chien luoc" gan truc tiep vao visual profile tung bai.

File chinh da sua:
- apps/web/src/components/PhysicsSimulation.tsx
- apps/web/src/utils/visualProfiles.ts
- apps/web/src/pages/BaiHocPage.tsx

Ghi chu:
- Anh minh hoa dang duoc tao dang SVG data URL runtime de tranh phu thuoc asset ben ngoai.
- Neu muon thay bang anh AI/PDF/PNG that, co the upload vao CMS va gan imageUrl cho tung lesson.
- Nen chay lai npm install && npm run build tren may cua ban de build lai frontend.


PHASE 9 HOTFIX
- Sửa crash trang bài học do thiếu visualProfile.
- Mô phỏng được seed theo tên bài + sceneVariant để tránh lặp cảnh giữa các bài.
- Mở chi tiết kết quả thi cho học sinh khi hideResultDetails = false.
- Phương án thi có nhãn A/B/C/D rõ ràng.
- Footer cố định cuối màn hình, nhấn mạnh hơn.
- Admin forms bổ sung label hiển thị.
- Backend đọc thêm alias OPENAI_APIKEY / OPENAI_API_KEY_ALT / GOOGLE_API_KEY.
- Chuyển cấu hình vite sang plugin react oxc để tránh cảnh báo esbuild cũ trên vite mới.
