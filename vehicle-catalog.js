// CarDesk embedded catalog (offline)
// Trim, powertrain, production years and fuel type are kept locally
// so the settings modal works without internet calls.
(function () {
  const BASE_MODELS_BY_MAKE = {
    현대: ["아반떼", "쏘나타", "그랜저", "아이오닉 5", "아이오닉 6", "코나", "투싼", "싼타페", "팰리세이드", "스타리아", "포터2"],
    기아: ["모닝", "레이", "K3", "K5", "K8", "K9", "스포티지", "쏘렌토", "셀토스", "카니발", "EV3", "EV6", "EV9", "봉고3"],
    제네시스: ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
    쉐보레: ["스파크", "말리부", "트랙스", "트레일블레이저", "이쿼녹스", "타호", "콜로라도"],
    르노코리아: ["SM3", "SM5", "SM6", "QM3", "QM5", "QM6", "XM3", "그랑 콜레오스"],
    KG모빌리티: ["티볼리", "코란도", "토레스", "렉스턴", "렉스턴 스포츠"],
    BMW: ["1시리즈", "2시리즈", "3시리즈", "4시리즈", "5시리즈", "7시리즈", "X1", "X3", "X5", "X7", "i4", "iX3"],
    벤츠: ["A클래스", "C클래스", "E클래스", "S클래스", "GLA", "GLC", "GLE", "GLS", "EQE", "EQS"],
    아우디: ["A3", "A4", "A6", "A7", "A8", "Q3", "Q5", "Q7", "e-tron"],
    폭스바겐: ["골프", "파사트", "아테온", "티구안", "투아렉"],
    볼보: ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40"],
    렉서스: ["ES", "LS", "IS", "NX", "RX", "UX"],
    토요타: ["캠리", "코롤라", "RAV4", "프리우스", "시에나"],
    혼다: ["어코드", "시빅", "CR-V", "오딧세이", "파일럿"],
    닛산: ["알티마", "맥시마", "로그", "패스파인더"],
    미니: ["쿠퍼", "클럽맨", "컨트리맨"],
    포르쉐: ["911", "타이칸", "카이엔", "마칸", "파나메라"],
    랜드로버: ["디스커버리 스포츠", "디펜더", "레인지로버 이보크", "레인지로버 벨라", "레인지로버 스포츠"],
    지프: ["레니게이드", "컴패스", "체로키", "그랜드 체로키", "랭글러"],
    포드: ["머스탱", "익스플로러", "익스페디션", "F-150"],
    테슬라: ["Model 3", "Model Y", "Model S", "Model X"],
    푸조: ["208", "2008", "3008", "5008"],
    재규어: ["XE", "XF", "F-PACE", "E-PACE", "I-PACE"],
    캐딜락: ["CT4", "CT5", "XT4", "XT5", "에스컬레이드"],
    링컨: ["코세어", "노틸러스", "에비에이터", "네비게이터"],
  };

  const OVERRIDES = {
    BMW: {
      "5시리즈": [
        { trim: "520i", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2017, endYear: 2026 },
        { trim: "520d", powertrain: "2.0L 터보 디젤", fuelType: "경유", startYear: 2017, endYear: 2024 },
        { trim: "523d", powertrain: "2.0L 디젤", fuelType: "경유", startYear: 2010, endYear: 2016 },
        { trim: "528i", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2010, endYear: 2016 },
        { trim: "530i", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2010, endYear: 2026 },
        { trim: "530e", powertrain: "2.0L 터보 PHEV", fuelType: "하이브리드", startYear: 2017, endYear: 2026 },
        { trim: "540i", powertrain: "3.0L 터보 가솔린", fuelType: "휘발유", startYear: 2017, endYear: 2026 },
        { trim: "550i", powertrain: "4.4L V8 가솔린", fuelType: "휘발유", startYear: 2010, endYear: 2019 },
        { trim: "550d", powertrain: "3.0L 쿼드터보 디젤", fuelType: "경유", startYear: 2012, endYear: 2020 },
      ],
    },
    아우디: {
      A6: [
        { trim: "40 TDI", powertrain: "2.0L 디젤", fuelType: "경유", startYear: 2019, endYear: 2024 },
        { trim: "45 TFSI", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2019, endYear: 2026 },
        { trim: "50 TDI", powertrain: "3.0L 디젤", fuelType: "경유", startYear: 2019, endYear: 2022 },
        { trim: "55 TFSI", powertrain: "3.0L 터보 가솔린", fuelType: "휘발유", startYear: 2019, endYear: 2026 },
        { trim: "55 TFSI e", powertrain: "2.0L 터보 PHEV", fuelType: "하이브리드", startYear: 2021, endYear: 2026 },
      ],
    },
    현대: {
      쏘나타: [
        { trim: "1.6T 가솔린", powertrain: "1.6L 터보 가솔린", fuelType: "휘발유", startYear: 2019, endYear: 2026 },
        { trim: "2.0 가솔린", powertrain: "2.0L 가솔린", fuelType: "휘발유", startYear: 2019, endYear: 2026 },
        { trim: "2.0 하이브리드", powertrain: "2.0L 하이브리드", fuelType: "하이브리드", startYear: 2019, endYear: 2026 },
        { trim: "2.5T N Line", powertrain: "2.5L 터보 가솔린", fuelType: "휘발유", startYear: 2020, endYear: 2026 },
      ],
    },
  };

  const MAKE_TEMPLATES = {
    현대: [
      { trim: "1.6 터보", powertrain: "1.6L 터보 가솔린", fuelType: "휘발유", startYear: 2018, endYear: 2026 },
      { trim: "2.0 가솔린", powertrain: "2.0L 가솔린", fuelType: "휘발유", startYear: 2015, endYear: 2026 },
      { trim: "하이브리드", powertrain: "하이브리드 시스템", fuelType: "하이브리드", startYear: 2017, endYear: 2026 },
    ],
    기아: [
      { trim: "1.6 터보", powertrain: "1.6L 터보 가솔린", fuelType: "휘발유", startYear: 2018, endYear: 2026 },
      { trim: "2.0 가솔린", powertrain: "2.0L 가솔린", fuelType: "휘발유", startYear: 2015, endYear: 2026 },
      { trim: "하이브리드", powertrain: "하이브리드 시스템", fuelType: "하이브리드", startYear: 2018, endYear: 2026 },
    ],
    제네시스: [
      { trim: "2.5T", powertrain: "2.5L 터보 가솔린", fuelType: "휘발유", startYear: 2020, endYear: 2026 },
      { trim: "3.5T", powertrain: "3.5L 터보 가솔린", fuelType: "휘발유", startYear: 2020, endYear: 2026 },
      { trim: "전동화", powertrain: "전기 파워트레인", fuelType: "전기", startYear: 2021, endYear: 2026 },
    ],
    BMW: [
      { trim: "20i", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2016, endYear: 2026 },
      { trim: "20d", powertrain: "2.0L 터보 디젤", fuelType: "경유", startYear: 2014, endYear: 2024 },
      { trim: "30i", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2016, endYear: 2026 },
      { trim: "30e", powertrain: "PHEV", fuelType: "하이브리드", startYear: 2019, endYear: 2026 },
    ],
    벤츠: [
      { trim: "200", powertrain: "2.0L 가솔린", fuelType: "휘발유", startYear: 2015, endYear: 2026 },
      { trim: "300", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2016, endYear: 2026 },
      { trim: "220d", powertrain: "2.0L 디젤", fuelType: "경유", startYear: 2014, endYear: 2024 },
      { trim: "350e", powertrain: "PHEV", fuelType: "하이브리드", startYear: 2018, endYear: 2026 },
    ],
    아우디: [
      { trim: "35 TFSI", powertrain: "1.5L 터보 가솔린", fuelType: "휘발유", startYear: 2018, endYear: 2026 },
      { trim: "40 TDI", powertrain: "2.0L 디젤", fuelType: "경유", startYear: 2018, endYear: 2024 },
      { trim: "45 TFSI", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2018, endYear: 2026 },
      { trim: "55 TFSI e", powertrain: "PHEV", fuelType: "하이브리드", startYear: 2021, endYear: 2026 },
    ],
  };

  const GENERIC_IMPORT_TRIMS = [
    { trim: "2.0 가솔린", powertrain: "2.0L 터보 가솔린", fuelType: "휘발유", startYear: 2014, endYear: 2026 },
    { trim: "2.0 디젤", powertrain: "2.0L 터보 디젤", fuelType: "경유", startYear: 2012, endYear: 2024 },
    { trim: "하이브리드", powertrain: "하이브리드 시스템", fuelType: "하이브리드", startYear: 2018, endYear: 2026 },
  ];

  const EV_MODEL_PATTERN = /EV|아이오닉|e-tron|Model|타이칸|I-PACE|C40|EQE|EQS|GV60|i4|iX/i;
  const HYBRID_MODEL_PATTERN = /프리우스|시에나|RX|NX|ES/i;
  const COMMERCIAL_MODEL_PATTERN = /포터|봉고|렉스턴 스포츠|콜로라도|F-150|스타리아/i;

  function buildVehicleCatalog() {
    const makes = {};

    Object.entries(BASE_MODELS_BY_MAKE).forEach(([make, models]) => {
      const modelMap = {};
      models.forEach((model) => {
        const override = OVERRIDES[make]?.[model];
        const trims = override || generateDefaultTrims(make, model);
        modelMap[model] = trims;
      });
      makes[make] = { models: modelMap };
    });

    return { makes };
  }

  function generateDefaultTrims(make, model) {
    if (EV_MODEL_PATTERN.test(model)) {
      return [
        { trim: "Standard Range", powertrain: "전기 모터", fuelType: "전기", startYear: 2021, endYear: 2026 },
        { trim: "Long Range", powertrain: "듀얼 모터 전기", fuelType: "전기", startYear: 2021, endYear: 2026 },
      ];
    }

    if (HYBRID_MODEL_PATTERN.test(model)) {
      return [
        { trim: "가솔린", powertrain: "가솔린 엔진", fuelType: "휘발유", startYear: 2014, endYear: 2026 },
        { trim: "하이브리드", powertrain: "하이브리드 시스템", fuelType: "하이브리드", startYear: 2016, endYear: 2026 },
      ];
    }

    if (COMMERCIAL_MODEL_PATTERN.test(model)) {
      return [
        { trim: "디젤", powertrain: "디젤 엔진", fuelType: "경유", startYear: 2010, endYear: 2026 },
        { trim: "LPG", powertrain: "LPG 엔진", fuelType: "LPG", startYear: 2014, endYear: 2026 },
      ];
    }

    const template = MAKE_TEMPLATES[make] || GENERIC_IMPORT_TRIMS;
    return template.map((item) => ({ ...item }));
  }

  window.VEHICLE_CATALOG = buildVehicleCatalog();
})();
