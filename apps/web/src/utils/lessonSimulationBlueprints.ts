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
  makeBlueprint('chuyen dong thang deu', 'linear-motion-3d', 'Theo doi vi tri, van toc va quan he x = x0 + v.t.', [
    ['Xe truot', 'Vat chuyen dong doc theo ray de quan sat vi tri va huong chuyen dong.'],
    ['Moc toa do', 'Cac moc chia giup doc vi tri va so sanh quang duong theo thoi gian.']
  ]),
  makeBlueprint('chuyen dong thang bien doi deu', 'accelerated-motion-3d', 'So sanh do doi cua van toc va quang duong khi gia toc khong doi.', [
    ['Xe tang toc', 'Vat di chuyen tren ray voi gia toc khong doi.'],
    ['Gia toc a', 'Dung de doi chieu voi su thay doi van toc theo thoi gian.']
  ]),
  makeBlueprint('su roi tu do', 'free-fall-3d', 'Quan sat do cao, van toc roi va vai tro cua gia toc trong truong g.', [
    ['Vat roi', 'Mo phong bo qua suc can khong khi de tap trung vao g.'],
    ['Thap do cao', 'Moc chia cao giup do quang duong roi va do cao con lai.']
  ]),
  makeBlueprint('chuyen dong tron deu', 'circular-motion-3d', 'Lien he giua ban kinh, toc do dai va gia toc huong tam.', [
    ['Ban kinh quay', 'Khoang cach toi tam quay quyet dinh quy dao.'],
    ['Gia toc huong tam', 'Vector huong vao tam de giu vat tren quy dao tron.']
  ]),
  makeBlueprint('tong hop va phan tich luc', 'force-decomposition-3d', 'Tach luc theo truc va xac dinh hop luc ngay tren hinh.', [
    ['Luc thanh phan', 'Quan sat cac vector luc rieng le cung tac dung len mot vat.'],
    ['Hop luc', 'Tong vector luc cho biet xu huong chuyen dong cua vat.']
  ]),
  makeBlueprint('ba dinh luat newton', 'newton-laws-3d', 'Doi chieu hop luc, khoi luong va gia toc trong cung mot he.', [
    ['Xe thi nghiem', 'Vat mau de so sanh trang thai can bang va mat can bang luc.'],
    ['Luc tac dung', 'Luc keo va luc can giup minh hoa ba dinh luat Newton.']
  ]),
  makeBlueprint('luc ma sat', 'friction-plane-3d', 'So sanh xu huong truot voi ma sat tren mat phang nghieng.', [
    ['Mat phang nghieng', 'Cho phep tach trong luc thanh cac thanh phan thuan tien.'],
    ['He so ma sat', 'Quyet dinh do lon luc can khi vat co xu huong truot.']
  ]),
  makeBlueprint('luc dan hoi', 'spring-3d', 'Lien he do bien dang voi luc phuc hoi theo dinh luat Hooke.', [
    ['Lo xo', 'Phan tu dan hoi bien dang quanh vi tri tu nhien.'],
    ['Do dan x', 'Gia tri x quyet dinh do lon luc phuc hoi.']
  ]),
  makeBlueprint('con lac', 'pendulum-3d', 'Theo doi goc lech, chu ki va su chuyen hoa nang luong.', [
    ['Day treo', 'Chieu dai day anh huong truc tiep den chu ki dao dong.'],
    ['Vat nang', 'Qua cau dao dong quanh vi tri can bang.']
  ]),
  makeBlueprint('giao thoa', 'interference-3d', 'So sanh hieu duong di de xac dinh cuc dai va cuc tieu.', [
    ['Hai nguon ket hop', 'Hai nguon song cung tan so va do lech pha on dinh.'],
    ['Van giao thoa', 'Vi tri sang toi phu thuoc vao hieu duong di.']
  ]),
  makeBlueprint('song dung', 'standing-wave-3d', 'Quan sat nut, bung va so bung song tren day.', [
    ['Nut song', 'Diem co bien do bang 0 trong moi thoi diem.'],
    ['Bung song', 'Diem co bien do dao dong lon nhat.']
  ]),
  makeBlueprint('song', 'wave-3d', 'Theo doi pha, huong truyen va khoang cach giua hai diem cung pha.', [
    ['Nguon song', 'Nguon dao dong tao ra mat song lan truyen trong moi truong.'],
    ['Pha song', 'Hai diem cung pha cach nhau mot so nguyen lan buoc song.']
  ]),
  makeBlueprint('dien truong', 'electric-field-3d', 'Quan sat huong dien truong va quy dao hat mang dien.', [
    ['Ban cuc', 'Dien truong deu hinh thanh giua hai ban song song.'],
    ['Hat mang dien', 'Quy dao phu thuoc vao dau dien tich va van toc dau.']
  ]),
  makeBlueprint('coulomb', 'coulomb-3d', 'Doi chieu dau dien tich, khoang cach va do lon luc Coulomb.', [
    ['Dien tich diem', 'Hai dien tich tao luc day hoac hut tren duong noi tam.'],
    ['Khoang cach r', 'Do lon luc thay doi nhanh khi r thay doi.']
  ]),
  makeBlueprint('cam ung', 'induction-3d', 'Theo doi su bien thien tu thong va dong dien cam ung.', [
    ['Cuon day', 'Noi xuat hien suat dien dong cam ung.'],
    ['Tu thong', 'Dai luong quyet dinh muc do cam ung dien tu.']
  ]),
  makeBlueprint('rlc', 'rlc-3d', 'Quan sat trao doi nang luong giua dien truong va tu truong.', [
    ['Tu dien C', 'Tich tru nang luong dien truong.'],
    ['Cuon cam L', 'Tich tru nang luong tu truong.']
  ]),
  makeBlueprint('bien ap', 'transformer-3d', 'Quan sat lien he so vong day voi dien ap vao va ra.', [
    ['Cuon so cap', 'Nhan dien ap tu nguon xoay chieu.'],
    ['Cuon thu cap', 'Nhan cam ung tu tu truong bien thien.']
  ]),
  makeBlueprint('thau kinh', 'lens-3d', 'Theo doi vi tri vat, anh, tieu cu va do phong dai.', [
    ['Vat va anh', 'Su thay doi vi tri vat lam anh thay doi theo cong thuc thau kinh.'],
    ['Tieu cu', 'Quyet dinh kha nang hoi tu hoac phan ki cua he quang hoc.']
  ]),
  makeBlueprint('khuc xa', 'refraction-3d', 'So sanh goc toi, goc khuc xa va su doi huong tia sang.', [
    ['Mat phan cach', 'Tia sang doi huong khi di qua hai moi truong khac nhau.'],
    ['Dinh luat Snell', 'Lien he giua chiet suat va goc toi, goc khuc xa.']
  ]),
  makeBlueprint('mat', 'eye-optics-3d', 'Theo doi cach mat dieu tiet de anh roi dung tren vong mac.', [
    ['Thuy tinh the', 'Dieu chinh tieu cu de anh hien ro tren vong mac.'],
    ['Vong mac', 'Noi anh can hoi tu de nhin ro vat.']
  ]),
  makeBlueprint('kinh lup', 'magnifier-3d', 'Minh hoa anh ao phong dai cua kinh lup.', [
    ['Vat can quan sat', 'Dat trong khoang tieu cu cua kinh lup.'],
    ['Anh ao', 'Anh cung chieu, lon hon vat va nam truoc kinh.']
  ]),
  makeBlueprint('kinh hien vi', 'microscope-3d', 'Theo doi anh trung gian va anh cuoi cung cua kinh hien vi.', [
    ['Vat kinh', 'Tao anh trung gian that va phong dai.'],
    ['Thi kinh', 'Phong dai anh trung gian de mat quan sat.']
  ]),
  makeBlueprint('kinh thien van', 'telescope-3d', 'Minh hoa vai tro cua vat kinh va thi kinh khi quan sat vat o xa.', [
    ['Vat kinh', 'Thu chum tia song song tu vat o xa.'],
    ['Thi kinh', 'Tao anh sau cung phu hop cho mat quan sat.']
  ]),
  makeBlueprint('dang nhiet', 'thermal-isothermal-3d', 'Theo doi quan he nghich giua ap suat va the tich khi nhiet do khong doi.', [
    ['Nhiet do T', 'Duoc giu co dinh trong suot qua trinh dang nhiet.'],
    ['Ap suat va the tich', 'Quan sat p giam khi V tang.']
  ]),
  makeBlueprint('dang ap', 'thermal-isobaric-3d', 'Quan sat su bien doi the tich khi ap suat duoc giu khong doi.', [
    ['Ap suat p', 'Duoc giu co dinh trong qua trinh trao doi nhiet.'],
    ['The tich V', 'Tang giam theo nhiet do tuyet doi.']
  ]),
  makeBlueprint('phuong trinh trang thai', 'thermal-state-equation-3d', 'Lien he giua p, V va T trong khi li tuong.', [
    ['Trang thai khi', 'Ba dai luong p, V, T rang buoc nhau.'],
    ['Thong so dieu khien', 'Thay doi mot dai luong se anh huong den hai dai luong con lai.']
  ]),
  makeBlueprint('nhiet do', 'thermal-kinetic-3d', 'Lien he giua chuyen dong vi mo cua phan tu khi va nhiet do.', [
    ['Phan tu khi', 'Chuyen dong nhanh hon khi nhiet do tang.'],
    ['Dong nang trung binh', 'Tang theo nhiet do tuyet doi.']
  ]),
  makeBlueprint('tia x', 'xray-tube-3d', 'Quan sat electron dap vao anot de tao tia X.', [
    ['Catot', 'Nguon phat electron trong ong tia X.'],
    ['Anot', 'Noi electron va cham va phat ra tia X.']
  ]),
  makeBlueprint('bohr', 'bohr-atom-3d', 'Nhan manh muc nang luong roi rac va buoc nhay electron.', [
    ['Hat nhan', 'Tam nguyen tu mang dien duong.'],
    ['Quy dao muc n', 'Bieu dien cac muc nang luong rieng cua electron.']
  ]),
  makeBlueprint('cau tao hat nhan', 'nuclear-structure-3d', 'Tach ro proton va neutron trong hat nhan.', [
    ['Proton', 'Hat mang dien duong cau tao nen hat nhan.'],
    ['Neutron', 'Hat trung hoa gop phan on dinh hat nhan.']
  ]),
  makeBlueprint('phan ra alpha', 'alpha-decay-3d', 'Theo doi hat nhan me phat ra hat alpha va doi thanh hat nhan con.', [
    ['Hat alpha', 'Cum 2 proton va 2 neutron duoc phong ra khoi hat nhan.'],
    ['Hat nhan con', 'So khoi giam 4 va dien tich giam 2 sau phan ra.']
  ]),
  makeBlueprint('phan ra beta', 'beta-decay-3d', 'Quan sat qua trinh bien doi neutron proton kem hat beta.', [
    ['Hat beta', 'Co the la electron hoac positron tuy co che bien doi.'],
    ['So proton neutron', 'Thay doi theo dinh luat bao toan dien tich va so nucleon.']
  ]),
  makeBlueprint('phan ra gamma', 'gamma-decay-3d', 'Minh hoa hat nhan kich thich phat photon gamma de ve trang thai ben hon.', [
    ['Photon gamma', 'Mang nang luong lon nhung khong lam doi so proton va neutron.'],
    ['Muc nang luong', 'Hat nhan chuyen tu muc cao xuong muc thap hon.']
  ]),
  makeBlueprint('chu ki ban ra', 'half-life-3d', 'Doi chieu quy luat giam theo ham mu va y nghia cua T1/2.', [
    ['N(t)', 'So hat nhan chua phan ra giam theo thoi gian.'],
    ['Chu ki ban ra', 'Sau moi T1/2 so hat con lai bang mot nua truoc do.']
  ]),
  makeBlueprint('phong xa', 'radioactive-decay-3d', 'Phan biet hat me, buc xa phat ra va bo dem.', [
    ['Hat nhan me', 'Hat nhan khong ben truoc khi phan ra.'],
    ['Buc xa', 'Co the la alpha, beta hoac gamma tuy co che.']
  ]),
  makeBlueprint('phan hach', 'nuclear-fission-3d', 'Quan sat hat nhan nang hap thu notron roi vo thanh hai manh nhe hon.', [
    ['Hat nhan nang', 'Trang thai ban dau de xay ra qua trinh phan hach.'],
    ['Notron va nang luong', 'Sau phan hach co the giai phong notron moi va nang luong lon.']
  ]),
  makeBlueprint('nhiet hach', 'nuclear-fusion-3d', 'Theo doi hai hat nhan nhe hop lai trong dieu kien nang luong cao.', [
    ['Hai hat nhan nhe', 'Vuot qua luc day Coulomb de tien den hop nhat.'],
    ['San pham hop nhat', 'Hat nhan moi ben hon va kem nang luong giai phong.']
  ]),
  makeBlueprint('phan ung hat nhan', 'nuclear-reaction-3d', 'Quan sat hat ban pha, hat dich va san pham phan ung.', [
    ['Hat ban pha', 'Hat toi gay ra phan ung hat nhan.'],
    ['San pham phan ung', 'Cac hat tao thanh sau va cham.']
  ]),
  makeBlueprint('nang luong lien ket', 'binding-energy-3d', 'Minh hoa gieng the va do hut khoi cua hat nhan.', [
    ['Gieng the nang', 'Bieu dien trang thai lien ket ben.'],
    ['Nang luong tach', 'Phan nang luong can cung cap de pha lien ket.']
  ])
];

export function resolveLessonSimulationBlueprint(input: { title?: string; slug?: string; topic?: string; type?: string }) {
  const haystack = normalize(`${input.title || ''} ${input.slug || ''} ${input.topic || ''}`);
  const exact = BLUEPRINTS.find((item) => haystack.includes(item.key));
  if (exact) return { ...exact, matched: true };

  const fallbackType = input.type || 'co-hoc-overview-visual';
  return {
    key: haystack || 'default',
    simulationType: fallbackType,
    focus: 'Quan sat cac thanh phan chinh cua mo phong, doi chieu voi cong thuc loi va thu thay doi tham so.',
    components: [
      { label: 'Thanh phan trung tam', note: 'Doi tuong chinh can theo doi trong bai hoc nay.' },
      { label: 'Thong so dieu khien', note: 'Bien so lam thay doi trang thai hoac quy luat cua mo phong.' },
      { label: 'Dau hieu quan sat', note: 'Chi tiet can doc de suy ra ban chat vat ly cua hien tuong.' }
    ],
    matched: false
  };
}
