$path = 'D:\Physic_Lab\V10\apps\web\src\components\PhysicsSimulation.tsx'
$before = Get-Content -Path $path | Select-Object -First 414
$after = Get-Content -Path $path | Select-Object -Skip 697
$block = @"
function sceneAnnotations(sceneKind: string, config: Record<string, unknown> = {}): SceneAnnotation[] {
  if (Array.isArray(config.lessonComponents) && config.lessonComponents.length) {
    return (config.lessonComponents as Array<{ label?: string; note?: string }>)
      .map((item) => ({
        label: cleanUiText(item.label, 'Thanh phan chinh'),
        note: cleanUiText(item.note, 'Chi tiet nay can duoc doi chieu voi cong thuc va du lieu quan sat.')
      }))
      .filter((item) => item.label.trim() && item.note.trim());
  }
  return sceneAnnotationsSafe(sceneKind);
}

function sceneAnnotationsSafe(sceneKind: string): SceneAnnotation[] {
  switch (sceneKind) {
    case 'linearRail':
      return [
        { label: 'Xe va ray', note: 'Vat chuyen dong doc theo ray de quan sat vi tri va huong chuyen dong.' },
        { label: 'Van toc khong doi', note: 'Trong cac khoang thoi gian bang nhau, vat di duoc cac quang duong bang nhau.' }
      ];
    case 'acceleratedCart':
      return [
        { label: 'Mui ten van toc', note: 'Do dai mui ten thay doi theo v = v0 + a.t.' },
        { label: 'Gia toc', note: 'Gia toc duoc giu khong doi trong suot qua trinh mo phong.' }
      ];
    case 'freeFallTower':
      return [
        { label: 'Vat roi', note: 'Bo qua suc can khong khi, van toc tang deu theo thoi gian.' },
        { label: 'Thap do cao', note: 'Moc chia cao giup doi chieu quang duong roi va do cao con lai.' }
      ];
    case 'circularRotor':
      return [
        { label: 'Ban kinh quay', note: 'Ban kinh quyet dinh moi lien he giua omega, v va gia toc huong tam.' },
        { label: 'Gia toc huong tam', note: 'Vector gia toc luon huong ve tam quay.' }
      ];
    case 'forceBoard':
      return [
        { label: 'Luc thanh phan', note: 'Tach cac luc thanh phan de xac dinh hop luc tac dung len vat.' },
        { label: 'Hop luc', note: 'Hop luc cho biet xu huong chuyen dong va gia toc cua vat.' }
      ];
    case 'newtonCart':
      return [
        { label: 'Xe thi nghiem', note: 'Dung de doi chieu hop luc, khoi luong va gia toc.' },
        { label: 'Luc tac dung', note: 'Luc keo va luc can giup nhin ro trang thai can bang hay mat can bang.' }
      ];
    case 'inclinedPlane':
      return [
        { label: 'Mat phang nghieng', note: 'Tach trong luc thanh hai thanh phan doc va vuong goc mat phang.' },
        { label: 'Ma sat', note: 'Luc can xuat hien khi vat co xu huong truot tren mat phang.' }
      ];
    case 'springOscillator':
      return [
        { label: 'Vi tri can bang', note: 'Do lech khoi vi tri can bang quyet dinh luc phuc hoi cua lo xo.' },
        { label: 'Nang luong dao dong', note: 'Dong nang va the nang bien doi qua lai theo chu ki.' }
      ];
    case 'pendulum':
      return [
        { label: 'Goc lech', note: 'Bien do goc nho cho phep ap dung mo hinh dao dong dieu hoa.' },
        { label: 'Chu ki', note: 'Chu ki phu thuoc chu yeu vao chieu dai day va gia toc trong truong.' }
      ];
    case 'waveTank':
      return [
        { label: 'Nguon song', note: 'Nguon dao dong tao ra cac mat song lan truyen trong moi truong.' },
        { label: 'Pha song', note: 'Cac diem cung pha cach nhau mot so nguyen lan buoc song.' }
      ];
    case 'interferenceTank':
      return [
        { label: 'Hai nguon ket hop', note: 'Hai nguon cung tan so va do lech pha on dinh tao giao thoa.' },
        { label: 'Van cuc dai cuc tieu', note: 'Hieu duong di quyet dinh vi tri tang cuong hay triet tieu.' }
      ];
    case 'standingString':
      return [
        { label: 'Nut song', note: 'Nut la diem luon co bien do bang 0.' },
        { label: 'Bung song', note: 'Bung la diem co bien do dao dong cuc dai.' }
      ];
    case 'electricPlates':
      return [
        { label: 'Ban cuc', note: 'Dien truong deu giua hai ban song song huong tu duong sang am.' },
        { label: 'Hat mang dien', note: 'Quy dao phu thuoc dau dien tich, van toc dau va cuong do dien truong.' }
      ];
    case 'coulombCharges':
      return [
        { label: 'Hai dien tich diem', note: 'Luc Coulomb tang khi dien tich lon hon va khoang cach nho hon.' },
        { label: 'Huong luc', note: 'Cung dau day nhau, khac dau hut nhau tren duong noi tam.' }
      ];
    case 'ohmCircuit':
      return [
        { label: 'Nguon va dien tro', note: 'Do lon dong dien thay doi theo I = U/R.' },
        { label: 'Do thi dai luong', note: 'Theo doi hieu dien the, dong dien va cong suat theo thoi gian.' }
      ];
    case 'magneticHelix':
      return [
        { label: 'Van toc ban dau', note: 'Thanh phan song song B giu chuyen dong thang, thanh phan vuong goc tao quay tron.' },
        { label: 'Luc Lorentz', note: 'Luc tu luon vuong goc voi ca v va B nen khong sinh cong.' }
      ];
    case 'lensBench':
      return [
        { label: 'Vat va anh', note: 'Vi tri anh thay doi theo cong thuc 1/f = 1/d + 1/d phay.' },
        { label: 'Tieu cu', note: 'Tieu cu quyet dinh kha nang hoi tu hay phan ki cua he quang hoc.' }
      ];
    case 'refractionTank':
      return [
        { label: 'Mat phan cach', note: 'Tia sang doi huong khi di qua hai moi truong co chiet suat khac nhau.' },
        { label: 'Dinh luat Snell', note: 'n1 sin i = n2 sin r cho phep tinh goc khuc xa.' }
      ];
    case 'eyeOptics':
      return [
        { label: 'Thuy tinh the', note: 'Dieu tiet de anh roi dung tren vong mac.' },
        { label: 'Vong mac', note: 'Noi anh can hien ro de mat quan sat tot.' }
      ];
    case 'thermalIsothermal':
      return [
        { label: 'Nhiet do khong doi', note: 'Trong suot qua trinh, T duoc giu co dinh de doi chieu quan he p-V.' },
        { label: 'Ap suat va the tich', note: 'Khi V tang thi p giam theo quy luat Boyle-Mariotte.' }
      ];
    case 'thermalIsobaric':
      return [
        { label: 'Ap suat khong doi', note: 'He duoc dieu khien de giu p khong doi trong khi T bien thien.' },
        { label: 'Do no nhiet', note: 'The tich tang khi nhiet do tuyet doi tang.' }
      ];
    case 'thermalState':
      return [
        { label: 'Trang thai khi', note: 'Ba dai luong p, V, T rang buoc nhau trong cung mot he.' },
        { label: 'Bien doi thong so', note: 'Thay doi mot dai luong se lam cac dai luong con lai thay doi.' }
      ];
    default:
      return [
        { label: 'Vat the chinh', note: 'Thanh phan trung tam cua mo phong duoc theo doi bang overlay va metric.' },
        { label: 'Dai luong can quan sat', note: 'Tap trung vao cac vector, tham so va timeline o ben duoi canvas.' }
      ];
  }
}
"@ -split "`r?`n"
$out = @()
$out += $before
$out += $block
$out += $after
Set-Content -Path $path -Value $out -Encoding UTF8
