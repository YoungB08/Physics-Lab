export type LessonComponentNote = {
  label: string;
  note: string;
};

export type LessonSimulationBlueprint = {
  key: string;
  simulationType: string;
  focus: string;
  components: LessonComponentNote[];
  matched?: boolean;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đ]/g, 'd')
    .replace(/[Đ]/g, 'D')
    .toLowerCase()
    .trim();
}

function makeBlueprint(key: string, simulationType: string, focus: string, labels: [string, string][]): LessonSimulationBlueprint {
  return {
    key,
    simulationType,
    focus,
    components: labels.map(([label, note]) => ({ label, note }))
  };
}

const BLUEPRINTS: LessonSimulationBlueprint[] = [
  makeBlueprint('chuyển động thẳng đều', 'linear-motion-3d', 'Theo dõi vị trí, vận tốc và quan hệ x = x₀ + v.t.', [
    ['Xe trượt', 'Vật chuyển động dọc theo ray để quan sát vị trí và hướng chuyển động.'],
    ['Mốc tọa độ', 'Các mốc chia giúp đọc vị trí và so sánh quãng đường theo thời gian.']
  ]),
  makeBlueprint('chuyển động thẳng biến đổi đều', 'accelerated-motion-3d', 'So sánh độ đổi của vận tốc và quãng đường khi gia tốc không đổi.', [
    ['Xe tăng tốc', 'Vật di chuyển trên ray với gia tốc không đổi.'],
    ['Gia tốc a', 'Dùng để đối chiếu với sự thay đổi vận tốc theo thời gian.']
  ]),
  makeBlueprint('sự rơi tự do', 'free-fall-3d', 'Quan sát độ cao, vận tốc rơi và vai trò của gia tốc trọng trường g.', [
    ['Vật rơi', 'Mô phỏng bỏ qua sức cản không khí để tập trung vào g.'],
    ['Tháp độ cao', 'Mốc chia cao giúp đo quãng đường rơi và độ cao còn lại.']
  ]),
  makeBlueprint('chuyển động tròn đều', 'circular-motion-3d', 'Liên hệ giữa bán kính, tốc độ dài và gia tốc hướng tâm.', [
    ['Bán kính quay', 'Khoảng cách tới tâm quay quyết định quỹ đạo.'],
    ['Gia tốc hướng tâm', 'Vector hướng vào tâm để giữ vật trên quỹ đạo tròn.']
  ]),
  makeBlueprint('tổng hợp và phân tích lực', 'force-decomposition-3d', 'Tách lực theo trục và xác định hợp lực ngay trên hình.', [
    ['Lực thành phần', 'Quan sát các vector lực riêng lẻ cùng tác dụng lên một vật.'],
    ['Hợp lực', 'Tổng vector lực cho biết xu hướng chuyển động của vật.']
  ]),
  makeBlueprint('ba định luật Newton', 'newton-laws-3d', 'Đối chiếu hợp lực, khối lượng và gia tốc trong cùng một hệ.', [
    ['Xe thí nghiệm', 'Vật mẫu để so sánh trạng thái cân bằng và mất cân bằng lực.'],
    ['Lực tác dụng', 'Lực kéo và lực cản giúp minh họa ba định luật Newton.']
  ]),
  makeBlueprint('lực ma sát', 'friction-plane-3d', 'So sánh xu hướng trượt với ma sát trên mặt phẳng nghiêng.', [
    ['Mặt phẳng nghiêng', 'Cho phép tách trọng lực thành các thành phần thuận tiện.'],
    ['Hệ số ma sát', 'Quyết định độ lớn lực cản khi vật có xu hướng trượt.']
  ]),
  makeBlueprint('lực đàn hồi', 'spring-3d', 'Liên hệ độ biến dạng với lực phục hồi theo định luật Hooke.', [
    ['Lò xo', 'Phần tử đàn hồi biến dạng quanh vị trí tự nhiên.'],
    ['Độ dãn x', 'Giá trị x quyết định độ lớn lực phục hồi.']
  ]),
  makeBlueprint('con lắc', 'pendulum-3d', 'Theo dõi góc lệch, chu kì và sự chuyển hóa năng lượng.', [
    ['Dây treo', 'Chiều dài dây ảnh hưởng trực tiếp đến chu kì dao động.'],
    ['Vật nặng', 'Quả cầu dao động quanh vị trí cân bằng.']
  ]),
  makeBlueprint('giao thoa', 'interference-3d', 'So sánh hiệu đường đi để xác định cực đại và cực tiểu.', [
    ['Hai nguồn kết hợp', 'Hai nguồn sóng cùng tần số và độ lệch pha ổn định.'],
    ['Vân giao thoa', 'Vị trí sáng tối phụ thuộc vào hiệu đường đi.']
  ]),
  makeBlueprint('sóng dừng', 'standing-wave-3d', 'Quan sát nút, bụng và số bụng sóng trên dây.', [
    ['Nút sóng', 'Điểm có biên độ bằng 0 trong mọi thời điểm.'],
    ['Bụng sóng', 'Điểm có biên độ dao động lớn nhất.']
  ]),
  makeBlueprint('sóng', 'wave-3d', 'Theo dõi pha, hướng truyền và khoảng cách giữa hai điểm cùng pha.', [
    ['Nguồn sóng', 'Nguồn dao động tạo ra mặt sóng lan truyền trong môi trường.'],
    ['Pha sóng', 'Hai điểm cùng pha cách nhau một số nguyên lần bước sóng.']
  ]),
  makeBlueprint('điện trường', 'electric-field-3d', 'Quan sát hướng điện trường và quỹ đạo hạt mang điện.', [
    ['Bản cực', 'Điện trường đều hình thành giữa hai bản song song.'],
    ['Hạt mang điện', 'Quỹ đạo phụ thuộc vào dấu điện tích và vận tốc đầu.']
  ]),
  makeBlueprint('coulomb', 'coulomb-3d', 'Đối chiếu dấu điện tích, khoảng cách và độ lớn lực Coulomb.', [
    ['Điện tích điểm', 'Hai điện tích tạo lực đẩy hoặc hút trên đường nối tâm.'],
    ['Khoảng cách r', 'Độ lớn lực thay đổi nhanh khi r thay đổi.']
  ]),
  makeBlueprint('cảm ứng', 'induction-3d', 'Theo dõi sự biến thiên từ thông và dòng điện cảm ứng.', [
    ['Cuộn dây', 'Nơi xuất hiện suất điện động cảm ứng.'],
    ['Từ thông', 'Đại lượng quyết định mức độ cảm ứng điện từ.']
  ]),
  makeBlueprint('rlc', 'rlc-3d', 'Quan sát trao đổi năng lượng giữa điện trường và từ trường.', [
    ['Tụ điện C', 'Tích trữ năng lượng điện trường.'],
    ['Cuộn cảm L', 'Tích trữ năng lượng từ trường.']
  ]),
  makeBlueprint('biến áp', 'transformer-3d', 'Quan sát liên hệ số vòng dây với điện áp vào và ra.', [
    ['Cuộn sơ cấp', 'Nhận điện áp từ nguồn xoay chiều.'],
    ['Cuộn thứ cấp', 'Nhận cảm ứng từ từ trường biến thiên.']
  ]),
  makeBlueprint('thấu kính', 'lens-3d', 'Theo dõi vị trí vật, ảnh, tiêu cự và độ phóng đại.', [
    ['Vật và ảnh', 'Sự thay đổi vị trí vật làm ảnh thay đổi theo công thức thấu kính.'],
    ['Tiêu cự', 'Quyết định khả năng hội tụ hoặc phân kì của hệ quang học.']
  ])
];

export function resolveLessonSimulationBlueprint(input: { title?: string; slug?: string; topic?: string; type?: string }) {
  const haystack = normalize(`${input.title || ''} ${input.slug || ''} ${input.topic || ''}`);
  const exact = BLUEPRINTS.find((item) => haystack.includes(item.key));
  if (exact) return { ...exact, matched: true };
  return null;
}
